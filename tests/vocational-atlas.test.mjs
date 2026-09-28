import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/vocational-atlas.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const { buildAtlas, foldTurkish, isSinavli, baseTitle, findSibling } = exports;
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);

const links = (...ids) => ids.map((id) => ({ school_id: id, schools: { is_active: true } }));
const row = (id, title, schools = [], extra = {}) => ({ id, slug: `s${id}`, title, school_vocational_fields: schools, ...extra });

test('folds Turkish case and diacritics into one search key', () => {
  assert.equal(foldTurkish('BİLİŞİM'), 'bilisim');
  assert.equal(foldTurkish('Işık  ve   Ses'), 'isik ve ses');
  assert.equal(foldTurkish('Mobilya ve İç Mekân'), 'mobilya ve ic mekan');
});

test('recognises the sınavlı suffix in any casing', () => {
  assert.equal(isSinavli('Adalet Alanı (SINAVLI)'), true);
  assert.equal(isSinavli('Adalet Alanı (sınavlı)'), true);
  assert.equal(isSinavli('Adalet Alanı'), false);
});

test('attaches a sınavlı record under its base field', () => {
  const atlas = buildAtlas([
    row(1, 'Bilişim Teknolojileri Alanı', links(10, 11, 12), { branches: ['Yazılım Geliştirme'] }),
    row(2, 'Bilişim Teknolojileri Alanı (SINAVLI)', links(10, 13)),
  ]);
  assert.equal(atlas.entries.length, 1);
  const [entry] = atlas.entries;
  eq(entry.sinavli, { id: 2, slug: 's2', title: 'Bilişim Teknolojileri Alanı (SINAVLI)', schoolCount: 2 });
  eq(entry.branches, ['Yazılım Geliştirme']);
  assert.equal(entry.schoolCount, 3);
  assert.equal(atlas.fieldCount, 1);
  assert.equal(atlas.sinavliCount, 1);
  assert.equal(atlas.schoolCount, 4, 'distinct schools across both programs');
  assert.ok(entry.searchText.includes('sinavli'));
});

test('a sınavlı record without a base field keeps its own row', () => {
  const atlas = buildAtlas([row(5, 'Denizcilik Alanı (SINAVLI)', links(1))]);
  eq(atlas.entries.map((e) => [e.title, e.sinavli]), [['Denizcilik Alanı (SINAVLI)', null]]);
});

test('records without an active school move to the empty list', () => {
  const atlas = buildAtlas([
    row(1, 'Metal Teknolojisi Alanı', links(1)),
    row(2, 'Metal Teknolojisi Alanı (SINAVLI)', []),
    row(3, 'Matbaa Teknolojisi Alanı', [{ school_id: 9, schools: { is_active: false } }, { school_id: 8, schools: null }]),
  ]);
  eq(atlas.entries.map((e) => [e.title, e.sinavli]), [['Metal Teknolojisi Alanı', null]]);
  eq(atlas.empty.map((p) => p.title), ['Matbaa Teknolojisi Alanı', 'Metal Teknolojisi Alanı (SINAVLI)']);
  assert.equal(atlas.schoolCount, 1);
});

test('sorts in Turkish alphabetical order and letters with Turkish uppercase', () => {
  const atlas = buildAtlas([
    row(1, 'İnşaat Teknolojisi Alanı', links(1)),
    row(2, 'Çocuk Gelişimi ve Eğitimi Alanı', links(2)),
    row(3, 'Denizcilik Alanı', links(3)),
    row(4, 'Bale Alanı', links(4)),
    row(5, 'Işık Alanı', links(5)),
  ]);
  eq(atlas.entries.map((e) => e.letter), ['B', 'Ç', 'D', 'I', 'İ']);
});

test('non-array branches (legacy {} values) become an empty list', () => {
  const atlas = buildAtlas([row(1, 'Adalet Alanı', links(1), { branches: {} })]);
  eq(atlas.entries[0].branches, []);
});

test('finds the sınavlı sibling of a field and the base of a sınavlı program', () => {
  const all = [
    { id: 1, slug: 'bilisim', title: 'Bilişim Teknolojileri Alanı' },
    { id: 2, slug: 'bilisim-sinavli', title: 'Bilişim Teknolojileri Alanı (SINAVLI)' },
    { id: 3, slug: 'denizcilik', title: 'Denizcilik Alanı' },
  ];
  assert.equal(findSibling(all[0], all).slug, 'bilisim-sinavli');
  assert.equal(findSibling(all[1], all).slug, 'bilisim');
  assert.equal(findSibling(all[2], all), null);
  assert.equal(baseTitle('Bilişim Teknolojileri Alanı (SINAVLI)'), 'Bilişim Teknolojileri Alanı');
});

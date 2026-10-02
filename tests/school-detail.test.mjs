import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
// lib dosyaları birbirini göreli yolla içe aktarır; her biri ayrı derlenir.
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code, {exports, require:name=>load(path.join(path.dirname(file), `${name}.ts`))});
  return exports;
}
const { buildLedger, groupSchoolFields, turkishTitleCase, formatPercentile, formatLgs, formatPhone } = load('src/lib/school-detail.ts');
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const score = (year, percentile, obpScore, lgsScore = null, extra = {}) => ({ year, percentile, obpScore, lgsScore, program: null, vocationalFieldId: null, vocationalField: null, ...extra });
const quota = (year, sinavliCount, sinavsizCount) => ({ year, sinavliCount, sinavsizCount });

test('a merkezi school gets one okul geneli row with percentile and LGS aligned to the years', () => {
  // Anamur Anadolu Lisesi
  const ledger = buildLedger(
    [score(2026,16.57,null,367.1478), score(2023,15.23,null,400.439), score(2025,16.39,null,367.876)],
    [quota(2025,120,0), quota(2026,120,0)],
  );
  // 2023 son üç yılın (2024–2026) dışında; kaydı olmayan 2024 sütun olmaz.
  eq(ledger.years, [2025, 2026]);
  eq(ledger.groups, [{ placement: 'merkezi', metrics: ['yuzdelik', 'lgs'], rows: [
    { key: 'genel', label: 'Okul geneli', values: { yuzdelik: [16.39, 16.57], lgs: [367.876, 367.1478] } },
  ] }]);
  // Hiç sınavsız yeri yok: satır çizilmez.
  eq(ledger.quotas, [{ key: 'sinavli', values: [120, 120] }]);
  assert.equal(ledger.quotaMax, 120);
});

test('a vocational school splits sınavlı fields into merkezi and the school OBP into yerel', () => {
  const field = (id, name) => ({ vocationalFieldId: id, vocationalField: { id, name } });
  const ledger = buildLedger([
    score(2026, null, 54.75),
    score(2026, 99.17, null, 162.9184, field(4, 'Metal Teknolojisi Alanı (SINAVLI)')),
    score(2026, 46.96, null, 268.1089, field(3, 'Elektrik-Elektronik Teknolojisi Alanı (SINAVLI)')),
    score(2025, 51.2, null, null, field(3, 'Elektrik-Elektronik Teknolojisi Alanı (SINAVLI)')),
  ], [quota(2026, 120, 170)]);
  eq(ledger.years, [2025, 2026]);
  eq(ledger.groups.map((g) => [g.placement, g.metrics, g.rows.map((r) => [r.label, r.values])]), [
    ['merkezi', ['yuzdelik', 'lgs'], [
      ['Elektrik-Elektronik Teknolojisi Alanı', { yuzdelik: [51.2, 46.96], lgs: [null, 268.1089] }],
      ['Metal Teknolojisi Alanı', { yuzdelik: [null, 99.17], lgs: [null, 162.9184] }],
    ]],
    ['yerel', ['obp'], [['Okul geneli', { obp: [null, 54.75] }]]],
  ]);
  eq(ledger.quotas, [{ key: 'sinavli', values: [null, 120] }, { key: 'sinavsiz', values: [null, 170] }]);
  assert.equal(ledger.quotaMax, 170);
});

test('ÇPAL programs follow the school-wide row, invalid values and empty years drop out', () => {
  const ledger = buildLedger([
    score(2025, null, 44.64),
    score(2026, null, 52.082, null, { program: 'meslek' }),
    score(2026, null, 53.869, null, { program: 'anadolu_lisesi' }),
    score(2024, 0, 0, 0),
  ], []);
  eq(ledger.years, [2025, 2026]);
  eq(ledger.groups[0].rows.map((r) => [r.key, r.label, r.values.obp]), [
    ['genel', 'Okul geneli', [44.64, null]],
    ['program:anadolu_lisesi', 'Anadolu Lisesi Programı', [null, 53.869]],
    ['program:meslek', 'Meslek Programı', [null, 52.082]],
  ]);
  eq(ledger.quotas, []);
});

test('keeps only the last three years and reports an empty ledger honestly', () => {
  const ledger = buildLedger([2021, 2022, 2023, 2024, 2025].map((y) => score(y, null, 60 + y - 2021)), []);
  eq(ledger.years, [2023, 2024, 2025]);
  eq(ledger.groups[0].rows[0].values.obp, [62, 63, 64]);
  // Kontenjan yılı da pencereyi belirler; puanı olmayan son yıl sütun olarak kalır.
  eq(buildLedger([score(2023, null, 70), score(2024, null, 71)], [quota(2026, 0, 90)]).years, [2024, 2026]);
  eq(buildLedger([], [quota(2026, null, null)]), { years: [], groups: [], quotas: [], quotaMax: 0 });
});

test('prints Turkish decimals', () => {
  assert.equal(formatPercentile(0.7), '%0,70');
  assert.equal(formatLgs(367.1478), '367,1478');
  assert.equal(formatLgs(400.439), '400,4390');
  assert.equal(formatLgs(178.12), '178,1200');
});

test('hangs a sınavlı program under its base field and keeps an orphan as its own row', () => {
  const f = (id, title, branches = []) => ({ id, slug: `s${id}`, title, branches });
  eq(groupSchoolFields([
    f(2, 'Metal Teknolojisi Alanı (SINAVLI)'),
    f(1, 'Elektrik-Elektronik Teknolojisi Alanı', ['Elektrik Tesisatları ve Dağıtımı']),
    f(3, 'İnşaat Teknolojisi Alanı (SINAVLI)', ['Yapı Ressamlığı']),
    f(4, 'Elektrik-Elektronik Teknolojisi Alanı (SINAVLI)', ['Endüstriyel Bakım Onarım']),
    f(5, 'İnşaat Teknolojisi Alanı'),
  ]).map((e) => [e.id, e.title, e.sinavli, e.sinavliOnly]), [
    [1, 'Elektrik-Elektronik Teknolojisi Alanı', { slug: 's4', branches: ['Endüstriyel Bakım Onarım'] }, false],
    [5, 'İnşaat Teknolojisi Alanı', { slug: 's3', branches: ['Yapı Ressamlığı'] }, false],
    [2, 'Metal Teknolojisi Alanı', null, true],
  ]);
});

test('groups an 11-digit Turkish phone number and leaves others alone', () => {
  assert.equal(formatPhone('03247131681'), '0324 713 16 81');
  assert.equal(formatPhone('0 (324) 713 16 81'), '0324 713 16 81');
  assert.equal(formatPhone(' 444 1 444 '), '444 1 444');
});

test('title-cases language names with Turkish rules', () => {
  assert.equal(turkishTitleCase('İNGİLİZCE'), 'İngilizce');
  assert.equal(turkishTitleCase('ıspanyolca'), 'Ispanyolca');
  assert.equal(turkishTitleCase(' ALMANCA '), 'Almanca');
});

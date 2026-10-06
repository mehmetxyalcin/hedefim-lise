import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
function load(file) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Intl, Date, console, require: name => {
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    return require(name);
  }});
  return exports;
}
const { parseFaqSheet, planFaqImport, buildFaqPreview, FAQ_IMPORT_MAX_ROWS } = load('src/lib/faq-import.ts');
const { ANSWER_MAX } = load('src/lib/qa.ts');

const sheet = (...rows) => [['Kategori', 'Soru', 'Yanıt', 'Kaynak sayfa', 'Sıra', 'Öne çıkan', 'Yayında'], ...rows];
// Objects built inside the vm context have foreign prototypes; compare their JSON form.
const clean = (obj) => JSON.parse(JSON.stringify(obj));
const eq = (actual, expected, message) => assert.deepEqual(clean(actual), expected, message);

test('header names are matched case- and Turkish-insensitively, with aliases', () => {
  for (const answerHeader of ['Yanıt', 'YANIT', 'yanit', 'Yanit', 'Cevap', 'CEVAP']) {
    const { rows, errors } = parseFaqSheet([['KATEGORİ', 'soru', answerHeader], ['Tercih', 'Ne zaman?', 'Şubat.']]);
    eq(errors, [], answerHeader);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].answer, 'Şubat.');
    assert.equal(rows[0].category, 'Tercih');
  }
  const { rows } = parseFaqSheet([['kategori', 'soru', 'yanıt', 'sayfa', 'ÖNE ÇIKAN', 'YAYINDA', 'sıra'], ['K1', 'Soru bir mi', 'Yanıt', '7', 'evet', 'hayır', '30']]);
  eq(rows[0], { row: 2, category: 'K1', question: 'Soru bir mi', answer: 'Yanıt', sourcePage: 7, sortOrder: 30, isFeatured: true, isPublished: false });
});

test('object rows work and sheet row numbers start at 2', () => {
  const { rows, errors } = parseFaqSheet([
    { Kategori: 'A kat', Soru: 'Birinci soru', Yanıt: 'Bir' },
    { Kategori: '', Soru: '', Yanıt: '' },
    { Kategori: 'A kat', Soru: 'Üçüncü soru', Yanıt: 'Üç' },
  ]);
  eq(errors, []);
  eq(rows.map(r => r.row), [2, 4]);
});

test('missing required columns are reported against row 1 and nothing is parsed', () => {
  const { rows, errors } = parseFaqSheet([['Kategori', 'Soru'], ['A kat', 'Soru bir']]);
  assert.equal(rows.length, 0);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].row, 1);
  assert.match(errors[0].message, /Yanıt/);
  assert.equal(parseFaqSheet([]).errors[0].row, 1);
});

test('booleans: defaults, words and invalid values', () => {
  const read = (featured, published) => parseFaqSheet(sheet(['K1', 'Soru bir mi', 'Yanıt', '', '', featured, published]));
  const empty = read('', '');
  assert.equal(empty.rows[0].isFeatured, false);
  assert.equal(empty.rows[0].isPublished, true);
  for (const yes of ['evet', 'EVET', 'Evet', '1', 'true', 'TRUE', 'x', 'X', 1, true]) {
    assert.equal(read(yes, yes).rows[0].isFeatured, true, String(yes));
  }
  for (const no of ['hayır', 'HAYIR', 'hayir', '0', 'false', 'FALSE', 0, false]) {
    const r = read(no, no).rows[0];
    assert.equal(r.isFeatured, false, String(no));
    assert.equal(r.isPublished, false, String(no));
  }
  const bad = read('belki', '');
  assert.equal(bad.rows.length, 0);
  assert.equal(bad.errors[0].row, 2);
  assert.match(bad.errors[0].message, /Öne çıkan/);
});

test('invalid rows become errors with the sheet row number; valid rows still parse', () => {
  const { rows, errors } = parseFaqSheet(sheet(
    ['K1', 'Geçerli soru', 'Yanıt'],
    ['', 'Kategorisiz soru', 'Yanıt'],
    ['K1', '', 'Yanıt'],
    ['K1', 'Yanıtsız soru', '   '],
    ['K1', 'x'.repeat(501), 'Yanıt'],
    ['K1', 'Uzun yanıt', 'y'.repeat(ANSWER_MAX + 1)],
    ['K1', 'Sayfa hatası', 'Yanıt', 'on'],
    ['K1', 'Sıra hatası', 'Yanıt', '', '-5'],
    ['K', 'Kısa kategori', 'Yanıt'],
    ['K1', 'Tam sınır', 'y'.repeat(ANSWER_MAX)],
  ));
  eq(rows.map(r => r.row), [2, 11]);
  eq(errors.map(e => e.row), [3, 4, 5, 6, 7, 8, 9, 10]);
  assert.match(errors[0].message, /Kategori/);
  assert.match(errors[1].message, /Soru/);
  assert.match(errors[2].message, /Yanıt/);
  assert.match(errors[6].message, /Sıra/);
});

test('whitespace is normalised; answer keeps its line breaks', () => {
  const { rows } = parseFaqSheet(sheet(['  Tercih   İşlemleri ', ' Soru   iki   boşluk ', 'Satır bir\r\nSatır iki']));
  assert.equal(rows[0].category, 'Tercih İşlemleri');
  assert.equal(rows[0].question, 'Soru iki boşluk');
  assert.equal(rows[0].answer, 'Satır bir\nSatır iki');
});

test('more than the row limit is rejected as a file-level error', () => {
  const many = Array.from({ length: FAQ_IMPORT_MAX_ROWS + 1 }, (_, i) => ['K1', `Soru numarası ${i}`, 'Yanıt']);
  const { rows, errors } = parseFaqSheet(sheet(...many));
  assert.equal(rows.length, 0);
  assert.equal(errors[0].row, 1);
  const ok = Array.from({ length: FAQ_IMPORT_MAX_ROWS }, (_, i) => ['K1', `Soru numarası ${i}`, 'Yanıt']);
  assert.equal(parseFaqSheet(sheet(...ok)).rows.length, FAQ_IMPORT_MAX_ROWS);
});

const existing = {
  categories: [
    { id: 'c1', title: 'Tercih İşlemleri', slug: 'tercih-islemleri', sortOrder: 10 },
    { id: 'c2', title: 'Yerleştirme', slug: 'yerlestirme', sortOrder: 20 },
  ],
  faqs: [
    { question: 'Tercih ne zaman yapılır?', slug: 'tercih-ne-zaman-yapilir', categoryId: 'c1', sortOrder: 40 },
  ],
};
const plan = (rows, ex = existing) => planFaqImport(parseFaqSheet(sheet(...rows)).rows, ex);

test('existing categories match by folded title and by slug; unknown ones are planned as new', () => {
  const result = plan([
    ['TERCIH ISLEMLERI', 'Birinci yeni soru', 'Yanıt'],
    ['yerleştirme', 'İkinci yeni soru', 'Yanıt'],
    ['Pansiyon ve Kayıt', 'Üçüncü yeni soru', 'Yanıt'],
    ['pansiyon  ve kayıt', 'Dördüncü yeni soru', 'Yanıt'],
    ['Özel Durumlar', 'Beşinci yeni soru', 'Yanıt'],
  ]);
  eq(result.create.map(c => c.categoryId), ['c1', 'c2', null, null, null]);
  eq(result.create.map(c => c.newCategoryTitle), [null, null, 'Pansiyon ve Kayıt', 'Pansiyon ve Kayıt', 'Özel Durumlar']);
  eq(result.newCategories, [
    { title: 'Pansiyon ve Kayıt', slug: 'pansiyon-ve-kayit', sortOrder: 30 },
    { title: 'Özel Durumlar', slug: 'ozel-durumlar', sortOrder: 40 },
  ]);
});

test('a category whose slug equals an existing category slug is that category', () => {
  const result = plan([
    ['Yerleştirme!', 'Soru bir mi', 'Yanıt'],
    ['Nakil', 'Soru iki mi', 'Yanıt'],
  ], { categories: [...existing.categories, { id: 'c9', title: 'Başka', slug: 'nakil', sortOrder: 5 }], faqs: [] });
  // "Nakil" shares its slug with c9; "Yerleştirme!" folds to the same slug as an existing category => same category.
  assert.equal(result.create[0].categoryId, 'c2');
  assert.equal(result.create[1].categoryId, 'c9');
});

test('slug match wins over a differently titled category with a numbered slug', () => {
  const result = plan([['Nakil-İşlemleri', 'Soru bir mi', 'Yanıt']], {
    categories: [{ id: 'c9', title: 'Başka ad', slug: 'nakil-islemleri-2', sortOrder: 5 }, { id: 'c8', title: 'Yer', slug: 'nakil-islemleri', sortOrder: 6 }],
    faqs: [],
  });
  // slug "nakil-islemleri" belongs to an existing category => matched, no new category.
  assert.equal(result.create[0].categoryId, 'c8');
  assert.equal(result.newCategories.length, 0);
});

test('duplicates against existing questions and earlier rows are skipped, not created', () => {
  const result = plan([
    ['Tercih İşlemleri', 'TERCİH NE ZAMAN YAPILIR', 'Yanıt'],
    ['Yerleştirme', 'Sonuçlar nerede açıklanır', 'Yanıt'],
    ['Nakil', 'sonuçlar nerede   açıklanır?', 'Yanıt'],
  ]);
  eq(result.create.map(c => c.row), [3]);
  eq(result.skippedDuplicates, [
    { row: 2, question: 'TERCİH NE ZAMAN YAPILIR', reason: 'existing' },
    { row: 4, question: 'sonuçlar nerede açıklanır?', reason: 'file' },
  ]);
  // A skipped duplicate does not create its category.
  eq(result.newCategories, []);
});

test('faq slugs are unique against existing slugs and within the file', () => {
  const result = plan([
    ['Tercih İşlemleri', 'Aynı slug olan soru ilk', 'Yanıt'],
    ['Tercih İşlemleri', 'Aynı slug olan soru ilk!!', 'Yanıt'],
    ['Tercih İşlemleri', 'Aynı slug olan soru ilk (2)', 'Yanıt'],
  ]);
  const slugs = result.create.map(c => c.slug);
  // Second row is a duplicate (punctuation folds away); third has a distinct fold.
  assert.equal(result.create.length, 2);
  assert.equal(new Set(slugs).size, slugs.length);

  const clash = plan([['Tercih İşlemleri', 'Tercih ne zaman yapılır mı', 'Yanıt']], {
    ...existing,
    faqs: [{ question: 'Başka soru', slug: 'tercih-ne-zaman-yapilir-mi', categoryId: 'c1', sortOrder: 0 }],
  });
  assert.equal(clash.create[0].slug, 'tercih-ne-zaman-yapilir-mi-2');

  const same = plan([
    ['Tercih İşlemleri', 'Soru bir iki', 'Yanıt'],
    ['Tercih İşlemleri', 'Soru bir iki üç', 'Yanıt'],
  ], { ...existing, faqs: [{ question: 'Eski', slug: 'soru-bir-iki', categoryId: 'c1', sortOrder: 0 }] });
  eq(same.create.map(c => c.slug), ['soru-bir-iki-2', 'soru-bir-iki-uc']);
});

test('sort order: explicit values are kept, empty ones continue from the category maximum in steps of 10', () => {
  const result = plan([
    ['Tercih İşlemleri', 'Birinci yeni soru', 'Yanıt'],
    ['Tercih İşlemleri', 'İkinci yeni soru', 'Yanıt', '', '5'],
    ['Tercih İşlemleri', 'Üçüncü yeni soru', 'Yanıt'],
    ['Yerleştirme', 'Dördüncü yeni soru', 'Yanıt'],
    ['Yeni Kat', 'Beşinci yeni soru', 'Yanıt'],
    ['Yeni Kat', 'Altıncı yeni soru', 'Yanıt'],
  ]);
  eq(result.create.map(c => c.sortOrder), [50, 5, 60, 10, 10, 20]);
});

test('preview lists rows in sheet order with ok / duplicate / error statuses', () => {
  const parsed = parseFaqSheet(sheet(
    ['Tercih İşlemleri', 'Yepyeni bir soru', 'Yanıt'],
    ['', 'Kategorisiz soru', 'Yanıt'],
    ['Tercih İşlemleri', 'Tercih ne zaman yapılır?', 'Yanıt'],
    ['Nakil', 'Nakil sorusu', 'Yanıt'],
  ));
  const preview = buildFaqPreview(parsed, planFaqImport(parsed.rows, existing));
  eq(preview.items.map(i => [i.row, i.status, i.newCategory]), [[2, 'ok', false], [3, 'error', false], [4, 'duplicate', false], [5, 'ok', true]]);
  eq(preview.counts, { total: 4, create: 2, duplicate: 1, error: 1, newCategories: 1 });
  eq(preview.newCategories, ['Nakil']);
  assert.equal(preview.items[1].question, 'Kategorisiz soru');

  const broken = parseFaqSheet([['Kategori', 'Soru']]);
  const brokenPreview = buildFaqPreview(broken, planFaqImport(broken.rows, existing));
  assert.equal(brokenPreview.fileErrors.length, 1);
  assert.equal(brokenPreview.items.length, 0);
});

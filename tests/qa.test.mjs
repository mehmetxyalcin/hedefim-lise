import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
function load(file) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: () => ({}) });
  // vm bağlamının dizileri deepEqual'da farklı prototipe sahip; düz JS'e çevir.
  return Object.fromEntries(Object.entries(exports).map(([k, v]) => [k, typeof v === 'function' ? (...a) => JSON.parse(JSON.stringify(v(...a)) ?? 'null') : v]));
}
const qa = load('src/lib/qa.ts');
const faq = (id, question, answer, extra = {}) => ({ id, slug: id, question, answer, category: 'Tercih İşlemleri', categoryId: 'c1', sortOrder: 0, isPublished: true, isFeatured: false, origin: 'editorial', ...extra });
const faqs = [
  faq('a', 'Kaç okul tercih edebilirim?', 'En fazla 5 okul seçebilirsiniz.'),
  faq('b', 'İstanbul dışından nakil olur mu?', 'Nakil dönemlerinde mümkündür.', { category: 'Nakil İşlemleri', categoryId: 'c2' }),
  faq('c', 'Yerel yerleştirme nedir?', 'Adrese dayalı yerleştirmedir; tercihler önemlidir.'),
];
const index = qa.indexFaqs(faqs);

test('folds Turkish casing and diacritics', () => {
  assert.equal(qa.foldTr('İSTANBUL Işık ÇAĞ'), 'istanbul isik cag');
  assert.equal(qa.slugifyQuestion('Kaç okul tercih edebilirim?'), 'kac-okul-tercih-edebilirim');
  assert.equal(qa.slugifyQuestion('???'), 'soru');
  assert.equal(qa.uniqueSlug('soru', ['soru', 'soru-2']), 'soru-3');
});

test('search requires every meaningful term at a word start and ranks question hits first', () => {
  assert.deepEqual(qa.searchFaqs(index, 'tercih').map(h => h.faq.id), ['a', 'c']);
  assert.deepEqual(qa.searchFaqs(index, 'istanbul nakil').map(h => h.faq.id), ['b']);
  assert.deepEqual(qa.searchFaqs(index, 'rcih').map(h => h.faq.id), []);
  assert.deepEqual(qa.searchFaqs(index, 'nedir').map(h => h.faq.id), ['c'], 'stop-word-only query still searches');
  assert.deepEqual(qa.searchFaqs(index, '   '), []);
});

test('similar questions need fewer matching terms than search', () => {
  assert.deepEqual(qa.similarFaqs(index, 'kaç tane okul yazabilirim').map(f => f.id), ['a']);
  assert.deepEqual(qa.similarFaqs(index, 'ab'), []);
  // "tercih" soruların çoğunda geçer: tek başına öneri üretmez; "pansiyon" üretir.
  const more = qa.indexFaqs([...faqs, faq('d', 'Tercih onayı nasıl yapılır?', 'Okul onaylar.'), faq('e', 'Yatılılık başvurusu?', 'Pansiyonlu okul müdürlüğüne.')]);
  assert.deepEqual(qa.similarFaqs(more, 'tercih ücreti'), []);
  assert.deepEqual(qa.similarFaqs(more, 'TEST pansiyon ücreti nasıl ödenir').map(f => f.id), ['e']);
});

test('highlight ranges map back to original code points', () => {
  const text = 'İstanbul dışından nakil';
  const ranges = qa.highlightRanges(text, qa.searchTerms('istanbul nakil'));
  const chars = [...text];
  assert.deepEqual(ranges.map(([s, e]) => chars.slice(s, e).join('')), ['İstanbul', 'nakil']);
});

test('groups by category order and drops empty categories', () => {
  const cats = [{ id: 'c2', title: 'Nakil' }, { id: 'c1', title: 'Tercih' }, { id: 'c3', title: 'Boş' }];
  assert.deepEqual(qa.groupByCategory(cats, faqs).map(g => [g.category.id, g.faqs.length]), [['c2', 1], ['c1', 2]]);
});

test('submission check trims, bounds and refuses contact details', () => {
  const ok = qa.checkSubmission({ question: '  Pansiyon   ücreti ne kadar?  ', categoryId: '', nickname: ' ' });
  assert.equal(ok.ok, true);
  assert.deepEqual({ ...ok.value }, { question: 'Pansiyon ücreti ne kadar?', categoryId: null, nickname: null });
  assert.equal(qa.checkSubmission({ question: 'kısa', categoryId: '', nickname: '' }).field, 'question');
  assert.equal(qa.checkSubmission({ question: 'Beni arayın lütfen yardım', categoryId: '', nickname: '0532 123 45 67' }).field, 'nickname');
  assert.equal(qa.checkSubmission({ question: 'Mail atın ali@example.com adresime', categoryId: '', nickname: '' }).field, 'question');
  assert.equal(qa.checkSubmission({ question: 'Geçerli bir soru metni', categoryId: 'x', nickname: '' }).field, 'categoryId');
  assert.equal(qa.TOKEN_PATTERN.test('a'.repeat(64)), true);
  assert.equal(qa.TOKEN_PATTERN.test('A'.repeat(64)), false);
});

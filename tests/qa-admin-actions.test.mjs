import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Yönetim sunucu eylemleri: sahte bir Supabase istemcisiyle gerçek eylem dosyası
// çalıştırılır; hangi tabloya ne yazıldığı, hangi yola yönlendirildiği ve hangi
// önbellekler tazelendiği doğrulanır.
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, FormData, Intl, Date, console, require: name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks);
    return require(name);
  }});
  return exports;
}

const ACTIONS = 'src/app/admin/soru-cevap/actions.ts';
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const SUB = uuid(1), CAT = uuid(2), FAQ = uuid(3), OTHER = uuid(4);
const form = values => { const f = new FormData(); for (const [k, v] of Object.entries(values)) f.append(k, v); return f; };

// responder(call) → { data, error, count }; call = { table, ops: [[method, ...args], ...] }
function harness(responder = () => ({ data: null, error: null })) {
  const calls = [];
  const db = {
    from(table) {
      const call = { table, ops: [] };
      calls.push(call);
      const chain = {};
      for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'single', 'maybeSingle']) {
        chain[m] = (...args) => { call.ops.push([m, ...args]); return chain; };
      }
      chain.then = (resolve, reject) => Promise.resolve(responder(call)).then(resolve, reject);
      return chain;
    },
  };
  const revalidated = [];
  const api = load(ACTIONS, {
    '@/lib/admin-auth': { requireAdmin: async () => ({ supabase: db, profile: { role: 'admin' }, user: { id: uuid(9) } }) },
    '@/lib/faqs': { FAQ_CACHE_TAG: 'faqs' },
    'next/navigation': { redirect: url => { throw new Error(`REDIRECT:${decodeURIComponent(url)}`); } },
    'next/cache': {
      revalidatePath: (path, type) => revalidated.push(type ? `${path}|${type}` : path),
      revalidateTag: tag => revalidated.push(`tag:${tag}`),
    },
  });
  return { calls, api, revalidated };
}

const op = (call, name) => call.ops.find(o => o[0] === name);
const writesTo = (calls, table, method) => calls.filter(c => c.table === table && op(c, method));
const payload = (calls, table, method) => { const c = writesTo(calls, table, method)[0]; return c ? op(c, method)[1] : undefined; };

const ALL_REVALIDATIONS = ['tag:faqs', '/soru-cevap|layout', '/admin/soru-cevap', '/sitemap.xml'];

test('invalid requests redirect with a message and never touch the database', async () => {
  const cases = [
    ['answerSubmission', { id: SUB, answer: '   ' }],
    ['answerSubmission', { id: 'x', answer: 'Yanıt' }],
    ['answerSubmission', { id: SUB, answer: 'a'.repeat(6001) }],
    ['answerSubmission', { id: SUB, answer: 'Yanıt', note: 'n'.repeat(601) }],
    ['rejectSubmission', { id: SUB, related_faq_id: 'bad' }],
    ['rejectSubmission', { id: SUB, note: 'n'.repeat(601) }],
    ['reopenSubmission', { id: '' }],
    ['publishSubmission', { id: SUB, question: 'Soru', answer: 'Yanıt', category_id: 'bad' }],
    ['publishSubmission', { id: SUB, question: 'Soru', answer: 'Yanıt', category_id: CAT, slug: 'Büyük Harf' }],
    ['publishSubmission', { id: SUB, question: '', answer: 'Yanıt', category_id: CAT }],
    ['deleteSubmission', { id: 'x' }],
    ['createFaq', { question: 'Soru', answer: 'Yanıt', category_id: '' }],
    ['createFaq', { question: 'Soru', answer: 'Yanıt', category_id: CAT, slug: '-kotu--adres-' }],
    ['updateFaq', { question: 'Soru', answer: 'Yanıt', category_id: CAT }],
    ['saveCategory', { title: '' }],
    ['saveCategory', { title: 'A' }],
    ['saveCategory', { title: 'Geçerli', slug: 'Kötü Adres' }],
    ['saveCategory', { title: 'Geçerli', description: 'd'.repeat(301) }],
    ['deleteCategory', { id: 'x' }],
  ];
  for (const [name, values] of cases) {
    const { calls, api, revalidated } = harness();
    await assert.rejects(api[name](form(values)), /REDIRECT:\/admin\/soru-cevap\?.*error=.+/, `${name} ${JSON.stringify(values)}`);
    assert.equal(calls.length, 0, `${name} ${JSON.stringify(values)} must not query`);
    assert.deepEqual(revalidated, [], `${name} must not revalidate on failure`);
  }
});

test('failures keep the tab, filter and selected submission in the redirect', async () => {
  const { api } = harness();
  await assert.rejects(
    api.answerSubmission(form({ id: SUB, answer: '', sekme: 'gelen', durum: 'yeni', soru: SUB })),
    new RegExp(`REDIRECT:/admin/soru-cevap\\?sekme=gelen&durum=yeni&soru=${SUB}&error=Yanıt boş olamaz`),
  );
  // Bilinmeyen / bozuk dönüş alanları atılır; açık yönlendirme olamaz.
  await assert.rejects(
    api.answerSubmission(form({ id: SUB, answer: '', sekme: 'https://kotu.example', durum: 'x', soru: 'y', ara: 'a'.repeat(300) })),
    /REDIRECT:\/admin\/soru-cevap\?sekme=gelen&ara=a{100}&error=/,
  );
});

test('answering saves status, answer, note and clears a stale related question', async () => {
  const { calls, api, revalidated } = harness(() => ({ data: { id: SUB }, error: null }));
  await assert.rejects(
    api.answerSubmission(form({ id: SUB, answer: 'Yanıt\r\n\r\nİkinci', note: '  Not  ', durum: 'yeni' })),
    new RegExp(`REDIRECT:/admin/soru-cevap\\?sekme=gelen&durum=yeni&soru=${SUB}&success=Yanıt kaydedildi`),
  );
  const record = payload(calls, 'question_submissions', 'update');
  assert.equal(record.status, 'answered');
  assert.equal(record.answer, 'Yanıt\n\nİkinci');
  assert.equal(record.note, 'Not');
  assert.equal(record.related_faq_id, null);
  assert.ok(Date.now() - new Date(record.answered_at).getTime() < 5000);
  assert.ok(writesTo(calls, 'question_submissions', 'update')[0].ops.some(o => o[0] === 'eq' && o[1] === 'id' && o[2] === SUB));
  assert.deepEqual(revalidated, ALL_REVALIDATIONS);
});

test('rejecting stores the note and the related question; reopening keeps the answer text', async () => {
  const rejected = harness(() => ({ data: { id: SUB }, error: null }));
  await assert.rejects(rejected.api.rejectSubmission(form({ id: SUB, note: 'Kılavuzda yok', related_faq_id: FAQ })), /success=Soru reddedildi/);
  const record = payload(rejected.calls, 'question_submissions', 'update');
  assert.deepEqual({ ...record, updated_at: undefined }, { status: 'rejected', note: 'Kılavuzda yok', related_faq_id: FAQ, updated_at: undefined });
  assert.deepEqual(rejected.revalidated, ALL_REVALIDATIONS);

  const bare = harness(() => ({ data: { id: SUB }, error: null }));
  await assert.rejects(bare.api.rejectSubmission(form({ id: SUB, note: '', related_faq_id: '' })), /success=/);
  const empty = payload(bare.calls, 'question_submissions', 'update');
  assert.equal(empty.note, null);
  assert.equal(empty.related_faq_id, null);

  const reopened = harness(() => ({ data: { id: SUB }, error: null }));
  await assert.rejects(reopened.api.reopenSubmission(form({ id: SUB })), /success=Soru yeniden/);
  const reopen = payload(reopened.calls, 'question_submissions', 'update');
  assert.equal(reopen.status, 'new');
  assert.equal('answer' in reopen, false, 'answer text is left untouched');
  assert.deepEqual(reopened.revalidated, ALL_REVALIDATIONS);
});

test('a vanished submission is reported instead of success', async () => {
  const { api, revalidated } = harness(() => ({ data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } }));
  await assert.rejects(api.answerSubmission(form({ id: SUB, answer: 'Yanıt' })), /error=Soru bulunamadı/);
  assert.deepEqual(revalidated, []);
});

function publishResponder({ status = 'answered', publishedFaqId = null, slugs = [], top = 30 } = {}) {
  return call => {
    const first = call.ops[0];
    if (call.table === 'question_submissions' && op(call, 'maybeSingle')) return { data: { id: SUB, status, published_faq_id: publishedFaqId }, error: null };
    if (call.table === 'faqs' && first[0] === 'select' && first[1] === 'slug') return { data: slugs.map(slug => ({ slug })), error: null };
    if (call.table === 'faqs' && first[0] === 'select' && first[1] === 'sort_order') return { data: top === null ? null : { sort_order: top }, error: null };
    if (call.table === 'faqs' && first[0] === 'insert') return { data: { id: FAQ }, error: null };
    return { data: { id: SUB }, error: null };
  };
}
const publishForm = (extra = {}) => form({ id: SUB, question: 'Tercih nasıl yapılır?', answer: 'Yanıt metni', category_id: CAT, sekme: 'gelen', durum: 'yanitlanan', ...extra });

test('publishSubmission refuses submissions that are not answered', async () => {
  for (const status of ['new', 'rejected']) {
    const { calls, api, revalidated } = harness(publishResponder({ status }));
    await assert.rejects(api.publishSubmission(publishForm()), new RegExp(`REDIRECT:/admin/soru-cevap\\?sekme=gelen&durum=yanitlanan&soru=${SUB}&error=Yalnızca yanıtlanmış sorular`), status);
    assert.equal(writesTo(calls, 'faqs', 'insert').length, 0, `${status}: nothing is inserted`);
    assert.equal(writesTo(calls, 'question_submissions', 'update').length, 0);
    assert.deepEqual(revalidated, []);
  }
});

test('publishSubmission refuses a submission that is already published and a missing one', async () => {
  const again = harness(publishResponder({ publishedFaqId: FAQ }));
  await assert.rejects(again.api.publishSubmission(publishForm()), /error=Bu soru zaten herkese açık/);
  assert.equal(writesTo(again.calls, 'faqs', 'insert').length, 0);

  const gone = harness(call => (call.table === 'question_submissions' ? { data: null, error: null } : { data: [], error: null }));
  await assert.rejects(gone.api.publishSubmission(publishForm()), /error=Soru bulunamadı/);
  assert.equal(writesTo(gone.calls, 'faqs', 'insert').length, 0);
});

test('publishSubmission inserts a community FAQ with a unique slug, next sort order and links it back', async () => {
  const { calls, api, revalidated } = harness(publishResponder({ slugs: ['tercih-nasil-yapilir', 'tercih-nasil-yapilir-2'], top: 30 }));
  await assert.rejects(api.publishSubmission(publishForm()), new RegExp(`REDIRECT:/admin/soru-cevap\\?sekme=gelen&durum=yanitlanan&soru=${SUB}&success=Soru herkese açık`));
  const faq = payload(calls, 'faqs', 'insert');
  assert.equal(faq.slug, 'tercih-nasil-yapilir-3');
  assert.equal(faq.origin, 'community');
  assert.equal(faq.submission_id, SUB);
  assert.equal(faq.is_published, true);
  assert.equal(faq.category_id, CAT);
  assert.equal(faq.sort_order, 40);
  assert.equal('category' in faq, false, 'legacy category text is filled by the trigger');
  const link = payload(calls, 'question_submissions', 'update');
  assert.equal(link.published_faq_id, FAQ);
  assert.deepEqual(revalidated, ALL_REVALIDATIONS);
});

test('publishSubmission: empty category starts at 10, explicit slug is used or refused when taken', async () => {
  const first = harness(publishResponder({ top: null }));
  await assert.rejects(first.api.publishSubmission(publishForm({ slug: 'ozel-adres' })), /success=/);
  const faq = payload(first.calls, 'faqs', 'insert');
  assert.equal(faq.sort_order, 10);
  assert.equal(faq.slug, 'ozel-adres');

  const taken = harness(publishResponder({ slugs: ['ozel-adres'] }));
  await assert.rejects(taken.api.publishSubmission(publishForm({ slug: 'ozel-adres' })), /error=Bu adres başka bir soruda/);
  assert.equal(writesTo(taken.calls, 'faqs', 'insert').length, 0);
});

test('publishSubmission rolls the FAQ back when linking the submission fails', async () => {
  const responder = publishResponder();
  const { calls, api, revalidated } = harness(call => (call.table === 'question_submissions' && op(call, 'update') ? { data: null, error: { message: 'bağlantı koptu' } } : responder(call)));
  await assert.rejects(api.publishSubmission(publishForm()), /error=Soru bağlanamadı, ekleme geri alındı: bağlantı koptu/);
  assert.equal(writesTo(calls, 'faqs', 'delete').length, 1);
  assert.ok(writesTo(calls, 'faqs', 'delete')[0].ops.some(o => o[0] === 'eq' && o[1] === 'id' && o[2] === FAQ));
  assert.deepEqual(revalidated, []);
});

test('deleteSubmission removes the row and drops the selection from the redirect', async () => {
  const { calls, api, revalidated } = harness(() => ({ data: { id: SUB }, error: null }));
  await assert.rejects(api.deleteSubmission(form({ id: SUB, sekme: 'gelen', durum: 'yeni', soru: SUB })), /REDIRECT:\/admin\/soru-cevap\?sekme=gelen&durum=yeni&success=Ziyaretçi sorusu silindi\.$/);
  assert.equal(writesTo(calls, 'question_submissions', 'delete').length, 1);
  assert.deepEqual(revalidated, ALL_REVALIDATIONS);
});

test('createFaq: empty slug is generated and made unique against existing slugs', async () => {
  const { calls, api, revalidated } = harness(call => (call.table === 'faqs' && op(call, 'select') ? { data: [{ slug: 'nakil-ne-zaman-yapilir' }, { slug: 'baska' }, { slug: null }], error: null } : { data: null, error: null }));
  await assert.rejects(api.createFaq(form({ question: 'Nakil ne zaman yapılır?', answer: 'Yanıt', category_id: CAT, slug: '', is_featured: 'on', sort_order: '20' })), /REDIRECT:\/admin\/soru-cevap\?sekme=sorular&success=Soru eklendi/);
  const record = payload(calls, 'faqs', 'insert');
  assert.equal(record.slug, 'nakil-ne-zaman-yapilir-2');
  assert.equal(record.category_id, CAT);
  assert.equal(record.is_featured, true);
  assert.equal(record.is_published, false, 'unchecked box means draft');
  assert.equal(record.sort_order, 20);
  assert.match(record.source_title, /Tercih ve Yerleştirme Kılavuzu/);
  assert.deepEqual(revalidated, ALL_REVALIDATIONS);

  const explicit = harness();
  await assert.rejects(explicit.api.createFaq(form({ question: 'Soru', answer: 'Yanıt', category_id: CAT, slug: 'kendi-adresim' })), /success=/);
  assert.equal(payload(explicit.calls, 'faqs', 'insert').slug, 'kendi-adresim');
  assert.equal(explicit.calls.filter(c => c.table === 'faqs' && op(c, 'select')).length, 0, 'explicit slug needs no lookup');
});

test('updateFaq regenerates an emptied slug without colliding with its own, and reports duplicates', async () => {
  const { calls, api } = harness(call => (call.table === 'faqs' && op(call, 'select') && !op(call, 'single') ? { data: [{ slug: 'baska' }], error: null } : { data: { id: FAQ }, error: null }));
  await assert.rejects(api.updateFaq(form({ id: FAQ, question: 'Yeni Başlık', answer: 'Yanıt', category_id: CAT, slug: '', is_published: 'on' })), /success=Soru güncellendi/);
  const lookup = calls.find(c => c.table === 'faqs' && op(c, 'select') && !op(c, 'single'));
  assert.ok(lookup.ops.some(o => o[0] === 'neq' && o[1] === 'id' && o[2] === FAQ), 'own row is excluded from taken slugs');
  assert.equal(payload(calls, 'faqs', 'update').slug, 'yeni-baslik');
  assert.equal(payload(calls, 'faqs', 'update').is_published, true);

  const dup = harness(call => (call.table === 'faqs' && op(call, 'update') ? { data: null, error: { code: '23505', message: 'duplicate key' } } : { data: [], error: null }));
  await assert.rejects(dup.api.updateFaq(form({ id: FAQ, question: 'Soru', answer: 'Yanıt', category_id: CAT, slug: 'dolu' })), /error=Bu adres başka bir soruda kullanılıyor/);
  assert.deepEqual(dup.revalidated, []);
});

test('deleteFaq returns to the Questions tab with its search and filter', async () => {
  const { calls, api, revalidated } = harness(() => ({ data: { id: FAQ }, error: null }));
  await assert.rejects(api.deleteFaq(form({ id: FAQ, sekme: 'sorular', ara: 'nakil', kategori: CAT })), new RegExp(`REDIRECT:/admin/soru-cevap\\?sekme=sorular&ara=nakil&kategori=${CAT}&success=Soru silindi`));
  assert.equal(writesTo(calls, 'faqs', 'delete').length, 1);
  assert.deepEqual(revalidated, ALL_REVALIDATIONS);
});

test('deleteCategory refuses a category that still holds questions', async () => {
  const { calls, api, revalidated } = harness(call => (call.ops[0][0] === 'select' ? { data: null, count: 3, error: null } : { data: { id: CAT }, error: null }));
  await assert.rejects(api.deleteCategory(form({ id: CAT })), /REDIRECT:\/admin\/soru-cevap\?sekme=kategoriler&error=Bu kategoride 3 soru var; önce soruları başka kategoriye taşıyın\./);
  assert.equal(writesTo(calls, 'faq_categories', 'delete').length, 0);
  assert.deepEqual(revalidated, []);
});

test('deleteCategory handles a foreign-key refusal from the database gracefully', async () => {
  const { api, revalidated } = harness(call => {
    if (call.ops[0][0] === 'select') return { data: null, count: 0, error: null };
    return { data: null, error: { code: '23503', message: 'update or delete on table "faq_categories" violates foreign key constraint' } };
  });
  await assert.rejects(api.deleteCategory(form({ id: CAT })), /error=Bu kategoride soru var; önce soruları başka kategoriye taşıyın\.$/);
  assert.deepEqual(revalidated, []);
});

test('deleteCategory removes an empty category and refreshes everything', async () => {
  const { calls, api, revalidated } = harness(call => (call.ops[0][0] === 'select' ? { data: null, count: 0, error: null } : { data: { id: CAT }, error: null }));
  await assert.rejects(api.deleteCategory(form({ id: CAT })), /REDIRECT:\/admin\/soru-cevap\?sekme=kategoriler&success=Kategori silindi/);
  assert.equal(writesTo(calls, 'faq_categories', 'delete').length, 1);
  assert.deepEqual(revalidated, ALL_REVALIDATIONS);
});

test('saveCategory: creates with a generated Turkish slug, updates by id, and explains duplicates', async () => {
  const created = harness(call => (call.table === 'faq_categories' && op(call, 'select') ? { data: [{ slug: 'ozel-durumlar' }], error: null } : { data: null, error: null }));
  await assert.rejects(created.api.saveCategory(form({ title: 'Özel Durumlar', description: ' Kısa ', sort_order: '60', is_published: 'on' })), /REDIRECT:\/admin\/soru-cevap\?sekme=kategoriler&success=Kategori eklendi/);
  const record = payload(created.calls, 'faq_categories', 'insert');
  assert.equal(record.slug, 'ozel-durumlar-2');
  assert.equal(record.title, 'Özel Durumlar');
  assert.equal(record.description, 'Kısa');
  assert.equal(record.sort_order, 60);
  assert.equal(record.is_published, true);
  assert.deepEqual(created.revalidated, ALL_REVALIDATIONS);

  const updated = harness(() => ({ data: { id: CAT }, error: null }));
  await assert.rejects(updated.api.saveCategory(form({ id: CAT, title: 'Yerleştirme', slug: 'yerlestirme', description: '' })), /success=Kategori güncellendi/);
  const update = payload(updated.calls, 'faq_categories', 'update');
  assert.equal(update.description, null);
  assert.equal(update.is_published, false);
  assert.ok(updated.calls[0].ops.some(o => o[0] === 'eq' && o[1] === 'id' && o[2] === CAT));

  const title = harness(() => ({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "faq_categories_title_key"' } }));
  await assert.rejects(title.api.saveCategory(form({ title: 'Yerleştirme', slug: 'yerlestirme' })), /error=Bu başlıkta bir kategori zaten var/);
  const slug = harness(() => ({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "faq_categories_slug_key"' } }));
  await assert.rejects(slug.api.saveCategory(form({ title: 'Başka', slug: 'yerlestirme' })), /error=Bu adres başka bir kategoride/);
  assert.deepEqual(slug.revalidated, []);
});

test('every mutating action refreshes the cache tag, the public layout, the admin page and the sitemap', async () => {
  const scenarios = [
    ['createFaq', { question: 'Soru', answer: 'Yanıt', category_id: CAT, slug: 'a' }],
    ['updateFaq', { id: FAQ, question: 'Soru', answer: 'Yanıt', category_id: CAT, slug: 'a' }],
    ['deleteFaq', { id: FAQ }],
    ['answerSubmission', { id: SUB, answer: 'Yanıt' }],
    ['rejectSubmission', { id: SUB }],
    ['reopenSubmission', { id: SUB }],
    ['deleteSubmission', { id: SUB }],
    ['saveCategory', { title: 'Yeni', slug: 'yeni' }],
  ];
  for (const [name, values] of scenarios) {
    const { api, revalidated } = harness(() => ({ data: { id: OTHER }, error: null }));
    await assert.rejects(api[name](form(values)), /success=/, name);
    assert.deepEqual(revalidated, ALL_REVALIDATIONS, name);
  }
});

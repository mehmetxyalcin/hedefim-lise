import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, FormData, File, Blob, Intl, Date, console, require: name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks);
    return require(name);
  }});
  return exports;
}
const uuid = '12345678-1234-1234-1234-123456789012';
const form = values => { const f = new FormData(); for (const [k, v] of Object.entries(values)) f.append(k, v); return f; };
const valid = { title: 'Nakil dönemi: İlk adımlar', excerpt: 'Kısa özet', body: 'Metin\r\n\r\n## Başlık', category: 'Nakil İşlemleri', status: 'yayinda' };

function actions(responder = () => ({ data: { id: uuid, slug: 'eski-adres' }, error: null })) {
  const calls = [];
  const db = {
    from(table) {
      calls.push(['from', table]);
      const chain = {};
      for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'single', 'maybeSingle']) chain[method] = (...args) => { calls.push([method, ...args]); return chain; };
      chain.then = (resolve, reject) => Promise.resolve(responder(calls)).then(resolve, reject);
      return chain;
    },
    storage: { from() { return { upload: async (...args) => { calls.push(['upload', ...args]); return { error: null }; }, getPublicUrl: path => ({ data: { publicUrl: `https://cdn.test/${path}` } }) }; } },
  };
  const revalidated = [];
  const redirect = url => { throw new Error(`REDIRECT:${decodeURIComponent(url)}`); };
  const api = load('src/app/admin/blog/actions.ts', {
    '@/lib/admin-auth': { requireAdmin: async () => ({ supabase: db, profile: { role: 'admin' }, user: { id: uuid } }) },
    '@/lib/blog-data': { BLOG_CACHE_TAG: 'blog-posts' },
    'next/navigation': { redirect },
    'next/cache': { revalidatePath: path => revalidated.push(path), revalidateTag: tag => revalidated.push(`tag:${tag}`) },
  });
  return { calls, api, revalidated };
}
const written = (calls, op) => calls.find(c => c[0] === op)?.[1];

test('invalid posts return a message and never touch the database', async () => {
  for (const data of [{ ...valid, title: '  ' }, { ...valid, status: 'arsiv' }, { ...valid, highlight: 'x'.repeat(25) }, { ...valid, published_at: 'yarın' }, { ...valid, slug: '---', title: '!!!' }]) {
    const { calls, api } = actions();
    const result = await api.saveBlogPost(null, form(data));
    assert.equal(result.success, false, JSON.stringify(data));
    assert.equal(calls.some(c => c[0] === 'insert' || c[0] === 'update'), false);
  }
});

test('new post derives a Turkish slug, publishes now and opens its editor', async () => {
  const { calls, api, revalidated } = actions(calls => ({ data: calls.some(c => c[0] === 'insert') ? { id: uuid } : null, error: null }));
  await assert.rejects(api.saveBlogPost(null, form(valid)), new RegExp(`REDIRECT:/admin/blog/${uuid}/duzenle\\?success=Yazı kaydedildi ve yayında`));
  const record = written(calls, 'insert');
  assert.equal(record.slug, 'nakil-donemi-ilk-adimlar');
  assert.equal(record.is_published, true);
  assert.ok(Date.now() - new Date(record.published_at).getTime() < 5000);
  assert.equal(record.highlight, null);
  assert.equal(record.author_name, 'Hedefim Lise');
  assert.equal(record.body, 'Metin\n\n## Başlık');
  assert.ok(revalidated.includes('tag:blog-posts') && revalidated.includes('/blog/nakil-donemi-ilk-adimlar'));
});

test('draft keeps a planned Istanbul date; scheduled publish reports its date', async () => {
  const draft = actions();
  const result = await draft.api.saveBlogPost(null, form({ ...valid, id: uuid, status: 'taslak', published_at: '2026-10-01T09:00' }));
  assert.equal(result.success, true);
  assert.equal(result.message, 'Taslak kaydedildi.');
  const record = written(draft.calls, 'update');
  assert.equal(record.is_published, false);
  assert.equal(record.published_at, '2026-10-01T06:00:00.000Z');
  assert.ok(draft.revalidated.includes('/blog/eski-adres'), 'old slug path is refreshed after a rename');

  const scheduled = actions();
  const future = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);
  assert.match((await scheduled.api.saveBlogPost(null, form({ ...valid, id: uuid, published_at: future }))).message, /yayın tarihinde/);
});

test('slug collision and vanished posts are reported instead of success', async () => {
  const taken = actions(calls => calls.some(c => c[0] === 'update') ? { data: null, error: { code: '23505', message: 'duplicate' } } : { data: { slug: 'x' }, error: null });
  assert.match((await taken.api.saveBlogPost(null, form({ ...valid, id: uuid, slug: 'Mevcut Adres' }))).message, /“mevcut-adres” adresi başka bir yazıda/);

  const gone = actions(() => ({ data: null, error: null }));
  const result = await gone.api.saveBlogPost(null, form({ ...valid, id: uuid }));
  assert.equal(result.success, false);
  assert.equal(gone.calls.some(c => c[0] === 'update'), false);
});

test('covers: SVG is refused before upload, raster uploads under blog/, removal clears alt text', async () => {
  const svg = actions();
  const refused = await svg.api.saveBlogPost(null, form({ ...valid, id: uuid, cover_file: new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' }) }));
  assert.match(refused.message, /JPG, PNG, WebP veya AVIF/);
  assert.equal(svg.calls.some(c => c[0] === 'upload' || c[0] === 'update'), false);

  const png = actions();
  await png.api.saveBlogPost(null, form({ ...valid, id: uuid, cover_image_alt: 'Kapak', cover_file: new File([new Uint8Array([1, 2])], 'k.png', { type: 'image/png' }) }));
  assert.match(png.calls.find(c => c[0] === 'upload')[1], /^blog\/nakil-donemi-ilk-adimlar-\d+\.png$/);
  assert.match(written(png.calls, 'update').cover_image_url, /^https:\/\/cdn\.test\/blog\//);

  const removed = actions();
  await removed.api.saveBlogPost(null, form({ ...valid, id: uuid, current_cover: 'https://cdn.test/blog/a.png', cover_image_alt: 'Kapak', remove_cover: 'on' }));
  const record = written(removed.calls, 'update');
  assert.equal(record.cover_image_url, null);
  assert.equal(record.cover_image_alt, null);
});

test('delete validates the id and confirms the row was removed', async () => {
  const bad = actions();
  await assert.rejects(bad.api.deleteBlogPost(form({ id: 'bad' })), /REDIRECT:\/admin\/blog\?error=/);
  assert.equal(bad.calls.length, 0);
  const missing = actions(() => ({ data: null, error: { message: 'Kayıt yok' } }));
  await assert.rejects(missing.api.deleteBlogPost(form({ id: uuid })), /REDIRECT:\/admin\/blog\?error=Yazı silinemedi/);
  const ok = actions(() => ({ data: { slug: 'silinen' }, error: null }));
  await assert.rejects(ok.api.deleteBlogPost(form({ id: uuid })), /REDIRECT:\/admin\/blog\?success=Yazı silindi/);
  assert.ok(ok.revalidated.includes('/blog/silinen'));
});

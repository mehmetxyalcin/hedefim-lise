import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
function load(file) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, Intl, Date, console, require: name => {
    if (name.startsWith('./')) return load(join(dirname(file), `${name.slice(2)}.ts`));
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    return require(name);
  }});
  return exports;
}
const blog = load('src/lib/blog.ts');
const md = load('src/lib/blog-markdown.ts');
const plain = value => JSON.parse(JSON.stringify(value));

test('Turkish slugs fold dotted and dotless i, accents and punctuation', () => {
  assert.equal(blog.slugifyTr('İlk Tercih: Işıklı Çağ Öğrencisi!'), 'ilk-tercih-isikli-cag-ogrencisi');
  assert.equal(blog.slugifyTr('  Yüzdelik %1 dilim  '), 'yuzdelik-1-dilim');
  assert.equal(blog.slugifyTr('---'), '');
  assert.ok(blog.slugifyTr('a'.repeat(300)).length <= 120);
  assert.ok(blog.SLUG_PATTERN.test('yerel-yerlestirme-nasil-isler'));
  assert.ok(!blog.SLUG_PATTERN.test('Yerel yerleştirme'));
});

test('search folds Turkish casing and matches every term', () => {
  const posts = [
    { title: 'İmam hatip liseleri', excerpt: '', body: '', category: 'Genel' },
    { title: 'Nakil dönemi', excerpt: 'Işık okulu', body: 'OBP', category: 'Nakil İşlemleri' },
  ];
  assert.equal(blog.filterPosts(posts, { ara: 'imam' }).length, 1);
  assert.equal(blog.filterPosts(posts, { ara: 'IŞIK obp' }).length, 1);
  assert.equal(blog.filterPosts(posts, { ara: 'isik yok' }).length, 0);
  assert.equal(blog.filterPosts(posts, { kategori: 'nakil-islemleri' }).length, 1);
  assert.deepEqual(plain(blog.categoriesOf([...posts, posts[1]]).map(c => [c.param, c.count])), [['nakil-islemleri', 2], ['genel', 1]]);
});

test('search highlight marks every folded term match and leaves the text intact', () => {
  const segments = plain(blog.highlightSegments('İlk tercihte OBP ve ışık', 'ilk isik obp'));
  assert.equal(segments.map(s => s.text).join(''), 'İlk tercihte OBP ve ışık');
  assert.deepEqual(segments.filter(s => s.match).map(s => s.text), ['İlk', 'OBP', 'ışık']);
  assert.deepEqual(plain(blog.highlightSegments('Metin', '')), [{ text: 'Metin', match: false }]);
  assert.deepEqual(plain(blog.highlightSegments('Metin', 'a')), [{ text: 'Metin', match: false }], 'one-letter terms are ignored');
});

test('publish state: draft, scheduled in the future, published in the past', () => {
  const now = new Date('2026-09-24T12:00:00Z');
  assert.equal(blog.postState({ isPublished: false, publishedAt: '2026-01-01T00:00:00Z' }, now), 'taslak');
  assert.equal(blog.postState({ isPublished: true, publishedAt: null }, now), 'taslak');
  assert.equal(blog.postState({ isPublished: true, publishedAt: '2026-09-25T00:00:00Z' }, now), 'zamanlanmis');
  assert.equal(blog.postState({ isPublished: true, publishedAt: '2026-09-24T11:59:00Z' }, now), 'yayinda');
});

test('Istanbul datetime-local round-trips through ISO at UTC+3', () => {
  assert.equal(blog.fromIstanbulInput('2026-09-24T09:30'), '2026-09-24T06:30:00.000Z');
  assert.equal(blog.toIstanbulInput('2026-09-24T06:30:00.000Z'), '2026-09-24T09:30');
  for (const bad of ['', '2026-09-24', '2026-13-40T99:99', 'dün']) assert.equal(blog.fromIstanbulInput(bad), null, bad);
  assert.equal(blog.formatBlogDate('2026-09-23T22:30:00Z'), '24 Eylül 2026');
});

test('reading time, page clamping, tones and related posts', () => {
  assert.equal(blog.readingMinutes('kısa'), 1);
  assert.equal(blog.readingMinutes(Array(1000).fill('kelime').join(' ')), 6);
  assert.equal(blog.readingMinutes(Array(180).fill('kelime').join(' ')), 1);
  assert.equal(blog.clampPage('abc', 30, 12), 1);
  assert.equal(blog.clampPage('9', 30, 12), 3);
  assert.equal(blog.clampPage('2', 0, 12), 1);
  assert.equal(blog.plateTone('Yerleştirme'), 'ink');
  assert.equal(blog.plateTone('TERCİH işlemleri'), blog.plateTone('Tercih İşlemleri'));
  for (const name of ['Yepyeni kategori', 'Genel', 'Tercih İşlemleri', 'x', 'Burslar']) assert.notEqual(blog.plateTone(name), 'lemon', 'lemon is reserved for the featured plate');
  const posts = [{ id: '1', category: 'A' }, { id: '2', category: 'B' }, { id: '3', category: 'A' }, { id: '4', category: 'C' }];
  assert.deepEqual(plain(blog.relatedPosts(posts[0], posts).map(p => p.id)), ['3', '2', '4']);
  assert.equal(blog.truncate('a  b   c', 10), 'a b c');
  assert.equal(blog.truncate('abcdefghij', 5), 'abcd…');
});

test('markdown blocks: headings with unique ids, lists, callouts, tables, rules', () => {
  const blocks = plain(md.parseMarkdown([
    '# Giriş', 'İlk satır', 'ikinci satır', '', '## Giriş', '### Alt başlık',
    '- bir', '- iki', '  devam', '', '1. birinci', '2. ikinci', '',
    '> [!Önemli] Başlık yok', '> satır', '', '> düz alıntı', '',
    '| A | B |', '| --- | --- |', '| 1 | 2 |', '| 3 |', '', '---',
  ].join('\n')));
  assert.deepEqual(blocks.map(b => b.type), ['heading', 'paragraph', 'heading', 'heading', 'list', 'list', 'callout', 'quote', 'table', 'rule']);
  assert.deepEqual(blocks.slice(0, 4).filter(b => b.type === 'heading').map(b => [b.level, b.id]), [[2, 'giris'], [2, 'giris-2'], [3, 'alt-baslik']]);
  assert.equal(blocks[1].children[0].value, 'İlk satır ikinci satır');
  assert.equal(blocks[4].ordered, false);
  assert.equal(md.inlineText(blocks[4].items[1]), 'iki devam');
  assert.equal(blocks[5].ordered, true);
  assert.equal(blocks[6].kind, 'onemli');
  assert.equal(md.inlineText(blocks[6].paragraphs[0]), 'Başlık yok satır');
  assert.equal(blocks[8].rows[1].length, 2, 'short rows are padded to the header width');
  assert.deepEqual(plain(md.tableOfContents(blocks)).map(e => e.text), ['Giriş', 'Giriş', 'Alt başlık']);
});

test('inline markup nests and unsafe links or images degrade to text', () => {
  const [p] = md.parseMarkdown('**kalın ==vurgu==** ve *italik* ve `kod` ve [site](/okullar?yerlestirme=yerel) ve [kötü](javascript:alert(1))');
  const types = plain(p.children.map(n => n.type));
  assert.deepEqual(types, ['strong', 'text', 'em', 'text', 'code', 'text', 'link', 'text']);
  assert.equal(p.children[0].children[1].type, 'mark');
  assert.equal(p.children[6].href, '/okullar?yerlestirme=yerel');
  assert.ok(!JSON.stringify(p).includes('javascript:'), 'unsafe href never reaches the tree');
  assert.equal(md.parseMarkdown('![x](http://example.com/a.png)').length, 0, 'plain http images are dropped');
  assert.equal(md.parseMarkdown('![Kapak](https://example.com/a.png)')[0].type, 'image');
  for (const href of ['//evil.test', 'data:text/html,x', 'https://u:p@example.com', '/\\evil']) assert.equal(md.isSafeHref(href), false, href);
  assert.equal(md.parseInline('2 * 3 * 4')[0].value, '2 * 3 * 4', 'spaced asterisks stay literal');
  assert.equal(md.parseInline('<script>alert(1)</script>')[0].value, '<script>alert(1)</script>', 'HTML stays text');
});

test('seeded drafts in the migration parse into headed sections', () => {
  const sql = readFileSync('supabase/migrations/019_blog_posts.sql', 'utf8');
  const bodies = [...sql.matchAll(/\$body\$([\s\S]*?)\$body\$/g)].map(m => m[1]);
  assert.equal(bodies.length, 2);
  for (const body of bodies) {
    const blocks = md.parseMarkdown(body);
    assert.ok(md.tableOfContents(blocks).length >= 4);
    assert.ok(blocks.some(b => b.type === 'callout'));
  }
});

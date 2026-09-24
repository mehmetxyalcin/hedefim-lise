import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite();
const admin = '00000000-0000-4000-8000-000000000001';
const member = '00000000-0000-4000-8000-000000000002';
const migration = readFileSync('supabase/migrations/019_blog_posts.sql', 'utf8');
before(async () => {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to authenticated, anon;
    create table public.profiles(id uuid primary key, email text, role text);
    alter table profiles enable row level security;
    create policy own_profile on profiles for select to authenticated using(id = auth.uid());
    insert into profiles values ('${admin}','admin@example.test','admin'),('${member}','member@example.test','member');
    create table public.navigation_items(id uuid primary key default gen_random_uuid(), label text not null, href text not null, order_index int not null default 0, is_visible boolean not null default true, target text not null default '_self');
    insert into navigation_items(label, href, order_index) values ('Okullar','/okullar',0),('Soru-Cevap','/soru-cevap',4);
  `);
  await db.exec(migration);
  // Supabase public tablolara bu yetkileri varsayılan olarak verir; RLS asıl sınırdır.
  // profiles okuma yetkisi canlıyla aynı (015: kullanıcı yalnız kendi satırını görür).
  await db.exec(`grant select on blog_posts to anon; grant select,insert,update,delete on blog_posts to authenticated; grant select on profiles to authenticated;`);
});
after(() => db.close());

async function as(user, sql, params = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${user ? 'authenticated' : 'anon'}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? '']);
    return tx.query(sql, params);
  });
}

test('seeds two drafts and one visible Blog menu item, and re-running is idempotent', async () => {
  await db.exec(migration);
  const posts = (await db.query('select slug, is_published from blog_posts order by slug')).rows;
  assert.deepEqual(posts, [
    { slug: 'yerel-yerlestirme-nasil-isler', is_published: false },
    { slug: 'yuzdelik-dilim-ve-obp-nasil-okunur', is_published: false },
  ]);
  const nav = (await db.query("select label, order_index, is_visible from navigation_items where href = '/blog'")).rows;
  assert.deepEqual(nav, [{ label: 'Blog', order_index: 5, is_visible: true }]);
});

test('visitors see only published posts whose date has arrived', async () => {
  await db.exec(`
    insert into blog_posts(slug,title,excerpt,body,is_published,published_at) values
      ('gecmis','Geçmiş','Özet','Metin',true,now() - interval '1 day'),
      ('gelecek','Gelecek','Özet','Metin',true,now() + interval '1 day');`);
  for (const user of [null, member]) {
    const rows = (await as(user, 'select slug from blog_posts order by slug')).rows.map(r => r.slug);
    assert.deepEqual(rows, ['gecmis'], `user ${user}`);
  }
  assert.equal((await as(admin, 'select count(*)::int as n from blog_posts')).rows[0].n, 4);
});

test('only admins write; members and visitors are refused', async () => {
  await assert.rejects(as(member, "insert into blog_posts(slug,title,excerpt,body) values ('x','X','Ö','M')"), /row-level security/);
  await assert.rejects(as(null, "insert into blog_posts(slug,title,excerpt,body) values ('y','Y','Ö','M')"), /row-level security|permission denied/);
  const updated = await as(member, "update blog_posts set title = 'Ele geçirildi' where slug = 'gecmis' returning id");
  assert.equal(updated.rows.length, 0);
  await as(admin, "update blog_posts set title = 'Yeni başlık' where slug = 'gecmis'");
  assert.equal((await db.query("select title from blog_posts where slug = 'gecmis'")).rows[0].title, 'Yeni başlık');
  const deleted = await as(admin, "delete from blog_posts where slug = 'gelecek' returning id");
  assert.equal(deleted.rows.length, 1);
});

test('constraints reject malformed slugs, blank titles and published posts without a date', async () => {
  for (const sql of [
    "insert into blog_posts(slug,title,excerpt,body) values ('Büyük Harf','T','Ö','M')",
    "insert into blog_posts(slug,title,excerpt,body) values ('bos-baslik','   ','Ö','M')",
    "insert into blog_posts(slug,title,excerpt,body,is_published) values ('tarihsiz','T','Ö','M',true)",
    "insert into blog_posts(slug,title,excerpt,body) values ('gecmis','T','Ö','M')",
    `insert into blog_posts(slug,title,excerpt,body,highlight) values ('uzun','T','Ö','M','${'x'.repeat(25)}')`,
  ]) await assert.rejects(db.query(sql), undefined, sql);
});

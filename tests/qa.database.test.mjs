import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite();
const admin = '00000000-0000-4000-8000-000000000001';
const member = '00000000-0000-4000-8000-000000000002';
const faqsMigration = readFileSync('supabase/migrations/010_faqs.sql', 'utf8');
const migration = readFileSync('supabase/migrations/021_qa_center.sql', 'utf8');
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
  `);
  await db.exec(faqsMigration);
  // Canlıda elle eklenmiş, tohumda olmayan bir kategori.
  await db.exec(`insert into faqs(question, answer, category, sort_order) values ('Burs başvurusu nasıl yapılır?', 'Okul müdürlüğüne.', 'Burslar', 500)`);
  await db.exec(migration);
  await db.exec(`
    grant select on faqs, faq_categories to anon;
    grant select,insert,update,delete on faqs, faq_categories, question_submissions to authenticated;
    grant select on profiles to authenticated;`);
});
after(() => db.close());

async function as(user, sql, params = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${user ? 'authenticated' : 'anon'}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? '']);
    return tx.query(sql, params);
  });
}

test('backfills categories, category_id and unique slugs; re-running is idempotent', async () => {
  await db.exec(migration);
  const cats = (await db.query('select slug, title from faq_categories order by sort_order, slug')).rows;
  assert.deepEqual(cats.map(c => c.slug), ['tercih-islemleri', 'yerlestirme', 'nakil-islemleri', 'ozel-durumlar', 'pansiyon-ve-kayit', 'burslar']);
  const missing = (await db.query('select count(*)::int n from faqs where category_id is null or slug is null')).rows[0].n;
  assert.equal(missing, 0);
  const dupes = (await db.query('select count(*)::int n from (select slug from faqs group by slug having count(*) > 1) d')).rows[0].n;
  assert.equal(dupes, 0);
  const first = (await db.query("select slug from faqs where question = '2026 lise tercihleri ne zaman yapılacak?'")).rows[0].slug;
  assert.equal(first, '2026-lise-tercihleri-ne-zaman-yapilacak');
});

test('trigger keeps legacy category text and category_id in sync both ways', async () => {
  const legacy = (await db.query(`insert into faqs(question, answer, category) values ('Eski kod sorusu burada mı?', 'Evet.', 'Yerleştirme') returning category_id, slug`)).rows[0];
  const yer = (await db.query(`select id from faq_categories where slug = 'yerlestirme'`)).rows[0].id;
  assert.equal(legacy.category_id, yer);
  assert.match(legacy.slug, /^eski-kod-sorusu-burada-mi-[0-9a-f]{6}$/);
  const nakil = (await db.query(`select id from faq_categories where slug = 'nakil-islemleri'`)).rows[0].id;
  const modern = (await db.query(`insert into faqs(question, answer, category_id, slug) values ('Yeni kod sorusu?', 'Evet.', $1, 'yeni-kod-sorusu') returning category`, [nakil])).rows[0];
  assert.equal(modern.category, 'Nakil İşlemleri');
  await db.query(`update faq_categories set title = 'Nakil' where id = $1`, [nakil]);
  assert.equal((await db.query(`select category from faqs where slug = 'yeni-kod-sorusu'`)).rows[0].category, 'Nakil');
  await assert.rejects(db.query(`delete from faq_categories where id = $1`, [nakil]), /foreign key/);
});

test('visitors see only published categories; only admins write them', async () => {
  await db.exec(`insert into faq_categories(slug, title, is_published) values ('gizli', 'Gizli', false)`);
  const anon = (await as(null, 'select slug from faq_categories')).rows.map(r => r.slug);
  assert.ok(!anon.includes('gizli'));
  assert.ok((await as(admin, 'select slug from faq_categories')).rows.some(r => r.slug === 'gizli'));
  await assert.rejects(as(member, "insert into faq_categories(slug, title) values ('x', 'Xx')"), /row-level security/);
  await assert.rejects(as(null, "insert into faq_categories(slug, title) values ('y', 'Yy')"), /row-level security|permission denied/);
  await assert.rejects(db.query("insert into faq_categories(slug, title) values ('takip', 'Takip')"), /check constraint/);
});

test('visitors submit through the function only and get a 64-hex tracking token', async () => {
  await assert.rejects(as(null, 'select * from question_submissions'), /permission denied/);
  assert.equal((await as(member, 'select * from question_submissions')).rows.length, 0);
  const token = (await as(null, `select submit_question('Pansiyon ücreti ne kadar acaba?', 'Detay', null, 'Ece', 'abc') as t`)).rows[0].t;
  assert.match(token, /^[0-9a-f]{64}$/);
  const stored = (await db.query('select token_hash, status, nickname from question_submissions')).rows[0];
  assert.notEqual(stored.token_hash, token);
  assert.equal(stored.status, 'new');
  const status = (await as(null, 'select * from get_question_status($1)', [token])).rows;
  assert.equal(status.length, 1);
  assert.equal(status[0].status, 'new');
  assert.equal(status[0].answer, null);
  assert.equal((await as(null, 'select * from get_question_status($1)', ['0'.repeat(64)])).rows.length, 0);
  assert.equal((await as(null, 'select * from get_question_status($1)', ["' or 1=1 --"])).rows.length, 0);
});

test('submission validates length and rate-limits per client', async () => {
  await assert.rejects(as(null, `select submit_question('kısa')`), /qa:question_length/);
  await as(null, `select submit_question('İkinci soru metni burada', null, null, null, 'abc')`);
  await as(null, `select submit_question('Üçüncü soru metni burada', null, null, null, 'abc')`);
  await assert.rejects(as(null, `select submit_question('Dördüncü soru metni burada', null, null, null, 'abc')`), /qa:rate_limited/);
  await as(null, `select submit_question('Başka istemciden soru', null, null, null, 'def')`);
});

test('unpublished category on submission is dropped, not trusted', async () => {
  const gizli = (await db.query(`select id from faq_categories where slug = 'gizli'`)).rows[0].id;
  await as(null, `select submit_question('Gizli kategoriye soru', null, $1, null, 'ghi')`, [gizli]);
  const row = (await db.query(`select category_id from question_submissions where question = 'Gizli kategoriye soru'`)).rows[0];
  assert.equal(row.category_id, null);
});

test('answer and note reach the tracker only after the admin acts', async () => {
  const token = (await as(null, `select submit_question('Nakil ne zaman başlar?', null, null, null, 'jkl') as t`)).rows[0].t;
  await assert.rejects(db.query(`update question_submissions set status = 'answered' where question = 'Nakil ne zaman başlar?'`), /answer_required/);
  await as(admin, `update question_submissions set answer = 'Taslak', note = 'not' where question = 'Nakil ne zaman başlar?'`);
  let s = (await as(null, 'select * from get_question_status($1)', [token])).rows[0];
  assert.equal(s.answer, null);
  assert.equal(s.note, null);
  const faq = (await db.query(`select id, slug from faqs where slug = 'yeni-kod-sorusu'`)).rows[0];
  await as(admin, `update question_submissions set status = 'answered', answer = 'Eylülde.', answered_at = now(), published_faq_id = $1 where question = 'Nakil ne zaman başlar?'`, [faq.id]);
  s = (await as(null, 'select * from get_question_status($1)', [token])).rows[0];
  assert.equal(s.answer, 'Eylülde.');
  assert.equal(s.published_slug, 'yeni-kod-sorusu');
  assert.equal(s.published_category_slug, 'nakil-islemleri');
});

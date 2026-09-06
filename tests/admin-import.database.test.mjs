import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite();
const admin = '00000000-0000-4000-8000-000000000001';
const member = '00000000-0000-4000-8000-000000000002';
const oldFacility = '00000000-0000-4000-8000-000000000011';
const newFacility = '00000000-0000-4000-8000-000000000012';
const oldBranch = '00000000-0000-4000-8000-000000000021';
const newBranch = '00000000-0000-4000-8000-000000000022';
const sqlFile = 'supabase/migrations/20260905185222_atomic_school_import.sql';
before(async () => {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to authenticated, anon;
    create table public.profiles(id uuid primary key, email text, role text);
    alter table profiles enable row level security;
    create policy own_profile on profiles for select to authenticated using(id = auth.uid());
    create table public.schools(id bigserial primary key, institution_code text unique, name text not null, slug text unique not null, type text not null, district text not null,
      phone text, website text, address text, percentile text, logo text, color text, description text, features jsonb, projects jsonb, languages jsonb, images jsonb, is_active boolean default false);
    create table public.vocational_fields(id bigserial primary key, title text unique, slug text, description text, skills text, career text, branches jsonb);
    alter table vocational_fields enable row level security;
    create policy public_read_vocational_fields on vocational_fields for select using(true);
    create table school_vocational_fields(id bigserial primary key, school_id bigint references schools on delete cascade, vocational_field_id bigint references vocational_fields on delete cascade, created_at timestamptz default now(), unique(school_id,vocational_field_id));
  `);
  // Base column types and junction shape verified against live catalog on 2026-09-06.
  // Real project detail schema and policies; base tables above predate migrations.
  await db.exec(readFileSync('supabase/migrations/003_school_detail_tables.sql','utf8'));
  for (const file of ['006_schools_rls.sql','007_school_vocational_fields_rls.sql','008_vocational_fields_rls.sql']) await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
  // Required by the current app, but absent from the historical migrations.
  await db.exec(`alter table school_scores add column vocational_field_id integer references vocational_fields; alter table school_scores drop constraint school_scores_school_id_year_key;
    grant select,insert,update,delete on all tables in schema public to authenticated;
    grant usage,select on all sequences in schema public to authenticated;
    revoke insert,update,delete on profiles from authenticated;
    insert into profiles values ('${admin}','admin@example.test','admin'),('${member}','member@example.test','member');`);
  await db.exec(readFileSync(sqlFile,'utf8'));
});
after(() => db.close());
beforeEach(async () => {
  await db.exec(`drop policy if exists reject_test_insert on school_facilities; drop policy if exists reject_test_branch on school_vocational_branches; drop policy if exists reject_test_quota on school_quotas;
    truncate schools, facilities, vocational_fields cascade;
    insert into schools(id,institution_code,name,slug,type,district,is_active) values(1,'123456','Örnek Lise','ornek-lise','Anadolu Lisesi','Toroslar',true);
    insert into vocational_fields(id,title) values(1,'Bilişim Teknolojileri'),(2,'Makine Teknolojisi');
    insert into facilities(id,name) values('${oldFacility}','Kütüphane'),('${newFacility}','Spor Salonu');
    insert into vocational_branches(id,vocational_field_id,name) values('${oldBranch}',1,'Yazılım'),('${newBranch}',2,'Üretim');
    insert into school_facilities values(1,'${oldFacility}');
    insert into school_vocational_fields(school_id,vocational_field_id) values(1,1);
    insert into school_vocational_branches values(1,'${oldBranch}');
    insert into school_scores(school_id,year,obp_score,lgs_score,percentile) values(1,2025,85,400,5);
    insert into school_quotas(school_id,year,sinavli_count,sinavsiz_count) values(1,2026,30,10);
    select setval(pg_get_serial_sequence('schools','id'),1,true);`);
});
async function save(mode, rows, user=admin) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)",[user]);
    const result=await tx.query('select public.admin_import_school($1, $2::jsonb) as result',[mode,JSON.stringify(rows)]);
    return result.rows[0].result;
  });
}
const row = data => ({ institution_code:'123456', ...data });
test('non-admin and absent identity cannot mutate through the RPC',async()=>{
  for (const user of [member,'']) await assert.rejects(save('basic',[row({name:'Değişti'})],user),/Yönetici yetkisi/);
  assert.equal((await db.query('select name from schools where id=1')).rows[0].name,'Örnek Lise');
  await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role anon');await tx.query("select admin_import_school('basic','[]'::jsonb)");}),/permission denied/);
});
test('basic import preserves blanks and the other quota column',async()=>{
  const result=await save('basic',[row({name:'Güncel Lise',district:'',sinavli_2026:0})]);
  assert.equal(result.operation,'updated');
  assert.equal((await db.query('select district from schools where id=1')).rows[0].district,'Toroslar');
  assert.deepEqual((await db.query('select sinavli_count,sinavsiz_count from school_quotas')).rows,[{sinavli_count:0,sinavsiz_count:10}]);
});
test('new school rolls back when a later quota fails and duplicate codes do not create a second school',async()=>{
  await db.exec("create policy reject_test_quota on school_quotas as restrictive for insert to authenticated with check(year <> 2024)");
  await assert.rejects(save('basic',[{institution_code:'999999',name:'İçel Şehit Lisesi',district:'Mezitli',school_type:'Anadolu Lisesi',sinavli_2026:20,sinavli_2024:25}]),/row-level security/);
  assert.equal((await db.query("select count(*)::int as n from schools where institution_code='999999'")).rows[0].n,0);
  const result=await save('basic',[{institution_code:'999999',name:'İçel Şehit Lisesi',district:'Mezitli',school_type:'Anadolu Lisesi'}]);
  assert.equal(result.operation,'added');assert.equal(result.slug,'icel-sehit-lisesi-999999');
  assert.deepEqual((await db.query("select features from schools where institution_code='999999'")).rows[0].features, []);
  assert.equal((await save('basic',[{institution_code:'999999',name:'Güncel'}])).operation,'updated');
});
test('a later invalid year rolls back all earlier score writes for that school',async()=>{
  await assert.rejects(save('scores',[row({obp_2025:90,lgs_2024:999})]),/sınır dışında/);
  assert.equal(Number((await db.query('select obp_score from school_scores')).rows[0].obp_score),85);
  const result=await save('scores',[row({obp_2025:90,percentile_2024:10})]);
  assert.equal(result.operation,'updated');
  assert.equal(Number((await db.query('select lgs_score from school_scores where year=2025')).rows[0].lgs_score),400);
});
test('facility insert denied after delete restores the old relations',async()=>{
  await db.exec(`create policy reject_test_insert on school_facilities as restrictive for insert to authenticated with check(facility_id <> '${newFacility}')`);
  await assert.rejects(save('facilities',[row({facility_names:['Spor Salonu']})]),/row-level security/);
  assert.deepEqual((await db.query('select facility_id from school_facilities')).rows,[{facility_id:oldFacility}]);
});
test('unknown facility mixed with a valid one cannot silently remove existing data',async()=>{
  await assert.rejects(save('facilities',[row({facility_names:['Spor Salonu','Bilinmeyen']})]),/bulunamadı/);
  assert.deepEqual((await db.query('select facility_id from school_facilities')).rows,[{facility_id:oldFacility}]);
  assert.equal((await save('facilities',[row({facility_names:[]})])).operation,'skipped');
});
test('branch insert failure restores both field and branch relations',async()=>{
  await db.exec(`create policy reject_test_branch on school_vocational_branches as restrictive for insert to authenticated with check(branch_id <> '${newBranch}')`);
  await assert.rejects(save('vocational',[row({vocational_field:'Makine Teknolojisi',branch:'Üretim'})]),/row-level security/);
  assert.deepEqual((await db.query('select vocational_field_id from school_vocational_fields')).rows,[{vocational_field_id:1}]);
  assert.deepEqual((await db.query('select branch_id from school_vocational_branches')).rows,[{branch_id:oldBranch}]);
});
test('duplicate base or score records are rejected before they can give misleading success',async()=>{
  await assert.rejects(save('basic',[row({name:'A'}),row({name:'B'})]),/birden fazla/);
  await assert.rejects(save('scores',[row({obp_2025:90}),row({obp_2025:91})]),/birden fazla/);
  assert.equal(Number((await db.query('select obp_score from school_scores')).rows[0].obp_score),85);
});
async function replace(fields, branches = null, facilities = null) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [admin]);
    return tx.query('select admin_replace_school_relations(1, $1::integer[], $2::uuid[], $3::uuid[])', [fields, branches, facilities]);
  });
}
test('individual form can clear fields and their branches while preserving facilities', async () => {
  await replace([]);
  assert.equal((await db.query('select count(*)::int n from school_vocational_fields')).rows[0].n, 0);
  assert.equal((await db.query('select count(*)::int n from school_vocational_branches')).rows[0].n, 0);
  assert.equal((await db.query('select count(*)::int n from school_facilities')).rows[0].n, 1);
});
test('individual form rejects a branch outside the selected fields without deleting old data', async () => {
  await assert.rejects(replace([1], [newBranch]), /meslek alanlarına bağlı değil/);
  assert.deepEqual((await db.query('select branch_id from school_vocational_branches')).rows, [{branch_id:oldBranch}]);
});
test('silently denied branch deletion prevents a field-only replacement from leaving invalid links', async () => {
  await db.exec('create policy reject_test_delete on school_vocational_branches as restrictive for delete to authenticated using(false)');
  try {
    await assert.rejects(replace([2]), /Dal ilişkileri değiştirilemedi/);
    assert.deepEqual((await db.query('select vocational_field_id from school_vocational_fields')).rows, [{vocational_field_id:1}]);
  } finally {
    await db.exec('drop policy reject_test_delete on school_vocational_branches');
  }
});

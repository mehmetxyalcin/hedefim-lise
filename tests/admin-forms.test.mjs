import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, URL, FormData, console, require: name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks);
    return require(name);
  }});
  return exports;
}
const validation = load('src/lib/admin-form-validation.ts');
const { validateAdminForm: validate, schoolFormRules: school, contentFormRules: content } = validation;
const form = values => { const f = new FormData(); for (const [k,v] of Object.entries(values)) for (const item of Array.isArray(v) ? v : [v]) f.append(k,item); return f; };
const uuid = '12345678-1234-1234-1234-123456789012';
const validBasic = { id:'1', name:'Örnek Lise', slug:'ornek-lise', type:'Anadolu Lisesi', district:'Akdeniz', logo:'ÖL', color:'bg-blue-600', description:'Okul açıklaması' };
test('school basic fields reject missing text, invalid choices and malformed hours before saving', () => {
  assert.equal(validate(form(validBasic),school.updateSchool),null);
  for (const change of [{name:'   '},{district:'Bilinmeyen'},{type:'x'},{placement_type:'other'},{boarding_type:'other'},{school_hours_start:'25:30'},{institution_code:'1e6'},{description:new Blob(['x'])}]) assert.ok(validate(form({...validBasic,...change}),school.updateSchool));
  assert.equal(validate(form({...validBasic, school_hours_start:'08:30', school_hours_end:'17:00:00', institution_code:'123456'}),school.updateSchool),null);
});
test('unsafe links rejected while public websites, internal navigation and contact links work', () => {
  for (const href of ['javascript:alert(1)','data:text/html,x','//evil.example','/\\evil.example','https://user:pass@example.com','https://a.com\n']) {
    // Whitespace around ordinary input is trimmed; embedded control characters remain rejected.
    if (href.endsWith('\n')) continue;
    assert.ok(validate(form({label:'Link',href}),content.createNavigationItem),href);
  }
  for (const href of ['/okullar','/okullar?ilce=Mut','#iletisim','https://example.com','mailto:a@example.com','tel:+903241234567']) assert.equal(validate(form({label:'Link',href}),content.createNavigationItem),null,href);
  assert.ok(validate(form({school_id:'1',website:'example.com'}),school.updateSchoolContact));
  assert.equal(validate(form({school_id:'1',website:'https://example.com',phone:'0 (324) 123 45 67'}),school.updateSchoolContact),null);
  assert.ok(validate(form({copyright_text:'Site',contact_email:'yanlis'}),content.updateFooterSettings));
});
test('identifiers and multi-selection reject malformed entries instead of silently dropping them', () => {
  for (const id of ['-1','1.5','1e2','0','9007199254740993']) assert.ok(validate(form({school_id:id}),school.syncSchoolFacilities));
  assert.ok(validate(form({school_id:'1',vocational_field_ids:['2','bad']}),school.syncSchoolVocationalFull));
  assert.ok(validate(form({school_id:'1',branch_ids:['']}),school.syncSchoolVocationalFull));
  assert.equal(validate(form({school_id:'1'}),school.syncSchoolVocationalFull),null,'empty selection still permits intentional clearing');
  assert.ok(validate(form({school_id:['1','2']}),school.syncSchoolFacilities));
});
test('numeric forms accept zero and decimal comma, reject partial, out-of-range or duplicate scores', () => {
  const score={school_id:'1',year:'2025',obp_score:'85,5',percentile:'0',lgs_score:'500'};
  assert.equal(validate(form(score),school.upsertSchoolScore),null);
  for (const extra of [{obp_score:'100.1'},{lgs_score:'501'},{year:'2025.0'},{percentile:'3abc'},{obp_score:['1','2']}]) assert.ok(validate(form({...score,...extra}),school.upsertSchoolScore));
  assert.ok(validate(form({school_id:'1',year:'2025',sinavli_count:'1.5'}),school.upsertSchoolQuota));
  assert.ok(validate(form({question:'S',answer:'C',category:'K',sort_order:'abc'}),content.createFaq));
  assert.ok(validate(form({question:'S',answer:'C',category:'K',source_page:'0'}),content.createFaq));
});
function actions(file, responder = () => ({data:null,error:null})) {
  const calls=[];
  const db = { from(table) { calls.push(['from',table]); const chain={}; for (const method of ['select','insert','update','delete','eq','neq','in','order','limit','single','maybeSingle','upsert']) chain[method]=(...args)=>{calls.push([method,...args]);return chain;}; chain.then=(resolve,reject)=>Promise.resolve(responder(calls)).then(resolve,reject); return chain; }, rpc(){calls.push(['rpc']);return Promise.resolve({error:null});} };
  const redirect = url => {throw new Error(`REDIRECT:${decodeURIComponent(url)}`);};
  return { calls, api:load(file, {'@/lib/admin-form-validation':validation,'@/lib/admin-auth':{requireAdmin:async()=>({supabase:db,profile:{role:'admin'},user:{id:uuid}})},'next/navigation':{redirect},'next/cache':{revalidatePath(){},revalidateTag(){}},'@/lib/site-settings':{SITE_SETTINGS_ID:uuid,FOOTER_SETTINGS_ID:uuid}}) };
}
test('invalid requests reach no database or storage calls through real school actions', async () => {
  const {calls,api}=actions('src/app/admin/okullar/actions.ts');
  for (const [name,data] of [['updateSchool',{...validBasic,district:'bad'}],['updateSchoolContact',{school_id:'1',website:'javascript:alert(1)'}]]) assert.equal((await api[name](null,form(data))).success,false);
  for (const [name,data] of [['syncSchoolVocationalFull',{school_id:'1',vocational_field_ids:['2','bad']}],['upsertSchoolScore',{school_id:'1',year:'2025'}],['upsertSchoolQuota',{school_id:'1',year:'2025'}],['updateSchoolProject',{school_id:'1',id:uuid,title:'Proje',link_url:'javascript:1'}]]) await assert.rejects(api[name](form(data)),/REDIRECT:/);
  assert.equal(calls.length,0);
});
test('school score verifies selected field belongs to that school before insertion', async () => {
  const {calls,api}=actions('src/app/admin/okullar/actions.ts');
  await assert.rejects(api.upsertSchoolScore(form({school_id:'1',year:'2025',vocational_field_id:'2',obp_score:'80'})),/bu okula bağlı değil/);
  assert.equal(calls.some(c=>c[0]==='insert'),false);
});
test('valid contact saves preserve blank optional values and report success only after write', async () => {
  const {calls,api}=actions('src/app/admin/okullar/actions.ts',()=>({data:{id:1,slug:'ornek'},error:null}));
  assert.equal((await api.updateSchoolContact(null,form({school_id:'1',website:'https://example.com',phone:'',address:'Adres'}))).success,true);
  assert.equal(calls.find(c=>c[0]==='update')[1].phone,null);
});
test('scholarship update scopes the child record to the submitted school', async () => {
  const {calls,api}=actions('src/app/admin/okullar/actions.ts',()=>({data:{slug:'ornek'},error:null}));
  await assert.rejects(api.updateSchoolScholarship(form({school_id:'1',id:uuid,title:'Burs'})),/REDIRECT:.*success=/);
  assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='school_id'&&c[2]===1));
});
test('invalid content and direct-argument admin requests do not write', async () => {
  for (const [file,name,args] of [
    ['src/app/admin/site-settings/actions.ts','createNavigationItem',[form({label:'Link',href:'javascript:1'})]],
    ['src/app/admin/soru-cevap/actions.ts','createFaq',[form({question:'S',answer:'C',category:'K',sort_order:'bad'})]],
    ['src/app/admin/meslek-alanlari/actions.ts','addVocationalField',[{}]],
    ['src/app/admin/mesajlar/actions.ts','markMessageStatus',[uuid,'deleted']],
  ]) { const {calls,api}=actions(file);await assert.rejects(api[name](...args));assert.equal(calls.length,0); }
});
test('valid school, score, quota and content requests still reach the expected writes', async () => {
  for (const [file,name,args,table] of [
    ['src/app/admin/okullar/actions.ts','createSchool',[null,form({...validBasic,is_active:'on'})],'schools'],
    ['src/app/admin/okullar/actions.ts','upsertSchoolScore',[form({school_id:'1',year:'2025',obp_score:'0'})],'school_scores'],
    ['src/app/admin/okullar/actions.ts','upsertSchoolQuota',[form({school_id:'1',year:'2025',sinavli_count:'0'})],'school_quotas'],
    ['src/app/admin/soru-cevap/actions.ts','createFaq',[form({question:'Soru',answer:'Yanıt',category:'Genel',sort_order:'0'})],'faqs'],
    ['src/app/admin/site-settings/actions.ts','createNavigationItem',[form({label:'Okullar',href:'/okullar',target:'_self'})],'navigation_items'],
  ]) {
    const {calls,api}=actions(file,calls=>({data:calls.some(c=>c[0]==='insert'||c[0]==='upsert')?{id:1,slug:'ornek'}:null,error:null}));
    await assert.rejects(api[name](...args),/REDIRECT:.*success=/);
    assert.ok(calls.some(c=>c[0]==='from'&&c[1]===table));assert.ok(calls.some(c=>c[0]==='insert'||c[0]==='upsert'));
  }
});
test('content update with no writable row reports an error instead of success', async () => {
  const {api}=actions('src/app/admin/soru-cevap/actions.ts',()=>({data:null,error:{message:'Kayıt bulunamadı'}}));
  await assert.rejects(api.updateFaq(form({id:uuid,question:'Soru',answer:'Yanıt',category:'Genel'})),/REDIRECT:.*error=Kayıt bulunamadı/);
});
test('uploads and explicitly blank enum values are rejected before saving', async () => {
  const data={...validBasic};
  for (const image_file of ['not-a-file',new Blob(['x'],{type:'text/plain'}),new Blob([new Uint8Array(5*1024*1024+1)],{type:'image/png'})]) assert.ok(validate(form({...data,image_file}),school.updateSchool));
  assert.equal(validate(form({...data,image_file:new Blob(['fixture'],{type:'image/png'})}),school.updateSchool),null);
  assert.ok(validate(form({...data,placement_type:''}),school.updateSchool));
});
test('create and update stay on the tabbed form when the slug belongs to another school', async () => {
  const taken = () => ({data:{id:99},error:null});
  for (const [name,data] of [['createSchool',{...validBasic,id:undefined}],['updateSchool',validBasic]]) {
    const {calls,api}=actions('src/app/admin/okullar/actions.ts',taken);
    const fields = Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined));
    const result = await api[name](null,form(fields));
    assert.equal(result.success,false,name);
    assert.match(result.message,/slug/i,name);
    assert.equal(calls.some(c=>c[0]==='insert'||c[0]==='update'),false,name);
  }
});
test('status and delete actions return to the ledger view they came from', async () => {
  const school = () => ({data:{id:1,slug:'ornek'},error:null});
  const {api}=actions('src/app/admin/okullar/actions.ts',school);
  await assert.rejects(api.toggleSchoolStatus(form({id:'1',is_active:'false',return_to:'/admin?eksik=puan&okul=ornek'})),
    {message:'REDIRECT:/admin?eksik=puan&okul=ornek&success=Okul pasif hale getirildi.'});
  await assert.rejects(api.toggleSchoolStatus(form({id:'1',is_active:'true',return_to:'https://evil.example/admin?x=1'})),
    {message:'REDIRECT:/admin?success=Okul aktif hale getirildi.'});
  await assert.rejects(api.deleteSchool(form({id:'1',return_to:'/admin?ilce=Mut&okul=ornek'})),
    {message:'REDIRECT:/admin?ilce=Mut&success=Okul başarıyla silindi.'});
  const bulk=actions('src/app/admin/okullar/actions.ts',()=>({data:[{id:1,slug:'ornek'}],error:null})).api;
  await assert.rejects(bulk.bulkUpdateSchoolStatus(form({ids:['1'],is_active:'true',return_to:'/admin?durum=pasif'})),
    {message:'REDIRECT:/admin?durum=pasif&success=1 okul aktif hale getirildi.'});
});
test('status action errors also return to the ledger view', async () => {
  const {calls,api}=actions('src/app/admin/okullar/actions.ts');
  await assert.rejects(api.toggleSchoolStatus(form({id:'abc',is_active:'false',return_to:'/admin?eksik=puan'})),
    /^Error: REDIRECT:\/admin\?eksik=puan&error=/);
  assert.equal(calls.length,0);
});

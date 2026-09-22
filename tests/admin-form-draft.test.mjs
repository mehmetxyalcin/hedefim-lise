import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
const require=createRequire(import.meta.url);
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'https://example.com'});
global.window=dom.window;global.document=dom.window.document;global.FormData=dom.window.FormData;global.Element=dom.window.Element;global.IS_REACT_ACT_ENVIRONMENT=true;
function load(file) {
 const exports={};const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,document,window,Element:dom.window.Element,FormData,URL,URLSearchParams,require:name=>{
  if(name==='next/link')return {default:({children,...props})=>React.createElement('a',props,children)};
  if(name==='next/image')return {default:()=>null};
  if(name==='next/navigation')return {useRouter:()=>({refresh(){}}),useSearchParams:()=>new URLSearchParams()};
  if(name.startsWith('@/')) {const base=`src/${name.slice(2)}`;return load(base+(existsSync(base+'.ts')?'.ts':'.tsx'));}
  return require(name);
 }});return exports;
}
const {SchoolFormTabs}=load('src/components/admin/SchoolFormTabs.tsx');
const noop=async()=>{};
const tabProps={submitLabel:'Kaydet',saveContact:noop,saveOtherInfo:noop,upsertScore:noop,upsertQuota:noop,deleteScore:noop,deleteQuota:noop,
 allFacilities:[],selectedFacilityIds:[],syncFacilities:noop,addFacility:noop,allVocationalFields:[],allBranches:[],selectedFieldIds:[],selectedBranchIds:[],
 syncVocational:noop,addBranch:noop,scholarships:[],addScholarship:noop,updateScholarship:noop,deleteScholarship:noop,reorderScholarship:noop,
 schoolProjects:[],addProject:noop,updateProject:noop,deleteProject:noop,reorderProject:noop,scores:[],quotas:[],schoolVocationalFields:[]};
test('failed server action on the tabbed school form shows its error and preserves the draft',async()=>{
 const container=document.getElementById('root');const root=createRoot(container);let submits=0; let finish; const response=new Promise(resolve=>{finish=resolve;});
 try {
  await act(async()=>root.render(React.createElement(SchoolFormTabs,{...tabProps,saveSchool:async()=>{submits++;return response;}})));
  const form=container.querySelector('form');const description=form.elements.namedItem('description');description.value='Kaybolmaması gereken açıklama';
  const type=form.elements.namedItem('type');type.value='Anadolu Lisesi';
  await act(async()=>type.dispatchEvent(new dom.window.Event('change',{bubbles:true})));
  // A submit event bypasses native required-field checks to isolate React's
  // automatic reset following the real asynchronous action response.
  await act(async()=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(submits,1);assert.equal(form.querySelector('button[type="submit"]').disabled,true);
  await act(async()=>finish({success:false,message:'Bu slug zaten başka bir okul tarafından kullanılıyor.'}));
  assert.equal(form.querySelector('button[type="submit"]').disabled,false);assert.match(container.querySelector('[role="alert"]').textContent,/Bu slug zaten başka bir okul tarafından kullanılıyor\./);
  assert.equal(description.value,'Kaybolmaması gereken açıklama');assert.equal(type.value,'Anadolu Lisesi');
 } finally {await act(async()=>root.unmount());dom.window.close();}
});

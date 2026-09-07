import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/program-scores.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {exports});
const {matchingPrograms,rankingValue,countMatchingSchools} = exports;
const row=(field,p,obp=null,year=2025)=>({id:String(field),school_id:1,year,vocational_field_id:field,percentile:p,obp_score:obp,lgs_score:null});
const scores=[row(1,8),row(2,14),row(3,22)];
test('any eligible program includes the school and supplies its ranking value',()=>{
 const criteria={year:2025,percentile:[15,25],sort:'yuzdelik_asc'};
 assert.equal(matchingPrograms(scores,criteria)[0].vocational_field_id,3);
 assert.equal(rankingValue(scores,criteria),22);
});
test('sorting direction chooses only among matching programs, independent of input order',()=>{
 for(const input of [scores,[...scores].reverse()]) {
  assert.equal(rankingValue(input,{year:2025,percentile:[10,25],sort:'yuzdelik_asc'}),14);
  assert.equal(rankingValue(input,{year:2025,percentile:[10,25],sort:'yuzdelik_desc'}),22);
 }
});
test('selected field cannot borrow another field or school-wide score',()=>{
 assert.equal(rankingValue([...scores,row(null,3)],{year:2025,fieldId:2,sort:'yuzdelik_asc'}),14);
 assert.equal(matchingPrograms(scores,{year:2025,fieldId:2,percentile:[15,25]}).length,0);
});
test('two score ranges must be satisfied by the same program',()=>{
 assert.equal(matchingPrograms([row(1,8,70),row(2,22,95)],{year:2025,percentile:[5,10],obp:[90,100]}).length,0);
});
test('missing current-year score never falls back to an older year',()=>{
 assert.equal(rankingValue([row(1,8,null,2024)],{year:2025,sort:'yuzdelik_asc'}),null);
});
test('zero is valid, invalid values excluded, and a missing metric is not substituted',()=>{
 assert.equal(rankingValue([row(1,null,98)],{year:2025,sort:'yuzdelik_asc'}),null);
 assert.equal(rankingValue([row(1,0),row(2,-1)],{year:2025,sort:'yuzdelik_asc'}),0);
 assert.equal(matchingPrograms([row(1,101)],{year:2025,percentile:[0,100]}).length,0);
});
test('OBP and LGS use their own metric and direction',()=>{
 const input=[row(1,5,90),{...row(2,10,80),lgs_score:450}];
 assert.equal(rankingValue(input,{year:2025,sort:'obp_desc'}),90);
 assert.equal(rankingValue(input,{year:2025,sort:'obp_asc'}),80);
 assert.equal(rankingValue(input,{year:2025,sort:'lgs_desc'}),450);
});
test('landing counts distinct schools with any matching program and respects district/type',()=>{
 const points=[8,14,22].map(value=>({schoolId:1,value,district:'A',schoolType:'Lise'}));
 points.push({schoolId:2,value:20,district:'B',schoolType:'Fen'});
 assert.equal(countMatchingSchools(points,15,25),2);
 assert.equal(countMatchingSchools(points,0,100),2);
 assert.equal(countMatchingSchools(points,15,25,'A'),1);
 assert.equal(countMatchingSchools(points,15,25,'','Fen'),1);
});

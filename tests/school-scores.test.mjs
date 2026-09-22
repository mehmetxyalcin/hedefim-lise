import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/school-scores.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const { isValidScore, placementValues, valuesBySchool, compareByScore, parsePlacement } = exports;
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const row = (year, percentile, obp_score, vocational_field_id = null) => ({ year, percentile, obp_score, vocational_field_id });
// Fatma Aliye 2025: okul geneli OBP + üç sınavlı alan.
const fatma = [row(2025,null,57.044), row(2025,72.95,null,3), row(2025,99.67,null,4), row(2025,99.73,null,5), row(2024,99.9,40)];

test('most accessible value: largest percentile, lowest OBP, latest year only', () => {
  eq(placementValues(fatma, 2025), { merkezi: 99.73, yerel: 57.044 });
  eq(placementValues([row(2025,null,80), row(2025,null,62.5)], 2025), { merkezi: null, yerel: 62.5 });
  eq(placementValues(fatma, 2023), { merkezi: null, yerel: null });
  eq(placementValues(fatma, null), { merkezi: null, yerel: null });
});
test('field filter narrows only the merkezi value', () => {
  eq(placementValues(fatma, 2025, 3), { merkezi: 72.95, yerel: 57.044 });
  eq(placementValues(fatma, 2025, 9), { merkezi: null, yerel: 57.044 });
});
test('invalid values are ignored', () => {
  for (const v of [0, -1, 100.5, NaN, Infinity, null, undefined, '50']) assert.equal(isValidScore(v), false, String(v));
  assert.equal(isValidScore(100), true);
  eq(placementValues([row(2025,0,0), row(2025,120,101)], 2025), { merkezi: null, yerel: null });
});
test('values are grouped per school', () => {
  const map = valuesBySchool([{school_id:1,...fatma[0]},{school_id:1,...fatma[3]},{school_id:2,...row(2025,15,null)}], 2025);
  eq([...map.entries()], [[1,{merkezi:99.73,yerel:57.044}],[2,{merkezi:15,yerel:null}]]);
});
test('score sort puts missing values last in both directions and breaks ties by name', () => {
  const s = (name, merkezi, yerel = null) => ({ name, values: { merkezi, yerel } });
  const list = [s('Çınar', 40), s('Boş', null), s('Ada', 40), s('Zirve', 90)];
  const names = sort => [...list].sort((a,b) => compareByScore(a,b,sort)).map(x => x.name);
  eq(names('yuzdelik_asc'), ['Ada','Çınar','Zirve','Boş']);
  eq(names('yuzdelik_desc'), ['Zirve','Ada','Çınar','Boş']);
  const obp = [s('A', null, 70), s('B', null, null), s('C', null, 90)];
  eq([...obp].sort((a,b)=>compareByScore(a,b,'obp_desc')).map(x=>x.name), ['C','A','B']);
  eq([...obp].sort((a,b)=>compareByScore(a,b,'obp_asc')).map(x=>x.name), ['A','C','B']);
});
test('placement parameter accepts only yerel and merkezi', () => {
  assert.equal(parsePlacement('yerel'), 'yerel');
  assert.equal(parsePlacement('merkezi'), 'merkezi');
  for (const v of ['yerel_merkezi', '', undefined, 'MERKEZI']) assert.equal(parsePlacement(v), null);
});

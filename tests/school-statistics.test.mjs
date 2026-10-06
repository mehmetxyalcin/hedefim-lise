import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
function load(file) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,require:(name)=>{
    if (!name.startsWith('@/')) throw new Error(`unexpected import ${name}`);
    const base = `src/${name.slice(2)}`; return load(existsSync(base+'.ts')?base+'.ts':base+'.tsx');
  }});
  return exports;
}
const S = load('src/lib/school-statistics.ts');
const { mersinSchoolStatistics2026: data } = load('src/data/mersinSchoolStatistics2026.ts');
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);

const base = [{ slug:'a', district:'Mezitli', school:'A', type:'Fen Lisesi',
  percentiles:{2022:1.5,2025:2}, lgsScores:{2025:470}, quotas:{2025:120,2026:120} }];

test('canlı okul geneli satırı yedeğin üstüne yazılır, eski yıllar kalır', () => {
  const [s] = S.mergeLiveStatistics(base, [{ slug:'a',
    school_scores:[
      { year:2026, percentile:'1.25', lgs_score:'475.5', vocational_field_id:null, program:null },
      { year:2026, percentile:90, lgs_score:150, vocational_field_id:4, program:null },
      { year:2026, percentile:80, lgs_score:null, vocational_field_id:null, program:'meslek' },
    ],
    school_quotas:[{ year:2026, sinavli_count:150 }, { year:2025, sinavli_count:0 }] }]);
  eq(s.percentiles, { 2022:1.5, 2025:2, 2026:1.25 });
  eq(s.lgsScores, { 2025:470, 2026:475.5 });
  eq(s.quotas, { 2025:120, 2026:150 });
});

test('canlı kaydı olmayan okul olduğu gibi kalır', () => {
  assert.equal(S.mergeLiveStatistics(base, [])[0], base[0]);
});

test('yıllar, eksen ve kullanıcı dilimi', () => {
  eq(S.statisticYears(base), { first:2022, latest:2025, previous:2024, quota:2026 });
  assert.equal(S.axisMax(base, [2025]), 5);
  assert.equal(S.axisMax(data, [2026, 2025]), 50);
  assert.deepEqual([...S.axisTicks(25)], [0,5,10,15,20,25]);
  assert.deepEqual([...S.axisTicks(50)], [0,10,20,30,40,50]);
  assert.equal(S.parsePercentile('3,5'), 3.5);
  assert.equal(S.parsePercentile('%0.7'), 0.7);
  assert.equal(S.parsePercentile('0'), null);
  assert.equal(S.parsePercentile('101'), null);
  assert.equal(S.parsePercentile('abc'), null);
});

test('yedek kopyada her okulun 2026 dilimi ve puanı var, slug tekil', () => {
  for (const s of data) {
    assert.ok(s.percentiles[2026] > 0, s.school);
    assert.ok(s.lgsScores[2026] > 0, s.school);
  }
  assert.equal(new Set(data.map((s) => s.slug)).size, data.length);
});

test('ilçe kontenjanları büyükten küçüğe', () => {
  const rows = S.districtQuotas(data, 2026);
  assert.equal(rows.reduce((n, r) => n + r.schools, 0), data.length);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i-1].quota >= rows[i].quota);
});

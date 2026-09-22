import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
function load(file) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,URLSearchParams,require:(name)=>{
    if (!name.startsWith('@/')) throw new Error(`unexpected import ${name}`);
    const base = `src/${name.slice(2)}`; return load(existsSync(base+'.ts')?base+'.ts':base+'.tsx');
  }});
  return exports;
}
const { evaluateSchoolHealth } = load('src/lib/school-health.ts');
const L = load('src/lib/admin-ledger.ts');
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const years = { scoreYear: 2025, quotaYear: 2026 };
const base = { type:'Anadolu Lisesi', description:'x'.repeat(90), images:['a'], languages:['İngilizce'], phone:'1', vocationalFieldCount:0, facilityCount:1, scoreYears:[2025], quotaYears:[2026] };
const row = (id, name, extra = {}, health = {}) => ({
  id, name, slug: `okul-${id}`, district: 'Akdeniz', type: 'Anadolu Lisesi', isActive: true,
  updatedAt: '2026-09-01T10:00:00Z', createdAt: '2026-01-01T10:00:00Z',
  health: evaluateSchoolHealth({ ...base, ...health }, years), ...extra,
});
const rows = [
  row(1, 'Zeytinlibahçe Anadolu Lisesi', { district: 'Erdemli', updatedAt: '2026-09-20T10:00:00Z' }),
  row(2, 'İmam Hatip Lisesi', { type: 'Anadolu İmam Hatip Lisesi', isActive: false }, { phone: null, scoreYears: [] }),
  row(3, 'Çamlıyayla Fen Lisesi', { createdAt: '2026-09-10T10:00:00Z' }, { images: [] }),
];
const ids = (list) => list.map((r) => r.id);
const filters = (qs) => L.parseLedgerFilters(new URLSearchParams(qs));

test('parses filters and ignores unknown values', () => {
  eq(filters(''), { ara:'', ilce:null, tur:null, durum:null, eksik:null, sirala:'ad' });
  eq(filters('ara=%20imam%20&ilce=Erdemli&durum=pasif&eksik=puan&sirala=eksik'),
    { ara:'imam', ilce:'Erdemli', tur:null, durum:'pasif', eksik:'puan', sirala:'eksik' });
  eq(filters('durum=hepsi&eksik=yok&sirala=constructor'), { ara:'', ilce:null, tur:null, durum:null, eksik:null, sirala:'ad' });
  assert.equal(filters('eksik=herhangi').eksik, 'herhangi');
});

test('builds a search string without defaults and with extras', () => {
  assert.equal(L.ledgerSearch(L.DEFAULT_LEDGER_FILTERS), '');
  assert.equal(L.ledgerSearch({ ...L.DEFAULT_LEDGER_FILTERS, eksik: 'puan', sirala: 'eksik' }, { okul: 'okul-3', bos: null }),
    '?eksik=puan&sirala=eksik&okul=okul-3');
  assert.equal(L.countActiveFilters(filters('ara=a&ilce=b&sirala=guncel')), 2);
});

test('search is Turkish case-insensitive across name, district, type and slug', () => {
  eq(ids(L.applyLedgerFilters(rows, filters('ara=imam'))), [2]);
  eq(ids(L.applyLedgerFilters(rows, filters('ara=ÇAMLI'))), [3]);
  eq(ids(L.applyLedgerFilters(rows, filters('ara=erdemli'))), [1]);
  eq(ids(L.applyLedgerFilters(rows, filters('ara=okul-2'))), [2]);
});

test('status and missing filters use the health rule', () => {
  eq(ids(L.applyLedgerFilters(rows, filters('durum=pasif'))), [2]);
  eq(ids(L.applyLedgerFilters(rows, filters('durum=aktif'))), [3, 1]);
  eq(ids(L.applyLedgerFilters(rows, filters('eksik=gorsel'))), [3]);
  eq(ids(L.applyLedgerFilters(rows, filters('eksik=herhangi'))), [3, 2]);
});

test('sorts by name, recency and missing count with Turkish collation', () => {
  eq(ids(L.applyLedgerFilters(rows, filters(''))), [3, 2, 1]);
  eq(ids(L.applyLedgerFilters(rows, filters('sirala=ad-ters'))), [1, 2, 3]);
  eq(ids(L.applyLedgerFilters(rows, filters('sirala=guncel'))), [1, 3, 2]);
  eq(ids(L.applyLedgerFilters(rows, filters('sirala=yeni'))), [3, 2, 1]);
  eq(ids(L.applyLedgerFilters(rows, filters('sirala=eksik'))), [2, 3, 1]);
});

test('relative dates follow the Istanbul calendar day', () => {
  const now = new Date('2026-09-23T09:00:00Z');
  assert.equal(L.formatRelativeDate('2026-09-23T01:00:00Z', now), 'bugün');
  assert.equal(L.formatRelativeDate('2026-09-22T20:59:00Z', now), 'dün');
  assert.equal(L.formatRelativeDate('2026-09-22T21:30:00Z', now), 'bugün');
  assert.equal(L.formatRelativeDate('2026-09-19T10:00:00Z', now), '4 gün önce');
  assert.equal(L.formatRelativeDate('2026-09-12T10:00:00Z', now), '12 Eyl');
  assert.equal(L.formatRelativeDate('2025-03-02T10:00:00Z', now), '2 Mar 2025');
  assert.equal(L.formatRelativeDate(null, now), '—');
  assert.equal(L.formatRelativeDate('bozuk', now), '—');
  assert.match(L.formatFullDate('2026-09-12T10:05:00Z'), /12 Eylül 2026.*13:05/);
});

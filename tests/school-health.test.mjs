import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/school-health.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const { HEALTH_CHECKS, latestYear, isVocationalType, evaluateSchoolHealth, parseHealthCheckId, missingTabs, countMissing } = exports;
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const years = { scoreYear: 2025, quotaYear: 2026 };
const full = {
  type: 'Anadolu Lisesi', description: 'x'.repeat(80), images: ['a.jpg'], languages: ['İngilizce'], phone: '0324 000 00 00',
  vocationalFieldCount: 0, facilityCount: 3, scoreYears: [2024, 2025], quotaYears: [2026],
};
const status = (h) => Object.fromEntries(h.items.map((i) => [i.id, i.status]));

test('checks keep a fixed order with short codes and target tabs', () => {
  eq(HEALTH_CHECKS.map((c) => [c.id, c.short, c.tab]), [
    ['gorsel','G','temel'], ['aciklama','A','temel'], ['tesis','T','tesisler'], ['dil','D','temel'],
    ['puan','P','puanlar'], ['kontenjan','K','puanlar'], ['alan','M','meslekler'], ['telefon','Tel','iletisim'],
  ]);
});

test('a complete non-vocational school passes seven checks and skips the field check', () => {
  const h = evaluateSchoolHealth(full, years);
  eq(status(h), { gorsel:'ok', aciklama:'ok', tesis:'ok', dil:'ok', puan:'ok', kontenjan:'ok', alan:'na', telefon:'ok' });
  eq({ missing: h.missing, required: h.required, complete: h.complete }, { missing: 0, required: 7, complete: true });
});

test('missing items carry readable messages', () => {
  const h = evaluateSchoolHealth({ ...full, description: 'kısa', images: [], languages: [], phone: '  ', facilityCount: 0, scoreYears: [2024], quotaYears: [] }, years);
  const messages = Object.fromEntries(h.items.filter((i) => i.status === 'missing').map((i) => [i.id, i.message]));
  eq(messages, {
    gorsel: 'Görsel yok', aciklama: 'Açıklama kısa (4/80)', tesis: 'Tesis kaydı yok', dil: 'Yabancı dil yok',
    puan: '2025 puanı yok', kontenjan: '2026 kontenjanı yok', telefon: 'Telefon yok',
  });
  assert.equal(h.complete, false);
  assert.equal(h.missing, 7);
  assert.equal(evaluateSchoolHealth({ ...full, description: '   ' }, years).items[1].message, 'Açıklama yok');
});

test('vocational schools need a field; detection is Turkish case-insensitive', () => {
  assert.equal(isVocationalType('Mesleki ve Teknik Anadolu Lisesi'), true);
  assert.equal(isVocationalType('ÇOK PROGRAMLI ANADOLU LİSESİ MESLEK'), true);
  assert.equal(isVocationalType('Fen Lisesi'), false);
  const voc = { ...full, type: 'Mesleki ve Teknik Anadolu Lisesi' };
  assert.equal(status(evaluateSchoolHealth(voc, years)).alan, 'missing');
  assert.equal(status(evaluateSchoolHealth({ ...voc, vocationalFieldCount: 2 }, years)).alan, 'ok');
});

test('score and quota checks are not required when the dataset has no year', () => {
  const h = evaluateSchoolHealth({ ...full, scoreYears: [], quotaYears: [] }, { scoreYear: null, quotaYear: null });
  eq([status(h).puan, status(h).kontenjan, h.required], ['na', 'na', 5]);
});

test('latest year, id parsing, tabs and counts', () => {
  assert.equal(latestYear([2023, 2025, 2024]), 2025);
  assert.equal(latestYear([]), null);
  assert.equal(parseHealthCheckId('puan'), 'puan');
  for (const v of ['PUAN', '', null, undefined, 'herhangi']) assert.equal(parseHealthCheckId(v), null);
  const h = evaluateSchoolHealth({ ...full, phone: null, quotaYears: [] }, years);
  eq([...missingTabs(h)].sort(), ['iletisim', 'puanlar']);
  assert.equal(countMissing([h, evaluateSchoolHealth(full, years)], 'telefon'), 1);
});

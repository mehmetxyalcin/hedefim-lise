import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
// Modules run in a separate vm realm; compare plain data, not prototypes.
const eq = (actual, expected) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)));
const modules = new Map();
function load(file, globals = {}) {
  if (modules.has(file)) return modules.get(file);
  const exports = {};
  modules.set(file, exports);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code, {...globals, exports, require:name=>name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`, globals) : require(name)});
  return exports;
}
const { parseFavorites, latestYearScores, mergeFreshFavorites, moveFavorite } = load('src/lib/favorites.ts');
const score = (year, field = null, percentile = 10) => ({ year, percentile, obp_score: 90, lgs_score: 450, vocational_field_name: field });
const fav = (id, extra = {}) => ({ id, name: `Okul ${id}`, district: 'Mezitli', school_type: 'Anadolu Lisesi', slug: `okul-${id}`, scores: [], ...extra });

test('storage parser survives corrupt data, migrates old shape and drops duplicates', () => {
  eq(parseFavorites(null), []);
  eq(parseFavorites('{bozuk'), []);
  eq(parseFavorites('{"id":1}'), []);
  const list = parseFavorites(JSON.stringify([
    { id: 7, name: 'Eski', district: 'Tarsus', school_type: 'Fen Lisesi', slug: 'eski', latest_score: score(2024) },
    { id: '7', slug: 'kopya' }, null, { id: '', slug: 'x' }, { id: '8', slug: 'yeni', scores: [score(2025), { year: 'x' }] },
  ]));
  eq(list.map(f => f.id), ['7', '8']);
  assert.equal(list[0].scores[0].year, 2024);
  assert.equal(list[1].scores.length, 1);
});

test('latest-year selection keeps every program of that year, school-wide first', () => {
  const picked = latestYearScores([score(2024), score(2025, 'Makine'), score(2025, 'Bilişim'), score(2025)]);
  eq(picked.map(s => [s.year, s.vocational_field_name]), [[2025, null], [2025, 'Bilişim'], [2025, 'Makine']]);
  eq(latestYearScores([]), []);
});

test('fresh rows replace stale copies in order; unpublished schools stay and are reported', () => {
  const stored = [fav('1', { scores: [score(2024)] }), fav('2'), fav('3', { name: 'Kaldırılan' })];
  const rows = [
    { id: 2, name: 'Yeni Ad', slug: 'yeni-ad', district: 'Toroslar', type: 'Meslek Lisesi', school_scores: [{ year: 2025, percentile: 30, obp_score: 70, lgs_score: 300, vocational_field: { title: 'Bilişim' } }] },
    { id: 1, name: 'Okul 1', slug: 'okul-1', district: 'Mezitli', type: 'Anadolu Lisesi', school_scores: [{ year: 2025, percentile: 5.5, obp_score: 95, lgs_score: 480, vocational_field: null }, { year: 2024, percentile: 6, obp_score: 94, lgs_score: 470, vocational_field: null }] },
  ];
  const { list, missingIds } = mergeFreshFavorites(stored, rows);
  eq(list.map(f => f.id), ['1', '2', '3']);
  eq(list[0].scores, [score(2025, null, 5.5)].map(s => ({ ...s, obp_score: 95, lgs_score: 480 })));
  assert.equal(list[1].slug, 'yeni-ad');
  assert.equal(list[1].school_type, 'Meslek Lisesi');
  assert.equal(list[1].scores[0].vocational_field_name, 'Bilişim');
  assert.equal(list[2].name, 'Kaldırılan');
  eq(missingIds, ['3']);
});

test('moving past either end is a no-op', () => {
  const list = [fav('1'), fav('2')];
  assert.equal(moveFavorite(list, 0, -1), list);
  assert.equal(moveFavorite(list, 1, 1), list);
  eq(moveFavorite(list, 0, 1).map(f => f.id), ['2', '1']);
});

test('hook follows same-tab writes and changes from another tab', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://hedefimlise.com/tercihlerim' });
  const globals = { window: dom.window, localStorage: dom.window.localStorage, Event: dom.window.Event };
  Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const { useFavorites } = load('src/hooks/useFavorites.ts', globals);
  let api;
  function Probe({ expose }) { const current = useFavorites(); expose(current); return React.createElement('p', null, current.favorites.map(f => f.id).join(',')); }
  const container = document.getElementById('root');
  const root = createRoot(container);
  try {
    dom.window.localStorage.setItem('hedefim_favorites', JSON.stringify([fav('1')]));
    await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(Probe, { expose: value => { api = value; } }))));
    assert.equal(container.textContent, '1');
    assert.equal(api.ready, true);
    await act(async () => api.addFavorite(fav('2')));
    await act(async () => api.addFavorite(fav('2')));
    assert.equal(container.textContent, '1,2');
    await act(async () => api.moveUp(1));
    assert.equal(container.textContent, '2,1');
    // Another tab rewrites the list.
    await act(async () => {
      dom.window.localStorage.setItem('hedefim_favorites', JSON.stringify([fav('9')]));
      dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: 'hedefim_favorites' }));
    });
    assert.equal(container.textContent, '9');
    let missing;
    await act(async () => { missing = api.applyFreshRows([{ id: 9, name: 'Güncel', slug: 'guncel', district: 'Erdemli', type: 'Fen Lisesi', school_scores: [] }], ['9']); });
    eq(missing, []);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('hedefim_favorites'))[0].name, 'Güncel');
    await act(async () => api.clearAll());
    assert.equal(container.textContent, '');
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    delete global.window; delete global.document; delete global.IS_REACT_ACT_ENVIRONMENT;
  }
});

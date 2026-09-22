import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
const require = createRequire(import.meta.url);
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://example.com/admin' });
global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
let search = new URLSearchParams('');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, document, window, URLSearchParams, Intl, require: (name) => {
    if (name === 'next/navigation') return { usePathname: () => '/admin', useSearchParams: () => search };
    if (name === 'next/link') return { default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (name.startsWith('@/')) { const base = `src/${name.slice(2)}`; return load(existsSync(base + '.ts') ? base + '.ts' : base + '.tsx'); }
    return require(name);
  } });
  return exports;
}
const { evaluateSchoolHealth } = load('src/lib/school-health.ts');
const { SchoolLedger } = load('src/components/admin/ledger/SchoolLedger.tsx');
const years = { scoreYear: 2025, quotaYear: 2026 };
const base = { type: 'Anadolu Lisesi', description: 'x'.repeat(90), images: ['a'], languages: ['İngilizce'], phone: '1', vocationalFieldCount: 0, facilityCount: 1, scoreYears: [2025], quotaYears: [2026] };
const row = (id, name, health = {}) => ({ id, name, slug: `okul-${id}`, district: 'Akdeniz', type: 'Anadolu Lisesi', isActive: true, updatedAt: '2026-09-20T10:00:00Z', createdAt: '2026-01-01T10:00:00Z', health: evaluateSchoolHealth({ ...base, ...health }, years) });
const rows = [row(1, 'Akdeniz Anadolu Lisesi'), row(2, 'Bozyazı Fen Lisesi', { scoreYears: [], phone: null })];
const noop = async () => {};

async function render() {
  const container = document.getElementById('root');
  const root = createRoot(container);
  await act(async () => root.render(React.createElement(SchoolLedger, { rows, nowIso: '2026-09-23T09:00:00Z', bulkStatusAction: noop, toggleStatusAction: noop, deleteAction: noop })));
  return { container, root };
}

test('ledger renders rows, pips and opens the detail panel', async () => {
  search = new URLSearchParams('');
  const { container, root } = await render();
  try {
    const names = [...container.querySelectorAll('[data-ledger-slug]')].map((b) => b.textContent);
    assert.deepEqual(names, ['Akdeniz Anadolu Lisesi', 'Bozyazı Fen Lisesi']);
    assert.match(container.textContent, /Eksik: Puan, Telefon/);
    assert.match(container.textContent, /2 \/ 2 okul/);
    await act(async () => container.querySelector('[data-ledger-slug="okul-2"]').click());
    assert.equal(window.location.pathname + window.location.search, '/admin?okul=okul-2');
  } finally { await act(async () => root.unmount()); }
});

test('missing filter and selected school come from the URL', async () => {
  search = new URLSearchParams('eksik=puan&okul=okul-2');
  const { container, root } = await render();
  try {
    assert.deepEqual([...container.querySelectorAll('[data-ledger-slug]')].map((b) => b.textContent), ['Bozyazı Fen Lisesi']);
    const panel = container.querySelector('aside');
    assert.match(panel.getAttribute('aria-label'), /Bozyazı Fen Lisesi/);
    const fixes = [...panel.querySelectorAll('a[href*="?tab="]')].map((a) => a.getAttribute('href'));
    assert.deepEqual(fixes, ['/admin/okullar/okul-2/duzenle?tab=puanlar', '/admin/okullar/okul-2/duzenle?tab=iletisim']);
    assert.match(panel.textContent, /2025 puanı yok/);
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});

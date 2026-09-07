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
function load(file) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code, {exports, require:name=>name.startsWith('@/') ? load(`src/${name.slice(2)}${name.includes('/components/') ? '.tsx' : '.ts'}`) : require(name)});
  return exports;
}
const { SchoolQuotaCard } = load('src/components/school/SchoolQuotaCard.tsx');
test('quota card survives empty data, year selection, removal and replacement with real React updates', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
  const container=document.getElementById('root');const root=createRoot(container);
  const render=async quotas=>act(async()=>root.render(React.createElement(React.StrictMode,null,React.createElement(SchoolQuotaCard,{quotas}))));
  try {
    await render([]);assert.equal(container.textContent,'');
    const quotas=[{year:2024,sinavli_count:0,sinavsiz_count:12},{year:2025,sinavli_count:90,sinavsiz_count:null}];
    await render(quotas);assert.equal(container.querySelector('[aria-pressed="true"]').textContent,'2025');assert.match(container.textContent,/90/);
    await act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent==='2024').click());
    assert.equal(container.querySelector('[aria-pressed="true"]').textContent,'2024');assert.match(container.textContent,/0öğrenci/);
    await render([quotas[1]]);assert.equal(container.querySelector('[aria-pressed="true"]').textContent,'2025');assert.match(container.textContent,/90/);
    await render([]);assert.equal(container.textContent,'');
    await render([{year:2026,sinavli_count:null,sinavsiz_count:null}]);assert.match(container.textContent,/2026 yılı kontenjan bilgisi henüz eklenmemiş/);
    assert.equal(quotas[0].year,2024,'input array is not sorted in place');
  } finally { await act(async()=>root.unmount());dom.window.close();delete global.window;delete global.document;delete global.IS_REACT_ACT_ENVIRONMENT; }
});

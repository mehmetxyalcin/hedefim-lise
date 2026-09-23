import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/admin-return.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,URLSearchParams});
const { safeAdminReturn, withFlash } = exports;

test('keeps ledger filters on the admin root and drops old flash messages', () => {
  assert.equal(safeAdminReturn(null), '/admin');
  assert.equal(safeAdminReturn('/admin'), '/admin');
  assert.equal(safeAdminReturn('/admin?eksik=puan&okul=ornek'), '/admin?eksik=puan&okul=ornek');
  assert.equal(safeAdminReturn('/admin?eksik=puan&success=eski&error=eski'), '/admin?eksik=puan');
  assert.equal(safeAdminReturn('/admin?ilce=Mut&okul=ornek', ['okul']), '/admin?ilce=Mut');
  assert.equal(safeAdminReturn('/admin?ara=%C4%B0mam#x'), '/admin?ara=%C4%B0mam');
});

test('anything that is not the admin root falls back to /admin', () => {
  for (const raw of ['', '   ', 'https://evil.example/admin', '//evil.example/admin', '/\\evil.example', '\\\\evil.example',
    'javascript:alert(1)', '/admin/../okullar', '/adminx', '/admin/okullar/yeni', 'admin', '/admin/', new Blob(['x'])]) {
    assert.equal(safeAdminReturn(raw), '/admin', String(raw));
  }
});

test('adds a flash message to the return address', () => {
  assert.equal(withFlash('/admin', 'error', 'x y'), '/admin?error=x%20y');
  assert.equal(withFlash('/admin?eksik=puan', 'success', 'Okul pasif hale getirildi.'), '/admin?eksik=puan&success=Okul%20pasif%20hale%20getirildi.');
});

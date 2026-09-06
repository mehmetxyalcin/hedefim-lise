import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';

function load(file, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }});
  return exports;
}
const { parseImportNumber, excludeInvalidSchools } = load('src/lib/import-validation.ts');
test('numeric input rejects partial numbers, fractions for quotas and values outside bounds', () => {
  for (const value of ['90abc', '-1', '101', 'Infinity', '1e2']) assert.equal(parseImportNumber(value, 100), null);
  assert.equal(parseImportNumber('1.5', 100000, true), null);
  assert.equal(parseImportNumber('85,5', 100), 85.5);
  assert.equal(parseImportNumber('0', 100), 0);
  assert.equal(parseImportNumber('', 100), undefined);
});
test('skipping errors removes all rows belonging to an invalid school', () => {
  const rows = [{ institution_code: 'A', invalid: false }, { institution_code: 'A', invalid: true }, { institution_code: 'B', invalid: false }];
  assert.equal(JSON.stringify(excludeInvalidSchools(rows, r => r.invalid)), JSON.stringify([rows[2]]));
});
function importer(responses) {
  const calls = [], refreshed = [];
  const { runSchoolImport } = load('src/lib/admin-import.ts', { 'next/cache': { revalidatePath: (...args) => refreshed.push(args) } });
  return { calls, refreshed, run: rows => runSchoolImport({ rpc: async (name, args) => {
    calls.push({ name, args });
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return response;
  } }, 'scores', rows) };
}
test('counts only committed schools and groups all of their source rows', async () => {
  const importerCase = importer([{ data: { operation: 'updated' } }, { error: { code: '23514', message: 'Rejected' } }]);
  const result = await importerCase.run([{ institution_code: ' A ', source_row: 9 }, { institution_code: 'B', source_row: 12 }, { institution_code: 'A', source_row: 15 }]);
  assert.equal(result.updated, 1);
  assert.equal(importerCase.calls.length, 2);
  assert.equal(importerCase.calls[0].args.p_rows.length, 2);
  assert.equal(result.errors[0].row, 12);
  assert.equal(importerCase.refreshed.length, 2);
});
test('missing migration stops all further calls without a REST fallback', async () => {
  const scenario = importer([{ error: { code: 'PGRST202' } }]);
  const result = await scenario.run([{ institution_code: 'A' }, { institution_code: 'B' }]);
  assert.equal(scenario.calls.length, 1);
  assert.equal(result.updated, 0);
  assert.match(result.errors[1].reason, /İşlenmedi/);
});
test('ambiguous network outcomes stop without falsely claiming rollback or retrying', async () => {
  for (const response of [new Error('Lost connection'), { data: null }, { error: { message: 'Failed to fetch' } }]) {
    const scenario = importer([response]);
    const result = await scenario.run([{ institution_code: 'A' }, { institution_code: 'B' }]);
    assert.equal(scenario.calls.length, 1);
    assert.equal(result.updated, 0);
    assert.match(result.errors[0].reason, /doğrulanamadı/);
    assert.doesNotMatch(result.errors[0].reason, /kaydedilmedi/);
    assert.equal(scenario.refreshed.length, 2);
  }
});
test('admin gate denies missing profiles, members and profile read failures', async () => {
  for (const response of [{ data: null }, { data: { role: 'member' } }, { data: { role: 'admin' }, error: new Error('Read failed') }, { data: { role: 'admin' } }]) {
    const query = { select() { return this; }, eq() { return this; }, maybeSingle: async () => response };
    const client = { auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) }, from: () => query };
    const { requireAdmin } = load('src/lib/admin-auth.ts', {
      'next/navigation': { redirect: url => { throw new Error(`REDIRECT ${url}`); } },
      'next/headers': { headers: async () => new Map() },
      '@/lib/supabase/server': { createClient: async () => client },
    });
    if (response.data?.role === 'admin' && !response.error) assert.equal((await requireAdmin()).supabase, client);
    else await assert.rejects(requireAdmin(), /REDIRECT \/admin\/login/);
  }
});

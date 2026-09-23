import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/school-programs.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const { isSchoolProgram, programForType, typeFilterExpression, parseProgramLabel, programsForSave, parseScoreScope, scoreScopeValue } = exports;
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);

test('type maps to a program only for Anadolu Lisesi and Anadolu Meslek Programı', () => {
  assert.equal(programForType('Anadolu Lisesi'), 'anadolu_lisesi');
  assert.equal(programForType('Anadolu Meslek Programı'), 'meslek');
  for (const t of ['Fen Lisesi', 'Çok Programlı Anadolu Lisesi', 'Anadolu Meslek ve Teknik Programı', '', 'constructor', 'toString', '__proto__']) assert.equal(programForType(t), null);
  assert.equal(isSchoolProgram('meslek'), true);
  assert.equal(isSchoolProgram('fen'), false);
});
test('type filter includes multi-program schools that offer the program', () => {
  assert.equal(typeFilterExpression('Anadolu Lisesi'),
    'type.eq."Anadolu Lisesi",and(type.eq."Çok Programlı Anadolu Lisesi",programs.cs.{anadolu_lisesi})');
  assert.equal(typeFilterExpression('Anadolu Meslek Programı'),
    'type.eq."Anadolu Meslek Programı",and(type.eq."Çok Programlı Anadolu Lisesi",programs.cs.{meslek})');
  assert.equal(typeFilterExpression('Fen Lisesi'), null);
  assert.equal(typeFilterExpression('constructor'), null);
});
test('Excel program labels: blank is school-wide, unknown is invalid', () => {
  assert.equal(parseProgramLabel(''), null);
  assert.equal(parseProgramLabel('  '), null);
  assert.equal(parseProgramLabel('Anadolu Lisesi'), 'anadolu_lisesi');
  assert.equal(parseProgramLabel('ANADOLU LİSESİ'), 'anadolu_lisesi');
  assert.equal(parseProgramLabel('Meslek Programı'), 'meslek');
  assert.equal(parseProgramLabel('Anadolu Meslek Programı'), 'meslek');
  assert.equal(parseProgramLabel('Fen'), undefined);
});
test('only multi-program schools keep programs, in canonical order without duplicates', () => {
  eq(programsForSave('Çok Programlı Anadolu Lisesi', ['meslek', 'anadolu_lisesi', 'meslek', 'x']), ['anadolu_lisesi', 'meslek']);
  eq(programsForSave('Anadolu Lisesi', ['anadolu_lisesi']), []);
});
test('score scope round-trips school-wide, field and program', () => {
  eq(parseScoreScope(''), { fieldId: null, program: null });
  eq(parseScoreScope('field:12'), { fieldId: 12, program: null });
  eq(parseScoreScope('program:meslek'), { fieldId: null, program: 'meslek' });
  for (const bad of ['field:', 'field:1.5', 'program:fen', 'x']) assert.equal(parseScoreScope(bad), null);
  assert.equal(scoreScopeValue(null, null), '');
  assert.equal(scoreScopeValue(12, null), 'field:12');
  assert.equal(scoreScopeValue(null, 'anadolu_lisesi'), 'program:anadolu_lisesi');
});

# Çok Programlı Lise Programları Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Çok programlı Anadolu liselerinde (ÇPAL) Anadolu Lisesi ve Meslek programlarının OBP'leri ayrı saklanır ve gösterilir; okul, programına göre "Anadolu Lisesi" / "Anadolu Meslek Programı" tür filtrelerinde de çıkar.

**Architecture:** `schools.programs text[]` okulun programlarını, `school_scores.program` puan satırının programını tutar (`null` = okul geneli). Program kümesi ve tür eşlemesi `src/lib/school-programs.ts`'te; puan kuralı `src/lib/school-scores.ts` opsiyonel program parametresi alır. Yönetim formu, puan sekmesi ve toplu yükleme programı yazar; `/okullar` filtresi ve kartlar okur.

**Tech Stack:** Next.js 16.2 (App Router, server actions), React 19, Supabase (Postgres + PostgREST), `node --test` + PGlite testleri, xlsx.

**Spec:** `docs/superpowers/specs/2026-09-23-cok-programli-lise-programlari-design.md`

## Global Constraints

- Program değerleri yalnız `anadolu_lisesi`, `meslek`. Etiketler: kartta "Anadolu Lisesi" / "Meslek Programı"; detay tablosunda "Anadolu Lisesi Programı" / "Meslek Programı".
- ÇPAL türü metni: `Çok Programlı Anadolu Lisesi`. Tür→program eşlemesi: `Anadolu Lisesi` → `anadolu_lisesi`, `Anadolu Meslek Programı` → `meslek`.
- Okul tek kart kalır; kart kutusunun düzeni ve boyutu değişmez.
- Geçerli puan: sonlu sayı, `> 0` ve `<= 100` (mevcut `isValidScore`).
- 2023–2025 okul geneli puanlarına dokunulmaz.
- Canlı veritabanına yazma ve `main`'e push yalnız kullanıcının o adım için açık onayıyla yapılır. Yönetici şifresi girilmez.
- `AGENTS.md`: Next.js API'si değiştiyse `node_modules/next/dist/docs/` rehberine bakılır; bu plan yeni Next API'si kullanmaz.
- Testler: `npm test` (tümü), tek dosya `node --test tests/<ad>.test.mjs`. Lint: `npx eslint <dosyalar>`. Derleme: `npm run build`.

## File Structure

| Dosya | Sorumluluk |
|---|---|
| `src/lib/school-programs.ts` (yeni) | Program kümesi, etiketler, tür eşlemesi, PostgREST filtre ifadesi, Excel/scope ayrıştırma, kaydedilecek program listesi |
| `src/lib/school-scores.ts` | Program parametreli `placementValues`/`valuesBySchool`, yeni `programOBPs` |
| `supabase/migrations/017_school_programs.sql` (yeni) | Şema + `admin_import_school` puan modunun program ve 2026 desteği |
| `supabase/migrations/018_cpal_2026_program_scores.sql` (yeni) | Canlıya özel veri: 9 ÇPAL'ın 2026 program satırları ve `programs` |
| `src/types/school.ts`, `src/types/schoolDetail.ts`, `src/lib/supabase/public.ts`, `src/lib/supabase/schoolDetail.ts` | `programs` ve `program` alanlarının okunması |
| `src/app/(site)/okullar/page.tsx`, `src/components/schools/SchoolList.tsx` | Tür filtresi, program değerleri, kart |
| `src/components/school/SchoolDetail.tsx`, `src/components/school/SchoolScoreCard.tsx` | Detay puan tablosu |
| `src/components/admin/SmartSchoolBasicFields.tsx`, `src/components/admin/tabs/BasicInfoTab.tsx`, `src/lib/admin-form-validation.ts`, `src/app/admin/okullar/actions.ts` | Okul formunda program seçimi, puan kaydında kapsam |
| `src/components/admin/tabs/ScoresTab.tsx`, `src/components/admin/SchoolFormTabs.tsx`, `src/app/admin/okullar/[slug]/duzenle/page.tsx` | Puan sekmesinde 2026 ve program |
| `src/components/admin/bulk-upload/parsers.ts`, `ScoreUploadWizard.tsx`, `src/app/admin/okullar/toplu-yukle/actions.ts`, `src/app/api/admin/okul-sablonu/route.ts` | Toplu puan yüklemede Program ve 2026 |

---

### Task 1: Program yardımcıları ve puan kuralı

**Files:**
- Create: `src/lib/school-programs.ts`
- Modify: `src/lib/school-scores.ts`
- Test: `tests/school-programs.test.mjs` (yeni), `tests/school-scores.test.mjs`

**Interfaces:**
- Produces:
  - `SCHOOL_PROGRAMS: readonly ["anadolu_lisesi","meslek"]`, `type SchoolProgram`
  - `MULTI_PROGRAM_TYPE = "Çok Programlı Anadolu Lisesi"`
  - `PROGRAM_LABELS: Record<SchoolProgram,string>`, `PROGRAM_ROW_LABELS: Record<SchoolProgram,string>`
  - `isSchoolProgram(v: unknown): v is SchoolProgram`
  - `programForType(type: string): SchoolProgram | null`
  - `typeFilterExpression(type: string): string | null`
  - `parseProgramLabel(raw: string): SchoolProgram | null | undefined`
  - `programsForSave(type: string, raw: unknown[]): SchoolProgram[]`
  - `type ScoreScope = { fieldId: number | null; program: SchoolProgram | null }`, `parseScoreScope(raw: string): ScoreScope | null`, `scoreScopeValue(fieldId: number | null, program: SchoolProgram | null): string`
  - `ScoreInput.program?: SchoolProgram | null`
  - `placementValues(rows, year, fieldId = null, program: SchoolProgram | null = null): PlacementValues`
  - `valuesBySchool(rows, year, fieldId = null, program: SchoolProgram | null = null)`
  - `type ProgramOBPs = Record<SchoolProgram, number | null>`, `programOBPs(rows: ScoreInput[], year: number | null): ProgramOBPs`

- [ ] **Step 1: Write the failing tests**

`tests/school-programs.test.mjs`:

```js
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
  for (const t of ['Fen Lisesi', 'Çok Programlı Anadolu Lisesi', 'Anadolu Meslek ve Teknik Programı', '']) assert.equal(programForType(t), null);
  assert.equal(isSchoolProgram('meslek'), true);
  assert.equal(isSchoolProgram('fen'), false);
});
test('type filter includes multi-program schools that offer the program', () => {
  assert.equal(typeFilterExpression('Anadolu Lisesi'),
    'type.eq."Anadolu Lisesi",and(type.eq."Çok Programlı Anadolu Lisesi",programs.cs.{anadolu_lisesi})');
  assert.equal(typeFilterExpression('Anadolu Meslek Programı'),
    'type.eq."Anadolu Meslek Programı",and(type.eq."Çok Programlı Anadolu Lisesi",programs.cs.{meslek})');
  assert.equal(typeFilterExpression('Fen Lisesi'), null);
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
```

`tests/school-scores.test.mjs` — destructure satırını değiştir ve dosyanın sonuna ekle:

```js
const { isValidScore, placementValues, valuesBySchool, compareByScore, parsePlacement, programOBPs } = exports;
```

```js
// Merkez Gözne ÇPAL 2026: iki program; 2025: okul geneli.
const prow = (year, obp_score, program = null) => ({ year, percentile: null, obp_score, vocational_field_id: null, program });
const gozne = [prow(2026, 53.869, 'anadolu_lisesi'), prow(2026, 52.082, 'meslek'), prow(2025, 44.64)];

test('program narrows the yerel value and falls back to school-wide rows', () => {
  eq(placementValues(gozne, 2026), { merkezi: null, yerel: 52.082 });
  eq(placementValues(gozne, 2026, null, 'anadolu_lisesi'), { merkezi: null, yerel: 53.869 });
  eq(placementValues(gozne, 2026, null, 'meslek'), { merkezi: null, yerel: 52.082 });
  eq(placementValues(gozne, 2025, null, 'anadolu_lisesi'), { merkezi: null, yerel: 44.64 });
  eq(placementValues([prow(2026, 51.351, 'anadolu_lisesi')], 2026, null, 'meslek'), { merkezi: null, yerel: null });
  eq(placementValues(fatma, 2025, null, 'meslek'), { merkezi: 99.73, yerel: 57.044 });
});
test('program OBPs per year ignore school-wide and invalid rows', () => {
  eq(programOBPs(gozne, 2026), { anadolu_lisesi: 53.869, meslek: 52.082 });
  eq(programOBPs(gozne, 2025), { anadolu_lisesi: null, meslek: null });
  eq(programOBPs([prow(2026, 0, 'meslek'), prow(2026, 40, 'meslek'), prow(2026, 35, 'meslek')], 2026), { anadolu_lisesi: null, meslek: 35 });
  eq(programOBPs(gozne, null), { anadolu_lisesi: null, meslek: null });
});
test('valuesBySchool passes the program through', () => {
  const map = valuesBySchool(gozne.map(r => ({ school_id: 153, ...r })), 2026, null, 'anadolu_lisesi');
  eq([...map.entries()], [[153, { merkezi: null, yerel: 53.869 }]]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/school-programs.test.mjs tests/school-scores.test.mjs`
Expected: FAIL (`ENOENT ... school-programs.ts` and `programOBPs is not a function`)

- [ ] **Step 3: Create `src/lib/school-programs.ts`**

```ts
// Çok programlı Anadolu liseleri (ÇPAL) Anadolu Lisesi ve Meslek programlarıyla
// öğrenci alabilir. Program kümesi, tür eşlemesi ve etiketlerin tek sahibi.
// Saf fonksiyonlar; Supabase veya React içermez.

export const SCHOOL_PROGRAMS = ["anadolu_lisesi", "meslek"] as const;
export type SchoolProgram = (typeof SCHOOL_PROGRAMS)[number];

export const MULTI_PROGRAM_TYPE = "Çok Programlı Anadolu Lisesi";

/** Liste kartı ve yönetim etiketleri. */
export const PROGRAM_LABELS: Record<SchoolProgram, string> = {
  anadolu_lisesi: "Anadolu Lisesi",
  meslek: "Meslek Programı",
};

/** Detay puan tablosundaki satır etiketleri. */
export const PROGRAM_ROW_LABELS: Record<SchoolProgram, string> = {
  anadolu_lisesi: "Anadolu Lisesi Programı",
  meslek: "Meslek Programı",
};

const TYPE_PROGRAMS: Record<string, SchoolProgram> = {
  "Anadolu Lisesi": "anadolu_lisesi",
  "Anadolu Meslek Programı": "meslek",
};

export function isSchoolProgram(value: unknown): value is SchoolProgram {
  return typeof value === "string" && (SCHOOL_PROGRAMS as readonly string[]).includes(value);
}

export function programForType(type: string): SchoolProgram | null {
  return TYPE_PROGRAMS[type] ?? null;
}

/** PostgREST `or` ifadesi: türün kendisi veya o programı olan ÇPAL. Eşleme yoksa null. */
export function typeFilterExpression(type: string): string | null {
  const program = programForType(type);
  if (!program) return null;
  return `type.eq."${type}",and(type.eq."${MULTI_PROGRAM_TYPE}",programs.cs.{${program}})`;
}

/** Excel "Program" hücresi: boş → null (okul geneli), bilinmeyen → undefined. */
export function parseProgramLabel(raw: string): SchoolProgram | null | undefined {
  const value = raw.trim().toLocaleLowerCase("tr-TR");
  if (!value) return null;
  if (value === "anadolu lisesi") return "anadolu_lisesi";
  if (value === "meslek programı" || value === "anadolu meslek programı") return "meslek";
  return undefined;
}

/** Okul formundan gelen seçimler; ÇPAL dışındaki türlerde her zaman boş. */
export function programsForSave(type: string, raw: unknown[]): SchoolProgram[] {
  if (type !== MULTI_PROGRAM_TYPE) return [];
  return SCHOOL_PROGRAMS.filter((program) => raw.includes(program));
}

/** Puan satırının kapsamı: okul geneli, meslek alanı veya program. */
export type ScoreScope = { fieldId: number | null; program: SchoolProgram | null };

export function parseScoreScope(raw: string): ScoreScope | null {
  if (raw === "") return { fieldId: null, program: null };
  const field = /^field:(\d+)$/.exec(raw);
  if (field) return { fieldId: Number(field[1]), program: null };
  const program = /^program:(.+)$/.exec(raw);
  if (program && isSchoolProgram(program[1])) return { fieldId: null, program: program[1] };
  return null;
}

export function scoreScopeValue(fieldId: number | null, program: SchoolProgram | null): string {
  if (program) return `program:${program}`;
  return fieldId != null ? `field:${fieldId}` : "";
}
```

- [ ] **Step 4: Update `src/lib/school-scores.ts`**

Dosyanın başındaki yorumdan sonra ekle:

```ts
import type { SchoolProgram } from "./school-programs";
```

`ScoreInput` tipine alan ekle:

```ts
export type ScoreInput = {
  year: number;
  percentile: number | null;
  obp_score: number | null;
  vocational_field_id?: number | null;
  program?: SchoolProgram | null;
};

export type ProgramOBPs = Record<SchoolProgram, number | null>;
```

`placementValues`'ı bununla değiştir (doc yorumu dahil):

```ts
/**
 * Okulun son yıl değerleri. `fieldId` verilirse merkezi değeri yalnız o
 * alanın yüzdeliğinden gelir. `program` verilirse yerel değeri o programın
 * OBP'sinden gelir; o yıl programa ait satır yoksa okul geneli satırlarına
 * düşülür. Program verilmezse tüm satırların en düşük OBP'si kullanılır.
 */
export function placementValues(
  rows: ScoreInput[],
  year: number | null,
  fieldId: number | null = null,
  program: SchoolProgram | null = null,
): PlacementValues {
  let merkezi: number | null = null;
  let yerel: number | null = null;
  if (year == null) return { merkezi, yerel };
  const yearRows = rows.filter((row) => row.year === year);
  const own = program == null ? [] : yearRows.filter((row) => row.program === program);
  const obpRows =
    program == null ? yearRows
    : own.length > 0 ? own
    : yearRows.filter((row) => (row.program ?? null) === null);
  for (const row of yearRows) {
    const inField = fieldId == null || row.vocational_field_id === fieldId;
    if (inField && isValidScore(row.percentile) && (merkezi == null || row.percentile > merkezi)) {
      merkezi = row.percentile;
    }
  }
  for (const row of obpRows) {
    if (isValidScore(row.obp_score) && (yerel == null || row.obp_score < yerel)) {
      yerel = row.obp_score;
    }
  }
  return { merkezi, yerel };
}

/** Son yılda program bazında en düşük OBP; okul geneli satırlar sayılmaz. */
export function programOBPs(rows: ScoreInput[], year: number | null): ProgramOBPs {
  const result: ProgramOBPs = { anadolu_lisesi: null, meslek: null };
  if (year == null) return result;
  for (const row of rows) {
    if (row.year !== year || !row.program || !isValidScore(row.obp_score)) continue;
    const current = result[row.program];
    if (current == null || row.obp_score < current) result[row.program] = row.obp_score;
  }
  return result;
}
```

`valuesBySchool`'a program parametresi ekle:

```ts
export function valuesBySchool(
  rows: (ScoreInput & { school_id: number })[],
  year: number | null,
  fieldId: number | null = null,
  program: SchoolProgram | null = null,
): Map<number, PlacementValues> {
```

ve içindeki çağrıyı `result.set(schoolId, placementValues(list, year, fieldId, program));` yap. Dosya başındaki yorumdaki "yerel yerleştirmede en düşük OBP" cümlesinin arkasına ekle: `ÇPAL'da tür filtresi programı seçer (lib/school-programs).`

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/school-programs.test.mjs tests/school-scores.test.mjs`
Expected: PASS (tüm eski testler dahil)

- [ ] **Step 6: Commit**

```bash
git add src/lib/school-programs.ts src/lib/school-scores.ts tests/school-programs.test.mjs tests/school-scores.test.mjs
git commit -m "feat: program-aware score rule for multi-program high schools"
```

---

### Task 2: Şema ve içe aktarma fonksiyonu (migration 017)

**Files:**
- Create: `supabase/migrations/017_school_programs.sql`
- Test: `tests/admin-import.database.test.mjs`

**Interfaces:**
- Produces: `schools.programs text[] not null default '{}'`; `school_scores.program text null`; unique index `school_scores_unique_idx (school_id, year, coalesce(vocational_field_id,0), coalesce(program,''))`; `admin_import_school('scores', rows)` satırda `program` (`anadolu_lisesi`/`meslek`) ve `obp_2026`/`lgs_2026`/`percentile_2026` kabul eder. Hata metinleri: `Geçersiz program.`, `Program ve meslek alanı aynı satırda verilemez.`, `Seçilen program bu okula tanımlı değil.`

- [ ] **Step 1: Write the failing tests**

`tests/admin-import.database.test.mjs` içinde `before` bloğunun son satırı `await db.exec(readFileSync(sqlFile,'utf8'));` altına ekle:

```js
  await db.exec(readFileSync('supabase/migrations/017_school_programs.sql','utf8'));
```

Dosyanın `async function replace(` tanımından önce ekle:

```js
test('multi-program school keeps one row per program and accepts 2026',async()=>{
  await db.exec("update schools set type='Çok Programlı Anadolu Lisesi', programs='{anadolu_lisesi,meslek}' where id=1");
  const result=await save('scores',[row({program:'anadolu_lisesi',obp_2026:53.8694}),row({program:'meslek',obp_2026:52.0819})]);
  assert.equal(result.operation,'updated');
  assert.deepEqual((await db.query("select program, obp_score::text as obp from school_scores where year=2026 order by program")).rows,
    [{program:'anadolu_lisesi',obp:'53.869'},{program:'meslek',obp:'52.082'}]);
  await save('scores',[row({program:'meslek',obp_2026:50})]);
  assert.equal((await db.query("select count(*)::int as n from school_scores where year=2026")).rows[0].n,2);
  assert.equal(Number((await db.query("select obp_score from school_scores where year=2026 and program='meslek'")).rows[0].obp_score),50);
});
test('program rows are rejected for unknown programs, missing school programs or together with a field',async()=>{
  await assert.rejects(save('scores',[row({program:'fen',obp_2026:50})]),/Geçersiz program/);
  await assert.rejects(save('scores',[row({program:'meslek',obp_2026:50})]),/tanımlı değil/);
  await db.exec("update schools set programs='{meslek}' where id=1");
  await assert.rejects(save('scores',[row({program:'meslek',vocational_field:'Bilişim Teknolojileri',obp_2026:50})]),/aynı satırda/);
  assert.equal((await db.query("select count(*)::int as n from school_scores where year=2026")).rows[0].n,0);
});
test('schema rejects unknown program values and program rows tied to a field',async()=>{
  await assert.rejects(db.exec("update schools set programs='{fen}' where id=1"),/schools_programs_check/);
  await assert.rejects(db.exec("insert into school_scores(school_id,year,program,obp_score) values(1,2026,'fen',50)"),/school_scores_program_check/);
  await assert.rejects(db.exec("insert into school_scores(school_id,year,vocational_field_id,program,obp_score) values(1,2026,1,'meslek',50)"),/school_scores_program_field_check/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/admin-import.database.test.mjs`
Expected: FAIL (`ENOENT ... 017_school_programs.sql`)

- [ ] **Step 3: Write the schema part of `supabase/migrations/017_school_programs.sql`**

```sql
-- Çok programlı Anadolu liseleri: okulun programları ve program bazında puan.
-- Yalnız ekleme yapar; önceki uygulama sürümü program satırlarını okul geneli
-- gibi okuyup en düşük OBP'yi alır. Uygulama yayınından ÖNCE uygulanır.

ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS programs text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_programs_check;
ALTER TABLE public.schools ADD CONSTRAINT schools_programs_check
  CHECK (programs <@ ARRAY['anadolu_lisesi', 'meslek']::text[]);

ALTER TABLE public.school_scores ADD COLUMN IF NOT EXISTS program text;
ALTER TABLE public.school_scores DROP CONSTRAINT IF EXISTS school_scores_program_check;
ALTER TABLE public.school_scores ADD CONSTRAINT school_scores_program_check
  CHECK (program IS NULL OR program IN ('anadolu_lisesi', 'meslek'));
-- Program puanı okulun tamamına aittir; meslek alanı satırı olamaz.
ALTER TABLE public.school_scores DROP CONSTRAINT IF EXISTS school_scores_program_field_check;
ALTER TABLE public.school_scores ADD CONSTRAINT school_scores_program_field_check
  CHECK (program IS NULL OR vocational_field_id IS NULL);

DROP INDEX IF EXISTS public.school_scores_unique_idx;
CREATE UNIQUE INDEX school_scores_unique_idx ON public.school_scores
  (school_id, year, coalesce(vocational_field_id, 0), coalesce(program, ''));

```

- [ ] **Step 4: Append the import function**

`supabase/migrations/20260905185222_atomic_school_import.sql` dosyasının **83–309. satırlarını** (`CREATE OR REPLACE FUNCTION public.admin_import_school` başlangıcından `GRANT EXECUTE ON FUNCTION public.admin_import_school(text, jsonb) TO authenticated;` dahil) olduğu gibi 017 dosyasının sonuna kopyala. Başına şu yorumu koy:

```sql
-- admin_import_school: puan modu program ve 2026 yılını tanır. Gövdenin geri
-- kalanı 20260905185222_atomic_school_import.sql ile aynıdır.
```

Kopyada şu beş değişikliği yap:

(A) `DECLARE` bölümünde `score_key text;` satırının altına:

```sql
  score_program text;
```

(B) Puan modunda, meslek alanı çözümleyen `END IF;` bloğundan hemen sonra (`FOREACH yr IN ARRAY ...` satırından önce):

```sql
      score_program := nullif(btrim(r->>'program'), '');
      IF score_program IS NOT NULL THEN
        IF score_program NOT IN ('anadolu_lisesi', 'meslek') THEN
          RAISE EXCEPTION 'Geçersiz program.' USING ERRCODE = '22023';
        END IF;
        IF field_id IS NOT NULL THEN
          RAISE EXCEPTION 'Program ve meslek alanı aynı satırda verilemez.' USING ERRCODE = '22023';
        END IF;
        IF NOT score_program = ANY(s.programs) THEN
          RAISE EXCEPTION 'Seçilen program bu okula tanımlı değil.' USING ERRCODE = '22023';
        END IF;
      END IF;
```

(C) `FOREACH yr IN ARRAY ARRAY[2025,2024,2023] LOOP` → `FOREACH yr IN ARRAY ARRAY[2026,2025,2024,2023] LOOP` (yalnız puan modundaki satır; kontenjan döngüsü `ARRAY[2026,2025,2024]` olarak kalır).

(D) `score_key := yr || ':' || coalesce(field_id::text, 'school');` →

```sql
        score_key := yr || ':' || coalesce(field_id::text, 'school') || ':' || coalesce(score_program, '');
```

(E) Satır arama ve ekleme:

```sql
          SELECT * INTO STRICT score FROM public.school_scores
            WHERE school_id = s.id AND year = yr AND vocational_field_id IS NOT DISTINCT FROM field_id
              AND program IS NOT DISTINCT FROM score_program;
```

```sql
          INSERT INTO public.school_scores(school_id, year, vocational_field_id, program, obp_score, lgs_score, percentile)
          VALUES(s.id, yr, field_id, score_program, (r->>('obp_' || yr))::numeric, (r->>('lgs_' || yr))::numeric, (r->>('percentile_' || yr))::numeric);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/admin-import.database.test.mjs`
Expected: PASS (eski testler dahil; özellikle "duplicate base or score records" hâlâ `birden fazla` ile reddedilir)

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/017_school_programs.sql tests/admin-import.database.test.mjs
git commit -m "feat: store multi-program scores and import 2026 score columns"
```

---

### Task 3: 2026 ÇPAL program verisi (migration 018)

**Files:**
- Create: `supabase/migrations/018_cpal_2026_program_scores.sql`

**Interfaces:**
- Consumes: Task 2 şeması.
- Produces: canlıda 9 okulun `programs` değeri ve 16 adet 2026 program satırı. Otomatik test yok (canlı okul ID'lerine bağlı); doğrulama sorgusu Task 8'de.

- [ ] **Step 1: Write the file**

```sql
-- 2026 ÇPAL OBP'leri program bazında. Kaynak: okul_yerlestirme_puanlari_2026.xlsx
-- (23 Eylül 2026). İlk yüklemede program ayrımı olmadığından okul geneline iki
-- değerden düşüğü yazılmıştı; bu dosya o satırları program satırlarıyla değiştirir.
-- Canlı veriye özeldir (okul ID'leri); 017'den sonra, kullanıcı onayıyla uygulanır.
BEGIN;

UPDATE public.schools SET programs = '{anadolu_lisesi,meslek}'
  WHERE id IN (37, 43, 95, 96, 119, 153, 154) AND type = 'Çok Programlı Anadolu Lisesi';
UPDATE public.schools SET programs = '{anadolu_lisesi}'
  WHERE id IN (62, 120) AND type = 'Çok Programlı Anadolu Lisesi';

DELETE FROM public.school_scores
  WHERE year = 2026 AND program IS NULL AND vocational_field_id IS NULL
    AND school_id IN (37, 43, 62, 95, 96, 119, 120, 153, 154);

INSERT INTO public.school_scores (school_id, year, program, obp_score) VALUES
  (37, 2026, 'anadolu_lisesi', 72.6495), (37, 2026, 'meslek', 45.3261),
  (43, 2026, 'anadolu_lisesi', 44.2159), (43, 2026, 'meslek', 50.2711),
  (62, 2026, 'anadolu_lisesi', 51.3507),
  (95, 2026, 'anadolu_lisesi', 57.1325), (95, 2026, 'meslek', 33.2157),
  (96, 2026, 'anadolu_lisesi', 51.6263), (96, 2026, 'meslek', 54.4519),
  (119, 2026, 'anadolu_lisesi', 54.5165), (119, 2026, 'meslek', 35.8055),
  (120, 2026, 'anadolu_lisesi', 59.6626),
  (153, 2026, 'anadolu_lisesi', 53.8694), (153, 2026, 'meslek', 52.0819),
  (154, 2026, 'anadolu_lisesi', 54.6093), (154, 2026, 'meslek', 43.1147);

COMMIT;
```

- [ ] **Step 2: Syntax check on PGlite**

Run:

```bash
node --input-type=module -e "
import { PGlite } from '@electric-sql/pglite'; import fs from 'node:fs';
const db = new PGlite();
await db.exec(\"create table schools(id int primary key,type text,programs text[] not null default '{}');create table school_scores(id serial,school_id int,year int,vocational_field_id int,program text,obp_score numeric(6,3));\");
await db.exec(\"insert into schools select g,'Çok Programlı Anadolu Lisesi' from unnest(array[37,43,62,95,96,119,120,153,154]) g; insert into school_scores(school_id,year,obp_score) select id,2026,1 from schools;\");
await db.exec(fs.readFileSync('supabase/migrations/018_cpal_2026_program_scores.sql','utf8'));
console.log((await db.query('select count(*)::int n, count(distinct school_id)::int s, count(*) filter (where program is null)::int genel from school_scores')).rows);"
```

Expected: `[ { n: 16, s: 9, genel: 0 } ]`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/018_cpal_2026_program_scores.sql
git commit -m "data: split 2026 multi-program OBPs by program"
```

---

### Task 4: Liste — tür filtresi ve kart

**Files:**
- Modify: `src/types/school.ts:1-9` ve `School` tipi
- Modify: `src/lib/supabase/public.ts` (`SchoolRow`, `SchoolScoreRow`, `mapSchool`, `mapSchoolScore`)
- Modify: `src/types/schoolDetail.ts:22-31`
- Modify: `src/app/(site)/okullar/page.tsx`
- Modify: `src/components/schools/SchoolList.tsx`

**Interfaces:**
- Consumes: Task 1 (`programForType`, `typeFilterExpression`, `isSchoolProgram`, `programOBPs`, `ProgramOBPs`, `PROGRAM_LABELS`, program parametreli `placementValues`/`valuesBySchool`).
- Produces: `SchoolScoreRaw.program?: SchoolProgram | null`; `School.programs?: SchoolProgram[]`; `SchoolScore.program: SchoolProgram | null` (camelCase detay tipi); `SchoolList` prop `programValues?: Record<number, ProgramOBPs>`.

- [ ] **Step 1: Types**

`src/types/school.ts` başına `import type { SchoolProgram } from "@/lib/school-programs";` ekle; `SchoolScoreRaw`'a `program?: SchoolProgram | null;`, `School` tipine `institutionCode` satırının altına `programs?: SchoolProgram[];` ekle.

`src/types/schoolDetail.ts` başına aynı import'u ekle; `SchoolScore` tipine `vocationalFieldId` altına `program: SchoolProgram | null;` ekle.

- [ ] **Step 2: Mapping (`src/lib/supabase/public.ts`)**

`import { isSchoolProgram } from "@/lib/school-programs";` ekle. `SchoolRow` tipine `programs?: string[] | null;`, `SchoolScoreRow` tipine `program?: string | null;` ekle.

`mapSchool` içinde `scores` eşlemesine `program: isSchoolProgram(s.program) ? s.program : null,` ve `institutionCode` satırının altına:

```ts
    programs: (row.programs ?? []).filter(isSchoolProgram),
```

`mapSchoolScore` dönüşüne `program: isSchoolProgram(row.program) ? row.program : null,` ekle.

- [ ] **Step 3: `/okullar` sayfası**

`src/app/(site)/okullar/page.tsx`:

import'lara ekle:

```ts
import { programForType, typeFilterExpression } from "@/lib/school-programs";
```

ve `@/lib/school-scores` import'una `programOBPs`, `type ProgramOBPs` ekle.

`const tur = params.tur ?? "";` satırının altına:

```ts
  // "Anadolu Lisesi" / "Anadolu Meslek Programı" seçiliyse ÇPAL'larda o programın OBP'si kullanılır.
  const program = programForType(tur);
```

Puan satırı sorgusu:

```ts
      .select("school_id, year, percentile, obp_score, vocational_field_id, program")
```

ve `valuesBySchool(..., scoreYear, fieldId, program)`.

`SCHOOLS_SELECT`:

```ts
  const SCHOOLS_SELECT =
    "*, school_scores(id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id, program), school_vocational_fields(vocational_field_id)";
```

`applyFilters` içinde `if (tur) q = q.eq("type", tur);` satırını değiştir:

```ts
    if (tur) {
      const expression = typeFilterExpression(tur);
      q = expression ? q.or(expression) : q.eq("type", tur);
    }
```

Kart değerleri döngüsünü değiştir:

```ts
  const scoreValues: Record<number, PlacementValues> = {};
  const programValues: Record<number, ProgramOBPs> = {};
  for (const school of schools) {
    scoreValues[school.id] = placementValues(school.scores ?? [], scoreYear, fieldId, program);
    if (program == null) programValues[school.id] = programOBPs(school.scores ?? [], scoreYear);
  }
```

`<SchoolList` çağrısına `programValues={programValues}` ekle.

- [ ] **Step 4: Kart (`src/components/schools/SchoolList.tsx`)**

import'lar: `import { PROGRAM_LABELS } from "@/lib/school-programs";` ve school-scores tip import'una `ProgramOBPs`.

Props tipine `programValues?: Record<number, ProgramOBPs>;` ekle, bileşen parametrelerinde `programValues = {},` olarak al.

`ScoreBox`'ı bununla değiştir:

```tsx
function ScoreBox({ values, programs, placement, year }: { values: PlacementValues | undefined; programs: ProgramOBPs | undefined; placement: Placement | null; year: number | null }) {
  const merkezi = values?.merkezi ?? null;
  const yerel = values?.yerel ?? null;
  const al = programs?.anadolu_lisesi ?? null;
  const mp = programs?.meslek ?? null;
  // İki programlı ÇPAL: tür filtresi yoksa ve merkezi gösterilmiyorsa iki OBP satırı.
  const programRows =
    al != null && mp != null && placement !== "merkezi" && (placement === "yerel" || merkezi == null)
      ? [
          { label: PROGRAM_LABELS.anadolu_lisesi, value: formatScore(al) },
          { label: PROGRAM_LABELS.meslek, value: formatScore(mp) },
        ]
      : null;
  const single = programRows ? null
    : placement === "merkezi" ? (merkezi != null ? { label: "Yüzdelik Dilim", value: `%${formatScore(merkezi)}` } : null)
    : placement === "yerel" ? (yerel != null ? { label: "OBP Puanı", value: formatScore(yerel) } : null)
    : merkezi != null && yerel == null ? { label: "Yüzdelik Dilim", value: `%${formatScore(merkezi)}` }
    : yerel != null && merkezi == null ? { label: "OBP Puanı", value: formatScore(yerel) }
    : null;
  const rows = programRows ?? (placement === null && merkezi != null && yerel != null
    ? [
        { label: "Merkezi", value: `%${formatScore(merkezi)}` },
        { label: "Yerel OBP", value: formatScore(yerel) },
      ]
    : null);

  return (
    <div className="relative mb-4 flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50/40">
      {single ? (
        <>
          <span className="mt-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{single.label}</span>
          <span className="text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">{single.value}</span>
        </>
      ) : rows ? (
        <dl className="w-full space-y-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</dt>
              <dd className="text-lg font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <span className="text-xs text-slate-400">Veri yok</span>
      )}
      {(single || rows) && year != null && <span className="mt-1 text-[10px] text-slate-400">{year}</span>}
    </div>
  );
}
```

Çağrıyı güncelle: `<ScoreBox values={scoreValues[school.id]} programs={programValues[school.id]} placement={activePlacement} year={scoreYear} />`

- [ ] **Step 5: Type check and tests**

Run: `npx tsc --noEmit -p . && npm test`
Expected: tsc çıktısız; tüm testler PASS. (`mapSchoolScore` çağıranlar `program` alanını otomatik taşır; tsc başka eksik alan bildirirse o satıra `program: null` ekle.)

- [ ] **Step 6: Lint and commit**

```bash
npx eslint "src/app/(site)/okullar/page.tsx" src/components/schools/SchoolList.tsx src/lib/supabase/public.ts src/types/school.ts src/types/schoolDetail.ts
git add "src/app/(site)/okullar/page.tsx" src/components/schools/SchoolList.tsx src/lib/supabase/public.ts src/types/school.ts src/types/schoolDetail.ts
git commit -m "feat: list multi-program schools under their program types"
```

---

### Task 5: Detay sayfası puan tablosu

**Files:**
- Modify: `src/lib/supabase/schoolDetail.ts:27, 88-103`
- Modify: `src/components/school/SchoolDetail.tsx:21-29`
- Modify: `src/components/school/SchoolScoreCard.tsx`

**Interfaces:**
- Consumes: `SchoolScore.program` (Task 4), `PROGRAM_ROW_LABELS`, `isSchoolProgram`, `SchoolProgram` (Task 1).

- [ ] **Step 1: Fetch and map**

`schoolDetail.ts` satır 27 seçimi:

```ts
  school_scores ( id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id, program, vocational_field:vocational_fields ( id, title ) ),
```

`import { isSchoolProgram } from "@/lib/school-programs";` ekle ve skor eşlemesine `vocationalFieldId` altına:

```ts
      program: isSchoolProgram(s.program) ? s.program : null,
```

`SchoolDetail.tsx` `scores` eşlemesine `program: s.program,` ekle.

- [ ] **Step 2: `SchoolScoreCard.tsx`**

import: `import { PROGRAM_ROW_LABELS, type SchoolProgram } from "@/lib/school-programs";`

Yerel `SchoolScore` tipine `program: SchoolProgram | null;` ekle.

`isSingleSchoolWide` tanımı:

```ts
  const isSingleSchoolWide =
    activeYearScores.length === 1 && !activeYearScores[0].vocational_field_id && !activeYearScores[0].program;
```

Tablo başlığı `Meslek Alanı` → `Program / Alan`. İlk hücre:

```tsx
                  <td className="px-1 py-2.5 text-slate-700">
                    {score.program ? PROGRAM_ROW_LABELS[score.program] : score.vocational_field?.name ?? (
                      <span className="italic text-slate-400">Okul Geneli</span>
                    )}
                  </td>
```

- [ ] **Step 3: Type check, lint, commit**

```bash
npx tsc --noEmit -p .
npx eslint src/lib/supabase/schoolDetail.ts src/components/school/SchoolDetail.tsx src/components/school/SchoolScoreCard.tsx
git add src/lib/supabase/schoolDetail.ts src/components/school/SchoolDetail.tsx src/components/school/SchoolScoreCard.tsx
git commit -m "feat: label program rows in the school score table"
```

Expected: tsc ve eslint çıktısız.

---

### Task 6: Yönetim — okul programları ve puan sekmesi

**Files:**
- Modify: `src/lib/admin-form-validation.ts` (`basic`, `upsertSchoolScore` kuralları)
- Modify: `src/app/admin/okullar/actions.ts` (`createSchool`, `updateSchool`, `upsertSchoolScore`)
- Modify: `src/components/admin/SmartSchoolBasicFields.tsx`, `src/components/admin/tabs/BasicInfoTab.tsx`
- Modify: `src/components/admin/tabs/ScoresTab.tsx`, `src/components/admin/SchoolFormTabs.tsx:244-253`, `src/app/admin/okullar/[slug]/duzenle/page.tsx:129-141`
- Test: `tests/admin-forms.test.mjs`

**Interfaces:**
- Consumes: `SCHOOL_PROGRAMS`, `MULTI_PROGRAM_TYPE`, `PROGRAM_LABELS`, `programsForSave`, `parseScoreScope`, `scoreScopeValue`, `School.programs`, `SchoolScore.program`.
- Produces: form alanı `programs` (çoklu onay kutusu); puan formu alanı `scope` (`""` | `field:<id>` | `program:<program>`), `vocational_field_id` form alanı kalkar. `ScoresTab` prop'u `schoolPrograms: SchoolProgram[]`.

- [ ] **Step 1: Update and add failing tests (`tests/admin-forms.test.mjs`)**

Satır 68'i değiştir:

```js
  await assert.rejects(api.upsertSchoolScore(form({school_id:'1',year:'2025',scope:'field:2',obp_score:'80'})),/bu okula bağlı değil/);
```

Aynı testin altına ekle:

```js
test('program score requires the school to offer that program and rejects unknown scopes', async () => {
  const {calls,api}=actions('src/app/admin/okullar/actions.ts',()=>({data:{programs:['anadolu_lisesi']},error:null}));
  await assert.rejects(api.upsertSchoolScore(form({school_id:'1',year:'2026',scope:'program:meslek',obp_score:'52'})),/tanımlı değil/);
  await assert.rejects(api.upsertSchoolScore(form({school_id:'1',year:'2026',scope:'program:fen',obp_score:'52'})),/REDIRECT:/);
  assert.equal(calls.some(c=>c[0]==='insert'),false);
});
test('program score writes the program and no field', async () => {
  const {calls,api}=actions('src/app/admin/okullar/actions.ts',calls=>({data:calls.some(c=>c[0]==='insert')?{slug:'ornek'}:{programs:['anadolu_lisesi','meslek'],slug:'ornek'},error:null}));
  await assert.rejects(api.upsertSchoolScore(form({school_id:'1',year:'2026',scope:'program:meslek',obp_score:'52'})),/REDIRECT:.*success=/);
  const insert=calls.find(c=>c[0]==='insert')[1];
  assert.equal(insert.program,'meslek');assert.equal(insert.vocational_field_id,null);
});
test('school form keeps programs only for multi-program schools', () => {
  assert.equal(validate(form({...validBasic,programs:['anadolu_lisesi','meslek']}),school.createSchool),null);
  assert.ok(validate(form({...validBasic,programs:['fen']}),school.createSchool));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/admin-forms.test.mjs`
Expected: FAIL (scope alanı tanınmıyor; program kontrolü yok)

- [ ] **Step 3: Validation (`src/lib/admin-form-validation.ts`)**

import ekle: `import { SCHOOL_PROGRAMS } from '@/lib/school-programs';`

`basic` kurallarına `boarding_type` satırının altına:

```ts
  programs: { ...choice('Program', SCHOOL_PROGRAMS), multiple: true },
```

`upsertSchoolScore` kuralında `vocational_field_id: integer('Meslek alanı', false),` yerine:

```ts
scope: text('Puan kapsamı', false, 100),
```

- [ ] **Step 4: Actions (`src/app/admin/okullar/actions.ts`)**

import ekle: `import { parseScoreScope, programsForSave } from "@/lib/school-programs";`

`createSchool` ve `updateSchool` payload'larında `placement_type` satırının üstüne:

```ts
    programs: programsForSave(type, formData.getAll("programs")),
```

`upsertSchoolScore` içinde `rawFieldId`/`vocationalFieldId` iki satırını değiştir:

```ts
  const scope = parseScoreScope(String(formData.get("scope") ?? "").trim());
  if (!scope) redirect(`/admin?error=${encodeURIComponent("Puan kapsamı geçersiz; sayfayı yenileyip tekrar deneyin.")}`);
  const vocationalFieldId = scope.fieldId;
```

payload'a `vocational_field_id: vocationalFieldId,` altına `program: scope.program,` ekle.

Meslek alanı kontrol bloğunun (`if (vocationalFieldId !== null) {...}`) altına:

```ts
  if (scope.program !== null) {
    const { data: schoolRow, error: programError } = await supabase.from("schools")
      .select("programs").eq("id", schoolId).maybeSingle();
    const programs = (schoolRow?.programs ?? []) as string[];
    if (programError || !programs.includes(scope.program)) {
      redirect(`/admin?error=${encodeURIComponent("Seçilen program bu okula tanımlı değil. Önce Temel bilgiler sekmesinde programı işaretleyin.")}`);
    }
  }
```

- [ ] **Step 5: Run tests**

Run: `node --test tests/admin-forms.test.mjs`
Expected: PASS

- [ ] **Step 6: School form (`SmartSchoolBasicFields.tsx`, `BasicInfoTab.tsx`)**

`SmartSchoolBasicFields.tsx` import'larına `import { MULTI_PROGRAM_TYPE, PROGRAM_LABELS, SCHOOL_PROGRAMS, type SchoolProgram } from "@/lib/school-programs";` ekle. Props tipine `initialPrograms?: SchoolProgram[];`, parametrelere `initialPrograms = [],` ekle. Tür `</label>`'ından hemen sonra:

```tsx
      {type === MULTI_PROGRAM_TYPE && (
        <fieldset className="block md:col-span-2">
          <legend className="mb-2 block text-sm font-semibold text-admin-body">Programlar</legend>
          <div className="flex flex-wrap gap-4">
            {SCHOOL_PROGRAMS.map((program) => (
              <label key={program} className="inline-flex items-center gap-2 text-sm text-admin-body">
                <input
                  type="checkbox"
                  name="programs"
                  value={program}
                  defaultChecked={initialPrograms.includes(program)}
                  className="h-4 w-4 rounded border-admin-line-strong"
                />
                {program === "meslek" ? "Anadolu Meslek Programı" : PROGRAM_LABELS[program]}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-admin-muted">
            Okul, işaretlenen programın tür filtresinde de listelenir.
          </p>
        </fieldset>
      )}
```

`BasicInfoTab.tsx`'te `SmartSchoolBasicFields`'a `initialPrograms={school?.programs}` ekle.

- [ ] **Step 7: Scores tab**

`src/app/admin/okullar/[slug]/duzenle/page.tsx` satır 131 seçimine `, program` ekle:

```ts
      .select("id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id, program")
```

`src/components/admin/SchoolFormTabs.tsx` `<ScoresTab` çağrısına `schoolPrograms={school.programs ?? []}` ekle.

`src/components/admin/tabs/ScoresTab.tsx`:

import'lar:

```ts
import { PROGRAM_LABELS, scoreScopeValue, type SchoolProgram } from "@/lib/school-programs";
```

Props tipine `schoolPrograms: SchoolProgram[];`, parametrelere `schoolPrograms,` ekle.

Yıl sabitleri:

```ts
// 2026'dan geriye dört puan yılı; kontenjan üç yıl.
const YEARS = [2026, 2025, 2024, 2023];
const QUOTA_YEARS = [2026, 2025, 2024];
```

`usedFieldIdsForYear` fonksiyonunu değiştir:

```ts
  function usedScopesForYear(year: number): Set<string> {
    return new Set(scoresForYear(year).map((s) => scoreScopeValue(s.vocationalFieldId, s.program)));
  }
```

Yıl döngüsündeki türetmeleri değiştir:

```ts
            const usedScopes = usedScopesForYear(year);
            const isAddingNew = editingScoreId === `new-${year}`;
            const availableFields = schoolVocationalFields.filter(
              (f) => !usedScopes.has(scoreScopeValue(f.id, null)),
            );
            const availablePrograms = schoolPrograms.filter(
              (p) => !usedScopes.has(scoreScopeValue(null, p)),
            );
            const canAddSchoolWide = !usedScopes.has("");
```

Liste satırındaki `fieldName` hesaplamasının başına program etiketi ekle:

```ts
                      const fieldName =
                        (score.program ? `${PROGRAM_LABELS[score.program]} programı` : null) ??
                        score.vocationalField?.name ??
                        (score.vocationalFieldId !== null
                          ? schoolVocationalFields.find((f) => f.id === score.vocationalFieldId)
                              ?.title
                          : null);
```

Düzenleme formundaki gizli `vocational_field_id` input'unu değiştir:

```tsx
                              <input
                                type="hidden"
                                name="scope"
                                value={scoreScopeValue(score.vocationalFieldId, score.program)}
                              />
```

ve o formdaki "Meslek alanı" başlığını `Kapsam` yap. Yeni puan formundaki `<select name="vocational_field_id" ...>` bloğunu değiştir:

```tsx
                      <span className="mb-1 block text-xs font-semibold text-admin-body">
                        Kapsam
                      </span>
                      <select name="scope" className={inputCls}>
                        {canAddSchoolWide && <option value="">Okul geneli</option>}
                        {availablePrograms.map((p) => (
                          <option key={p} value={scoreScopeValue(null, p)}>
                            {PROGRAM_LABELS[p]} programı
                          </option>
                        ))}
                        {availableFields.map((f) => (
                          <option key={f.id} value={scoreScopeValue(f.id, null)}>
                            {f.title}
                          </option>
                        ))}
                      </select>
                      {!canAddSchoolWide && availableFields.length === 0 && availablePrograms.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          Bu yıl için tüm kapsamların puanı girilmiş.
                        </p>
                      )}
```

- [ ] **Step 8: Type check, full tests, lint, commit**

```bash
npx tsc --noEmit -p .
npm test
npx eslint src/lib/admin-form-validation.ts src/app/admin/okullar/actions.ts src/components/admin/SmartSchoolBasicFields.tsx src/components/admin/tabs/BasicInfoTab.tsx src/components/admin/tabs/ScoresTab.tsx src/components/admin/SchoolFormTabs.tsx "src/app/admin/okullar/[slug]/duzenle/page.tsx" tests/admin-forms.test.mjs
git add src/lib/admin-form-validation.ts src/app/admin/okullar/actions.ts src/components/admin/SmartSchoolBasicFields.tsx src/components/admin/tabs/BasicInfoTab.tsx src/components/admin/tabs/ScoresTab.tsx src/components/admin/SchoolFormTabs.tsx "src/app/admin/okullar/[slug]/duzenle/page.tsx" tests/admin-forms.test.mjs
git commit -m "feat: edit school programs and program scores in the admin"
```

Expected: tsc/eslint çıktısız, testler PASS.

---

### Task 7: Toplu puan yükleme — Program ve 2026

**Files:**
- Modify: `src/app/admin/okullar/toplu-yukle/actions.ts:104-117` (`ScoreRow`)
- Modify: `src/components/admin/bulk-upload/parsers.ts:199-218` (`ScoreParsedRow`)
- Modify: `src/components/admin/bulk-upload/ScoreUploadWizard.tsx`
- Modify: `src/app/api/admin/okul-sablonu/route.ts:86-115`

**Interfaces:**
- Consumes: `parseProgramLabel`, `PROGRAM_LABELS`, `SchoolProgram` (Task 1); `admin_import_school` program/2026 desteği (Task 2).
- Produces: `ScoreRow.program?: SchoolProgram`, `ScoreRow.obp_2026?/lgs_2026?/percentile_2026?: number`; `ScoreParsedRow.program: SchoolProgram | null`, `program_label: string`, `obp_2026/lgs_2026/percentile_2026: number | null | undefined`.

- [ ] **Step 1: Types**

`toplu-yukle/actions.ts`: `import type { SchoolProgram } from "@/lib/school-programs";` ekle; `ScoreRow`'a `vocational_field?` altına:

```ts
  program?: SchoolProgram;
  obp_2026?: number;
  lgs_2026?: number;
  percentile_2026?: number;
```

`parsers.ts`: aynı import; `ScoreParsedRow`'a `vocational_field_found` altına:

```ts
  program_label: string;
  program: SchoolProgram | null;
  obp_2026: number | null | undefined;
  lgs_2026: number | null | undefined;
  percentile_2026: number | null | undefined;
```

- [ ] **Step 2: Wizard parsing (`ScoreUploadWizard.tsx`)**

import: `import { parseProgramLabel, PROGRAM_LABELS } from "@/lib/school-programs";`

`rawParsed` eşlemesinde `const vocational_field_name = ...` altına:

```ts
        const program_label = str(row["Program"]);
        const parsedProgram = parseProgramLabel(program_label);
        const program = parsedProgram ?? null;
```

`obp_2025` satırından önce:

```ts
        const obp_2026 = parseScore(row["OBP 2026"], 100);
        const lgs_2026 = parseScore(row["LGS 2026"], 500);
        const percentile_2026 = parsePercentile(row["Yüzdelik 2026"]);
```

Hata listesinde `vocational_field_found` kontrolünün altına:

```ts
        if (parsedProgram === undefined) errors.push(`Program geçersiz: "${program_label}" (Anadolu Lisesi veya Meslek Programı yazın)`);
        if (program && vocational_field_name) errors.push("Program ve Meslek Alanı aynı satırda doldurulamaz");
        if (obp_2026 === null) errors.push("OBP 2026 geçersiz: pozitif sayı olmalı");
        if (lgs_2026 === null) errors.push("LGS 2026 geçersiz: pozitif sayı olmalı");
        if (percentile_2026 === null) errors.push("Yüzdelik 2026 geçersiz: 0-100 arasında olmalı");
```

`allEmpty` dizisinin başına `obp_2026, lgs_2026, percentile_2026,` ekle. Dönen nesneye `program_label, program,` ve `obp_2026, lgs_2026, percentile_2026,` ekle.

Tekrar kontrolü:

```ts
        const key = `${row.institution_code}::${row.vocational_field_name.toLocaleLowerCase("tr-TR")}::${row.program ?? ""}`;
        if (seenKeys.has(key)) {
          row.errors.push(
            `Tekrar eden kombinasyon: "${row.institution_code}" + "${row.program ? PROGRAM_LABELS[row.program] : row.vocational_field_name || "Okul Geneli"}"`,
          );
```

- [ ] **Step 3: Wizard upload and preview**

`rowsToUpload` eşlemesinde `vocational_field` satırının altına:

```ts
      if (row.program) r.program = row.program;
      if (typeof row.obp_2026 === "number") r.obp_2026 = row.obp_2026;
      if (typeof row.lgs_2026 === "number") r.lgs_2026 = row.lgs_2026;
      if (typeof row.percentile_2026 === "number") r.percentile_2026 = row.percentile_2026;
```

Önizleme başlıkları:

```ts
                  {[
                    "Durum", "Kurum Kodu", "Okul Adı", "Kapsam",
                    "OBP 26", "LGS 26", "%Dilim 26",
                    "OBP 25", "LGS 25", "%Dilim 25",
                    "OBP 24", "LGS 24", "%Dilim 24",
                    "OBP 23", "LGS 23", "%Dilim 23",
                  ].map((h) => (
```

"Meslek alanı" hücresinin içeriği:

```tsx
                        {row.program ? (
                          <span className="text-admin-body">{PROGRAM_LABELS[row.program]} programı</span>
                        ) : row.program_label && !row.vocational_field_name ? (
                          <span className="text-rose-700">{row.program_label} (geçersiz)</span>
                        ) : !row.vocational_field_name ? (
                          <span className="italic text-admin-faint">Okul geneli</span>
                        ) : !row.vocational_field_found ? (
                          <span className="text-rose-700">{row.vocational_field_name} (bulunamadı)</span>
                        ) : (
                          <span className="text-admin-body">{row.vocational_field_name}</span>
                        )}
```

2025 hücrelerinden önce:

```tsx
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.obp_2026} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.lgs_2026} /></td>
                      <td className="px-3 py-2 text-center text-admin-body"><ScoreCell value={row.percentile_2026} /></td>
```

- [ ] **Step 4: Template (`src/app/api/admin/okul-sablonu/route.ts`)**

```ts
  const scoreHeaders = [
    "Kurum Kodu",
    "Meslek Alanı",
    "Program",
    "OBP 2026", "LGS 2026", "Yüzdelik 2026",
    "OBP 2025", "LGS 2025", "Yüzdelik 2025",
    "OBP 2024", "LGS 2024", "Yüzdelik 2024",
    "OBP 2023", "LGS 2023", "Yüzdelik 2023",
  ];
  const scoreExamples = [
    ["733521", "",                    "",                85.20, 282.10, 64.00, 85.50, 280.25, 65.00, 82.00, 260.00, 70.00, 80.00, 240.00, 72.00],
    ["745231", "Tesisat Teknolojisi", "",                95.10, 382.00, 14.50, 95.50, 380.25, 15.00, 92.00, 360.00, 18.50, 90.00, 340.00, 22.00],
    ["751620", "",                    "Anadolu Lisesi",  53.87, "",     "",    "",    "",     "",    "",    "",     "",    "",    "",     ""],
    ["751620", "",                    "Meslek Programı", 52.08, "",     "",    "",    "",     "",    "",    "",     "",    "",    "",     ""],
  ];
```

`scoreNotes` listesine `NOT: Meslek Alanı doluysa ...` satırının altına:

```ts
    ["NOT: Program yalnız çok programlı liseler içindir: Anadolu Lisesi veya Meslek Programı. Program doluysa Meslek Alanı boş kalmalıdır"],
```

`wsScore["!cols"]`:

```ts
  wsScore["!cols"] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 15 },
    { wch: 12 }, { wch: 12 }, { wch: 15 },
  ];
```

- [ ] **Step 5: Type check, tests, lint, commit**

```bash
npx tsc --noEmit -p .
npm test
npx eslint "src/app/admin/okullar/toplu-yukle/actions.ts" src/components/admin/bulk-upload/parsers.ts src/components/admin/bulk-upload/ScoreUploadWizard.tsx src/app/api/admin/okul-sablonu/route.ts
git add "src/app/admin/okullar/toplu-yukle/actions.ts" src/components/admin/bulk-upload/parsers.ts src/components/admin/bulk-upload/ScoreUploadWizard.tsx src/app/api/admin/okul-sablonu/route.ts
git commit -m "feat: bulk score upload accepts 2026 and a program column"
```

Expected: tsc/eslint çıktısız, testler PASS.

---

### Task 8: Belgeler, canlı migration, önizleme doğrulaması, yayın

**Files:**
- Modify: `DESIGN.md` (puan kuralı bölümü), `PROJECT_HANDOFF.md` (§23 düzeltmesi, yeni §24)

- [ ] **Step 1: Docs**

`DESIGN.md`'de puan kuralı anlatılan yerde (`grep -n "school-scores" DESIGN.md`) şu cümleyi ekle: "Çok programlı liselerde OBP program bazındadır (`school_scores.program`); tür filtresi Anadolu Lisesi / Anadolu Meslek Programı seçildiğinde ÇPAL'ları o programın OBP'siyle listeler, filtre yokken kart iki program satırı gösterir."

`PROJECT_HANDOFF.md` §23'teki "main'e birleştirilmedi, push yapılmadı" ifadesini "23 Eylül'de main'e birleştirildi ve `3112ddd` ile canlıya çıktı" olarak düzelt. Sona ekle:

```markdown
## 24. Çok programlı liselerde program bazında puan — 23 Eylül 2026

Tasarım: `docs/superpowers/specs/2026-09-23-cok-programli-lise-programlari-design.md`; plan: `docs/superpowers/plans/2026-09-23-cok-programli-lise-programlari.md`.

- 2026 OBP (okul geneli) 106 okul için yüklendi (kaynak `okul_yerlestirme_puanlari_2026.xlsx`; Excel "Okul kodu" sistem kurum koduyla uyuşmadığından eşleme ilçe + ad ile yapıldı). Son yıl 2026 olduğu için 2026 yüzdelikleri yüklenene kadar merkezi değerler listede görünmez.
- `schools.programs` ve `school_scores.program` (017). 9 ÇPAL'ın 2026 OBP'leri program satırlarına bölündü (018). Tarsus Adalet ÇPAL'ın programları yönetimden seçilmeli.
- Kural `src/lib/school-programs.ts` + `school-scores.ts`; `/okullar` tür filtresi ÇPAL'ları programına göre kapsar; kart iki program satırı; detay tablosunda program satırları.
- Yönetim: okul formunda Programlar, puan sekmesinde 2026 ve Kapsam seçimi, toplu yüklemede Program ve 2026 sütunları.
```

Commit:

```bash
git add DESIGN.md PROJECT_HANDOFF.md
git commit -m "docs: record program-level scores for multi-program schools"
```

- [ ] **Step 2: Final checks**

Run: `npm test && npx eslint && npm run build`
Expected: tüm testler PASS, eslint 0 hata, derleme başarılı.

- [ ] **Step 3: Canlı migration — KULLANICI ONAYI GEREKLİ**

Kullanıcıya sor: "017 (şema + içe aktarma fonksiyonu) ve 018 (9 ÇPAL'ın 2026 program satırları) canlı veritabanına uygulansın mı?" Onay gelmeden devam etme.

Onaydan sonra Supabase MCP `execute_sql` ile (proje `hsqattqhmvruhdikdayu`) önce 017 dosyasının içeriğini, sonra 018'i çalıştır. Doğrula:

```sql
select count(*) rows, count(distinct school_id) schools,
       count(*) filter (where program='anadolu_lisesi') al, count(*) filter (where program='meslek') mp,
       count(*) filter (where program is null and school_id in (37,43,62,95,96,119,120,153,154)) leftover
from school_scores where year = 2026;
select id, programs from schools where type = 'Çok Programlı Anadolu Lisesi' order by id;
```

Expected: `rows=113, schools=106, al=9, mp=7, leftover=0`; 7 okul `{anadolu_lisesi,meslek}`, 62 ve 120 `{anadolu_lisesi}`, 121 `{}`.

Ayrıca `select pg_get_functiondef('public.admin_import_school(text,jsonb)'::regprocedure) like '%score_program%'` → `true`.

- [ ] **Step 4: Yerel önizleme (canlı veri)**

`.claude/launch.json` yoksa oluştur (`npm run dev:preview`, port 3105) ve `preview_start` ile aç. Kontroller:

- `/okullar` (filtresiz, ara=Gözne): Merkez Gözne kartında iki satır "Anadolu Lisesi 53,87" ve "Meslek Programı 52,08", yıl 2026.
- `/okullar?tur=Anadolu%20Lisesi&ara=Gözne`: kart tek değer "OBP Puanı 53,87".
- `/okullar?tur=Anadolu%20Meslek%20Programı&ara=Gözne`: "OBP Puanı 52,08". `ara=Zeyne` ile bu filtrede sonuç yok; `tur=Anadolu Lisesi` ile Zeyne 51,35.
- `/okullar?tur=Anadolu%20Lisesi&siralama=obp_desc`: ÇPAL'lar AL OBP'lerine göre araya girer; konsolda hata yok.
- Merkez Gözne detay sayfası 2026 sekmesi: tabloda "Anadolu Lisesi Programı 53.87" ve "Meslek Programı 52.08".
- `/admin` için kullanıcıdan in-app tarayıcıda kendisinin giriş yapmasını iste (şifre girilmez). Gözne düzenleme: Programlar kutuları işaretli; Puanlar sekmesinde 2026 satırları program etiketli. **Kaydetme yapılmaz** (canlı yazma).
- 375px genişlikte kart ve detay tablosu taşmıyor.

Ekran görüntülerini kullanıcıya göster.

- [ ] **Step 5: Push — KULLANICI ONAYI GEREKLİ**

`feat/cpal-programlar` dalını main'e ileri sarma ile birleştirip push etmek için onay iste (push canlı yayındır; araç engellerse kullanıcı kendi terminalinden çalıştırır):

```bash
git switch main
git merge --ff-only feat/cpal-programlar
git push origin main
```

Yayından sonra `https://hedefimlise.com/okullar?tur=Anadolu%20Lisesi&ara=Gözne` sayfasında 53,87 görünmeli. Ana sayfa 24 saatlik önbellek nedeniyle gecikmeli güncellenir.

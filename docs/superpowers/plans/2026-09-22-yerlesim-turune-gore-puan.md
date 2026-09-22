# Yerleştirme Türüne Göre Puan — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ana sayfa ölçeği, `/okullar` filtresi, sıralama ve liste kartı okul başına aynı "en erişilebilir" puan kuralını kullansın; yerleştirme filtresi Yerel/Merkezi olsun ve kart seçilen türün puanını göstersin.

**Architecture:** Saf bir kural modülü (`src/lib/school-scores.ts`) okulun son yıl puan satırlarından `{ merkezi, yerel }` değerlerini üretir. Sunucu sayfaları (ana sayfa, `/okullar`) bu değerlerle filtreler, sıralar ve karta hazır değer verir; kart yalnız gösterir.

**Tech Stack:** Next.js 16 App Router (server components), React 19, Supabase JS, TypeScript, `node:test` + TypeScript transpile yükleyicisi.

**Spec:** `docs/superpowers/specs/2026-09-22-yerlesim-turune-gore-puan-design.md`

## Global Constraints

- Merkezi değeri: okulun veri kümesi son yılındaki geçerli yüzdeliklerinin **en büyüğü**; alan filtresi varsa yalnız o alanın satırları.
- Yerel değeri: aynı yılın geçerli OBP'lerinin **en düşüğü**; alan filtresinden etkilenmez.
- Geçerli değer: sonlu sayı, `> 0` ve `<= 100`.
- Yerleştirme türü puandan çıkarılır; `schools.placement_type` filtrede kullanılmaz.
- `yerlestirme` yalnız `yerel` | `merkezi`; başka değer filtre yok demektir.
- Kart düzeni değişmez; sayılar `tr-TR`, iki ondalık.
- Veritabanı değişikliği yok. Okul detay sayfası, tercih listesi, öne çıkan okul şeridi kapsam dışı.
- `npx eslint .` 0 hata/uyarı kalmalı; `npm test` geçmeli.

## File Structure

- Create `src/lib/school-scores.ts` — kural: geçerlilik, okul değerleri, okul başına değer haritası, sıralama karşılaştırıcısı, yerleştirme parametresi.
- Create `tests/school-scores.test.mjs` — kural testleri.
- Modify `src/app/page.tsx` — ölçek dağılımları kuraldan.
- Modify `src/app/okullar/page.tsx` — yerleştirme/aralık filtresi ve puan sıralaması kuraldan; karta değer haritası.
- Modify `src/components/schools/SchoolList.tsx` — iki seçenekli yerleştirme, yeni puan kutusu.
- Modify `DESIGN.md` — tek-değer kuralı ifadeleri.
- Modify `PROJECT_HANDOFF.md` — iş kaydı.

---

### Task 1: Kural modülü

**Files:**
- Create: `src/lib/school-scores.ts`
- Test: `tests/school-scores.test.mjs`

**Interfaces:**
- Produces:
  - `type ScoreInput = { year: number; percentile: number | null; obp_score: number | null; vocational_field_id?: number | null }`
  - `type PlacementValues = { merkezi: number | null; yerel: number | null }`
  - `type Placement = "yerel" | "merkezi"`
  - `type ScoreSort = "yuzdelik_asc" | "yuzdelik_desc" | "obp_desc" | "obp_asc"`
  - `isValidScore(v: unknown): v is number`
  - `placementValues(rows: ScoreInput[], year: number | null, fieldId?: number | null): PlacementValues`
  - `valuesBySchool(rows: (ScoreInput & { school_id: number })[], year: number | null, fieldId?: number | null): Map<number, PlacementValues>`
  - `compareByScore(a: { name: string; values: PlacementValues }, b: same, sort: ScoreSort): number`
  - `parsePlacement(raw: string | undefined): Placement | null`

- [ ] **Step 1: Write the failing test** — `tests/school-scores.test.mjs`

```js
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/school-scores.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const { isValidScore, placementValues, valuesBySchool, compareByScore, parsePlacement } = exports;
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const row = (year, percentile, obp_score, vocational_field_id = null) => ({ year, percentile, obp_score, vocational_field_id });
// Fatma Aliye 2025: okul geneli OBP + üç sınavlı alan.
const fatma = [row(2025,null,57.044), row(2025,72.95,null,3), row(2025,99.67,null,4), row(2025,99.73,null,5), row(2024,99.9,40)];

test('most accessible value: largest percentile, lowest OBP, latest year only', () => {
  eq(placementValues(fatma, 2025), { merkezi: 99.73, yerel: 57.044 });
  eq(placementValues([row(2025,null,80), row(2025,null,62.5)], 2025), { merkezi: null, yerel: 62.5 });
  eq(placementValues(fatma, 2023), { merkezi: null, yerel: null });
  eq(placementValues(fatma, null), { merkezi: null, yerel: null });
});
test('field filter narrows only the merkezi value', () => {
  eq(placementValues(fatma, 2025, 3), { merkezi: 72.95, yerel: 57.044 });
  eq(placementValues(fatma, 2025, 9), { merkezi: null, yerel: 57.044 });
});
test('invalid values are ignored', () => {
  for (const v of [0, -1, 100.5, NaN, Infinity, null, undefined, '50']) assert.equal(isValidScore(v), false, String(v));
  assert.equal(isValidScore(100), true);
  eq(placementValues([row(2025,0,0), row(2025,120,101)], 2025), { merkezi: null, yerel: null });
});
test('values are grouped per school', () => {
  const map = valuesBySchool([{school_id:1,...fatma[0]},{school_id:1,...fatma[3]},{school_id:2,...row(2025,15,null)}], 2025);
  eq([...map.entries()], [[1,{merkezi:99.73,yerel:57.044}],[2,{merkezi:15,yerel:null}]]);
});
test('score sort puts missing values last in both directions and breaks ties by name', () => {
  const s = (name, merkezi, yerel = null) => ({ name, values: { merkezi, yerel } });
  const list = [s('Çınar', 40), s('Boş', null), s('Ada', 40), s('Zirve', 90)];
  const names = sort => [...list].sort((a,b) => compareByScore(a,b,sort)).map(x => x.name);
  eq(names('yuzdelik_asc'), ['Ada','Çınar','Zirve','Boş']);
  eq(names('yuzdelik_desc'), ['Zirve','Ada','Çınar','Boş']);
  const obp = [s('A', null, 70), s('B', null, null), s('C', null, 90)];
  eq([...obp].sort((a,b)=>compareByScore(a,b,'obp_desc')).map(x=>x.name), ['C','A','B']);
  eq([...obp].sort((a,b)=>compareByScore(a,b,'obp_asc')).map(x=>x.name), ['A','C','B']);
});
test('placement parameter accepts only yerel and merkezi', () => {
  assert.equal(parsePlacement('yerel'), 'yerel');
  assert.equal(parsePlacement('merkezi'), 'merkezi');
  for (const v of ['yerel_merkezi', '', undefined, 'MERKEZI']) assert.equal(parsePlacement(v), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/school-scores.test.mjs`
Expected: FAIL — `ENOENT ... src/lib/school-scores.ts`

- [ ] **Step 3: Write implementation** — `src/lib/school-scores.ts`

```ts
// Okul puanlarının tek kuralı: ana sayfa ölçeği, /okullar filtresi,
// sıralama ve liste kartı aynı değeri kullanır. Okul başına "en erişilebilir"
// program esas alınır: merkezi yerleştirmede en büyük yüzdelik, yerel
// yerleştirmede en düşük OBP. Yalnız veri kümesinin son yılı kullanılır.

export type ScoreInput = {
  year: number;
  percentile: number | null;
  obp_score: number | null;
  vocational_field_id?: number | null;
};

export type PlacementValues = { merkezi: number | null; yerel: number | null };

export type Placement = "yerel" | "merkezi";

export type ScoreSort = "yuzdelik_asc" | "yuzdelik_desc" | "obp_desc" | "obp_asc";

export function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 100;
}

/**
 * Okulun son yıl değerleri. `fieldId` verilirse merkezi değeri yalnız o
 * alanın yüzdeliğinden gelir; OBP okul geneline ait olduğundan etkilenmez.
 */
export function placementValues(
  rows: ScoreInput[],
  year: number | null,
  fieldId: number | null = null,
): PlacementValues {
  let merkezi: number | null = null;
  let yerel: number | null = null;
  if (year == null) return { merkezi, yerel };
  for (const row of rows) {
    if (row.year !== year) continue;
    const inField = fieldId == null || row.vocational_field_id === fieldId;
    if (inField && isValidScore(row.percentile) && (merkezi == null || row.percentile > merkezi)) {
      merkezi = row.percentile;
    }
    if (isValidScore(row.obp_score) && (yerel == null || row.obp_score < yerel)) {
      yerel = row.obp_score;
    }
  }
  return { merkezi, yerel };
}

export function valuesBySchool(
  rows: (ScoreInput & { school_id: number })[],
  year: number | null,
  fieldId: number | null = null,
): Map<number, PlacementValues> {
  const grouped = new Map<number, ScoreInput[]>();
  for (const row of rows) {
    const list = grouped.get(row.school_id) ?? [];
    list.push(row);
    grouped.set(row.school_id, list);
  }
  const result = new Map<number, PlacementValues>();
  grouped.forEach((list, schoolId) => {
    result.set(schoolId, placementValues(list, year, fieldId));
  });
  return result;
}

/** Değeri olmayan okul her iki yönde de sona gider; eşitlikte ad belirler. */
export function compareByScore(
  a: { name: string; values: PlacementValues },
  b: { name: string; values: PlacementValues },
  sort: ScoreSort,
): number {
  const key = sort.startsWith("yuzdelik") ? "merkezi" : "yerel";
  const ascending = sort.endsWith("_asc");
  const av = a.values[key];
  const bv = b.values[key];
  if (av != null && bv != null && av !== bv) return ascending ? av - bv : bv - av;
  if (av == null && bv != null) return 1;
  if (bv == null && av != null) return -1;
  return a.name.localeCompare(b.name, "tr");
}

export function parsePlacement(raw: string | undefined): Placement | null {
  return raw === "yerel" || raw === "merkezi" ? raw : null;
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/school-scores.test.mjs && npx eslint src/lib/school-scores.ts`
Expected: 6 pass, lint clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/school-scores.ts tests/school-scores.test.mjs
git commit -m "feat: shared most-accessible school score rule"
```

---

### Task 2: Ana sayfa ölçeği

**Files:**
- Modify: `src/app/page.tsx` (ölçek dağılımı bloğu, yaklaşık 62–99. satırlar)
- Modify: `DESIGN.md` (One-Tick-Per-School ve Scale-Is-The-Filter maddeleri)

**Interfaces:**
- Consumes: `valuesBySchool(rows, year)` from Task 1.

- [ ] **Step 1: Replace the distribution loop**

`import { valuesBySchool } from "@/lib/school-scores";` ekle. Yorum ve döngüyü şununla değiştir:

```ts
    // Ölçek dağılımları: son yıldaki aktif okulların değerleri. İki metrik ayrı
    // çizilir; iki puanı olan okul iki sekmede de yer alır. Okul başına TEK
    // değer, okulun en erişilebilir programı: en büyük yüzdelik, en düşük OBP
    // (kural: lib/school-scores). /okullar filtresi aynı kuralı kullanır.
    let percentiles: number[] = [];
    let obpScores: number[] = [];
    if (latestYear != null) {
      const { data: distRows } = await supabase
        .from("school_scores")
        .select("school_id, year, percentile, obp_score")
        .eq("year", latestYear);

      const values = valuesBySchool(
        (distRows ?? []).filter((r) => activeIds.has(r.school_id as number)) as {
          school_id: number; year: number; percentile: number | null; obp_score: number | null;
        }[],
        latestYear,
      );
      values.forEach(({ merkezi, yerel }) => {
        if (merkezi != null) percentiles.push(merkezi);
        if (yerel != null) obpScores.push(yerel);
      });
      percentiles = percentiles.sort((a, b) => a - b);
      obpScores = obpScores.sort((a, b) => a - b);
    }
```

- [ ] **Step 2: Update DESIGN.md wording**

One-Tick-Per-School: "its most competitive latest-year value — the *lowest* percentile, the *highest* OBP" → "its most accessible latest-year value — the *highest* percentile, the *lowest* OBP (`src/lib/school-scores.ts`)". Scale-Is-The-Filter: "(most-competitive latest-year value per school)" → "(most-accessible latest-year value per school)".

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --incremental false && npx eslint src/app/page.tsx`
Then on the dev server: yüzdelik sekmesi "55 okul", OBP sekmesi "126 okul".

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx DESIGN.md
git commit -m "feat: landing scale plots each school's most accessible score"
```

---

### Task 3: `/okullar` filtre, sıralama ve kart değerleri

**Files:**
- Modify: `src/app/okullar/page.tsx`

**Interfaces:**
- Consumes: `placementValues`, `valuesBySchool`, `compareByScore`, `parsePlacement`, `type ScoreSort`, `type PlacementValues` from Task 1.
- Produces for Task 4: `SchoolList` props `activePlacement: Placement | null` (the list already has a `placement` select state), `scoreYear: number | null`, `scoreValues: Record<number, PlacementValues>`; `initialPlacement` becomes the parsed value (`""` when none).

- [ ] **Step 1: Remove the old range helper**

`type ScoreRow` ve `idsInRange` modül düzeyi tanımlarını sil. `SCORE_SORTS`/`isScoreSort` kalsın; `type ScoreSort` artık `@/lib/school-scores`'tan import edilir, yerel tanımı sil ve `isScoreSort` tipini ona bağla.

- [ ] **Step 2: Parse placement and field**

```ts
  const yerlestirme = parsePlacement(params.yerlestirme);
  const fieldId = /^\d+$/.test(alan) ? Number(alan) : null;
```

- [ ] **Step 3: Replace Step 1b with one latest-year score pass**

Alan ID filtresinden sonra (Step 1), eski Step 1b bloğunun yerine:

```ts
  // Step 1b: Son yıl puanları (kural: lib/school-scores). Yerleştirme,
  // aralık ve puan sıralaması aynı okul değerlerini kullanır; ana sayfa
  // ölçeğiyle aynı tanım olduğu için ölçekteki her işaret listede bir okuldur.
  const { data: yearRows } = await supabase
    .from("school_scores")
    .select("year")
    .order("year", { ascending: false })
    .limit(1);
  const scoreYear = (yearRows?.[0]?.year as number | undefined) ?? null;

  const needsScores =
    yerlestirme !== null || hasYuzdelikRange || hasObpRange || isScoreSort(siralama);
  let schoolValues = new Map<number, PlacementValues>();
  if (needsScores && scoreYear != null) {
    const { data: rawScoreRows } = await supabase
      .from("school_scores")
      .select("school_id, year, percentile, obp_score, vocational_field_id")
      .eq("year", scoreYear);
    schoolValues = valuesBySchool(
      (rawScoreRows ?? []) as Parameters<typeof valuesBySchool>[0],
      scoreYear,
      fieldId,
    );
  }

  const idsWhere = (keep: (v: PlacementValues) => boolean) => {
    const ids: number[] = [];
    schoolValues.forEach((v, id) => { if (keep(v)) ids.push(id); });
    return ids;
  };
  const intersect = (current: number[] | null, ids: number[]) => {
    if (current === null) return ids;
    const allowed = new Set(ids);
    return current.filter((id) => allowed.has(id));
  };
  const inRange = (v: number | null, lo: number, hi: number) => v != null && v >= lo && v <= hi;

  if (yerlestirme !== null) {
    schoolIdFilter = intersect(schoolIdFilter, idsWhere((v) => v[yerlestirme] != null));
  }
  if (hasYuzdelikRange) {
    schoolIdFilter = intersect(schoolIdFilter, idsWhere((v) => inRange(v.merkezi, yuzdelikMin!, yuzdelikMax!)));
  }
  if (hasObpRange) {
    schoolIdFilter = intersect(schoolIdFilter, idsWhere((v) => inRange(v.yerel, obpMin!, obpMax!)));
  }
```

- [ ] **Step 4: Stop filtering on the placement column; include field id in card scores**

In `applyFilters` delete `if (yerlestirme) q = q.eq("placement_type", yerlestirme);`. Change `SCHOOLS_SELECT` school_scores list to `school_scores(id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id)`.

- [ ] **Step 5: Replace score sort Steps B–C**

In the score-sort branch select `id, name` in Step A and replace Steps B and C with:

```ts
    const idRows = (idResult.data ?? []) as { id: number; name: string }[];
    const empty: PlacementValues = { merkezi: null, yerel: null };
    const sortedIds = idRows
      .map((r) => ({ id: r.id, name: r.name, values: schoolValues.get(r.id) ?? empty }))
      .sort((a, b) => compareByScore(a, b, siralama))
      .map((r) => r.id);
```

(`siralama` is narrowed by `isScoreSort`.) Remove the now-unused `allIds`, `scoreData`, `scoreMap`, `HIGH`.

- [ ] **Step 6: Card values and props**

After `schools` is known:

```ts
  const scoreValues: Record<number, PlacementValues> = {};
  for (const school of schools) {
    scoreValues[school.id] = placementValues(school.scores ?? [], scoreYear, fieldId);
  }
```

`mapSchool` must carry `vocational_field_id` into `scores` — check `src/lib/supabase/public.ts` around line 170 and add `vocational_field_id: s.vocational_field_id ?? null` if missing (type `SchoolScoreRaw` already has the optional field).

Pagination: `if (yerlestirme) paginationSearchParams.yerlestirme = yerlestirme;` stays (now only valid values). `SchoolList` gets `initialPlacement={yerlestirme ?? ""}`, `activePlacement={yerlestirme}`, `scoreYear={scoreYear}`, `scoreValues={scoreValues}`; the `key` keeps `yerlestirme`.

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit --incremental false && npx eslint src/app/okullar/page.tsx src/lib/supabase/public.ts` (Task 4 not done: expect a prop type error on `SchoolList` until Task 4 — implement Task 4 before running tsc, or add the props in Task 4 first).

- [ ] **Step 8: Commit** together with Task 4 (the page and the list props change together).

---

### Task 4: Liste kartı ve yerleştirme seçenekleri

**Files:**
- Modify: `src/components/schools/SchoolList.tsx`

**Interfaces:**
- Consumes: props from Task 3; `type PlacementValues`, `type Placement` from Task 1.

- [ ] **Step 1: Options and props**

```ts
const PLACEMENT_OPTIONS = [
  { value: "yerel", label: "Yerel" },
  { value: "merkezi", label: "Merkezi" },
] as const;
```

Props: add `activePlacement: Placement | null; scoreYear: number | null; scoreValues: Record<number, PlacementValues>;` and destructure them (`activePlacement`, not `placement`, which is already the select state).

- [ ] **Step 2: Replace `DisplayScore` / `getDisplayScore` with the score box**

```tsx
const formatScore = (v: number) =>
  v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function ScoreBox({ values, placement, year }: { values: PlacementValues | undefined; placement: Placement | null; year: number | null }) {
  const merkezi = values?.merkezi ?? null;
  const yerel = values?.yerel ?? null;
  const single =
    placement === "merkezi" ? (merkezi != null ? { label: "Yüzdelik Dilim", value: `%${formatScore(merkezi)}` } : null)
    : placement === "yerel" ? (yerel != null ? { label: "OBP Puanı", value: formatScore(yerel) } : null)
    : merkezi != null && yerel == null ? { label: "Yüzdelik Dilim", value: `%${formatScore(merkezi)}` }
    : yerel != null && merkezi == null ? { label: "OBP Puanı", value: formatScore(yerel) }
    : null;
  const both = placement === null && merkezi != null && yerel != null;

  return (
    <div className="relative mb-4 flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50/40">
      {single ? (
        <>
          <span className="mt-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{single.label}</span>
          <span className="text-3xl font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">{single.value}</span>
        </>
      ) : both ? (
        <dl className="w-full space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Merkezi</dt>
            <dd className="text-lg font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">%{formatScore(merkezi)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Yerel OBP</dt>
            <dd className="text-lg font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">{formatScore(yerel)}</dd>
          </div>
        </dl>
      ) : (
        <span className="text-xs text-slate-400">Veri yok</span>
      )}
      {(single || both) && year != null && <span className="mt-1 text-[10px] text-slate-400">{year}</span>}
    </div>
  );
}
```

In the card replace the IIFE with `<ScoreBox values={scoreValues[school.id]} placement={activePlacement} year={scoreYear} />`. Remove the now-unused `SchoolScoreRaw` import if nothing else uses it.

- [ ] **Step 3: Verify both tasks**

Run: `npx tsc --noEmit --incremental false && npx eslint . && npm test`
Expected: clean, all tests pass.

- [ ] **Step 4: Commit Tasks 3–4**

```bash
git add src/app/okullar/page.tsx src/components/schools/SchoolList.tsx src/lib/supabase/public.ts
git commit -m "feat: filter, rank and show schools by Yerel/Merkezi score"
```

---

### Task 5: Gerçek veriyle doğrulama ve kayıt

- [ ] **Step 1: Counts against the live data (dev server, real Supabase)**

`/okullar?yerlestirme=merkezi&limit=100` → "55" sonuç; `/okullar?yerlestirme=yerel&limit=100` → "126" sonuç (iki sayfa); `/okullar?yuzdelik_min=0&yuzdelik_max=100` → 55; `/okullar?obp_min=0&obp_max=100` → 126; `/okullar?yerlestirme=yerel_merkezi` → filtresiz toplam ile aynı.

- [ ] **Step 2: Fatma Aliye card**

`/okullar?ara=Fatma Aliye` → iki satır "Merkezi %99,73", "Yerel OBP 57,04"; `&yerlestirme=merkezi` → "%99,73"; `&yerlestirme=yerel` → "57,04"; `&alan=<Çocuk Gelişimi id>&yerlestirme=merkezi` → "%72,95".

- [ ] **Step 3: Sort order spot check**

`/okullar?siralama=yuzdelik_desc&yerlestirme=merkezi` ilk kartlar en büyük yüzdelikler; `siralama=obp_asc` ilk kartlar en düşük OBP; değeri olmayanlar sonda.

- [ ] **Step 4: Screenshots** — masaüstü ve mobil (375px) liste.

- [ ] **Step 5: Build and handoff**

`NEXT_DIST_DIR=.next-verify npx next build` (sonra `.next-verify` silinir ve `tsconfig.json` otomatik değişikliği geri alınır). `PROJECT_HANDOFF.md`'ye bölüm 22 eklenir; commit.

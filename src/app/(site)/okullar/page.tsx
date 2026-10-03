import type { Metadata } from "next";
import { mapSchool, mapVocationalField } from "@/lib/supabase/public";
import { buildTurkishNameRegex } from "@/lib/turkishSearch";
import { createClient } from "@/lib/supabase/server";
import { SchoolList } from "@/components/schools/SchoolList";
import { MULTI_PROGRAM_TYPE, programForType, typeFilterExpression } from "@/lib/school-programs";
import {
  compareByScore,
  parsePlacement,
  placementValues,
  programOBPs,
  valuesBySchool,
  type PlacementValues,
  type ProgramOBPs,
  type ScoreSort,
} from "@/lib/school-scores";
import { Pagination } from "@/components/schools/Pagination";

export const metadata: Metadata = {
  title: "Okullar",
  description:
    "Mersin'deki liseleri ilçe, okul türü ve meslek alanlarına göre inceleyin.",
  alternates: {
    canonical: "/okullar",
  },
  openGraph: {
    title: "Okullar | Hedefim Lise",
    description:
      "Mersin'deki liseleri karşılaştırın ve tercih süreciniz için doğru okulu keşfedin.",
    url: "/okullar",
  },
};

const VALID_LIMITS = [10, 20, 50, 100] as const;
type ValidLimit = (typeof VALID_LIMITS)[number];

function parseLimit(raw: string | undefined): ValidLimit {
  const n = Number(raw);
  return (VALID_LIMITS as readonly number[]).includes(n) ? (n as ValidLimit) : 20;
}

const SCORE_SORTS: readonly ScoreSort[] = ["yuzdelik_asc", "yuzdelik_desc", "obp_desc", "obp_asc"];

function isScoreSort(s: string): s is ScoreSort {
  return (SCORE_SORTS as readonly string[]).includes(s);
}

type Props = {
  searchParams?: Promise<{
    ara?: string;
    ilce?: string;
    tur?: string;
    alan?: string;
    limit?: string;
    sayfa?: string;
    yerlestirme?: string;
    siralama?: string;
    yuzdelik_min?: string;
    yuzdelik_max?: string;
    obp_min?: string;
    obp_max?: string;
  }>;
};

export default async function OkullarPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};

  const ara = (params.ara ?? "").trim();
  const ilce = params.ilce ?? "";
  const tur = params.tur ?? "";
  // "Anadolu Lisesi" / "Anadolu Meslek Programı" seçiliyse ÇPAL'larda o programın OBP'si kullanılır.
  const program = programForType(tur);
  const alan = (params.alan ?? "").trim(); // vocational field ID
  const fieldId = /^\d+$/.test(alan) ? Number(alan) : null;
  const yerlestirme = parsePlacement(params.yerlestirme);
  const siralama = params.siralama ?? "isim_asc";
  // Yüzdelik aralığı: gerçek filtre (landing'deki ölçekten gelir).
  const parseRangeParam = (raw: string | undefined): number | null => {
    const t = (raw ?? "").trim();
    if (t === "") return null;
    const v = Number(t);
    return Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
  };
  const yuzdelikMin = parseRangeParam(params.yuzdelik_min);
  const yuzdelikMax = parseRangeParam(params.yuzdelik_max);
  const hasYuzdelikRange =
    yuzdelikMin != null && yuzdelikMax != null && yuzdelikMin <= yuzdelikMax;
  // OBP aralığı: ikinci metrik. Okulların çoğu yalnızca birine sahip olduğu
  // için iki aralık bağımsızdır; ikisi birden verilirse kesişim uygulanır.
  const obpMin = parseRangeParam(params.obp_min);
  const obpMax = parseRangeParam(params.obp_max);
  const hasObpRange = obpMin != null && obpMax != null && obpMin <= obpMax;
  const limit = parseLimit(params.limit);
  const sayfa = Math.max(Number(params.sayfa) || 1, 1);
  const offset = (sayfa - 1) * limit;

  const supabase = await createClient();
  const scoreSort = isScoreSort(siralama);
  const needsScores = yerlestirme !== null || hasYuzdelikRange || hasObpRange || scoreSort;
  // Meslek alanı, yerleştirme türü ya da puan aralığı okul kimliklerine indirgenir.
  const filtersByIds = alan !== "" || yerlestirme !== null || hasYuzdelikRange || hasObpRange;

  // Sunucu (Avrupa) ile veritabanı (Seul) arasındaki her tur ~0,3 sn sürer, bu
  // yüzden birbirini beklemeyen sorgular aynı anda yola çıkar. PostgREST sorgusu
  // ancak await/then edilince gönderilir; send() onu hemen gönderir.
  const send = <T,>(query: PromiseLike<T>): Promise<T> => Promise.resolve(query);

  const SCHOOLS_SELECT =
    "*, school_scores(id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id, program), school_vocational_fields(vocational_field_id)";

  // Helper: apply shared filters to any supabase query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (q: any, ids: number[] | null): any => {
    if (ara) q = q.regexIMatch("name", buildTurkishNameRegex(ara));
    if (ilce) q = q.eq("district", ilce);
    if (tur) {
      const expression = typeFilterExpression(tur);
      q = expression ? q.or(expression) : q.eq("type", tur);
    }
    if (ids !== null) {
      q = q.in("id", ids.length > 0 ? ids : [-1]);
    }
    return q;
  };
  // Aynı adı taşıyan okullar var (ör. iki "Atatürk Anadolu Lisesi"). Yalnız
  // ada göre sıralanınca veritabanı bunları her seferinde başka sırada
  // verebilir; sayfa sınırına denk gelirse biri iki sayfada görünür, öbürü
  // hiç görünmez. İlçe ve kimlik sırayı sabitler.
  const namePage = (ids: number[] | null) => {
    let schoolsQuery = supabase
      .from("schools")
      .select(SCHOOLS_SELECT, { count: "exact" })
      .eq("is_active", true)
      .order("name")
      .order("district")
      .order("id");
    schoolsQuery = applyFilters(schoolsQuery, ids);
    return schoolsQuery.range(offset, offset + limit - 1);
  };

  const fieldsPromise = send(supabase.from("vocational_fields").select("*").order("title"));

  // Seçili meslek alanının okulları. Ana sorgudan önce çözülür ki sayı ve
  // sayfalama doğru alt küme üzerinden hesaplansın (birleştirme okul başına
  // satırı çoğaltırdı).
  const fieldSchoolsPromise = alan
    ? send(
        supabase
          .from("school_vocational_fields")
          .select("school_id")
          .eq("vocational_field_id", Number(alan)),
      )
    : null;

  // Son yıl puanları (kural: lib/school-scores). Yerleştirme, aralık ve puan
  // sıralaması aynı okul değerlerini kullanır; ana sayfa ölçeğiyle aynı tanım
  // olduğu için ölçekteki her işaret listede bir okuldur. Puan gerekiyorsa
  // bütün yıllar yeniden eskiye tek sorguda gelir ve ilk satır son yılı verir:
  // ayrı "son yıl" sorgusunu beklemek bir tur daha demekti. Satır sınırı (1000)
  // aşılırsa yalnız en eski yıllar düşer.
  const scoreRowsPromise = needsScores
    ? send(
        supabase
          .from("school_scores")
          .select("school_id, year, percentile, obp_score, vocational_field_id, program")
          .order("year", { ascending: false }),
      )
    : null;
  const latestYearPromise = needsScores
    ? null
    : send(
        supabase
          .from("school_scores")
          .select("year")
          .order("year", { ascending: false })
          .limit(1),
      );

  // İsim sıralamasında kimlik filtresi yoksa sayfa sorgusu hiçbir şeyi beklemez.
  const earlyNamePagePromise = !scoreSort && !filtersByIds ? send(namePage(null)) : null;
  // Puan sıralamasında filtreli kimlikler de beklemez; kimlik filtresi aşağıda
  // bellekte uygulanır. Puan ve ad eşitse sıralama kararlı olduğundan bu sıra
  // korunur; aynı adlı okullar burada da sabit sırada kalır.
  let idQuery = supabase
    .from("schools")
    .select("id, name")
    .eq("is_active", true)
    .order("district")
    .order("id");
  idQuery = applyFilters(idQuery, null);
  const idRowsPromise = scoreSort ? send(idQuery) : null;

  const [scoreRowsResult, latestYearResult, fieldSchoolsResult] = await Promise.all([
    scoreRowsPromise,
    latestYearPromise,
    fieldSchoolsPromise,
  ]);

  let schoolIdFilter: number[] | null = fieldSchoolsResult
    ? (fieldSchoolsResult.data ?? []).map((r) => r.school_id as number)
    : null;

  type ScoreRow = Parameters<typeof valuesBySchool>[0][number];
  const scoreRows = (scoreRowsResult?.data ?? []) as ScoreRow[];
  const scoreYear =
    ((needsScores ? scoreRows[0]?.year : latestYearResult?.data?.[0]?.year) as
      | number
      | undefined) ?? null;

  let schoolValues = new Map<number, PlacementValues>();
  if (needsScores && scoreYear != null) {
    schoolValues = valuesBySchool(
      scoreRows.filter((row) => row.year === scoreYear),
      scoreYear,
      fieldId,
      program,
    );
  }

  const idsWhere = (keep: (v: PlacementValues) => boolean) => {
    const ids: number[] = [];
    schoolValues.forEach((v, id) => {
      if (keep(v)) ids.push(id);
    });
    return ids;
  };
  const intersect = (current: number[] | null, ids: number[]) => {
    if (current === null) return ids;
    const allowed = new Set(ids);
    return current.filter((id) => allowed.has(id));
  };
  const inRange = (v: number | null, lo: number, hi: number) =>
    v != null && v >= lo && v <= hi;

  if (yerlestirme !== null) {
    schoolIdFilter = intersect(schoolIdFilter, idsWhere((v) => v[yerlestirme] != null));
  }
  if (hasYuzdelikRange) {
    schoolIdFilter = intersect(
      schoolIdFilter,
      idsWhere((v) => inRange(v.merkezi, yuzdelikMin!, yuzdelikMax!)),
    );
  }
  if (hasObpRange) {
    schoolIdFilter = intersect(
      schoolIdFilter,
      idsWhere((v) => inRange(v.yerel, obpMin!, obpMax!)),
    );
  }

  let schools: ReturnType<typeof mapSchool>[];
  let totalCount: number;
  let fieldsResult: Awaited<typeof fieldsPromise>;

  if (!scoreSort) {
    // ── İsim sıralaması (default): sunucu tarafında sayfalama ──
    const [schoolsResult, fr] = await Promise.all([
      earlyNamePagePromise ?? send(namePage(schoolIdFilter)),
      fieldsPromise,
    ]);
    fieldsResult = fr;

    if (schoolsResult.error || fieldsResult.error) {
      return <h1>Veriler yüklenemedi.</h1>;
    }

    totalCount = schoolsResult.count ?? 0;
    schools = (schoolsResult.data ?? []).map(mapSchool);
  } else {
    // ── Puan sıralaması: önce tüm ID'leri sırala, sonra sayfayı çek ──

    // Step A: Tüm filtreli okul ID'leri (puanlarla aynı anda yola çıktı)
    const [idResult, fr] = await Promise.all([idRowsPromise!, fieldsPromise]);
    fieldsResult = fr;

    if (idResult.error || fieldsResult.error) {
      return <h1>Veriler yüklenemedi.</h1>;
    }

    // Step B: Kimlik filtresini uygula, ortak kurala göre sırala (değeri
    // olmayanlar sonda, eşitlikte ad).
    const allowed = schoolIdFilter === null ? null : new Set(schoolIdFilter);
    const idRows = ((idResult.data ?? []) as { id: number; name: string }[]).filter(
      (r) => allowed === null || allowed.has(r.id),
    );
    const empty: PlacementValues = { merkezi: null, yerel: null };
    const sortedIds = idRows
      .map((r) => ({ id: r.id, name: r.name, values: schoolValues.get(r.id) ?? empty }))
      .sort((a, b) => compareByScore(a, b, siralama))
      .map((r) => r.id);

    totalCount = sortedIds.length;
    const pageIds = sortedIds.slice(offset, offset + limit);

    // Step C: Sayfanın okul detaylarını çek
    const { data: schoolsData, error: schoolsErr } =
      pageIds.length > 0
        ? await supabase
            .from("schools")
            .select(SCHOOLS_SELECT)
            .eq("is_active", true)
            .in("id", pageIds)
        : { data: [], error: null };

    if (schoolsErr) {
      return <h1>Veriler yüklenemedi.</h1>;
    }

    // Sıralamayı koru
    const schoolMap = new Map(
      (schoolsData ?? []).map((s) => [s.id as number, s]),
    );
    const orderedData = pageIds
      .map((id) => schoolMap.get(id))
      .filter(Boolean) as typeof schoolsData;

    schools = (orderedData ?? []).map(mapSchool);
  }

  const vocationalFields = (fieldsResult.data ?? []).map(mapVocationalField);
  const scoreValues: Record<number, PlacementValues> = {};
  const programValues: Record<number, ProgramOBPs> = {};
  for (const school of schools) {
    scoreValues[school.id] = placementValues(school.scores ?? [], scoreYear, fieldId, program);
    if (program == null && school.type === MULTI_PROGRAM_TYPE) programValues[school.id] = programOBPs(school.scores ?? [], scoreYear);
  }
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
  const currentPage = Math.min(sayfa, totalPages);

  const paginationSearchParams: Record<string, string> = {};
  if (ara) paginationSearchParams.ara = ara;
  if (ilce) paginationSearchParams.ilce = ilce;
  if (tur) paginationSearchParams.tur = tur;
  if (alan) paginationSearchParams.alan = alan;
  if (yerlestirme) paginationSearchParams.yerlestirme = yerlestirme;
  if (limit !== 20) paginationSearchParams.limit = String(limit);
  if (siralama !== "isim_asc") paginationSearchParams.siralama = siralama;
  if (hasYuzdelikRange) {
    paginationSearchParams.yuzdelik_min = String(yuzdelikMin);
    paginationSearchParams.yuzdelik_max = String(yuzdelikMax);
  }
  if (hasObpRange) {
    paginationSearchParams.obp_min = String(obpMin);
    paginationSearchParams.obp_max = String(obpMax);
  }

  const startItem = totalCount === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, totalCount);

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-24 md:pt-12">
      <div className="container mx-auto max-w-7xl px-6">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-[2.25rem] md:leading-tight">
            Sana Uygun Liseleri Keşfet
          </h1>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            İlçe, okul türü ve meslek alanlarına göre filtrele, en uygun eşleşmeleri hızla bul.
          </p>
        </header>

        <SchoolList
          key={`${ara}-${ilce}-${tur}-${alan}-${yerlestirme}-${limit}-${siralama}-${yuzdelikMin}-${yuzdelikMax}-${obpMin}-${obpMax}`}
          yuzdelikMin={hasYuzdelikRange ? yuzdelikMin : null}
          yuzdelikMax={hasYuzdelikRange ? yuzdelikMax : null}
          obpMin={hasObpRange ? obpMin : null}
          obpMax={hasObpRange ? obpMax : null}
          schools={schools}
          vocationalFields={vocationalFields}
          totalCount={totalCount}
          startItem={startItem}
          endItem={endItem}
          currentPage={currentPage}
          totalPages={totalPages}
          initialSearch={ara}
          initialIlce={ilce}
          initialTur={tur}
          initialAlan={alan}
          initialPlacement={yerlestirme ?? ""}
          activePlacement={yerlestirme}
          scoreYear={scoreYear}
          scoreValues={scoreValues}
          programValues={programValues}
          initialLimit={limit}
          initialSiralama={siralama}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={paginationSearchParams}
        />
      </div>
    </div>
  );
}

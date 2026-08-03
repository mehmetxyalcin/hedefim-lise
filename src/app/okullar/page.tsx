import type { Metadata } from "next";
import Link from "next/link";
import { mapSchool, mapVocationalField } from "@/lib/supabase/public";
import { buildTurkishNameRegex } from "@/lib/turkishSearch";
import { createClient } from "@/lib/supabase/server";
import { SchoolList } from "@/components/schools/SchoolList";
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

const SCORE_SORTS = ["yuzdelik_asc", "yuzdelik_desc", "obp_desc", "obp_asc"] as const;
type ScoreSort = (typeof SCORE_SORTS)[number];

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
  const alan = (params.alan ?? "").trim(); // vocational field ID
  const yerlestirme = params.yerlestirme ?? "";
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

  // Step 1: When a vocational field is selected, resolve which school IDs have it.
  // This runs before the main query so count and offset are computed against the
  // correct subset (a join select would inflate the row count per school).
  let schoolIdFilter: number[] | null = null;
  if (alan) {
    const { data: svfData } = await supabase
      .from("school_vocational_fields")
      .select("school_id")
      .eq("vocational_field_id", Number(alan));
    schoolIdFilter = (svfData ?? []).map((r) => r.school_id as number);
  }

  // Step 1b: Puan aralığı filtreleri. Landing ölçeğiyle AYNI tanım kullanılır:
  // yalnızca en son yılın (school_scores'taki max year) değerleri ve okul
  // başına TEK değer — okulun EN REKABETÇİ değeri. Yön metriğe göre terstir:
  // yüzdelikte en düşük, OBP'de en yüksek. Böylece ölçekte "N okul" diyen tam
  // aralık, listede de tam olarak N okul döndürür.
  if (hasYuzdelikRange || hasObpRange) {
    const { data: yearRows } = await supabase
      .from("school_scores")
      .select("year")
      .order("year", { ascending: false })
      .limit(1);
    const scaleYear = (yearRows?.[0]?.year as number | undefined) ?? null;

    type ScoreRow = {
      school_id: number;
      percentile: number | null;
      obp_score: number | null;
    };
    const { data: rawScoreRows } = scaleYear
      ? await supabase
          .from("school_scores")
          .select("school_id, percentile, obp_score")
          .eq("year", scaleYear)
      : { data: null };
    const scoreRows = (rawScoreRows ?? []) as ScoreRow[];

    // Bir metriğin aralığını, okul başına en rekabetçi değere göre çözer.
    const idsInRange = (
      read: (r: ScoreRow) => number | null,
      moreCompetitive: (candidate: number, current: number) => boolean,
      lo: number,
      hi: number,
    ): number[] => {
      const bestBySchool = new Map<number, number>();
      for (const r of scoreRows) {
        const v = read(r);
        if (v == null || !Number.isFinite(v)) continue;
        const id = r.school_id;
        const prev = bestBySchool.get(id);
        if (prev == null || moreCompetitive(v, prev)) bestBySchool.set(id, v);
      }
      const out: number[] = [];
      bestBySchool.forEach((v, id) => {
        if (v >= lo && v <= hi) out.push(id);
      });
      return out;
    };

    const narrow = (ids: number[]) => {
      if (schoolIdFilter === null) {
        schoolIdFilter = ids;
      } else {
        const allowed = new Set(ids);
        schoolIdFilter = schoolIdFilter.filter((id) => allowed.has(id));
      }
    };

    if (hasYuzdelikRange) {
      narrow(
        idsInRange(
          (r) => r.percentile,
          (c, cur) => c < cur, // düşük yüzdelik = daha rekabetçi
          yuzdelikMin!,
          yuzdelikMax!,
        ),
      );
    }
    if (hasObpRange) {
      narrow(
        idsInRange(
          (r) => r.obp_score,
          (c, cur) => c > cur, // yüksek OBP = daha rekabetçi
          obpMin!,
          obpMax!,
        ),
      );
    }
  }

  const SCHOOLS_SELECT =
    "*, school_scores(id, school_id, year, obp_score, lgs_score, percentile), school_vocational_fields(vocational_field_id)";

  // Helper: apply shared filters to any supabase query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyFilters<T extends ReturnType<typeof supabase.from>>(q: any): any {
    if (ara) q = q.regexIMatch("name", buildTurkishNameRegex(ara));
    if (ilce) q = q.eq("district", ilce);
    if (tur) q = q.eq("type", tur);
    if (yerlestirme) q = q.eq("placement_type", yerlestirme);
    if (schoolIdFilter !== null) {
      q = q.in("id", schoolIdFilter!.length > 0 ? schoolIdFilter : [-1]);
    }
    return q;
  }

  const fieldsPromise = supabase.from("vocational_fields").select("*").order("title");

  let schools: ReturnType<typeof mapSchool>[];
  let totalCount: number;
  let fieldsResult: Awaited<typeof fieldsPromise>;

  if (!isScoreSort(siralama)) {
    // ── İsim sıralaması (default): sunucu tarafında sayfalama ──
    let schoolsQuery = supabase
      .from("schools")
      .select(SCHOOLS_SELECT, { count: "exact" })
      .eq("is_active", true)
      .order("name");
    schoolsQuery = applyFilters(schoolsQuery);

    const [schoolsResult, fr] = await Promise.all([
      schoolsQuery.range(offset, offset + limit - 1),
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

    // Step A: Tüm filtreli okul ID'leri
    let idQuery = supabase.from("schools").select("id").eq("is_active", true);
    idQuery = applyFilters(idQuery);

    const [idResult, fr] = await Promise.all([idQuery, fieldsPromise]);
    fieldsResult = fr;

    if (idResult.error || fieldsResult.error) {
      return <h1>Veriler yüklenemedi.</h1>;
    }

    const allIds = (idResult.data ?? []).map((r) => r.id as number);

    // Step B: Puan verileri (en son yıl, okul başına tek skor)
    const { data: scoreData } = allIds.length > 0
      ? await supabase
          .from("school_scores")
          .select("school_id, percentile, obp_score, year")
          .in("school_id", allIds)
      : { data: [] as { school_id: number; percentile: number | null; obp_score: number | null; year: number }[] };

    type ScoreEntry = { percentile: number | null; obp_score: number | null };
    const scoreMap = new Map<number, ScoreEntry>();
    for (const s of scoreData ?? []) {
      const id = s.school_id as number;
      const existing = scoreMap.get(id);
      // En son yıla ait skoru tut
      if (!existing || (s.year as number) > ((scoreMap as Map<number, ScoreEntry & { year: number }>).get(id)?.year ?? 0)) {
        (scoreMap as Map<number, ScoreEntry & { year: number }>).set(id, {
          percentile: s.percentile,
          obp_score: s.obp_score,
          year: s.year as number,
        });
      }
    }

    // Step C: ID'leri sırala
    const HIGH = 99999;
    const sortedIds = [...allIds].sort((a, b) => {
      const aS = scoreMap.get(a);
      const bS = scoreMap.get(b);
      if (siralama === "yuzdelik_asc")
        return (aS?.percentile ?? HIGH) - (bS?.percentile ?? HIGH);
      if (siralama === "yuzdelik_desc")
        return (bS?.percentile ?? -1) - (aS?.percentile ?? -1);
      if (siralama === "obp_desc")
        return (bS?.obp_score ?? -1) - (aS?.obp_score ?? -1);
      // obp_asc
      return (aS?.obp_score ?? HIGH) - (bS?.obp_score ?? HIGH);
    });

    totalCount = sortedIds.length;
    const pageIds = sortedIds.slice(offset, offset + limit);

    // Step D: Sayfanın okul detaylarını çek
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

  // Bir aralığı temizlemek yalnızca O aralığı düşürmeli; diğer filtreler kalır.
  const urlWithout = (...drop: string[]) => {
    const qs = new URLSearchParams(paginationSearchParams);
    for (const k of drop) qs.delete(k);
    const s = qs.toString();
    return `/okullar${s ? `?${s}` : ""}`;
  };
  const trFixed = (v: number) => v.toFixed(2).replace(".", ",");

  const startItem = totalCount === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, totalCount);

  return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-8 max-w-3xl">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Sana Uygun Liseleri Keşfet
          </h1>
          <p className="text-lg leading-relaxed text-slate-500">
            İlçe, okul türü ve meslek alanlarına göre filtrele, en uygun eşleşmeleri hızla bul.
          </p>
          {(hasYuzdelikRange || hasObpRange) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hasYuzdelikRange && (
                <p className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm text-blue-700">
                  Yüzdelik aralığı:{" "}
                  <span className="tabular font-semibold">
                    %{trFixed(yuzdelikMin!)} – %{trFixed(yuzdelikMax!)}
                  </span>
                  <Link
                    href={urlWithout("yuzdelik_min", "yuzdelik_max")}
                    className="font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-900"
                  >
                    temizle
                  </Link>
                </p>
              )}
              {hasObpRange && (
                <p className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm text-blue-700">
                  OBP aralığı:{" "}
                  <span className="tabular font-semibold">
                    {trFixed(obpMin!)} – {trFixed(obpMax!)}
                  </span>
                  <Link
                    href={urlWithout("obp_min", "obp_max")}
                    className="font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-900"
                  >
                    temizle
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

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
          initialPlacement={yerlestirme}
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

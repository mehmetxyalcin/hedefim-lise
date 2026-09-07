import type { Metadata } from "next";
import Link from "next/link";
import { mapSchool, mapVocationalField } from "@/lib/supabase/public";
import { buildTurkishNameRegex } from "@/lib/turkishSearch";
import { createClient } from "@/lib/supabase/server";
import { SchoolList } from "@/components/schools/SchoolList";
import { matchingPrograms, rankingValue, type ScoreCriteria } from "@/lib/program-scores";
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

const SCORE_SORTS = ["yuzdelik_asc", "yuzdelik_desc", "obp_desc", "obp_asc", "lgs_asc", "lgs_desc"] as const;
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
  const sayfa = Math.max(Math.floor(Number(params.sayfa)) || 1, 1);

  const supabase = await createClient();

  const { data: yearRows, error: yearError } = await supabase.from("school_scores")
    .select("year").order("year", { ascending: false }).limit(1);
  const scoreYear = yearRows?.[0]?.year ?? null;
  const criteria: ScoreCriteria = {
    year: scoreYear,
    fieldId: alan ? Number(alan) : null,
    percentile: hasYuzdelikRange ? [yuzdelikMin!, yuzdelikMax!] : null,
    obp: hasObpRange ? [obpMin!, obpMax!] : null,
    sort: siralama,
  };
  const { data: fieldRows, error: fieldsError } = await supabase.from("vocational_fields").select("*").order("title");
  if (yearError || fieldsError) return <h1>Veriler yüklenemedi. Lütfen tekrar deneyin.</h1>;
  const vocationalFields = (fieldRows ?? []).map(mapVocationalField);

  // Fetch compact candidates in pages so the API row cap cannot truncate ranking.
  const candidates: Pick<ReturnType<typeof mapSchool>, "id" | "name" | "scores" | "vocationalFields">[] = [];
  for (let from = 0; ; from += 500) {
    let query = supabase.from("schools")
      .select("id, name, school_scores(id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id), school_vocational_fields(vocational_field_id)")
      .eq("is_active", true).order("id");
    if (ara) query = query.regexIMatch("name", buildTurkishNameRegex(ara));
    if (ilce) query = query.eq("district", ilce);
    if (tur) query = query.eq("type", tur);
    if (yerlestirme) query = query.eq("placement_type", yerlestirme);
    const {data, error} = await query.range(from, from + 499);
    if (error) return <h1>Veriler yüklenemedi. Lütfen tekrar deneyin.</h1>;
    for (const row of data ?? []) {
      // Map only after the complete school is fetched; compact candidates need
      // just identity, score rows and field membership for filtering/ranking.
      const candidate = { id: row.id, name: row.name, scores: row.school_scores,
        vocationalFields: row.school_vocational_fields.map(r => r.vocational_field_id) };
      if (alan && !candidate.vocationalFields.includes(Number(alan))) continue;
      if ((hasYuzdelikRange || hasObpRange) && !matchingPrograms(candidate.scores, criteria).length) continue;
      candidates.push(candidate);
    }
    if (!data || data.length < 500) break;
  }
  candidates.sort((a,b) => {
    if (isScoreSort(siralama)) {
      const av = rankingValue(a.scores ?? [], criteria), bv = rankingValue(b.scores ?? [], criteria);
      if (av === null && bv !== null) return 1;
      if (bv === null && av !== null) return -1;
      if (av !== null && bv !== null && av !== bv) return siralama.endsWith("_desc") ? bv-av : av-bv;
    }
    return a.name.localeCompare(b.name, "tr") || a.id-b.id;
  });
  const totalCount = candidates.length;
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
  const currentPage = Math.min(sayfa, totalPages);
  const offset = (currentPage - 1) * limit;
  const pageIds = candidates.slice(offset, offset + limit).map(s => s.id);
  const {data: schoolRows, error: schoolError} = pageIds.length ? await supabase.from("schools")
    .select("*, school_scores(id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id), school_vocational_fields(vocational_field_id)")
    .eq("is_active", true).in("id", pageIds) : {data: [], error: null};
  if (schoolError) return <h1>Veriler yüklenemedi. Lütfen tekrar deneyin.</h1>;
  const mapped = new Map((schoolRows ?? []).map(row => [row.id, mapSchool(row)]));
  const schools = pageIds.flatMap(id => mapped.has(id) ? [mapped.get(id)!] : []);

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
          scoreYear={scoreYear}
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

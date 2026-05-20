import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { mapSchool, mapVocationalField } from "@/lib/supabase/public";
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

type Props = {
  searchParams?: Promise<{
    ara?: string;
    ilce?: string;
    tur?: string;
    alan?: string;
    limit?: string;
    sayfa?: string;
    yerlestirme?: string;
  }>;
};

export default async function OkullarPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};

  const ara = (params.ara ?? "").trim();
  const ilce = params.ilce ?? "";
  const tur = params.tur ?? "";
  const alan = (params.alan ?? "").trim(); // vocational field ID
  const yerlestirme = params.yerlestirme ?? "";
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

  // Step 2: Build and run the main query. Include vocational fields list in parallel.
  let schoolsQuery = supabase
    .from("schools")
    .select(
      "*, school_scores(id, school_id, year, obp_score, lgs_score, percentile), school_vocational_fields(vocational_field_id)",
      { count: "exact" },
    )
    .eq("is_active", true)
    .order("name");

  if (ara) schoolsQuery = schoolsQuery.ilike("name", `%${ara}%`);
  if (ilce) schoolsQuery = schoolsQuery.eq("district", ilce);
  if (tur) schoolsQuery = schoolsQuery.eq("type", tur);
  if (yerlestirme) schoolsQuery = schoolsQuery.eq("placement_type", yerlestirme);
  if (schoolIdFilter !== null) {
    // Empty schoolIdFilter means no schools have this field — use [-1] to guarantee 0 results.
    schoolsQuery = schoolsQuery.in("id", schoolIdFilter.length > 0 ? schoolIdFilter : [-1]);
  }

  const [schoolsResult, fieldsResult] = await Promise.all([
    schoolsQuery.range(offset, offset + limit - 1),
    supabase.from("vocational_fields").select("*").order("title"),
  ]);

  if (schoolsResult.error || fieldsResult.error) {
    return <h1>Veriler yüklenemedi.</h1>;
  }

  const totalCount = schoolsResult.count ?? 0;
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
  const currentPage = Math.min(sayfa, totalPages);

  const schools = (schoolsResult.data ?? []).map(mapSchool);
  const vocationalFields = (fieldsResult.data ?? []).map(mapVocationalField);

  const paginationSearchParams: Record<string, string> = {};
  if (ara) paginationSearchParams.ara = ara;
  if (ilce) paginationSearchParams.ilce = ilce;
  if (tur) paginationSearchParams.tur = tur;
  if (alan) paginationSearchParams.alan = alan;
  if (yerlestirme) paginationSearchParams.yerlestirme = yerlestirme;
  if (limit !== 20) paginationSearchParams.limit = String(limit);

  const startItem = totalCount === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, totalCount);

  return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-24">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-100/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Akıllı Tercih Sistemi
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Sana Uygun Liseleri Keşfet
          </h1>
          <p className="text-lg leading-relaxed text-slate-500">
            İlçe, okul türü ve meslek alanlarına göre filtrele, en uygun eşleşmeleri hızla bul.
          </p>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {totalCount === 0 ? (
              "Sonuç bulunamadı."
            ) : (
              <>
                <span className="font-semibold text-slate-700">{totalCount}</span> okul
                {totalCount !== 1 && " bulundu"}
                {totalPages > 1 && (
                  <>
                    {" "}— {startItem}–{endItem} gösteriliyor
                  </>
                )}
              </>
            )}
          </p>
          {totalPages > 1 && (
            <p className="text-sm text-slate-500">
              Sayfa{" "}
              <span className="font-semibold text-slate-700">
                {currentPage}/{totalPages}
              </span>
            </p>
          )}
        </div>

        <SchoolList
          key={`${ara}-${ilce}-${tur}-${alan}-${yerlestirme}-${limit}`}
          schools={schools}
          vocationalFields={vocationalFields}
          initialSearch={ara}
          initialIlce={ilce}
          initialTur={tur}
          initialAlan={alan}
          initialPlacement={yerlestirme}
          initialLimit={limit}
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

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
    limit?: string;
    sayfa?: string;
  }>;
};

export default async function OkullarPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};

  const ara = (params.ara ?? "").trim();
  const ilce = params.ilce ?? "";
  const tur = params.tur ?? "";
  const limit = parseLimit(params.limit);
  const sayfa = Math.max(Number(params.sayfa) || 1, 1);
  const offset = (sayfa - 1) * limit;

  const supabase = await createClient();

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
            İlçe, okul türü ve aradığın fiziksel imkanlara göre veritabanını
            filtrele, en uygun eşleşmeleri hızla analiz et.
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
          key={`${ara}-${ilce}-${tur}-${limit}`}
          schools={schools}
          vocationalFields={vocationalFields}
          initialSearch={ara}
          initialIlce={ilce}
          initialTur={tur}
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

import Link from "next/link";
import { SchoolForm } from "@/components/admin/SchoolForm";
import { updateSchool } from "@/app/admin/okullar/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { mapSchool, mapVocationalField } from "@/lib/supabase/public";

type AdminEditSchoolPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminEditSchoolPage({
  params,
  searchParams,
}: AdminEditSchoolPageProps) {
  const { id } = await params;
  const { supabase, profile } = await requireAdmin();
  const query = searchParams ? await searchParams : undefined;

  if (!profile) {
    return <h1>Yetkisiz erişim.</h1>;
  }

  const [{ data, error }, { data: vocationalFieldsData, error: vocationalFieldsError }] =
    await Promise.all([
      supabase
        .from("schools")
        .select("*, school_vocational_fields(vocational_field_id)")
        .eq("id", Number(id))
        .maybeSingle(),
      supabase.from("vocational_fields").select("*").order("title"),
    ]);

  if (error || !data) {
    return <h1>Okul bulunamadı.</h1>;
  }

  if (vocationalFieldsError) {
    return <h1>Meslek alanlari yüklenemedi.</h1>;
  }

  const school = mapSchool(data);
  const publicHref = school.isActive !== false ? `/okullar/${school.slug}` : undefined;

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              Admin&apos;e dön
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Okulu Düzenle
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {school.name} kaydını, görsellerini ve meslek alanı ilişkilerini yönetin.
            </p>
          </div>
          {publicHref ? (
            <Link
              href={publicHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Public sayfayı aç
            </Link>
          ) : (
            <span className="inline-flex rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              Pasif okul public sayfada görünmez
            </span>
          )}
        </div>

        {query?.error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {query.error}
          </div>
        )}
        <SchoolForm
          action={updateSchool.bind(null, null)}
          cancelHref="/admin"
          publicHref={publicHref}
          school={school}
          submitLabel="Değişiklikleri Kaydet"
          vocationalFields={(vocationalFieldsData ?? []).map(mapVocationalField)}
        />
      </div>
    </div>
  );
}

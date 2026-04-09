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

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <Link href="/admin" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            Admin&apos;e don
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            Okulu Düzenle
          </h1>
        </div>
        {query?.error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {query.error}
          </div>
        )}
        <SchoolForm
          action={updateSchool}
          school={school}
          submitLabel="Degisiklikleri Kaydet"
          vocationalFields={(vocationalFieldsData ?? []).map(mapVocationalField)}
        />
      </div>
    </div>
  );
}

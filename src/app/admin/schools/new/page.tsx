import Link from "next/link";
import { SchoolForm } from "@/components/admin/SchoolForm";
import { requireAdmin } from "@/lib/admin-auth";
import { createSchool } from "@/app/admin/okullar/actions";
import { mapVocationalField } from "@/lib/supabase/public";

type AdminNewSchoolPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminNewSchoolPage({
  searchParams,
}: AdminNewSchoolPageProps) {
  const { supabase, profile } = await requireAdmin();
  const params = searchParams ? await searchParams : undefined;

  if (!profile) {
    return <h1>Yetkisiz erisim.</h1>;
  }

  const { data: vocationalFieldsData, error } = await supabase
    .from("vocational_fields")
    .select("*")
    .order("title");

  if (error) {
    return <h1>Meslek alanlari yuklenemedi.</h1>;
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <Link href="/admin" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            Admin&apos;e don
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            Yeni Okul
          </h1>
        </div>
        {params?.error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {params.error}
          </div>
        )}
        <SchoolForm
          action={createSchool}
          submitLabel="Okulu Kaydet"
          vocationalFields={(vocationalFieldsData ?? []).map(mapVocationalField)}
        />
      </div>
    </div>
  );
}

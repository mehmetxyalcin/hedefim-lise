import Link from "next/link";
import { AdminSchoolList } from "@/components/admin/AdminSchoolList";
import { mapSchool } from "@/lib/supabase/public";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteSchool } from "@/app/admin/okullar/actions";

type AdminPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { supabase, user, profile } = await requireAdmin();
  const params = searchParams ? await searchParams : undefined;

  if (!profile) {
    return <h1>Yetkisiz erisim.</h1>;
  }

  const { data, error } = await supabase.from("schools").select("*").order("name");

  if (error) {
    return <h1>Okullar yuklenemedi.</h1>;
  }

  const schools = (data ?? []).map(mapSchool);

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Admin Paneli
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Giris yapildi: {profile.email ?? user.email}
            </p>
          </div>
          <Link
            href="/admin/schools/new"
            className="inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Yeni Okul Ekle
          </Link>
        </div>

        {params?.success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {params.success}
          </div>
        )}

        {params?.error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {params.error}
          </div>
        )}

        <AdminSchoolList deleteAction={deleteSchool} schools={schools} />
      </div>
    </div>
  );
}

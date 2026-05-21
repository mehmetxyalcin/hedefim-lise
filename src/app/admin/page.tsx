import type { Metadata } from "next";
import Link from "next/link";
import { AdminSchoolList } from "@/components/admin/AdminSchoolList";
import { mapSchool } from "@/lib/supabase/public";
import { requireAdmin } from "@/lib/admin-auth";
import {
  bulkUpdateSchoolStatus,
  deleteSchool,
  toggleSchoolStatus,
} from "@/app/admin/okullar/actions";

export const metadata: Metadata = {
  title: "Admin Paneli",
  robots: {
    index: false,
    follow: false,
  },
};

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
    return <h1>Yetkisiz erişim.</h1>;
  }

  const [schoolsResult, unreadResult] = await Promise.all([
    supabase
      .from("schools")
      .select("*, school_vocational_fields(vocational_field_id)")
      .order("name"),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread"),
  ]);

  const { data, error } = schoolsResult;
  const unreadCount = unreadResult.count ?? 0;

  if (error) {
    return <h1>Okullar yüklenemedi.</h1>;
  }

  const schools = (data ?? []).map(mapSchool);

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Admin Paneli
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Giriş yapıldı: {profile.email ?? user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/mesajlar"
              className="relative inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Mesajlar
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/site-settings"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Site Ayarları
            </Link>
            <Link
              href="/admin/meslek-alanlari"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Meslek Alanları
            </Link>
            <Link
              href="/admin/okullar/toplu-yukle"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Toplu Yükle
            </Link>
            <Link
              href="/admin/okullar/yeni"
              className="inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Yeni Okul Ekle
            </Link>
          </div>
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

        <AdminSchoolList
          bulkStatusAction={bulkUpdateSchoolStatus}
          deleteAction={deleteSchool}
          schools={schools}
          toggleStatusAction={toggleSchoolStatus}
        />
      </div>
    </div>
  );
}

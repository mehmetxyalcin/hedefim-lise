import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import {
  VocationalFieldsManager,
  type VocFieldWithBranches,
} from "@/components/admin/VocationalFieldsManager";

export const metadata: Metadata = {
  title: "Meslek Alanları | Admin",
  robots: { index: false, follow: false },
};

export default async function MeslekAlanlariPage() {
  const { supabase } = await requireAdmin();

  const { data: fields, error } = await supabase
    .from("vocational_fields")
    .select("id, title, slug, vocational_branches(id, name)")
    .order("title");

  if (error) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-rose-600">Veriler yüklenemedi: {error.message}</p>
        </div>
      </div>
    );
  }

  const vocFields = (fields ?? []) as VocFieldWithBranches[];

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Admin Paneli
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Meslek Alanları Yönetimi
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Meslek alanlarını ve dallarını yönetin. Toplu yüklemede ve okul düzenlemede kullanılır.
          </p>
        </div>

        <VocationalFieldsManager initialFields={vocFields} />
      </div>
    </div>
  );
}

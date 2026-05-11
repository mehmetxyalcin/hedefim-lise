import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { BulkUploadWizard } from "@/components/admin/BulkUploadWizard";

export const metadata: Metadata = {
  title: "Toplu Okul Yükle | Admin",
  robots: { index: false, follow: false },
};

export default async function TopluYuklePage() {
  await requireAdmin();

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Admin Paneli
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Toplu Okul Yükleme
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Excel veya CSV dosyasıyla birden fazla okulu tek seferde ekleyin veya güncelleyin.
            </p>
          </div>
        </div>
        <BulkUploadWizard />
      </div>
    </div>
  );
}

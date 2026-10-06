import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FaqImportWizard } from "./FaqImportWizard";

export const metadata: Metadata = {
  title: "Soru-cevap toplu yükleme | Yönetim",
  robots: { index: false, follow: false },
};

export default async function FaqImportPage() {
  await requireAdmin();

  return (
    <AdminPage width="form">
      <PageHeader
        trail={[{ label: "Soru-cevap", href: "/admin/soru-cevap" }]}
        title="Soru-cevap toplu yükleme"
        description="Excel veya CSV dosyasıyla hazır soruları kategorileriyle birlikte ekleyin. Kayıttan önce her zaman önizleme gösterilir; zaten kayıtlı sorular atlanır."
      />
      <FaqImportWizard />
    </AdminPage>
  );
}

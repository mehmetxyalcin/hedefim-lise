import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { BulkUploadWizard } from "@/components/admin/bulk-upload/BulkUploadWizard";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata: Metadata = {
  title: "Toplu yükleme | Yönetim",
  robots: { index: false, follow: false },
};

export default async function TopluYuklePage() {
  await requireAdmin();

  return (
    <AdminPage>
      <PageHeader
        title="Toplu yükleme"
        description="Excel veya CSV dosyasıyla birden fazla okulu tek seferde ekleyin ya da güncelleyin. Kayıttan önce her zaman önizleme gösterilir."
      />
      <BulkUploadWizard />
    </AdminPage>
  );
}

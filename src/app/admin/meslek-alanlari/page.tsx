import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import {
  VocationalFieldsManager,
  type VocFieldWithBranches,
} from "@/components/admin/VocationalFieldsManager";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";

export const metadata: Metadata = {
  title: "Meslek alanları | Yönetim",
  robots: { index: false, follow: false },
};

type FieldRow = VocFieldWithBranches & {
  school_vocational_fields?: { school_id: number }[] | null;
};

export default async function MeslekAlanlariPage() {
  const { supabase } = await requireAdmin();

  const { data: fields, error } = await supabase
    .from("vocational_fields")
    .select("id, title, slug, vocational_branches(id, name), school_vocational_fields(school_id)")
    .order("title");

  if (error) {
    return (
      <AdminPage width="narrow">
        <PageHeader title="Meslek alanları" />
        <FlashBanner error={`Veriler yüklenemedi: ${error.message}`} />
      </AdminPage>
    );
  }

  const vocFields: VocFieldWithBranches[] = ((fields ?? []) as FieldRow[]).map(
    ({ school_vocational_fields, ...field }) => ({
      ...field,
      school_count: school_vocational_fields?.length ?? 0,
    }),
  );
  const branchCount = vocFields.reduce((total, field) => total + field.vocational_branches.length, 0);

  return (
    <AdminPage width="narrow">
      <PageHeader
        title="Meslek alanları"
        description={`${vocFields.length} alan · ${branchCount} dal. Toplu yüklemede ve okul düzenlemede kullanılır.`}
      />
      <VocationalFieldsManager initialFields={vocFields} />
    </AdminPage>
  );
}

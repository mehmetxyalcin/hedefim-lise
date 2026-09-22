import { permanentRedirect, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";

type Props = { params: Promise<{ id: string }> };

// Eski tek formlu yol; düzenleme sekmeli ekranda slug ile yapılır.
export default async function LegacyEditSchoolPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const schoolId = Number(id);
  const { data } = Number.isSafeInteger(schoolId) && schoolId > 0
    ? await supabase.from("schools").select("slug").eq("id", schoolId).maybeSingle()
    : { data: null };

  if (!data?.slug) {
    redirect(`/admin?error=${encodeURIComponent("Okul bulunamadı.")}`);
  }
  permanentRedirect(`/admin/okullar/${data.slug}/duzenle`);
}

import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { permanentRedirect } from "next/navigation";
import { SchoolFormTabs } from "@/components/admin/SchoolFormTabs";
import {
  updateSchool,
  updateSchoolContact,
  updateSchoolOtherInfo,
  upsertSchoolScore,
  deleteSchoolScore,
  upsertSchoolQuota,
  deleteSchoolQuota,
  syncSchoolFacilities,
  addSchoolFacility,
  syncSchoolVocationalFull,
  addVocationalBranch,
  addSchoolScholarship,
  updateSchoolScholarship,
  deleteSchoolScholarship,
  reorderSchoolScholarship,
  addSchoolProject,
  updateSchoolProject,
  deleteSchoolProject,
  reorderSchoolProject,
} from "@/app/admin/okullar/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { evaluateSchoolHealth, latestYear } from "@/lib/school-health";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { Badge } from "@/components/admin/ui/Badge";
import { adminButton } from "@/components/admin/ui/Button";
import { findSchoolSlugInHistory } from "@/lib/supabase/slugHistory";
import {
  mapSchool,
  mapVocationalField,
  mapFacility,
  mapVocationalBranch,
  mapSchoolScore,
  mapSchoolQuota,
  mapSchoolScholarship,
  mapSchoolProject,
} from "@/lib/supabase/public";


export const metadata: Metadata = {
  title: "Okulu düzenle | Yönetim",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function AdminEditSchoolPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { supabase, profile } = await requireAdmin();
  const query = searchParams ? await searchParams : undefined;

  if (!profile) {
    return (
      <AdminPage width="form">
        <PageHeader trail={[{ label: "Okullar", href: "/admin" }]} title="Yetkisiz erişim" />
      </AdminPage>
    );
  }

  const [
    { data: schoolData, error: schoolError },
    { data: vocationalFieldsData },
    { data: facilitiesData },
    { data: branchesData },
    { data: latestScoreRow },
    { data: latestQuotaRow },
  ] = await Promise.all([
    supabase
      .from("schools")
      .select(`
        *,
        school_vocational_fields(vocational_field_id),
        school_facilities(facility_id),
        school_vocational_branches(branch_id),
        school_quotas(id, school_id, year, sinavli_count, sinavsiz_count),
        school_scholarships(id, school_id, title, description, amount_info, order_index),
        school_projects(id, school_id, title, description, image_url, link_url, order_index)
      `)
      .eq("slug", slug)
      .maybeSingle(),
    supabase.from("vocational_fields").select("*").order("title"),
    supabase.from("facilities").select("*").order("name"),
    supabase.from("vocational_branches").select("*").order("name"),
    // Veri kümesinin son puan ve kontenjan yılı (veri sağlığı kuralı için).
    supabase.from("school_scores").select("year").order("year", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("school_quotas").select("year").order("year", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (schoolError || !schoolData) {
    // Yer imine alınmış eski düzenleme adresleri de yenisine taşınsın
    // (migration 013).
    const currentSlug = await findSchoolSlugInHistory(slug);
    if (currentSlug) permanentRedirect(`/admin/okullar/${currentSlug}/duzenle`);

    return (
      <AdminPage width="form">
        <PageHeader
          trail={[{ label: "Okullar", href: "/admin" }]}
          title="Okul bulunamadı"
          description="Adres değişmiş ya da okul silinmiş olabilir."
        />
      </AdminPage>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sd = schoolData as any;

  const school = mapSchool(sd);
  const publicHref = school.isActive ? `/okullar/${school.slug}` : undefined;

  const selectedFacilityIds: string[] = (sd.school_facilities ?? []).map((f: { facility_id: string }) => f.facility_id);
  const selectedBranchIds: string[] = (sd.school_vocational_branches ?? []).map((b: { branch_id: string }) => b.branch_id);
  const selectedFieldIds: number[] = (sd.school_vocational_fields ?? []).map((f: { vocational_field_id: number }) => f.vocational_field_id);

  // school_scores'u ayrı sorgula; vocational_field_id kolonu DB'de henüz yoksa
  // (migration çalıştırılmamış) fallback olarak sütun olmadan çek.
  let scoresRaw: Parameters<typeof mapSchoolScore>[0][] = [];
  {
    const { data: scoresWithField, error: scoresErr } = await supabase
      .from("school_scores")
      .select("id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id, program")
      .eq("school_id", sd.id);
    if (!scoresErr) {
      scoresRaw = scoresWithField ?? [];
    } else {
      const { data: scoresBasic } = await supabase
        .from("school_scores")
        .select("id, school_id, year, obp_score, lgs_score, percentile")
        .eq("school_id", sd.id);
      scoresRaw = scoresBasic ?? [];
    }
  }

  const scores = scoresRaw.map(mapSchoolScore);
  const quotas = (sd.school_quotas ?? []).map(mapSchoolQuota);
  const schoolVocationalFields: { id: number; title: string }[] = (vocationalFieldsData ?? [])
    .filter((vf: { id: number }) => selectedFieldIds.includes(vf.id))
    .map((vf: { id: number; title: string }) => ({ id: vf.id, title: vf.title }));
  const health = evaluateSchoolHealth(
    {
      type: school.type,
      description: school.description,
      images: school.images,
      languages: school.languages,
      phone: school.phone,
      vocationalFieldCount: selectedFieldIds.length,
      facilityCount: selectedFacilityIds.length,
      scoreYears: scores.map((score) => score.year),
      quotaYears: quotas.map((quota: { year: number }) => quota.year),
    },
    {
      scoreYear: latestYear(latestScoreRow ? [latestScoreRow.year] : []),
      quotaYear: latestYear(latestQuotaRow ? [latestQuotaRow.year] : []),
    },
  );
  const scholarships = [...(sd.school_scholarships ?? [])]
    .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
    .map(mapSchoolScholarship);
  const schoolProjects = [...(sd.school_projects ?? [])]
    .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
    .map(mapSchoolProject);

  return (
    <AdminPage width="form">
      <PageHeader
        trail={[{ label: "Okullar", href: "/admin" }]}
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            {school.name}
            <Badge tone={school.isActive ? "success" : "warning"}>
              {school.isActive ? "Yayında" : "Pasif"}
            </Badge>
          </span>
        }
        description={`${school.district} · ${school.type}`}
        actions={
          publicHref ? (
            <a href={publicHref} target="_blank" rel="noopener noreferrer" className={adminButton()}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Sitede aç
            </a>
          ) : undefined
        }
      />
      <FlashBanner success={query?.success} error={query?.error} />

        <SchoolFormTabs
          school={school}
          cancelHref="/admin"
          health={health}
          submitLabel="Değişiklikleri kaydet"
          saveSchool={updateSchool}
          saveContact={updateSchoolContact}
          saveOtherInfo={updateSchoolOtherInfo}
          upsertScore={upsertSchoolScore}
          deleteScore={deleteSchoolScore}
          upsertQuota={upsertSchoolQuota}
          deleteQuota={deleteSchoolQuota}
          allFacilities={(facilitiesData ?? []).map(mapFacility)}
          selectedFacilityIds={selectedFacilityIds}
          syncFacilities={syncSchoolFacilities}
          addFacility={addSchoolFacility}
          allVocationalFields={(vocationalFieldsData ?? []).map(mapVocationalField)}
          allBranches={(branchesData ?? []).map(mapVocationalBranch)}
          selectedFieldIds={selectedFieldIds}
          selectedBranchIds={selectedBranchIds}
          syncVocational={syncSchoolVocationalFull}
          addBranch={addVocationalBranch}
          scholarships={scholarships}
          addScholarship={addSchoolScholarship}
          updateScholarship={updateSchoolScholarship}
          deleteScholarship={deleteSchoolScholarship}
          reorderScholarship={reorderSchoolScholarship}
          schoolProjects={schoolProjects}
          addProject={addSchoolProject}
          updateProject={updateSchoolProject}
          deleteProject={deleteSchoolProject}
          reorderProject={reorderSchoolProject}
          scores={scores}
          quotas={quotas}
          schoolVocationalFields={schoolVocationalFields}
        />
    </AdminPage>
  );
}

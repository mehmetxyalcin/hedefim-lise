import type { Metadata } from "next";
import { SchoolFormTabs } from "@/components/admin/SchoolFormTabs";
import {
  createSchool,
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
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { mapVocationalField, mapFacility, mapVocationalBranch } from "@/lib/supabase/public";


export const metadata: Metadata = {
  title: "Yeni okul | Yönetim",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function AdminNewSchoolPage({ searchParams }: Props) {
  const { supabase, profile } = await requireAdmin();
  const params = searchParams ? await searchParams : undefined;

  if (!profile) return <h1>Yetkisiz erişim.</h1>;

  const [
    { data: vocationalFieldsData },
    { data: facilitiesData },
    { data: branchesData },
  ] = await Promise.all([
    supabase.from("vocational_fields").select("*").order("title"),
    supabase.from("facilities").select("*").order("name"),
    supabase.from("vocational_branches").select("*").order("name"),
  ]);

  return (
    <AdminPage width="form">
      <PageHeader
        trail={[{ label: "Okullar", href: "/admin" }]}
        title="Yeni okul"
        description="Önce temel bilgileri kaydedin; diğer bölümler kayıttan sonra açılır."
      />
      <FlashBanner success={params?.success} error={params?.error} />

        <SchoolFormTabs
          cancelHref="/admin"
          submitLabel="Okulu kaydet"
          saveSchool={createSchool}
          saveContact={updateSchoolContact}
          saveOtherInfo={updateSchoolOtherInfo}
          upsertScore={upsertSchoolScore}
          deleteScore={deleteSchoolScore}
          upsertQuota={upsertSchoolQuota}
          deleteQuota={deleteSchoolQuota}
          allFacilities={(facilitiesData ?? []).map(mapFacility)}
          selectedFacilityIds={[]}
          syncFacilities={syncSchoolFacilities}
          addFacility={addSchoolFacility}
          allVocationalFields={(vocationalFieldsData ?? []).map(mapVocationalField)}
          allBranches={(branchesData ?? []).map(mapVocationalBranch)}
          selectedFieldIds={[]}
          selectedBranchIds={[]}
          syncVocational={syncSchoolVocationalFull}
          addBranch={addVocationalBranch}
          scholarships={[]}
          addScholarship={addSchoolScholarship}
          updateScholarship={updateSchoolScholarship}
          deleteScholarship={deleteSchoolScholarship}
          reorderScholarship={reorderSchoolScholarship}
          schoolProjects={[]}
          addProject={addSchoolProject}
          updateProject={updateSchoolProject}
          deleteProject={deleteSchoolProject}
          reorderProject={reorderSchoolProject}
          scores={[]}
          quotas={[]}
          schoolVocationalFields={[]}
        />
    </AdminPage>
  );
}

import Link from "next/link";
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
import { mapVocationalField, mapFacility, mapVocationalBranch } from "@/lib/supabase/public";

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
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/admin" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            Admin&apos;e dön
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            Yeni Okul
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Okul bilgilerini ekleyin.
          </p>
        </div>

        {params?.error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {params.error}
          </div>
        )}

        <SchoolFormTabs
          cancelHref="/admin"
          submitLabel="Okulu Kaydet"
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
        />
      </div>
    </div>
  );
}

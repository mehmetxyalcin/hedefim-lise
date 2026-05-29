import Link from "next/link";
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

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function AdminEditSchoolPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { supabase, profile } = await requireAdmin();
  const query = searchParams ? await searchParams : undefined;

  if (!profile) return <h1>Yetkisiz erişim.</h1>;

  const [
    { data: schoolData, error: schoolError },
    { data: vocationalFieldsData },
    { data: facilitiesData },
    { data: branchesData },
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
  ]);

  if (schoolError || !schoolData) return <h1>Okul bulunamadı.</h1>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sd = schoolData as any;

  const school = mapSchool(sd);
  const publicHref = school.isActive ? `/okullar/${school.slug}` : undefined;

  const selectedFacilityIds: string[] = (sd.school_facilities ?? []).map((f: any) => f.facility_id);
  const selectedBranchIds: string[] = (sd.school_vocational_branches ?? []).map((b: any) => b.branch_id);
  const selectedFieldIds: number[] = (sd.school_vocational_fields ?? []).map((f: any) => f.vocational_field_id);

  // school_scores'u ayrı sorgula; vocational_field_id kolonu DB'de henüz yoksa
  // (migration çalıştırılmamış) fallback olarak sütun olmadan çek.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let scoresRaw: any[] = [];
  {
    const { data: scoresWithField, error: scoresErr } = await supabase
      .from("school_scores")
      .select("id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id")
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
    .filter((vf: any) => selectedFieldIds.includes(vf.id as number))
    .map((vf: any) => ({ id: vf.id as number, title: vf.title as string }));
  const scholarships = [...(sd.school_scholarships ?? [])]
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map(mapSchoolScholarship);
  const schoolProjects = [...(sd.school_projects ?? [])]
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map(mapSchoolProject);

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/admin" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            Admin&apos;e dön
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            Okulu Düzenle
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {school.name} kaydını yönetin.
          </p>
        </div>

        {query?.error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {query.error}
          </div>
        )}
        {query?.success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {query.success}
          </div>
        )}

        <SchoolFormTabs
          key={`${school.id}:${school.updatedAt ?? ""}`}
          school={school}
          cancelHref="/admin"
          publicHref={publicHref}
          submitLabel="Değişiklikleri Kaydet"
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
      </div>
    </div>
  );
}

"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import { adminButton } from "@/components/admin/ui/Button";
import { SchoolTabRail } from "@/components/admin/school-form/SchoolTabRail";
import { SaveBarStatus } from "@/components/admin/school-form/SaveBarStatus";
import type { SchoolHealth } from "@/lib/school-health";
import { UnsavedChangesWarning } from "@/components/admin/UnsavedChangesWarning";
import type { ActionResult } from "@/app/admin/okullar/actions";
import { BasicInfoTab } from "@/components/admin/tabs/BasicInfoTab";
import { ContactTab } from "@/components/admin/tabs/ContactTab";
import { ScoresTab } from "@/components/admin/tabs/ScoresTab";
import { FacilitiesTab } from "@/components/admin/tabs/FacilitiesTab";
import { VocationalTab } from "@/components/admin/tabs/VocationalTab";
import { ScholarshipsTab } from "@/components/admin/tabs/ScholarshipsTab";
import { ProjectsTab } from "@/components/admin/tabs/ProjectsTab";
import { OtherInfoTab } from "@/components/admin/tabs/OtherInfoTab";
import type { School } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";
import type {
  Facility,
  SchoolProject,
  SchoolQuota,
  SchoolScholarship,
  SchoolScore,
  VocationalBranch,
} from "@/types/schoolDetail";

type TabId =
  | "temel"
  | "iletisim"
  | "puanlar"
  | "tesisler"
  | "meslekler"
  | "burslar"
  | "projeler"
  | "diger";

const TABS: { id: TabId; label: string }[] = [
  { id: "temel",    label: "Temel bilgiler" },
  { id: "iletisim", label: "İletişim" },
  { id: "puanlar",  label: "Puanlar ve kontenjan" },
  { id: "tesisler", label: "Tesisler" },
  { id: "meslekler",label: "Meslek alanları" },
  { id: "burslar",  label: "Burslar" },
  { id: "projeler", label: "Projeler" },
  { id: "diger",    label: "Diğer bilgiler" },
];

// Sekme 1 → tam okul kaydı  (createSchool / updateSchool)
// Sekme 2 → sadece iletişim alanları (updateSchoolContact)
// Sekme 8 → sadece other_info (updateSchoolOtherInfo)
// Sekme 3-7 → kendi mini-action form'ları
const MAIN_SAVE_TABS: TabId[] = ["temel", "iletisim", "diger"];

type ActionFn = (_prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;

type Props = {
  school?: School;
  cancelHref?: string;
  // Okulun veri sağlığı; yeni okulda yok.
  health?: SchoolHealth;
  submitLabel: string;
  // Tab 1: tam okul kaydı (createSchool / updateSchool)
  saveSchool: ActionFn;
  // Tab 2: sadece iletişim alanları
  saveContact: ActionFn;
  // Tab 8: sadece other_info
  saveOtherInfo: ActionFn;
  // Tab 3 — Puanlar & Kontenjan
  upsertScore: (formData: FormData) => void | Promise<void>;
  upsertQuota: (formData: FormData) => void | Promise<void>;
  deleteScore: (formData: FormData) => void | Promise<void>;
  deleteQuota: (formData: FormData) => void | Promise<void>;
  // Tab 4 — Tesisler
  allFacilities: Facility[];
  selectedFacilityIds: string[];
  syncFacilities: (formData: FormData) => void | Promise<void>;
  addFacility: (formData: FormData) => void | Promise<void>;
  // Tab 5 — Meslek alanları & dallar
  allVocationalFields: Pick<VocationalField, "id" | "title">[];
  allBranches: VocationalBranch[];
  selectedFieldIds: number[];
  selectedBranchIds: string[];
  syncVocational: (formData: FormData) => void | Promise<void>;
  addBranch: (formData: FormData) => void | Promise<void>;
  // Tab 6 — Burslar
  scholarships: SchoolScholarship[];
  addScholarship: (formData: FormData) => void | Promise<void>;
  updateScholarship: (formData: FormData) => void | Promise<void>;
  deleteScholarship: (formData: FormData) => void | Promise<void>;
  reorderScholarship: (formData: FormData) => void | Promise<void>;
  // Tab 7 — Projeler
  schoolProjects: SchoolProject[];
  addProject: (formData: FormData) => void | Promise<void>;
  updateProject: (formData: FormData) => void | Promise<void>;
  deleteProject: (formData: FormData) => void | Promise<void>;
  reorderProject: (formData: FormData) => void | Promise<void>;
  // Puan / kota verileri (okuma için)
  scores: SchoolScore[];
  quotas: SchoolQuota[];
  schoolVocationalFields: { id: number; title: string }[];
};

export function SchoolFormTabs({
  school,
  cancelHref = "/admin",
  health,
  submitLabel,
  saveSchool,
  saveContact,
  saveOtherInfo,
  upsertScore,
  upsertQuota,
  deleteScore,
  deleteQuota,
  allFacilities,
  selectedFacilityIds,
  syncFacilities,
  addFacility,
  allVocationalFields,
  allBranches,
  selectedFieldIds,
  selectedBranchIds,
  syncVocational,
  addBranch,
  scholarships,
  addScholarship,
  updateScholarship,
  deleteScholarship,
  reorderScholarship,
  schoolProjects,
  addProject,
  updateProject,
  deleteProject,
  reorderProject,
  scores,
  quotas,
  schoolVocationalFields,
}: Props) {
  const router = useRouter();

  const [temelState, temelDispatch] = useActionState(saveSchool, null);
  const [iletisimState, iletisimDispatch] = useActionState(saveContact, null);
  const [digerState, digerDispatch] = useActionState(saveOtherInfo, null);

  // Başarılı kayıt sonrası server component verilerini yenile
  useEffect(() => {
    if (temelState?.success || iletisimState?.success || digerState?.success) {
      router.refresh();
    }
  }, [temelState, iletisimState, digerState, router]);

  // Kayıt sonucu UnsavedChangesWarning'e bildirilir: hata dönerse taslak yine
  // kaydedilmemiş sayılır ve ayrılma uyarısı devreye girer.
  useEffect(() => {
    for (const state of [temelState, iletisimState, digerState]) {
      if (state) {
        window.dispatchEvent(
          new window.CustomEvent("admin-form-settled", { detail: { success: state.success } }),
        );
      }
    }
  }, [temelState, iletisimState, digerState]);

  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId | null) ?? "temel";
  const isMainSaveTab = MAIN_SAVE_TABS.includes(activeTab);

  function mainSaveAction() {
    if (activeTab === "iletisim") return iletisimDispatch;
    if (activeTab === "diger") return digerDispatch;
    return temelDispatch;
  }

  function activeState() {
    if (activeTab === "iletisim") return iletisimState;
    if (activeTab === "diger") return digerState;
    return temelState;
  }

  function tabHref(id: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    return `?${params.toString()}`;
  }

  const lockedTabs = school
    ? []
    : TABS.filter((tab) => !MAIN_SAVE_TABS.includes(tab.id)).map((tab) => tab.id);
  const current = activeState();

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <SchoolTabRail
        tabs={TABS}
        activeTab={activeTab}
        hrefFor={(id) => tabHref(id as TabId)}
        health={health}
        lockedTabs={lockedTabs}
      />

      <div className="min-w-0 space-y-6">
        {/* Ana form (Tab 1, 2, 8 için) */}
        {isMainSaveTab && (
          <form onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const dispatch = mainSaveAction();
            startTransition(() => dispatch(data));
          }} action={mainSaveAction()} data-admin-school-form="true" className="space-y-6">
            <UnsavedChangesWarning />
            {school && <input type="hidden" name="id" value={school.id} />}
            {school && <input type="hidden" name="school_id" value={school.id} />}

            {activeTab === "temel"    && <BasicInfoTab school={school} />}
            {activeTab === "iletisim" && <ContactTab school={school} />}
            {activeTab === "diger"    && <OtherInfoTab school={school} />}

            {current?.success === false && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                {current.message}
              </div>
            )}

            {/* Yapışkan kayıt çubuğu */}
            <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-xl border border-admin-line bg-white px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <SaveBarStatus success={current?.success === true ? current.message : null} />
              <div className="flex shrink-0 gap-2">
                <Link href={cancelHref} className={adminButton()}>
                  İptal
                </Link>
                <AdminSubmitButton label={submitLabel} />
              </div>
            </div>
          </form>
        )}

        {/* Mini-action tab'ları (3-7) — kendi form'larını içeriyor */}
        {activeTab === "puanlar" && school && (
          <ScoresTab
            schoolId={school.id}
            scores={scores}
            quotas={quotas}
            schoolVocationalFields={schoolVocationalFields}
            schoolPrograms={school.programs ?? []}
            upsertScore={upsertScore}
            upsertQuota={upsertQuota}
            deleteScore={deleteScore}
            deleteQuota={deleteQuota}
          />
        )}

        {activeTab === "tesisler" && school && (
          <FacilitiesTab
            schoolId={school.id}
            allFacilities={allFacilities}
            selectedFacilityIds={selectedFacilityIds}
            syncFacilities={syncFacilities}
            addFacility={addFacility}
          />
        )}

        {activeTab === "meslekler" && school && (
          <VocationalTab
            schoolId={school.id}
            allFields={allVocationalFields}
            allBranches={allBranches}
            selectedFieldIds={selectedFieldIds}
            selectedBranchIds={selectedBranchIds}
            syncVocational={syncVocational}
            addBranch={addBranch}
          />
        )}

        {activeTab === "burslar" && school && (
          <ScholarshipsTab
            schoolId={school.id}
            scholarships={scholarships}
            addScholarship={addScholarship}
            updateScholarship={updateScholarship}
            deleteScholarship={deleteScholarship}
            reorderScholarship={reorderScholarship}
          />
        )}

        {activeTab === "projeler" && school && (
          <ProjectsTab
            schoolId={school.id}
            projects={schoolProjects}
            addProject={addProject}
            updateProject={updateProject}
            deleteProject={deleteProject}
            reorderProject={reorderProject}
          />
        )}

        {/* Yeni okul oluştururken 3-7 sekmeleri kilitli */}
        {!school && !isMainSaveTab && (
          <div className="rounded-xl border border-admin-line bg-white px-6 py-10 text-center shadow-admin-card">
            <p className="text-sm font-semibold text-admin-ink">
              Bu bölüm okul kaydedildikten sonra açılır.
            </p>
            <p className="mt-1 text-sm text-admin-muted">
              Önce &quot;Temel bilgiler&quot; bölümünü kaydedin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

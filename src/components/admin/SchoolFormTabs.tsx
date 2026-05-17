"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import { UnsavedChangesWarning } from "@/components/admin/UnsavedChangesWarning";
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
  { id: "temel",    label: "Temel Bilgiler" },
  { id: "iletisim", label: "İletişim" },
  { id: "puanlar",  label: "Puanlar & Kontenjan" },
  { id: "tesisler", label: "Tesisler" },
  { id: "meslekler",label: "Meslek Alanları" },
  { id: "burslar",  label: "Burs İmkânları" },
  { id: "projeler", label: "Projeler" },
  { id: "diger",    label: "Diğer Bilgiler" },
];

// Sekme 1 → tam okul kaydı  (createSchool / updateSchool)
// Sekme 2 → sadece iletişim alanları (updateSchoolContact)
// Sekme 8 → sadece other_info (updateSchoolOtherInfo)
// Sekme 3-7 → kendi mini-action form'ları
const MAIN_SAVE_TABS: TabId[] = ["temel", "iletisim", "diger"];

type Props = {
  school?: School;
  cancelHref?: string;
  publicHref?: string;
  submitLabel: string;
  // Tab 1: tam okul kaydı (createSchool / updateSchool)
  saveSchool: (formData: FormData) => void | Promise<void>;
  // Tab 2: sadece iletişim alanları
  saveContact: (formData: FormData) => void | Promise<void>;
  // Tab 8: sadece other_info
  saveOtherInfo: (formData: FormData) => void | Promise<void>;
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
  publicHref,
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
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId | null) ?? "temel";
  const isMainSaveTab = MAIN_SAVE_TABS.includes(activeTab);

  function mainSaveAction() {
    if (activeTab === "iletisim") return saveContact;
    if (activeTab === "diger") return saveOtherInfo;
    return saveSchool;
  }

  function tabHref(id: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    return `?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* Tab çubuğu */}
      <div className="hide-scrollbar overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <nav className="flex min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={tabHref(tab.id)}
                className={`relative whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Ana form (Tab 1, 2, 8 için) */}
      {isMainSaveTab && (
        <form action={mainSaveAction()} data-admin-school-form="true" className="space-y-6">
          <UnsavedChangesWarning />
          {school && <input type="hidden" name="id" value={school.id} />}
          {school && <input type="hidden" name="school_id" value={school.id} />}

          {activeTab === "temel"    && <BasicInfoTab school={school} />}
          {activeTab === "iletisim" && <ContactTab school={school} />}
          {activeTab === "diger"    && <OtherInfoTab school={school} />}

          {/* Kayıt / İptal barı */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {school
                  ? "Kaydettiğinizde admin listesi ve public sayfalar yeniden doğrulanır."
                  : "Kaydettiğinizde yeni okul admin listesine eklenir."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {publicHref && (
                  <Link
                    href={publicHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Public sayfayı aç
                  </Link>
                )}
                <Link
                  href={cancelHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  İptal
                </Link>
                <FormSubmitButton label={submitLabel} />
              </div>
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-700">
            Bu sekme yalnızca okul kaydedildikten sonra kullanılabilir.
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Önce "Temel Bilgiler" sekmesinden okulu kaydedin.
          </p>
        </div>
      )}
    </div>
  );
}

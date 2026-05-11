import type { SchoolWithDetails } from "@/types/schoolDetail";
import { SchoolHero } from "./SchoolHero";
import { SchoolInfoRibbon } from "./SchoolInfoRibbon";
import { SchoolAbout } from "./SchoolAbout";
import { SchoolFacilities } from "./SchoolFacilities";
import { VocationalAccordion } from "./VocationalAccordion";
import { SchoolScoreCard } from "./SchoolScoreCard";
import { SchoolQuotaCard } from "./SchoolQuotaCard";
import { SchoolScholarships } from "./SchoolScholarships";
import { SchoolProjects } from "./SchoolProjects";
import { SchoolContact } from "./SchoolContact";
import { SchoolTransportation } from "./SchoolTransportation";
import { SchoolOtherInfo } from "./SchoolOtherInfo";

type Props = { school: SchoolWithDetails };

export function SchoolDetail({ school }: Props) {
  // SchoolScoreCard snake_case bekliyor; SchoolWithDetails camelCase döndürür
  const scores = school.scores.map((s) => ({
    year: s.year,
    obp_score: s.obpScore,
    lgs_score: s.lgsScore,
    percentile: s.percentile,
  }));

  // SchoolQuotaCard snake_case bekliyor
  const quotas = school.quotas.map((q) => ({
    year: q.year,
    sinavli_count: q.sinavliCount,
    sinavsiz_count: q.sinavsizCount,
  }));

  // SchoolScholarships snake_case bekliyor
  const scholarships = school.scholarships.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    amount_info: s.amountInfo,
  }));

  // SchoolProjects snake_case bekliyor
  const projects = school.schoolProjects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    image_url: p.imageUrl,
    link_url: p.linkUrl,
  }));

  // VocationalAccordion: id string, name=title, branches=selectedBranches
  const vocationalFields = school.vocationalFieldsWithBranches.map((f) => ({
    id: String(f.id),
    name: f.title,
    branches: f.selectedBranches.map((b) => ({ id: b.id, name: b.name })),
  }));

  return (
    <div>
      {/* Hero */}
      <SchoolHero school={school} />

      <div className="container mx-auto max-w-6xl px-4">
        {/* Bilgi Şeridi */}
        <div className="mb-8 mt-6">
          <SchoolInfoRibbon school={school} />
        </div>

        {/* Ana İçerik Grid */}
        <div className="grid grid-cols-1 gap-6 pb-24 lg:grid-cols-3 lg:pb-8">
          {/* Sol Sütun */}
          <div className="space-y-6 lg:col-span-2">
            <SchoolAbout description={school.description} />
            <SchoolFacilities facilities={school.facilities} />
            <VocationalAccordion fields={vocationalFields} />
            <SchoolScholarships scholarships={scholarships} />
            <SchoolProjects projects={projects} />
            <SchoolTransportation transportation_info={school.transportationInfo} />
            <SchoolContact
              address={school.address}
              phone={school.phone}
              website={school.website}
            />
            <SchoolOtherInfo other_info={school.otherInfo} />
          </div>

          {/* Sağ Sütun — masaüstünde sticky */}
          <div className="hidden flex-col gap-4 lg:sticky lg:top-24 lg:flex lg:self-start">
            <SchoolScoreCard scores={scores} />
            <SchoolQuotaCard quotas={quotas} />
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              ☆ Tercihe Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Mobil: Sağ sütun içeriği altta */}
      <div className="container mx-auto max-w-6xl space-y-4 px-4 pb-24 lg:hidden">
        <SchoolScoreCard scores={scores} />
        <SchoolQuotaCard quotas={quotas} />
      </div>

      {/* Mobil: Sabit alt buton */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg lg:hidden">
        <button
          type="button"
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          ☆ Tercihe Ekle
        </button>
      </div>
    </div>
  );
}

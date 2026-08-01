import React from "react";
import { BookOpen, Building, Clock, GraduationCap, Hash, Users, ChevronLeft, ChevronRight } from "lucide-react";
import type { SchoolWithDetails } from "@/types/schoolDetail";

type Props = { school: SchoolWithDetails };

const BOARDING_LABELS: Record<string, string> = {
  yok: "Pansiyon Yok",
  kiz: "Kız Pansiyonu",
  erkek: "Erkek Pansiyonu",
  kiz_erkek: "Kız/Erkek Pansiyon",
};

type InfoItem = {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
};

export function SchoolInfoRibbon({ school }: Props) {
  const items: InfoItem[] = [];

  // 1. Okul Türü — her zaman
  items.push({
    icon: <GraduationCap className="h-5 w-5 text-blue-600" />,
    label: "Okul Türü",
    value: school.type,
  });

  // 2. Yerleştirme Türü
  if (school.placementType) {
    items.push({
      icon: <BookOpen className="h-5 w-5 text-blue-600" />,
      label: "Yerleştirme",
      value: ({ yerel: "Yerel Yerleştirme", merkezi: "Merkezi Yerleştirme", yerel_merkezi: "Yerel ve Merkezi" } as Record<string, string>)[school.placementType] ?? "Yerel Yerleştirme",
    });
  }

  // 3. Öğretim Şekli
  if (school.educationType) {
    items.push({
      icon: <Users className="h-5 w-5 text-blue-600" />,
      label: "Öğretim",
      value: school.educationType === "normal" ? "Normal Öğretim" : "İkili Öğretim",
    });
  }

  // 4. Pansiyon — her zaman göster
  if (school.boardingType) {
    const boardingLabel = BOARDING_LABELS[school.boardingType];
    if (boardingLabel) {
      items.push({
        icon: <Building className="h-5 w-5 text-blue-600" />,
        label: "Pansiyon",
        value: boardingLabel,
      });
    }
  }

  // 5. Okul Saatleri — ikisi de doluysa
  if (school.schoolHoursStart && school.schoolHoursEnd) {
    const fmt = (t: string) => t.slice(0, 5);
    items.push({
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      label: "Okul Saatleri",
      value: `${fmt(school.schoolHoursStart)} - ${fmt(school.schoolHoursEnd)}`,
      note: school.schoolHoursNote ?? undefined,
    });
  }

  // 6. Kurum Kodu — yalnızca doluysa
  if (school.institutionCode) {
    items.push({
      icon: <Hash className="h-5 w-5 text-blue-600" />,
      label: "Kurum Kodu",
      value: school.institutionCode,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md md:p-6">
      <div className="relative">
        {/* Sağ fade — sağda içerik olduğunu gösterir */}
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-white to-transparent lg:hidden" />

        <div className="hide-scrollbar overflow-x-auto">
          <div className="flex min-w-max items-stretch gap-4">
            {items.map((item, index) => (
              <React.Fragment key={item.label}>
                <div className="flex min-w-[120px] flex-col items-center gap-1.5 rounded-xl bg-slate-50 px-6 py-3">
                  {item.icon}
                  <span className="whitespace-nowrap text-xs text-slate-500">{item.label}</span>
                  <span className="whitespace-nowrap text-center text-sm font-semibold text-slate-800">
                    {item.value}
                  </span>
                  {item.note && (
                    <p className="mt-1 text-xs italic text-slate-400">{item.note}</p>
                  )}
                </div>
                {index < items.length - 1 && (
                  <div className="h-12 w-px self-center bg-slate-200" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Kaydırma ipucu — mobilde, kartlar taşıyorsa anlamlı */}
      <div className="mt-2 flex items-center justify-center gap-1 lg:hidden">
        <ChevronLeft className="h-3 w-3 text-slate-400" />
        <span className="text-xs text-slate-400">kaydırın</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
      </div>
    </div>
  );
}

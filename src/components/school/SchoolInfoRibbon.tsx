import React from "react";
import { BookOpen, Building, Clock, GraduationCap, Hash, Users } from "lucide-react";
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
      value: school.placementType === "yerel" ? "Yerel Yerleştirme" : "Merkezi Yerleştirme",
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
    items.push({
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      label: "Okul Saatleri",
      value: `${school.schoolHoursStart} - ${school.schoolHoursEnd}`,
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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md md:p-6">
      <div className="hide-scrollbar overflow-x-auto">
        <div className="flex min-w-max items-stretch gap-4">
          {items.map((item, index) => (
            <React.Fragment key={item.label}>
              <div
                className="flex min-w-[120px] flex-col items-center gap-1.5 rounded-xl bg-gray-50 px-6 py-3"
              >
                {item.icon}
                <span className="whitespace-nowrap text-xs text-gray-500">{item.label}</span>
                <span className="whitespace-nowrap text-center text-sm font-semibold text-gray-800">
                  {item.value}
                </span>
                {item.note && (
                  <p className="mt-1 text-xs italic text-gray-400">{item.note}</p>
                )}
              </div>
              {index < items.length - 1 && (
                <div className="h-12 w-px self-center bg-gray-200" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

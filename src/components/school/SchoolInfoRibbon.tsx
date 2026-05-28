"use client";

import React, { useRef, useState, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    window?.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window?.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });

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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md md:p-6">
      <div className="relative">
        {/* Sol ok */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            aria-label="Sola kaydır"
            className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-50 lg:hidden"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="hide-scrollbar overflow-x-auto scroll-smooth px-2"
        >
          <div className="flex min-w-max items-stretch gap-4">
            {items.map((item, index) => (
              <React.Fragment key={item.label}>
                <div className="flex min-w-[120px] flex-col items-center gap-1.5 rounded-xl bg-gray-50 px-6 py-3">
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

        {/* Sağ ok */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            aria-label="Sağa kaydır"
            className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-50 lg:hidden"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}

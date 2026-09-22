"use client";

import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";
import { useState } from "react";
import { BasicUploadWizard } from "@/components/admin/bulk-upload/BasicUploadWizard";
import { VocationalUploadWizard } from "@/components/admin/bulk-upload/VocationalUploadWizard";
import { ScoreUploadWizard } from "@/components/admin/bulk-upload/ScoreUploadWizard";
import { FacilityUploadWizard } from "@/components/admin/bulk-upload/FacilityUploadWizard";

// ─── Root component (mod seçici) ─────────────────────────────────

export function BulkUploadWizard() {
  const [mode, setMode] = useState<"basic" | "vocational" | "scores" | "facilities">("basic");

  const modes = [
    {
      key: "basic" as const,
      label: "Temel bilgiler",
      sheet: "Okullar",
      body: "Kurum koduyla eşleşen okulları günceller, yenilerini pasif olarak ekler.",
    },
    {
      key: "vocational" as const,
      label: "Meslek alanları ve dallar",
      sheet: "Meslek Alanları",
      body: "Okulların alan ve dal ilişkilerini değiştirir.",
    },
    {
      key: "scores" as const,
      label: "Puanlar",
      sheet: "Puan Bilgileri",
      body: "Yıllık OBP, LGS ve yüzdelik değerlerini yazar; boş hücre mevcut değeri korur.",
    },
    {
      key: "facilities" as const,
      label: "Tesisler",
      sheet: "Tesisler",
      body: "Okulların tesis ilişkilerini değiştirir; bilinmeyen tesis o okulu durdurur.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Mod seçici: hangi Excel sayfasının yükleneceği */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Yükleme türü">
        {modes.map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(m.key)}
              className={cn(
                "rounded-xl border bg-white p-4 text-left transition-colors duration-150",
                active
                  ? "border-admin-accent ring-2 ring-admin-accent/20"
                  : "border-admin-line hover:border-admin-line-strong",
                adminFocus,
              )}
            >
              <span className={cn("block text-sm font-bold", active ? "text-admin-tint-ink" : "text-admin-ink")}>
                {m.label}
              </span>
              <span className="mt-0.5 block text-xs text-admin-muted">Excel sayfası: {m.sheet}</span>
              <span className="mt-2 block text-[13px] leading-snug text-admin-body">{m.body}</span>
            </button>
          );
        })}
      </div>

      {mode === "basic" && <BasicUploadWizard />}
      {mode === "vocational" && <VocationalUploadWizard />}
      {mode === "scores" && <ScoreUploadWizard />}
      {mode === "facilities" && <FacilityUploadWizard />}
    </div>
  );
}

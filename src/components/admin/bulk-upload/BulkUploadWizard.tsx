"use client";

import { useState } from "react";
import { BasicUploadWizard } from "@/components/admin/bulk-upload/BasicUploadWizard";
import { VocationalUploadWizard } from "@/components/admin/bulk-upload/VocationalUploadWizard";
import { ScoreUploadWizard } from "@/components/admin/bulk-upload/ScoreUploadWizard";
import { FacilityUploadWizard } from "@/components/admin/bulk-upload/FacilityUploadWizard";

// ─── Root component (mod seçici) ─────────────────────────────────

export function BulkUploadWizard() {
  const [mode, setMode] = useState<"basic" | "vocational" | "scores" | "facilities">("basic");

  const tabs = [
    { key: "basic" as const, label: "Temel Bilgiler" },
    { key: "vocational" as const, label: "Meslek Alanları ve Dallar" },
    { key: "scores" as const, label: "Puan Bilgileri" },
    { key: "facilities" as const, label: "Tesisler" },
  ];

  return (
    <div className="space-y-6">
      {/* Mod seçici */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              mode === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "basic" && <BasicUploadWizard />}
      {mode === "vocational" && <VocationalUploadWizard />}
      {mode === "scores" && <ScoreUploadWizard />}
      {mode === "facilities" && <FacilityUploadWizard />}
    </div>
  );
}

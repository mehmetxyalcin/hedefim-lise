"use client";

import { cn } from "@/lib/cn";
// Toplu yükleme sihirbazlarının ortak parçaları: adım göstergesi, sayaç rozeti, dosya alanı.
import { Upload } from "lucide-react";

// ─── Shared sub-components ───────────────────────────────────────

export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Dosya", "Önizleme", "Sonuç"];
  return (
    <ol className="flex items-start gap-2" aria-label={`Adım ${step} / 3`}>
      {steps.map((label, index) => {
        const id = index + 1;
        const state = id < step ? "done" : id === step ? "current" : "todo";
        return (
          <li
            key={label}
            className="flex flex-1 flex-col gap-1.5"
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className={cn("h-1 rounded-full", state === "todo" ? "bg-admin-line" : "bg-admin-accent")} />
            <span className={cn("text-xs", state === "current" ? "font-semibold text-admin-ink" : "text-admin-muted")}>
              {id}. {label}
              {state === "done" && <span className="sr-only"> (tamamlandı)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Pill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "slate" | "green" | "yellow" | "red";
}) {
  const colorMap = {
    slate: "bg-admin-line-soft text-admin-body",
    green: "bg-emerald-50 text-emerald-800",
    yellow: "bg-amber-50 text-amber-800",
    red: "bg-rose-50 text-rose-800",
  };
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums ${colorMap[color]}`}>
      {label}: {count}
    </span>
  );
}

export function UploadDropzone({
  onFile,
  parseError,
  isDragging,
  setIsDragging,
  fileInputRef,
  hint,
}: {
  onFile: (file: File) => void;
  parseError: string | null;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  hint: string;
}) {
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-admin-accent bg-admin-tint"
            : "border-admin-line hover:border-admin-accent-soft hover:bg-admin-ground"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <Upload className="mx-auto mb-4 h-12 w-12 text-admin-faint" />
        <p className="mb-2 text-base font-semibold text-admin-body">
          Dosyayı buraya sürükleyin veya tıklayın
        </p>
        <p className="text-sm text-admin-faint">{hint}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {parseError && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {parseError}
        </p>
      )}
    </>
  );
}

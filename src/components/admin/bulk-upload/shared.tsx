"use client";

// Toplu yükleme sihirbazlarının ortak parçaları: adım göstergesi, sayaç rozeti, dosya alanı.
import { Upload } from "lucide-react";

// ─── Shared sub-components ───────────────────────────────────────

export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { id: 1 as const, label: "Dosya Yükle" },
    { id: 2 as const, label: "Önizleme" },
    { id: 3 as const, label: "Sonuç" },
  ];
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              s.id < step
                ? "bg-emerald-500 text-white"
                : s.id === step
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-500"
            }`}
          >
            {s.id < step ? "✓" : s.id}
          </div>
          <span
            className={`ml-2 text-sm font-medium ${
              s.id === step ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="mx-4 h-px w-8 bg-slate-200" />}
        </div>
      ))}
    </div>
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
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorMap[color]}`}>
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
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
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
        <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
        <p className="mb-2 text-base font-semibold text-slate-700">
          Dosyayı buraya sürükleyin veya tıklayın
        </p>
        <p className="text-sm text-slate-400">{hint}</p>
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

"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type LogoUploadFieldProps = {
  currentLogoUrl?: string | null;
  logoAlt?: string;
};

export function LogoUploadField({
  currentLogoUrl,
  logoAlt = "Site Logosu",
}: LogoUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setPreviewUrl(null);
      setSelectedFileName("");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFileName(file.name);
  }

  function clearSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const displayUrl = previewUrl ?? currentLogoUrl;

  return (
    <div className="space-y-4">
      <input type="hidden" name="current_logo_url" value={currentLogoUrl ?? ""} />

      {displayUrl && (
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Image
              src={displayUrl}
              alt={logoAlt}
              fill
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">
              {previewUrl ? "Yeni logo seçildi" : "Mevcut logo"}
            </p>
            {previewUrl && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {selectedFileName}
              </p>
            )}
            {!previewUrl && (
              <p className="mt-0.5 text-xs text-slate-500">
                Yeni dosya seçerseniz mevcut logonun yerine geçer.
              </p>
            )}
          </div>
          {previewUrl && (
            <button
              type="button"
              onClick={clearSelection}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white"
            >
              Seçimi kaldır
            </button>
          )}
        </div>
      )}

      {!displayUrl && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700">Henüz logo yok</p>
          <p className="mt-1 text-xs text-slate-500">
            Logo yoksa navbar'da varsayılan ikon gösterilir.
          </p>
        </div>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          {currentLogoUrl ? "Logoyu değiştir" : "Logo yükle"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          name="logo_file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleFileChange}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        <span className="mt-2 block text-xs text-slate-500">
          PNG, JPG, SVG veya WebP. En fazla 2 MB.
        </span>
      </label>
    </div>
  );
}

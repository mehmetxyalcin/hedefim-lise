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
        <div className="flex items-center gap-4 rounded-xl border border-admin-line bg-admin-ground p-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-admin-line bg-white">
            <Image
              src={displayUrl}
              alt={logoAlt}
              fill
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-admin-ink">
              {previewUrl ? "Yeni logo seçildi" : "Mevcut logo"}
            </p>
            {previewUrl && (
              <p className="mt-0.5 truncate text-xs text-admin-muted">
                {selectedFileName}
              </p>
            )}
            {!previewUrl && (
              <p className="mt-0.5 text-xs text-admin-muted">
                Yeni dosya seçerseniz mevcut logonun yerine geçer.
              </p>
            )}
          </div>
          {previewUrl && (
            <button
              type="button"
              onClick={clearSelection}
              className="shrink-0 rounded-lg border border-admin-line px-3 py-2 text-sm font-semibold text-admin-body transition-colors hover:bg-white"
            >
              Seçimi kaldır
            </button>
          )}
        </div>
      )}

      {!displayUrl && (
        <div className="rounded-xl border border-dashed border-admin-line-strong bg-admin-ground px-4 py-6 text-center">
          <p className="text-sm font-semibold text-admin-body">Henüz logo yok</p>
          <p className="mt-1 text-xs text-admin-muted">
            Logo yoksa navbar&apos;da varsayılan ikon gösterilir.
          </p>
        </div>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-admin-body">
          {currentLogoUrl ? "Logoyu değiştir" : "Logo yükle"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          name="logo_file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleFileChange}
          className="w-full rounded-xl border border-admin-line bg-white px-4 py-3 text-admin-ink outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-admin-line-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-admin-body focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
        />
        <span className="mt-2 block text-xs text-admin-muted">
          PNG, JPG, SVG veya WebP. En fazla 2 MB.
        </span>
      </label>
    </div>
  );
}

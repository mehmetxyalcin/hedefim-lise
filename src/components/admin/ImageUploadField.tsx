"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

type ImageUploadFieldProps = {
  currentImage?: string;
  schoolName?: string;
};

export function ImageUploadField({
  currentImage,
  schoolName = "Okul görseli",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl(null);
      setSelectedFileName("");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFileName(file.name);
    setRemoveImage(false);
  }

  function clearSelectedFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setSelectedFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="current_image" value={currentImage ?? ""} />

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-admin-accent-soft bg-admin-tint">
          <div
            className="h-56 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${previewUrl})` }}
            role="img"
            aria-label="Seçilen yeni okul görseli önizlemesi"
          />
          <div className="border-t border-admin-tint bg-white px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-admin-ink">
                  Yeni görsel seçildi
                </p>
                <p className="mt-1 text-xs text-admin-muted">
                  {selectedFileName} kaydedildiğinde mevcut görselin yerine geçer.
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelectedFile}
                className="rounded-xl border border-admin-line px-3 py-2 text-sm font-semibold text-admin-body transition-colors hover:bg-admin-ground"
              >
                Seçimi kaldır
              </button>
            </div>
          </div>
        </div>
      ) : currentImage ? (
        <div className="overflow-hidden rounded-xl border border-admin-line bg-admin-ground">
          <div className="relative h-56 w-full bg-admin-line-soft">
            <Image
              src={currentImage}
              alt={schoolName}
              fill
              sizes="(min-width: 768px) 720px, 100vw"
              className={`object-cover transition-opacity ${
                removeImage ? "opacity-35 grayscale" : "opacity-100"
              }`}
            />
            {removeImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/55 text-sm font-bold text-admin-body">
                Kaydedince mevcut görsel kaldırılacak
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 border-t border-admin-line bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-admin-ink">Mevcut görsel</p>
              <p className="text-xs text-admin-muted">
                Yeni dosya seçerseniz mevcut görselin yerine geçer.
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              <input
                type="checkbox"
                name="remove_image"
                checked={removeImage}
                disabled={Boolean(previewUrl)}
                onChange={(event) => setRemoveImage(event.target.checked)}
                className="h-4 w-4"
              />
              Görseli kaldır
            </label>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-admin-line-strong bg-admin-ground px-4 py-8 text-center">
          <p className="text-sm font-semibold text-admin-body">Henüz görsel yok</p>
          <p className="mt-1 text-xs text-admin-muted">
            Okul detay sayfası için geniş bir kapak görseli yükleyin.
          </p>
        </div>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-admin-body">
          {currentImage ? "Görseli değiştir" : "Okul görseli yükle"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          name="image_file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full rounded-xl border border-admin-line bg-white px-4 py-3 text-admin-ink outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-admin-line-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-admin-body focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
        />
        <span className="mt-2 block text-xs text-admin-muted">
          JPG, PNG veya WebP kullanabilirsiniz. En fazla 5 MB. Yeni dosya
          seçilirse kaldırma seçimi dikkate alınmaz.
        </span>
      </label>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { School } from "@/types/school";
import { adminInput } from "@/components/admin/ui/styles";

const textareaCls = adminInput;

type Props = { school?: School };

export function OtherInfoTab({ school }: Props) {
  const [preview, setPreview] = useState(false);
  const [value, setValue] = useState(school?.otherInfo ?? "");

  return (
    <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
      <div className="mb-5 border-b border-admin-line-soft pb-4">
        <h2 className="text-base font-bold text-admin-ink">Diğer bilgiler</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Serbest metin alanı. Markdown desteklenir.
        </p>
      </div>

      <div className="mb-3 inline-flex gap-1 rounded-lg border border-admin-line p-1" role="group" aria-label="Görünüm">
        <button
          type="button"
          onClick={() => setPreview(false)}
          aria-pressed={!preview}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            !preview
              ? "bg-admin-tint text-admin-tint-ink"
              : "text-admin-body hover:bg-admin-line-soft"
          }`}
        >
          Düzenle
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          aria-pressed={preview}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            preview
              ? "bg-admin-tint text-admin-tint-ink"
              : "text-admin-body hover:bg-admin-line-soft"
          }`}
        >
          Önizle
        </button>
      </div>

      {preview ? (
        <div className="min-h-[200px] rounded-xl border border-admin-line bg-admin-ground px-4 py-3">
          {value ? (
            <pre className="whitespace-pre-wrap text-sm text-admin-body">{value}</pre>
          ) : (
            <p className="text-sm text-admin-faint">İçerik yok.</p>
          )}
        </div>
      ) : (
        <textarea
          name="other_info"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={12}
          placeholder="Okul hakkında ek bilgiler, duyurular, özel notlar…"
          className={textareaCls}
        />
      )}
      {/* Önizleme modunda da name="other_info" gönderilmesi için hidden input */}
      {preview && <input type="hidden" name="other_info" value={value} />}
    </section>
  );
}

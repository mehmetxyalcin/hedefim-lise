"use client";

import { useState } from "react";
import type { School } from "@/types/school";

const textareaCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type Props = { school?: School };

export function OtherInfoTab({ school }: Props) {
  const [preview, setPreview] = useState(false);
  const [value, setValue] = useState(school?.otherInfo ?? "");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900">Diğer Bilgiler</h2>
        <p className="mt-1 text-sm text-slate-500">
          Serbest metin alanı. Markdown desteklenir.
        </p>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            !preview
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Düzenle
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            preview
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Önizle
        </button>
      </div>

      {preview ? (
        <div className="min-h-[200px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          {value ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-700">{value}</pre>
          ) : (
            <p className="text-sm text-slate-400">İçerik yok.</p>
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

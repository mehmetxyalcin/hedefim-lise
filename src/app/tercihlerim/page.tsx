"use client";

import Link from "next/link";
import { Star, ChevronUp, ChevronDown, X, MapPin, Printer } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export default function TercihlerimPage() {
  const { favorites, removeFavorite, moveUp, moveDown, clearAll } =
    useFavorites();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Başlık */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Tercih Listem
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {favorites.length} okul listelendi
            </p>
          </div>
          <div className="no-print flex shrink-0 gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Yazdır
            </button>
            {favorites.length > 0 && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                Listeyi Temizle
              </button>
            )}
          </div>
        </div>

        {/* Boş durum */}
        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm">
            <Star className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600">
              Henüz tercih eklemediniz
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Okul detay sayfalarından okul ekleyebilirsiniz
            </p>
            <Link
              href="/okullar"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Okullara Göz At
            </Link>
          </div>
        ) : (
          <div className="print-title space-y-3">
            {favorites.map((school, index) => (
              <div
                key={school.id}
                className="favorite-card flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                {/* Sıra numarası */}
                <div className="order-number mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {index + 1}
                </div>

                {/* Okul bilgileri */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/okullar/${school.slug}`}
                    className="line-clamp-1 text-base font-semibold text-slate-900 transition-colors hover:text-blue-600"
                  >
                    {school.name}
                  </Link>

                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {school.district}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      {school.school_type}
                    </span>
                  </div>

                  {school.scores && school.scores.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {school.scores.map((score, i) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <span className="min-w-[80px] text-xs text-slate-500">
                            {score.vocational_field_name ?? "Okul Geneli"}:
                          </span>

                          {score.percentile != null &&
                            score.percentile > 0 && (
                              <span className="score-badge rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                                %{score.percentile.toFixed(2)} Yüzdelik
                              </span>
                            )}

                          {score.obp_score != null &&
                            score.obp_score > 0 && (
                              <span className="score-badge rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                OBP: {score.obp_score.toFixed(2)}
                              </span>
                            )}

                          {score.lgs_score != null &&
                            score.lgs_score > 0 && (
                              <span className="score-badge rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                LGS: {score.lgs_score.toFixed(2)}
                              </span>
                            )}

                          <span className="text-xs text-slate-400">
                            ({score.year})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sıralama butonları */}
                <div className="no-print flex shrink-0 flex-col gap-1 pt-0.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="rounded-lg p-1.5 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Yukarı taşı"
                  >
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === favorites.length - 1}
                    className="rounded-lg p-1.5 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Aşağı taşı"
                  >
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                {/* Sil butonu */}
                <button
                  onClick={() => removeFavorite(school.id)}
                  className="no-print shrink-0 rounded-lg p-2 pt-2.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Listeden çıkar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

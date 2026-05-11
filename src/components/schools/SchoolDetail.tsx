"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe,
  Home,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { VocationalFieldIcon } from "@/lib/vocational-icons";
import type { School } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";

type SchoolDetailProps = {
  school: School;
  vocationalFields: VocationalField[];
};

function getHeroGradient(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("meslek") || t.includes("teknik")) {
    return "from-blue-700 via-indigo-700 to-purple-800";
  }
  if (t.includes("fen")) {
    return "from-orange-600 via-red-600 to-rose-700";
  }
  if (t.includes("anadolu")) {
    return "from-emerald-600 via-teal-600 to-cyan-700";
  }
  return "from-slate-600 via-slate-700 to-slate-800";
}

function getPercentileColor(value: number): string {
  if (value <= 20) return "bg-red-500";
  if (value <= 40) return "bg-orange-500";
  if (value <= 60) return "bg-yellow-500";
  if (value <= 80) return "bg-green-500";
  return "bg-blue-500";
}

function getPercentileLabel(value: number): string {
  if (value <= 20) return "Çok yüksek başarı gerektirir";
  if (value <= 40) return "Yüksek başarı gerektirir";
  if (value <= 60) return "Orta düzey başarı gerektirir";
  if (value <= 80) return "Ulaşılabilir hedef";
  return "Geniş yerleşme imkânı";
}

export function SchoolDetail({ school, vocationalFields }: SchoolDetailProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const heroImage = school.images[0] ?? null;
  const heroGradient = getHeroGradient(school.type);
  const percentileNum = parseFloat(school.percentile);
  const hasPercentile = !isNaN(percentileNum) && school.percentile !== "";
  const hasContact = !!(school.address || school.phone || school.website);
  const hasDescription = !!school.description?.trim();
  const hasFeatures = school.features.length > 0;
  const hasLanguages = school.languages.length > 0;
  const hasVocationalFields = vocationalFields.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-10">
      {/* ─── Hero Section ─── */}
      <section className="relative w-full overflow-hidden aspect-[16/9] md:aspect-[21/9]">
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt={school.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient}`} />
        )}

        {/* Breadcrumb */}
        <nav
          aria-label="Gezinti yolu"
          className="absolute top-0 left-0 right-0 container mx-auto max-w-7xl px-6 pt-5"
        >
          <ol className="flex items-center gap-1 text-sm text-white/60">
            <li className="hidden sm:flex items-center gap-1">
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Ana Sayfa</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="hidden sm:flex items-center gap-1">
              <Link href="/okullar" className="hover:text-white transition-colors">
                Okullar
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="flex items-center gap-1 text-white/40">
              <span className="truncate max-w-[120px] sm:max-w-none">{school.type}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="truncate max-w-[160px] sm:max-w-xs text-white/80 font-medium">
              {school.name}
            </li>
          </ol>
        </nav>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 container mx-auto max-w-7xl px-6 pb-20">
          <span className="inline-block mb-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
            {school.type}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2 max-w-2xl">
            {school.name}
          </h1>
          <p className="flex items-center gap-1.5 text-white/80 text-sm">
            <MapPin className="h-4 w-4 shrink-0" />
            {school.district}
          </p>
        </div>
      </section>

      {/* ─── Content ─── */}
      <div className="relative z-10 -mt-12 container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* About card */}
            {hasDescription && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Okul Hakkında</h2>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {school.description}
                </p>
              </article>
            )}

            {/* Contact card */}
            {hasContact && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-slate-900 mb-4">İletişim</h2>
                <dl className="space-y-3">
                  {school.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <dd>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(school.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                          aria-label={`${school.name} adresini haritada aç`}
                        >
                          {school.address}
                        </a>
                      </dd>
                    </div>
                  )}
                  {school.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <dd>
                        <a
                          href={`tel:${school.phone}`}
                          className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          {school.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {school.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                      <dd>
                        <a
                          href={school.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                          aria-label={`${school.name} web sitesi (yeni sekmede açılır)`}
                        >
                          {school.website.replace(/^https?:\/\//, "")}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </article>
            )}

            {/* Vocational fields */}
            {hasVocationalFields && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Meslek Alanları</h2>
                <div className="space-y-3">
                  {vocationalFields.map((field) => (
                    <Link
                      key={field.id}
                      href={`/alanlar/${field.slug}`}
                      className="group flex items-center gap-4 rounded-xl border border-slate-100 p-4 hover:border-orange-200 hover:bg-orange-50/50 transition-all"
                      aria-label={`${field.title} meslek alanı detayları`}
                    >
                      <div className="shrink-0 rounded-xl bg-orange-50 p-3 text-orange-600 border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <VocationalFieldIcon slug={field.slug} className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {field.title}
                        </p>
                        {field.branches.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {field.branches.slice(0, 4).map((branch) => (
                              <span
                                key={branch}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium"
                              >
                                {branch}
                              </span>
                            ))}
                            {field.branches.length > 4 && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                +{field.branches.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-400 shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </article>
            )}

            {/* School features */}
            {hasFeatures && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Tesis ve İmkânlar</h2>
                <ul
                  role="list"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                >
                  {school.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Percentile card */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Taban Yüzdelik Dilim
              </p>
              {hasPercentile ? (
                <>
                  <p className="text-4xl font-bold text-slate-900 mb-4 tabular-nums">
                    %{school.percentile}
                  </p>

                  {/* Progress bar */}
                  <div className="mb-1 flex justify-between text-xs text-slate-400 font-medium">
                    <span>Zor</span>
                    <span>Kolay</span>
                  </div>
                  <div
                    className="relative h-2.5 rounded-full bg-slate-100 mb-3 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={percentileNum}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Taban yüzdelik dilim: %${school.percentile}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${getPercentileColor(percentileNum)}`}
                      style={{ width: `${percentileNum}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    {getPercentileLabel(percentileNum)}
                  </p>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    Bu okula yerleşmek için en az{" "}
                    <span className="font-semibold text-slate-600">%{school.percentile}</span>{" "}
                    diliminde olmanız gerekiyor.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400 mb-5">
                  Taban puanı henüz belirlenmedi.
                </p>
              )}

              {/* Desktop add button */}
              <button
                onClick={handleAdd}
                className={`hidden lg:flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                  added
                    ? "bg-emerald-500 text-white"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
                }`}
                aria-label={added ? "Tercihe eklendi" : "Okulu tercihe ekle"}
              >
                <Star className="h-4 w-4" />
                {added ? "Eklendi ✓" : "Tercihe Ekle"}
              </button>
            </div>

            {/* Quick info card */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Hızlı Bilgiler
                </h3>
              </div>
              <dl className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium text-slate-400 shrink-0">Okul Türü</dt>
                  <dd className="text-xs font-semibold text-slate-700 text-right">{school.type}</dd>
                </div>
                <div className="h-px bg-slate-50" />
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xs font-medium text-slate-400 shrink-0">İlçe</dt>
                  <dd className="text-xs font-semibold text-slate-700 text-right flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {school.district}
                  </dd>
                </div>
                {hasLanguages && (
                  <>
                    <div className="h-px bg-slate-50" />
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-xs font-medium text-slate-400 shrink-0">Yabancı Dil</dt>
                      <dd className="text-xs font-semibold text-slate-700 text-right">
                        {school.languages.join(", ")}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile fixed bottom bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 shadow-lg p-4">
        <button
          onClick={handleAdd}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all ${
            added
              ? "bg-emerald-500 text-white"
              : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600"
          }`}
          aria-label={added ? "Tercihe eklendi" : "Okulu tercihe ekle"}
        >
          <Star className="h-4 w-4" />
          {added ? "Eklendi ✓" : "Tercihe Ekle"}
        </button>
      </div>
    </div>
  );
}

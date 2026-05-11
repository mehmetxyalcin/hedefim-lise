"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Building2,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  GraduationCap,
  Home,
  MapPin,
  Phone,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { VocationalFieldIcon } from "@/lib/vocational-icons";
import type { SchoolWithDetails, SchoolScore, SchoolQuota } from "@/types/schoolDetail";

type Props = { school: SchoolWithDetails };

function getHeroGradient(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("meslek") || t.includes("teknik")) return "from-blue-700 via-indigo-700 to-purple-800";
  if (t.includes("fen")) return "from-orange-600 via-red-600 to-rose-700";
  if (t.includes("anadolu")) return "from-emerald-600 via-teal-600 to-cyan-700";
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

function labelFor(key: string, value: string): string {
  const maps: Record<string, Record<string, string>> = {
    placementType: { yerel: "Yerel Yerleşim", merkezi: "Merkezi Sınav", acik: "Açık Yerleşim" },
    educationType: { normal: "Normal Öğretim", ikili: "İkili Öğretim" },
    boardingType: { yok: "Yatılı Yok", var: "Yatılı İmkânı", zorunlu: "Zorunlu Yatılı" },
  };
  return maps[key]?.[value] ?? value;
}

function ScoresSection({ scores, quotas }: { scores: SchoolScore[]; quotas: SchoolQuota[] }) {
  const years = [...new Set([...scores.map((s) => s.year), ...quotas.map((q) => q.year)])].sort(
    (a, b) => b - a,
  );
  const [activeYear, setActiveYear] = useState(years[0] ?? 0);

  if (years.length === 0) return null;

  const score = scores.find((s) => s.year === activeYear);
  const quota = quotas.find((q) => q.year === activeYear);

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Trophy className="h-5 w-5 text-amber-500" />
          Puanlar &amp; Kontenjan
        </h2>
        <div className="flex gap-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setActiveYear(y)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                activeYear === y
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {score?.obpScore != null && (
          <div className="rounded-xl bg-blue-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">OBP</p>
            <p className="mt-1 text-xl font-bold text-blue-700 tabular-nums">{score.obpScore}</p>
          </div>
        )}
        {score?.lgsScore != null && (
          <div className="rounded-xl bg-purple-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">LGS</p>
            <p className="mt-1 text-xl font-bold text-purple-700 tabular-nums">{score.lgsScore}</p>
          </div>
        )}
        {score?.percentile != null && (
          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Yüzdelik</p>
            <p className="mt-1 text-xl font-bold text-amber-700 tabular-nums">%{score.percentile}</p>
          </div>
        )}
        {quota && (quota.sinavliCount != null || quota.sinavsizCount != null) && (
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Kontenjan</p>
            <p className="mt-1 text-base font-bold text-emerald-700 tabular-nums">
              {quota.sinavliCount != null && <span>{quota.sinavliCount} S</span>}
              {quota.sinavliCount != null && quota.sinavsizCount != null && " / "}
              {quota.sinavsizCount != null && <span>{quota.sinavsizCount} SZ</span>}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export function SchoolDetail({ school }: Props) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const heroImage = school.images[0] ?? null;
  const heroGradient = getHeroGradient(school.type);
  const percentileNum = parseFloat(school.percentile);
  const hasPercentile = !isNaN(percentileNum) && school.percentile !== "";

  const hasDescription = !!school.description?.trim();
  const hasContact = !!(school.address || school.phone || school.website);
  const hasTransportation = !!school.transportationInfo;
  const hasFeatures = school.features.length > 0;
  const hasFacilities = school.facilities.length > 0;
  const hasVocational = school.vocationalFieldsWithBranches.length > 0;
  const hasScholarships = school.scholarships.length > 0;
  const hasProjects = school.schoolProjects.length > 0;
  const hasScoresOrQuotas = school.scores.length > 0 || school.quotas.length > 0;
  const hasOtherInfo = !!school.otherInfo?.trim();
  const hasHours = !!(school.schoolHoursStart || school.schoolHoursEnd);
  const hasLanguages = school.languages.length > 0;

  const showInfoRibbon =
    school.placementType !== "yerel" ||
    school.educationType !== "normal" ||
    school.boardingType !== "yok" ||
    hasHours;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-10">
      {/* Hero */}
      <section className="relative w-full overflow-hidden aspect-[16/9] md:aspect-[21/9]">
        {heroImage ? (
          <>
            <Image src={heroImage} alt={school.name} fill sizes="100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient}`} />
        )}

        <nav aria-label="Gezinti yolu" className="absolute top-0 left-0 right-0 container mx-auto max-w-7xl px-6 pt-5">
          <ol className="flex items-center gap-1 text-sm text-white/60">
            <li className="hidden sm:flex items-center gap-1">
              <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
                <Home className="h-3.5 w-3.5" />
                <span>Ana Sayfa</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="hidden sm:flex items-center gap-1">
              <Link href="/okullar" className="hover:text-white transition-colors">Okullar</Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="flex items-center gap-1 text-white/40">
              <span className="truncate max-w-[120px] sm:max-w-none">{school.type}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="truncate max-w-[160px] sm:max-w-xs text-white/80 font-medium">{school.name}</li>
          </ol>
        </nav>

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

      {/* Content */}
      <div className="relative z-10 -mt-12 container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Info ribbon */}
            {showInfoRibbon && (
              <div className="flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                {school.placementType !== "yerel" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {labelFor("placementType", school.placementType)}
                  </span>
                )}
                {school.educationType !== "normal" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                    <Clock className="h-3.5 w-3.5" />
                    {labelFor("educationType", school.educationType)}
                  </span>
                )}
                {school.boardingType !== "yok" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Users className="h-3.5 w-3.5" />
                    {labelFor("boardingType", school.boardingType)}
                  </span>
                )}
                {hasHours && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Clock className="h-3.5 w-3.5" />
                    {school.schoolHoursStart}
                    {school.schoolHoursEnd && `–${school.schoolHoursEnd}`}
                    {school.schoolHoursNote && ` (${school.schoolHoursNote})`}
                  </span>
                )}
              </div>
            )}

            {/* About */}
            {hasDescription && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Okul Hakkında</h2>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{school.description}</p>
              </article>
            )}

            {/* Scores & Quotas */}
            {hasScoresOrQuotas && <ScoresSection scores={school.scores} quotas={school.quotas} />}

            {/* Contact */}
            {(hasContact || hasTransportation) && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">İletişim &amp; Ulaşım</h2>
                <dl className="space-y-3">
                  {school.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <dd>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(school.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-slate-600 hover:text-blue-600 hover:underline"
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
                        <a href={`tel:${school.phone}`} className="text-sm text-slate-600 hover:text-blue-600">
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
                        >
                          {school.website.replace(/^https?:\/\//, "")}
                        </a>
                      </dd>
                    </div>
                  )}
                  {hasTransportation && (
                    <div className="mt-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {school.transportationInfo}
                    </div>
                  )}
                </dl>
              </article>
            )}

            {/* Vocational fields with branches */}
            {hasVocational && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Meslek Alanları</h2>
                <div className="space-y-3">
                  {school.vocationalFieldsWithBranches.map((field) => (
                    <Link
                      key={field.id}
                      href={`/alanlar/${field.slug}`}
                      className="group flex items-start gap-4 rounded-xl border border-slate-100 p-4 hover:border-orange-200 hover:bg-orange-50/50 transition-all"
                    >
                      <div className="shrink-0 rounded-xl bg-orange-50 p-3 text-orange-600 border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <VocationalFieldIcon slug={field.slug} className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {field.title}
                        </p>
                        {field.selectedBranches.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {field.selectedBranches.map((b) => (
                              <span key={b.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                                {b.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-400 shrink-0 transition-colors mt-1" />
                    </Link>
                  ))}
                </div>
              </article>
            )}

            {/* Facilities */}
            {hasFacilities && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Tesis &amp; Altyapı</h2>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {school.facilities.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      {f.icon ? (
                        <span className="text-base">{f.icon}</span>
                      ) : (
                        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      {f.name}
                    </li>
                  ))}
                </ul>
              </article>
            )}

            {/* Legacy features list (text-based) */}
            {hasFeatures && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Özellikler</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {school.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </article>
            )}

            {/* Scholarships */}
            {hasScholarships && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-500" />
                  Burs İmkânları
                </h2>
                <div className="space-y-3">
                  {school.scholarships.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800">{s.title}</p>
                        {s.amountInfo && (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                            {s.amountInfo}
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="mt-1.5 text-sm text-slate-500">{s.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            )}

            {/* Projects */}
            {hasProjects && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Projeler</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {school.schoolProjects.map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                      {p.imageUrl && (
                        <div className="relative h-36 w-full">
                          <Image src={p.imageUrl} alt={p.title} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-semibold text-slate-800">{p.title}</p>
                        {p.description && (
                          <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.description}</p>
                        )}
                        {p.linkUrl && (
                          <a
                            href={p.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Projeyi görüntüle
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {/* Other info */}
            {hasOtherInfo && (
              <article className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Ek Bilgiler</h2>
                <div className="prose prose-sm max-w-none text-slate-600">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{school.otherInfo}</pre>
                </div>
              </article>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Percentile card */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Taban Yüzdelik Dilim
              </p>
              {hasPercentile ? (
                <>
                  <p className="text-4xl font-bold text-slate-900 mb-4 tabular-nums">%{school.percentile}</p>
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
                  >
                    <div
                      className={`h-full rounded-full transition-all ${getPercentileColor(percentileNum)}`}
                      style={{ width: `${percentileNum}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{getPercentileLabel(percentileNum)}</p>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    Bu okula yerleşmek için en az{" "}
                    <span className="font-semibold text-slate-600">%{school.percentile}</span>{" "}
                    diliminde olmanız gerekiyor.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400 mb-5">Taban puanı henüz belirlenmedi.</p>
              )}

              <button
                onClick={handleAdd}
                className={`hidden lg:flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                  added
                    ? "bg-emerald-500 text-white"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
                }`}
              >
                <Star className="h-4 w-4" />
                {added ? "Eklendi ✓" : "Tercihe Ekle"}
              </button>
            </div>

            {/* Quick info */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Hızlı Bilgiler</h3>
              </div>
              <dl className="space-y-3 text-xs">
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-medium text-slate-400 shrink-0">Okul Türü</dt>
                  <dd className="font-semibold text-slate-700 text-right">{school.type}</dd>
                </div>
                <div className="h-px bg-slate-50" />
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-medium text-slate-400 shrink-0">İlçe</dt>
                  <dd className="font-semibold text-slate-700 text-right flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {school.district}
                  </dd>
                </div>
                {hasLanguages && (
                  <>
                    <div className="h-px bg-slate-50" />
                    <div className="flex items-start justify-between gap-4">
                      <dt className="font-medium text-slate-400 shrink-0">Yabancı Dil</dt>
                      <dd className="font-semibold text-slate-700 text-right">{school.languages.join(", ")}</dd>
                    </div>
                  </>
                )}
                {school.boardingType !== "yok" && (
                  <>
                    <div className="h-px bg-slate-50" />
                    <div className="flex items-start justify-between gap-4">
                      <dt className="font-medium text-slate-400 shrink-0">Yatılı</dt>
                      <dd className="font-semibold text-slate-700 text-right">
                        {labelFor("boardingType", school.boardingType)}
                      </dd>
                    </div>
                  </>
                )}
                {school.educationType !== "normal" && (
                  <>
                    <div className="h-px bg-slate-50" />
                    <div className="flex items-start justify-between gap-4">
                      <dt className="font-medium text-slate-400 shrink-0">Öğretim</dt>
                      <dd className="font-semibold text-slate-700 text-right">
                        {labelFor("educationType", school.educationType)}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-100 shadow-lg p-4">
        <button
          onClick={handleAdd}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all ${
            added
              ? "bg-emerald-500 text-white"
              : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600"
          }`}
        >
          <Star className="h-4 w-4" />
          {added ? "Eklendi ✓" : "Tercihe Ekle"}
        </button>
      </div>
    </div>
  );
}

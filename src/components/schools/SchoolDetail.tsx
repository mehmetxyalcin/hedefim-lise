"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Building2,
  Bus,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  GraduationCap,
  Home,
  MapPin,
  Phone,
  Star,
  Users,
} from "lucide-react";
import { VocationalFieldIcon } from "@/lib/vocational-icons";
import type {
  SchoolWithDetails,
  SchoolScore,
  SchoolQuota,
} from "@/types/schoolDetail";

type Props = { school: SchoolWithDetails };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function heroGradient(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("meslek") || t.includes("teknik"))
    return "from-indigo-700 via-blue-700 to-purple-800";
  if (t.includes("fen"))
    return "from-orange-600 via-red-600 to-rose-700";
  if (t.includes("anadolu"))
    return "from-emerald-600 via-teal-600 to-cyan-700";
  return "from-slate-600 via-slate-700 to-slate-800";
}

function percentileBar(v: number) {
  if (v <= 20) return { bar: "bg-red-500", label: "Çok yüksek başarı gerektirir" };
  if (v <= 40) return { bar: "bg-orange-500", label: "Yüksek başarı gerektirir" };
  if (v <= 60) return { bar: "bg-yellow-500", label: "Orta düzey başarı gerektirir" };
  if (v <= 80) return { bar: "bg-green-500", label: "Ulaşılabilir hedef" };
  return { bar: "bg-blue-500", label: "Geniş yerleşme imkânı" };
}

const PLACEMENT_LABELS: Record<string, string> = {
  yerel: "Yerel Yerleşim",
  merkezi: "Merkezi Sınav",
};
const EDUCATION_LABELS: Record<string, string> = {
  normal: "Normal Öğretim",
  ikili: "İkili Öğretim",
};
const BOARDING_LABELS: Record<string, string> = {
  yok: "Yatılı Yok",
  kiz_erkek: "Kız/Erkek Yatılı",
  kiz: "Kız Yatılı",
  erkek: "Erkek Yatılı",
};

// ─── Meslek Alanları Accordion ─────────────────────────────────────────────────

function VocationalAccordion({
  fields,
}: {
  fields: SchoolWithDetails["vocationalFieldsWithBranches"];
}) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-2">
      {fields.map((field) => {
        const isOpen = openIds.has(field.id);
        return (
          <div key={field.id} className="overflow-hidden rounded-xl border border-slate-100">
            <button
              type="button"
              onClick={() => toggle(field.id)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50"
            >
              <div className="shrink-0 rounded-lg border border-orange-100 bg-orange-50 p-2 text-orange-600">
                <VocationalFieldIcon slug={field.slug} className="h-4 w-4" />
              </div>
              <span className="flex-1 text-sm font-semibold text-slate-900">{field.title}</span>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/alanlar/${field.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hidden text-xs font-semibold text-blue-600 hover:underline sm:block"
                >
                  Alan sayfası →
                </Link>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                {field.selectedBranches.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {field.selectedBranches.map((b) => (
                      <span
                        key={b.id}
                        className="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700"
                      >
                        {b.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Bu alan için dal bilgisi eklenmemiş.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Puan Bilgileri kartı ──────────────────────────────────────────────────────

function ScoreCard({
  scores,
  fallbackPercentile,
}: {
  scores: SchoolScore[];
  fallbackPercentile: string;
}) {
  const sortedYears = scores.map((s) => s.year).sort((a, b) => b - a);
  const [activeYear, setActiveYear] = useState<number>(sortedYears[0] ?? 0);
  const score = scores.find((s) => s.year === activeYear);

  // Percentile'ı belirle: yıllık veri varsa ondan, yoksa fallback
  const rawP =
    score?.percentile != null
      ? String(score.percentile)
      : scores.length === 0
        ? fallbackPercentile
        : null;
  const pNum = rawP != null ? parseFloat(rawP) : NaN;
  const hasP = !isNaN(pNum);
  const { bar, label } = hasP ? percentileBar(pNum) : { bar: "", label: "" };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* Başlık + yıl sekmeleri */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Puan Bilgileri
        </p>
        {sortedYears.length > 0 && (
          <div className="flex gap-1">
            {sortedYears.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setActiveYear(y)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  activeYear === y
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Yüzdelik dilim */}
      {hasP && (
        <>
          <p className="mb-3 text-4xl font-extrabold tabular-nums text-slate-900">
            %{rawP}
          </p>
          <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-400">
            <span>Zor</span>
            <span>Kolay</span>
          </div>
          <div className="mb-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${bar}`}
              style={{ width: `${Math.min(pNum, 100)}%` }}
            />
          </div>
          <p className="mb-4 text-xs text-slate-500">{label}</p>
        </>
      )}

      {/* OBP + LGS */}
      {(score?.obpScore != null || score?.lgsScore != null) && (
        <div className="grid grid-cols-2 gap-2">
          {score?.obpScore != null && (
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">OBP</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-blue-700">
                {score.obpScore}
              </p>
            </div>
          )}
          {score?.lgsScore != null && (
            <div className="rounded-lg bg-purple-50 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">LGS</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-purple-700">
                {score.lgsScore}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Kontenjan kartı ───────────────────────────────────────────────────────────

function QuotaCard({ quotas }: { quotas: SchoolQuota[] }) {
  const sortedYears = quotas.map((q) => q.year).sort((a, b) => b - a);
  const [activeYear, setActiveYear] = useState<number>(sortedYears[0] ?? 0);
  const quota = quotas.find((q) => q.year === activeYear);

  if (quotas.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Kontenjan</p>
        <div className="flex gap-1">
          {sortedYears.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setActiveYear(y)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
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
      <dl className="space-y-2">
        {quota?.sinavliCount != null && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
            <dt className="text-xs font-medium text-slate-500">Sınavlı</dt>
            <dd className="text-sm font-bold tabular-nums text-slate-800">
              {quota.sinavliCount} öğrenci
            </dd>
          </div>
        )}
        {quota?.sinavsizCount != null && (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
            <dt className="text-xs font-medium text-slate-500">Sınavsız</dt>
            <dd className="text-sm font-bold tabular-nums text-slate-800">
              {quota.sinavsizCount} öğrenci
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// ─── Ana bileşen ───────────────────────────────────────────────────────────────

export function SchoolDetail({ school }: Props) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const heroImg = school.images[0] ?? null;
  const gradient = heroGradient(school.type);

  // Veri varlık kontrolleri
  const hasDescription = !!school.description?.trim();
  const hasFacilities = school.facilities.length > 0;
  const hasFeatures = school.features.length > 0;
  const hasVocational = school.vocationalFieldsWithBranches.length > 0;
  const hasScholarships = school.scholarships.length > 0;
  const hasProjects = school.schoolProjects.length > 0;
  const hasTransportation = !!school.transportationInfo?.trim();
  const hasContact = !!(school.address || school.phone || school.website);
  const hasOtherInfo = !!school.otherInfo?.trim();
  const hasLanguages = school.languages.length > 0;
  const hasHours = !!(school.schoolHoursStart || school.schoolHoursEnd);

  // Şerit için gösterilecek chip'ler
  const placementLabel = PLACEMENT_LABELS[school.placementType] ?? school.placementType;
  const educationLabel = EDUCATION_LABELS[school.educationType] ?? school.educationType;
  const boardingLabel = BOARDING_LABELS[school.boardingType] ?? school.boardingType;
  const showBoarding = school.boardingType !== "yok";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-10">

      {/* ────────────────── HERO ────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ aspectRatio: "21/9", minHeight: "220px", maxHeight: "480px" }}>
        {heroImg ? (
          <>
            <Image
              src={heroImg}
              alt={school.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        )}

        {/* Breadcrumb */}
        <nav
          aria-label="Gezinti yolu"
          className="absolute left-0 right-0 top-0 mx-auto max-w-7xl px-6 pt-5"
        >
          <ol className="flex items-center gap-1 text-sm text-white/70">
            <li className="hidden items-center gap-1 sm:flex">
              <Link href="/" className="flex items-center gap-1 hover:text-white">
                <Home className="h-3.5 w-3.5" />
                Ana Sayfa
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="hidden items-center gap-1 sm:flex">
              <Link href="/okullar" className="hover:text-white">Okullar</Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="flex items-center gap-1 text-white/50">
              <span className="max-w-[100px] truncate sm:max-w-none">{school.type}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="max-w-[160px] truncate font-medium text-white/90 sm:max-w-xs">
              {school.name}
            </li>
          </ol>
        </nav>

        {/* Hero içerik */}
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-6 pb-16">
          <span className="mb-3 inline-block rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {school.type}
          </span>
          <h1 className="mb-2 max-w-2xl text-3xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-4xl lg:text-5xl">
            {school.name}
          </h1>
          <p className="flex items-center gap-1.5 text-sm font-medium text-white/80">
            <MapPin className="h-4 w-4 shrink-0" />
            {school.district}
          </p>
        </div>
      </section>

      {/* ────────────────── CONTENT ────────────────── */}
      <div className="relative z-10 -mt-10 mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── Hızlı Bilgiler Şeridi ── */}
        <div className="hide-scrollbar mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            {/* Okul Türü — her zaman göster */}
            <Chip icon={<Building2 className="h-3.5 w-3.5" />} color="slate">
              {school.type}
            </Chip>

            {/* Yerleştirme */}
            <Chip icon={<GraduationCap className="h-3.5 w-3.5" />} color="blue">
              {placementLabel}
            </Chip>

            {/* Eğitim şekli */}
            <Chip icon={<BookOpen className="h-3.5 w-3.5" />} color="purple">
              {educationLabel}
            </Chip>

            {/* Pansiyon — sadece varsa */}
            {showBoarding && (
              <Chip icon={<Users className="h-3.5 w-3.5" />} color="emerald">
                {boardingLabel}
              </Chip>
            )}

            {/* Okul saatleri — sadece doluysa */}
            {hasHours && (
              <Chip icon={<Clock className="h-3.5 w-3.5" />} color="amber">
                {[
                  school.schoolHoursStart,
                  school.schoolHoursEnd ? `– ${school.schoolHoursEnd}` : null,
                  school.schoolHoursNote ? `(${school.schoolHoursNote})` : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </Chip>
            )}
          </div>
        </div>

        {/* ── 2 Sütun ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ──── Sol sütun ──── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Okul Hakkında */}
            {hasDescription && (
              <Card title="Okul Hakkında">
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                  {school.description}
                </p>
              </Card>
            )}

            {/* Tesisler (yeni DB tablosu) */}
            {hasFacilities && (
              <Card title="Tesis ve Altyapı">
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {school.facilities.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {f.icon && <span>{f.icon}</span>}
                      {f.name}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Meslek Alanları */}
            {hasVocational && (
              <Card title="Meslek Alanları ve Dallar">
                <VocationalAccordion fields={school.vocationalFieldsWithBranches} />
              </Card>
            )}

            {/* Özellikler (eski text[] alanı) */}
            {hasFeatures && (
              <Card title="Özellikler">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {school.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-700">{feat}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Burs İmkânları */}
            {hasScholarships && (
              <Card
                title="Burs İmkânları"
                icon={<GraduationCap className="h-5 w-5 text-emerald-500" />}
              >
                <div className="space-y-3">
                  {school.scholarships.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
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
              </Card>
            )}

            {/* Projeler */}
            {hasProjects && (
              <Card title="Projeler">
                <div className="grid gap-4 sm:grid-cols-2">
                  {school.schoolProjects.map((p) => (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
                    >
                      {p.imageUrl && (
                        <div className="relative h-36 w-full">
                          <Image
                            src={p.imageUrl}
                            alt={p.title}
                            fill
                            sizes="(max-width:640px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-semibold text-slate-800">{p.title}</p>
                        {p.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {p.description}
                          </p>
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
              </Card>
            )}

            {/* Ulaşım */}
            {hasTransportation && (
              <Card
                title="Ulaşım"
                icon={<Bus className="h-5 w-5 text-blue-500" />}
              >
                <p className="text-sm leading-relaxed text-slate-600">
                  {school.transportationInfo}
                </p>
              </Card>
            )}

            {/* İletişim */}
            {hasContact && (
              <Card title="İletişim">
                <dl className="space-y-3">
                  {school.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
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
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      <dd>
                        <a
                          href={`tel:${school.phone}`}
                          className="text-sm text-slate-600 hover:text-blue-600"
                        >
                          {school.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {school.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                      <dd>
                        <a
                          href={school.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-sm text-blue-600 hover:underline"
                        >
                          {school.website.replace(/^https?:\/\//, "")}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
            )}

            {/* Diğer Bilgiler */}
            {hasOtherInfo && (
              <Card title="Ek Bilgiler">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600">
                  {school.otherInfo}
                </pre>
              </Card>
            )}
          </div>

          {/* ──── Sağ sütun ──── */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* Puan Bilgileri */}
            <ScoreCard scores={school.scores} fallbackPercentile={school.percentile} />

            {/* Kontenjan */}
            <QuotaCard quotas={school.quotas} />

            {/* Hızlı Bilgiler */}
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Hızlı Bilgiler
                </h3>
              </div>
              <dl className="space-y-2.5 text-xs">
                <InfoRow label="Okul Türü" value={school.type} />
                <InfoRow label="İlçe" value={school.district} icon={<MapPin className="h-3 w-3" />} />
                {hasLanguages && (
                  <InfoRow label="Yabancı Dil" value={school.languages.join(", ")} />
                )}
                {showBoarding && (
                  <InfoRow label="Yatılı" value={boardingLabel} />
                )}
                {school.educationType !== "normal" && (
                  <InfoRow label="Öğretim" value={educationLabel} />
                )}
                {school.placementType !== "yerel" && (
                  <InfoRow label="Yerleşim" value={placementLabel} />
                )}
              </dl>
            </div>

            {/* Tercihe Ekle — desktop */}
            <button
              type="button"
              onClick={handleAdd}
              className={`hidden w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all lg:flex ${
                added
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
              }`}
            >
              <Star className="h-4 w-4" />
              {added ? "Eklendi ✓" : "Tercihe Ekle"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile: fixed bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white p-4 shadow-lg lg:hidden">
        <button
          type="button"
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

// ─── Küçük yardımcı bileşenler ─────────────────────────────────────────────────

type ChipColor = "slate" | "blue" | "purple" | "emerald" | "amber";

const chipClasses: Record<ChipColor, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
};

function Chip({
  icon,
  color,
  children,
}: {
  icon: React.ReactNode;
  color: ChipColor;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${chipClasses[color]}`}
    >
      {icon}
      {children}
    </span>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
        {icon}
        {title}
      </h2>
      {children}
    </article>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <dt className="shrink-0 font-medium text-slate-400">{label}</dt>
        <dd className="flex items-center gap-1 text-right font-semibold text-slate-700">
          {icon}
          {value}
        </dd>
      </div>
      <div className="h-px bg-slate-50" />
    </>
  );
}

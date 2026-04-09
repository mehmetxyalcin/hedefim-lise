"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Briefcase,
  Building,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Info,
  Languages,
  Layers,
  MapPin,
  Phone,
  Share2,
  Star,
  Trophy,
} from "lucide-react";
import { VocationalFieldIcon } from "@/lib/vocational-icons";
import type { School } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";

type SchoolDetailProps = {
  school: School;
  vocationalFields: VocationalField[];
};

export function SchoolDetail({ school, vocationalFields }: SchoolDetailProps) {
  const [activeTab, setActiveTab] = useState("genel");

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Link
                href="/okullar"
                className="-ml-2 flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-slate-50 hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Tercih Robotuna Don</span>
                <span className="sm:hidden">Geri</span>
              </Link>
              <ChevronRight className="hidden h-3.5 w-3.5 text-slate-300 sm:block" />
              <span className="hidden text-slate-400 sm:block">{school.district}</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-slate-300 md:block" />
              <span className="hidden max-w-[200px] truncate text-slate-400 md:block">
                {school.name}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="rounded-xl border border-transparent p-2 text-slate-400 transition-all hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                title="Okulu Paylas"
              >
                <Share2 className="h-4.5 w-4.5" />
              </button>
              <button
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                title="Tercih Listeme Kaydet"
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 pt-8 pb-10">
        <div className="relative flex flex-col gap-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10 lg:flex-row lg:gap-12">
          <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/2 rounded-full bg-blue-50/50 blur-3xl" />

          <div className="relative z-10 flex shrink-0 justify-center lg:justify-start">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-[2rem] text-3xl font-extrabold text-white ring-4 ring-slate-50 shadow-inner border border-white/20 sm:h-32 sm:w-32 sm:text-5xl ${school.color}`}
            >
              {school.logo}
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center text-center lg:text-left">
            {school.images[0] && (
              <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
                <Image
                  src={school.images[0]}
                  alt={school.name}
                  width={1280}
                  height={512}
                  className="h-64 w-full object-cover"
                />
              </div>
            )}
            <div className="mb-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-sm">
                {school.type}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {school.district}
              </span>
            </div>

            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {school.name}
            </h1>

            <p className="mx-auto mb-6 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base lg:mx-0">
              {school.description}
            </p>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 border-t border-slate-100 pt-5 lg:justify-start">
              <div className="group flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-1.5 transition-colors group-hover:border-blue-200 group-hover:text-blue-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>{school.address ?? "Adres bilgisi yakinda eklenecek."}</span>
              </div>
              <div className="group flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-1.5 transition-colors group-hover:border-blue-200 group-hover:text-blue-600">
                  <Globe className="h-4 w-4" />
                </div>
                <span>{school.website ?? "Website bilgisi yakinda eklenecek."}</span>
              </div>
              <div className="group flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-1.5 transition-colors group-hover:border-blue-200 group-hover:text-blue-600">
                  <Phone className="h-4 w-4" />
                </div>
                <span>{school.phone ?? "Telefon bilgisi yakinda eklenecek."}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex shrink-0 flex-col justify-center border-t border-slate-100 pt-8 lg:mt-0 lg:w-72 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/80 p-6 text-center backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-blue-50/30">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
              <div className="mt-2 mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Taban Yuzdelik Dilim
              </div>
              <div className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 sm:text-5xl">
                %{school.percentile}
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/40">
                <Star className="h-4 w-4" />
                Tercihe Ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-30 border-b border-slate-200 bg-slate-50/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="hide-scrollbar flex space-x-2 overflow-x-auto py-1 sm:space-x-8">
            {[
              { id: "genel", label: "Genel Bakis", icon: Info },
              { id: "akademik", label: "Akademik", icon: BookOpen },
              { id: "imkanlar", label: "Imkanlar", icon: Building },
              { id: "projeler", label: "Projeler", icon: Trophy },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "text-blue-600"
                      : "rounded-lg text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                  }`}
                >
                  <TabIcon
                    className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                  />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-[-5px] left-0 right-0 h-1 rounded-t-full bg-blue-600" />
                  )}
                </button>
              );
            })}

            {school.vocationalFields && (
              <button
                onClick={() => setActiveTab("alanlar")}
                className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === "alanlar"
                    ? "text-orange-600"
                    : "rounded-lg text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                }`}
              >
                <Briefcase
                  className={`h-4 w-4 ${activeTab === "alanlar" ? "text-orange-600" : "text-slate-400"}`}
                />
                Meslek Alanlari
                {activeTab === "alanlar" && (
                  <div className="absolute bottom-[-5px] left-0 right-0 h-1 rounded-t-full bg-orange-600" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 pt-10">
        {activeTab === "genel" && (
          <div className="grid items-start gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm sm:p-10">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl border border-blue-100/50 bg-blue-50 p-2.5 text-blue-600">
                    <Info className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Okul Hakkinda
                  </h2>
                </div>
                <div className="max-w-none space-y-6 text-lg leading-relaxed text-slate-600">
                  <p>
                    {school.description} Okulumuz, ogrenci merkezli egitim
                    anlayisi, donanimli laboratuvarlari ve guclu ogretmen
                    kadrosu ile bolgesinin en cok tercih edilen egitim
                    kurumlarindan biridir.
                  </p>
                  <p>
                    Amacimiz; ogrencilerimizi sadece ulusal sinavlara
                    hazirlamak degil, ayni zamanda 21. yuzyil becerileriyle
                    donatilmis bireyler olarak hayata katmaktir.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
                <h3 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  <Layers className="h-4 w-4" />
                  Hizli Bilgiler
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Languages className="h-4.5 w-4.5 text-slate-400" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Yabanci Diller
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {school.languages.map((language) => (
                        <span
                          key={language}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-100" />

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-slate-400" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Egitim Sekli
                      </h4>
                    </div>
                    <div className="pl-6">
                      <div className="text-sm font-medium text-slate-600">
                        Tam Gun Egitim
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        08:30 - 15:40
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "alanlar" && school.vocationalFields && (
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="mb-10 text-center">
              <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Mesleki Uzmanlik Alanlari
              </h2>
              <p className="text-lg text-slate-500">
                Bu okulda yer alan alanlari ve alt dallarini detaylica
                inceleyin.
              </p>
            </div>

            <div className="grid gap-6">
              {vocationalFields.map((field) => {
                return (
                  <Link
                    key={field.id}
                    href={`/alanlar/${field.slug}`}
                    className="group cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-6 transition-all hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 sm:p-8"
                  >
                    <div className="flex flex-col gap-6 md:flex-row md:items-start sm:gap-8">
                      <div className="shrink-0 rounded-2xl border border-orange-100/50 bg-orange-50 p-5 text-orange-600 shadow-sm transition-colors group-hover:bg-orange-500 group-hover:text-white">
                        <VocationalFieldIcon slug={field.slug} className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-3 text-2xl font-bold text-slate-900 transition-colors group-hover:text-orange-600">
                          {field.title}
                        </h4>
                        <p className="mb-5 text-base leading-relaxed text-slate-500">
                          {field.description}
                        </p>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Mevcut Dallar
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {field.branches.map((branch) => (
                              <span
                                key={branch}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                              >
                                {branch}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="hidden h-20 self-center border-l border-slate-100 pl-6 text-sm font-bold text-slate-400 transition-colors group-hover:text-orange-500 md:flex md:items-center">
                        Detaylar
                        <ChevronRight className="ml-1 h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "imkanlar" && (
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl border border-emerald-100/50 bg-emerald-50 p-2.5 text-emerald-600">
                <Building className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Tesis ve Fiziksel Imkanlar
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {school.features.map((feature) => (
                <div
                  key={feature}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <div className="rounded-xl border border-emerald-100/50 bg-emerald-50 p-2 transition-colors group-hover:bg-emerald-500">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 group-hover:text-white" />
                  </div>
                  <span className="font-bold text-slate-700 transition-colors group-hover:text-slate-900">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "projeler" && (
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-xl border border-indigo-100/50 bg-indigo-50 p-2.5 text-indigo-600">
                <Trophy className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Projeler ve Basarilar
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {school.projects.map((project) => (
                <div
                  key={project}
                  className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="mb-5 w-fit rounded-2xl border border-indigo-100/50 bg-indigo-50 p-3.5 text-indigo-600 transition-transform group-hover:scale-110">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h4 className="mb-3 text-xl font-bold text-slate-900">
                    {project}
                  </h4>
                  <p className="flex-grow text-sm leading-relaxed text-slate-500">
                    Okulumuz bu proje kapsaminda aktif calismalar yurutmekte,
                    ogrencilerine ulusal ve uluslararasi duzeyde vizyon
                    kazandirmayi hedeflemektedir.
                  </p>
                  <div className="mt-6 flex items-center gap-1 border-t border-slate-50 pt-5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Incele
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "akademik" && (
          <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0a0f1c] p-10 text-white shadow-xl">
              <div className="pointer-events-none absolute top-[-20%] right-[-10%] h-[60%] w-[60%] rounded-full bg-blue-500/20 blur-3xl" />
              <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-400/10 blur-2xl" />

              <div className="relative z-10">
                <div className="mb-8 flex items-center gap-3">
                  <div className="rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
                    <BookOpen className="h-5 w-5 text-blue-300" />
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-blue-100">
                    Akademik Performans
                  </h4>
                </div>

                <div className="mb-8">
                  <h3 className="mb-2 text-3xl font-extrabold text-white">
                    2025 YKS Basarisi
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    Ogrencilerimizin universite yerlestirme oranlari her gecen
                    yil artarak devam etmektedir.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/10">
                    <div className="mb-2 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-5xl font-extrabold text-transparent">
                      %85
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-300">
                      Lisans Yerlesme Orani
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-colors hover:bg-white/10">
                    <div className="mb-2 text-5xl font-extrabold text-white">
                      12
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-300">
                      Tip Fakultesi Yerlesen
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex h-full flex-col justify-center rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
                <h4 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900">
                  Destekleme ve Yetistirme Kurslari (DYK)
                </h4>
                <p className="mb-6 text-lg leading-relaxed text-slate-600">
                  Hafta sonu uzman kadromuz esliginde 9, 10, 11 ve 12.
                  siniflara yonelik ucretsiz DYK kurslarimizla ogrencilerimizin
                  sinav hazirlik sureclerini okul catisi altinda guvenle
                  yurutuyoruz.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                    Ucretsiz
                  </span>
                  <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Hafta Sonu
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

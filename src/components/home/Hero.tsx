"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";

export function Hero() {
  const [ilce, setIlce] = useState("");
  const [tur, setTur] = useState("");
  const router = useRouter();

  function handleSearch() {
    const params = new URLSearchParams();
    if (ilce) params.set("ilce", ilce);
    if (tur) params.set("tur", tur);
    const qs = params.toString();
    router.push(qs ? `/okullar?${qs}` : "/okullar");
  }

  return (
    <div className="relative flex flex-col items-center overflow-hidden bg-[#071426] pt-12 pb-32 lg:pt-16 lg:pb-40">
      <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(14,165,233,0.34),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(6,182,212,0.26),transparent_30%),linear-gradient(135deg,#071426_0%,#0b2f4a_45%,#102033_100%)]" />
        <div className="absolute top-[-18%] left-[8%] h-[54%] w-[42%] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute top-[12%] right-[-8%] h-[48%] w-[34%] rounded-full bg-sky-300/20 blur-[110px]" />
        <div className="absolute right-[14%] bottom-[-18%] h-[44%] w-[32%] rounded-full bg-orange-400/22 blur-[120px]" />
        <div className="absolute bottom-[8%] left-[-8%] h-[34%] w-[28%] rounded-full bg-rose-500/18 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-35" />
        <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl px-6 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-50 shadow-lg shadow-cyan-950/20 backdrop-blur-md">
          <Star className="h-4 w-4 text-amber-300" />
          <span>Mersin&apos;in LGS Tercih Platformu</span>
        </div>

        <h1 className="mb-6 text-4xl leading-[1.15] font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
          Geleceğini Şansa Bırakma,
          <br className="hidden md:block" />
          Liseni{" "}
          <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
            Bilinçli
          </span>{" "}
          Seç.
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-sky-50/80 md:text-xl">
          İlgi alanlarına ve yeteneklerine en uygun liseyi keşfet. Güvenilir
          verilerle hedefini belirle, kariyer yolculuğuna güçlü bir başlangıç
          yap.
        </p>

        <div className="relative z-20 mx-auto flex max-w-4xl flex-col gap-2 rounded-2xl border border-white/20 bg-white p-2 shadow-2xl shadow-sky-950/45 ring-1 ring-slate-900/5 md:flex-row">
          <div className="group relative flex flex-1 items-center rounded-xl border border-transparent bg-slate-50 transition-colors hover:bg-sky-50 focus-within:border-cyan-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-500/15">
            <MapPin className="absolute left-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-cyan-600" />
            <select
              value={ilce}
              onChange={(e) => setIlce(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent py-4 pr-10 pl-12 font-medium text-slate-700 outline-none"
            >
              <option value="" disabled hidden>
                İlçe Seçiniz
              </option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-4 h-5 w-5 rotate-90 text-slate-400" />
          </div>

          <div className="group relative flex flex-1 items-center rounded-xl border border-transparent bg-slate-50 transition-colors hover:bg-sky-50 focus-within:border-cyan-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-500/15">
            <GraduationCap className="absolute left-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-cyan-600" />
            <select
              value={tur}
              onChange={(e) => setTur(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent py-4 pr-10 pl-12 font-medium text-slate-700 outline-none"
            >
              <option value="" disabled hidden>
                Okul Türü Seçiniz
              </option>
              {SCHOOL_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-4 h-5 w-5 rotate-90 text-slate-400" />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-8 py-4 font-semibold text-white shadow-lg shadow-orange-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:from-amber-400 hover:via-orange-500 hover:to-rose-500 hover:shadow-orange-500/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200 md:w-auto"
          >
            <Search className="h-5 w-5" />
            Okul Ara
          </button>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-white/[0.08] px-4 py-2 text-sm text-sky-50/90 shadow-sm shadow-sky-950/20 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <span className="font-medium">RAM Onaylı İçerik</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-orange-200/20 bg-white/[0.08] px-4 py-2 text-sm text-sky-50/90 shadow-sm shadow-sky-950/20 backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4 text-amber-300" />
            <span className="font-medium">Güncel Veriler (2026)</span>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-3xl px-4">
          <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur-sm">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/50" />
            <p className="text-xs leading-relaxed text-white/60">
              Bu platformda yer alan tüm bilgiler yalnızca bilgilendirme
              amaçlıdır. Bu bilgiler yıllara göre değişebilir. Tercih yapmadan
              önce bilgilerin güncelliğini resmi MEB kaynaklarından teyit etmeniz
              önerilir. Tercih kararlarından doğacak sorumluluk tamamen
              kullanıcıya aittir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

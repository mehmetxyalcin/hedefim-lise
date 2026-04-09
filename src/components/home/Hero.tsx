import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";

export function Hero() {
  return (
    <div className="relative flex flex-col items-center overflow-hidden bg-[#0a0f1c] pt-24 pb-32 lg:pt-32 lg:pb-40">
      <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] h-[50%] w-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] h-[40%] w-[30%] rounded-full bg-cyan-400/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl px-6 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
          <Star className="h-4 w-4" />
          <span>Mersin&apos;in Resmi Tercih Platformu</span>
        </div>

        <h1 className="mb-6 text-4xl leading-[1.15] font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
          Gelecegini Sansa Birakma,
          <br className="hidden md:block" />
          Liseni{" "}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Bilincli
          </span>{" "}
          Sec.
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
          Ilgi alanlarina ve yeteneklerine en uygun liseyi kesfet. Guvenilir
          verilerle hedefini belirle, kariyer yolculuguna guclu bir baslangic
          yap.
        </p>

        <div className="relative z-20 mx-auto flex max-w-4xl flex-col gap-2 rounded-2xl border border-white/10 bg-white p-2 shadow-2xl shadow-black/40 ring-1 ring-slate-900/5 md:flex-row">
          <div className="group relative flex flex-1 items-center rounded-xl border border-transparent bg-slate-50 transition-colors hover:bg-slate-100 focus-within:border-blue-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
            <MapPin className="absolute left-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
            <select
              defaultValue=""
              className="w-full cursor-pointer appearance-none bg-transparent py-4 pr-10 pl-12 font-medium text-slate-700 outline-none"
            >
              <option value="" disabled hidden>
                Ilce Seciniz
              </option>
              {DISTRICTS.map((district) => (
                <option key={district}>{district}</option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-4 h-5 w-5 rotate-90 text-slate-400" />
          </div>

          <div className="group relative flex flex-1 items-center rounded-xl border border-transparent bg-slate-50 transition-colors hover:bg-slate-100 focus-within:border-blue-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
            <GraduationCap className="absolute left-4 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
            <select
              defaultValue=""
              className="w-full cursor-pointer appearance-none bg-transparent py-4 pr-10 pl-12 font-medium text-slate-700 outline-none"
            >
              <option value="" disabled hidden>
                Okul Turu Seciniz
              </option>
              {SCHOOL_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-4 h-5 w-5 rotate-90 text-slate-400" />
          </div>

          <Link
            href="/okullar"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/40 md:w-auto"
          >
            <Search className="h-5 w-5" />
            Okul Ara
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">RAM Onayli Icerik</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            <span className="font-medium">Guncel Veriler (2026)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

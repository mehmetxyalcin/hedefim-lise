import type { Metadata } from "next";
import { BarChart3, Layers3, Sparkles } from "lucide-react";
import { SchoolStatisticsDashboard } from "@/components/statistics/SchoolStatisticsDashboard";
import {
  mersinSchoolStatistics2026,
  STATISTICS_SOURCE,
} from "@/data/mersinSchoolStatistics2026";

export const metadata: Metadata = {
  title: "İstatistikler",
  description:
    "Mersin liselerinin kontenjan ve yüzdelik dilim verilerini etkileşimli grafiklerle inceleyin.",
};

export default function StatisticsPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white md:py-18">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-36 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                <Sparkles className="h-3.5 w-3.5" /> Veriye dayalı tercih
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
                Lise İstatistikleri
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                Mersin’deki sınavla öğrenci alan liselerin yüzdelik dilim ve
                kontenjan verilerini karşılaştırın, yıllar içindeki değişimi keşfedin.
              </p>
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-blue-950">
                <BarChart3 className="h-9 w-9 text-cyan-300" />
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-blue-950">
                <Layers3 className="h-9 w-9 text-blue-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-6 max-w-7xl px-4 sm:px-6">
        <SchoolStatisticsDashboard
          schools={mersinSchoolStatistics2026}
          source={STATISTICS_SOURCE}
        />
      </main>
    </div>
  );
}

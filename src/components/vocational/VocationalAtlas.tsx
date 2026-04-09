import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VocationalFieldIcon } from "@/lib/vocational-icons";
import type { VocationalField } from "@/types/vocationalField";

type VocationalAtlasProps = {
  vocationalFields: VocationalField[];
};

export function VocationalAtlas({ vocationalFields }: VocationalAtlasProps) {
  return (
    <div className="container mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-orange-600">
          Bilinçli Tercih, Doğru Kariyer
        </span>
        <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Meslek Atlası
        </h2>
        <p className="text-lg leading-relaxed text-slate-500 md:text-xl">
          İlgi ve yeteneklerinize uygun alanı secin, o alanın ne iş yaptığını,
          hangi okullarda bulunduğunu ve kariyer fırsatlarını derinlemesine
          inceleyin.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {vocationalFields.map((field) => {
          return (
            <Link
              key={field.id}
              href={`/alanlar/${field.slug}`}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative flex h-48 items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-50 p-8 transition-colors group-hover:bg-orange-50">
                <div className="absolute inset-0 bg-orange-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10 rounded-2xl border border-slate-100 bg-white p-5 text-slate-400 shadow-sm transition-all duration-300 group-hover:border-orange-200 group-hover:text-orange-500 group-hover:shadow-orange-500/10">
                  <VocationalFieldIcon slug={field.slug} className="h-10 w-10" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-8">
                <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-orange-600">
                  {field.title}
                </h3>
                <p className="mb-6 flex-grow text-sm leading-relaxed text-slate-500">
                  {field.description}
                </p>

                <div className="mt-auto border-t border-slate-50 pt-6">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Popüler Dallar
                  </div>
                  <div className="mb-6 flex flex-wrap gap-2">
                    {field.branches.slice(0, 2).map((branch) => (
                      <span
                        key={branch}
                        className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        {branch}
                      </span>
                    ))}
                    {field.branches.length > 2 && (
                      <span className="px-1 py-1.5 text-xs font-semibold text-slate-400">
                        +{field.branches.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition-all group-hover:border-orange-600 group-hover:bg-orange-600 group-hover:text-white">
                    Alanı İncele
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

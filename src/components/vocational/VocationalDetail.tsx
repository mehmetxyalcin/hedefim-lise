import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { VocationalFieldIcon } from "@/lib/vocational-icons";
import type { School } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";

type VocationalDetailProps = {
  field: VocationalField;
  relatedSchools: School[];
};

export function VocationalDetail({
  field,
  relatedSchools,
}: VocationalDetailProps) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="relative overflow-hidden bg-[#0a0f1c] pt-16 pb-32 text-white">
        <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-orange-600/10 blur-[150px]" />
        <div className="container relative z-10 mx-auto max-w-7xl px-6">
          <Link
            href="/alanlar"
            className="mb-8 flex w-fit items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Meslek Atlasi&apos;na Don
          </Link>
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-orange-400 backdrop-blur-sm">
              <VocationalFieldIcon slug={field.slug} className="h-8 w-8" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Meslek Alani Tanitimi
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            {field.title}
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-slate-300">
            {field.description}
          </p>
        </div>
      </div>

      <div className="container relative z-20 mx-auto -mt-20 max-w-7xl px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:p-10">
              <h3 className="mb-8 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
                <div className="rounded-xl bg-blue-50 p-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                Bu Alanda Neler Ogreneceksiniz?
              </h3>

              <div className="space-y-10">
                <div>
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                    Dallar (Uzmanliklar)
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field.branches.map((branch) => (
                      <div
                        key={branch}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-colors hover:border-blue-200"
                      >
                        <span className="mb-2 block font-bold text-slate-800">
                          {branch}
                        </span>
                        <span className="text-sm leading-relaxed text-slate-500">
                          Bu dalda uzmanlasarak mesleki yeterlilik
                          kazanabilirsiniz.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                    Gerekli Beceriler
                  </h4>
                  <div className="relative rounded-2xl border border-orange-100 bg-orange-50/50 p-6">
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl bg-orange-400" />
                    <p className="text-lg leading-relaxed font-medium italic text-slate-700">
                      &quot;{field.skills}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:p-10">
              <h3 className="mb-8 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
                <div className="rounded-xl bg-emerald-50 p-2">
                  <Briefcase className="h-6 w-6 text-emerald-600" />
                </div>
                Kariyer ve Gelecek
              </h3>
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 font-bold text-slate-900">Is Imkanlari</h4>
                  <p className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                    {field.career}
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Kamu Kurumlari",
                      "Ozel Sektor Kuruluslari",
                      "Is Yeri Acma Belgesi ile Kendi Isin",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="mb-3 font-bold text-slate-900">
                    Akademik Ilerleme
                  </h4>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <span className="mb-1 block font-bold text-blue-900">
                      M.T.O.K Kontenjani
                    </span>
                    <span className="text-sm leading-relaxed text-blue-800/80">
                      Teknoloji fakultelerinde bu alana ozel ayrilmis
                      kontenjanlardan faydalanabilirsiniz.
                    </span>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <span className="mb-1 block font-bold text-emerald-900">
                      Ek Puan Avantaji
                    </span>
                    <span className="text-sm leading-relaxed text-emerald-800/80">
                      Alana uygun 2 yillik on lisans bolumlerine geciste ek
                      puan imkani.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900">
                Alanin Bulundugu Okullar
              </h3>
              <p className="mb-6 text-sm text-slate-500">
                Mersin genelinde bu egitimi veren kurumlar:
              </p>

              <div className="space-y-4">
                {relatedSchools.map((school) => (
                  <Link
                    key={school.id}
                    href={`/okullar/${school.slug}`}
                    className="group block cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-inner ${school.color}`}
                      >
                        {school.logo}
                      </div>
                      <div>
                        <div className="line-clamp-2 text-sm font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-600">
                          {school.name}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          {school.district}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                      <span className="font-medium text-slate-500">
                        Yuzdelik:
                        <span className="ml-1 font-bold text-slate-900">
                          %{school.percentile}
                        </span>
                      </span>
                      <span className="flex items-center font-semibold text-blue-600">
                        Incele
                        <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

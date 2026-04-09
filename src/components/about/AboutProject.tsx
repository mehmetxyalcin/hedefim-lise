import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  Lightbulb,
  Network,
  ShieldCheck,
  Star,
  Target,
  Users,
} from "lucide-react";

const reasons = [
  {
    title: "Hedef Belirleme",
    desc: "Ogrenci, hangi liseye yerlesmek istedigini bilirse sinav hazirlik surecinde daha net bir hedefe odaklanir.",
  },
  {
    title: "Ilgi ve Yetenekleri Kesfetme",
    desc: "Farkli okul turleri farkli alanlara yonlendirir. Onceden tanimak, ogrencinin kendi potansiyeline uygun yolu secmesini saglar.",
  },
  {
    title: "Yanlis Tercih Riskini Azaltma",
    desc: "Liseleri tanimadan yapilan tercihler motivasyon kaybina yol acabilir. Proje, hayal kirikliklarini minimuma indirir.",
  },
  {
    title: "Okul Kulturunu Ogrenme",
    desc: "Her okulun sosyal ortami, kulupleri, laboratuvarlari ve universiteye hazirlik destegi farklidir.",
  },
  {
    title: "Aile ile Ortak Karar Verme",
    desc: "Sureci seffaflastirarak aile ve ogrenci arasinda saglikli bir iletisimle ortak bir tercih yapilmasina yardimci olur.",
  },
];

export function AboutProject() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="relative overflow-hidden bg-[#0a0f1c] pt-20 pb-32 text-white">
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-10%] bottom-[-20%] h-[40%] w-[40%] rounded-full bg-emerald-500/10 blur-[100px]" />

        <div className="relative z-10 container mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur-sm">
            <Star className="h-4 w-4" />
            <span>Sosyal Sorumluluk Projesi</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Hedefim Lise,
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Yolum Bilincli Tercih
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
            Mersin il genelindeki ortaokul ogrencilerinin, kendi ilgi ve
            yeteneklerine en uygun liseyi secerek egitim hayatlarina guclu bir
            yon vermelerini hedefleyen rehberlik platformu.
          </p>
        </div>
      </div>

      <div className="container relative z-20 mx-auto -mt-20 max-w-7xl px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:p-10">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
                <div className="rounded-xl bg-blue-50 p-2">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                Projenin Amaci
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-slate-600">
                Bu projenin amaci, LGS oncesinde ogrencilerin farkli lise
                turlerini ve ozelliklerini taniyarak bilincli tercihler
                yapmalarini, hedeflerini netlestirmelerini ve egitim hayatlarini
                kendi ilgi ve yeteneklerine uygun sekilde yonlendirmelerini
                saglamaktir.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Hedeflerin netlestirilerek dogru lise tercihinin yapilmasi.",
                  "Lise turlerinin tanitilarak ilgiye uygun secimlere rehberlik edilmesi.",
                  "Ogrencilerin bilgiye dayali karar verme becerilerinin gelistirilmesi.",
                  "Bilincli tercihlerle uzun vadeli akademik motivasyonun artirilmasi.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5"
                  >
                    <div className="mt-1 shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:p-10">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
                <div className="rounded-xl bg-orange-50 p-2">
                  <Lightbulb className="h-6 w-6 text-orange-600" />
                </div>
                Neden Bu Projeye Ihtiyac Duyuldu?
              </h2>
              <p className="mb-8 leading-relaxed text-slate-600">
                Lise tercih sureci, ogrencilerin gelecekteki egitim ve kariyer
                yolculugunu dogrudan etkileyen kritik bir asamadir. Sinav
                oncesinde liseleri tanimak, sadece sinav motivasyonu acisindan
                degil, ayni zamanda dogru tercih yapabilmek icin de buyuk onem
                tasir.
              </p>

              <div className="space-y-4">
                {reasons.map((item, index) => (
                  <div
                    key={item.title}
                    className="group flex items-start gap-4 rounded-2xl border border-transparent p-4 transition-colors hover:border-slate-100 hover:bg-slate-50"
                  >
                    <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-400 transition-all group-hover:border-orange-200 group-hover:text-orange-500">
                      <span className="flex h-5 w-5 items-center justify-center text-sm font-bold">
                        0{index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="mb-1 font-bold text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:col-span-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="mb-6 flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900">
                <div className="rounded-xl bg-emerald-50 p-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                Hedef Kitle
              </h3>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Dogrudan Hedef Kitle
                  </h4>
                  <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    {["7. ve 8. Sinif Ogrencileri", "Ogrenci Velileri"].map(
                      (item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 text-sm font-medium text-slate-700"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          {item}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Dolayli Hedef Kitle
                  </h4>
                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    {[
                      "Okul Psikolojik Danismanlari",
                      "Sinif Rehber Ogretmenleri",
                      "Okul Yoneticileri",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700"
                      >
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="mb-6 flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900">
                <div className="rounded-xl bg-indigo-50 p-2">
                  <Network className="h-5 w-5 text-indigo-600" />
                </div>
                Proje Paydaslari
              </h3>
              <p className="mb-6 text-sm text-slate-500">
                Bu platform, kurumlar arasi guclu bir is birligi ile hayata
                gecirilmistir.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <Handshake className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Il ve Ilce Milli Egitim Mudurlukleri
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Resmiyet, erisim ve koordinasyon destegi.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Rehberlik ve Arastirma Merkezleri
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Icerik uretimi, denetim ve musavirlik.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

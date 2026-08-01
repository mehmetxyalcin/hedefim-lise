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
    desc: "Öğrenci, hangi liseye yerleşmek istediğini bilirse sınav hazırlık sürecinde daha net bir hedefe odaklanır.",
  },
  {
    title: "İlgi ve Yetenekleri Keşfetme",
    desc: "Farklı okul türleri farklı alanlara yönlendirir. Önceden tanımak, öğrencinin kendi potansiyeline uygun yolu seçmesini sağlar.",
  },
  {
    title: "Yanlış Tercih Riskini Azaltma",
    desc: "Liseleri tanımadan yapılan tercihler motivasyon kaybına yol açabilir. Proje, hayal kırıklıklarını minimuma indirir.",
  },
  {
    title: "Okul Kültürünü Öğrenme",
    desc: "Her okulun sosyal ortamı, kulüpleri, laboratuvarları ve üniversiteye hazırlık desteği farklıdır.",
  },
  {
    title: "Aile ile Ortak Karar Verme",
    desc: "Süreci şeffaflaştırarak aile ve öğrenci arasında sağlıklı bir iletişimle ortak bir tercih yapılmasına yardımcı olur.",
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
              Yolum Bilinçli Tercih
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
            Mersin il genelindeki ortaokul öğrencilerinin, kendi ilgi ve
            yeteneklerine en uygun liseyi seçerek eğitim hayatlarına güçlü bir
            yön vermelerini hedefleyen rehberlik platformu.
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
                Projenin Amacı
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-slate-600">
                Bu projenin amacı, LGS öncesinde öğrencilerin farklı lise
                türlerini ve özelliklerini tanıyarak bilinçli tercihler
                yapmalarını, hedeflerini netleştirmelerini ve eğitim hayatlarını
                kendi ilgi ve yeteneklerine uygun şekilde yönlendirmelerini
                sağlamaktır.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Hedeflerin netleştirilerek doğru lise tercihinin yapılması.",
                  "Lise türlerinin tanıtılarak ilgiye uygun seçimlere rehberlik edilmesi.",
                  "Öğrencilerin bilgiye dayalı karar verme becerilerinin geliştirilmesi.",
                  "Bilinçli tercihlerle uzun vadeli akademik motivasyonun artırılması.",
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
                Neden Bu Projeye İhtiyaç Duyuldu?
              </h2>
              <p className="mb-8 leading-relaxed text-slate-600">
                Lise tercih süreci, öğrencilerin gelecekteki eğitim ve kariyer
                yolculuğunu doğrudan etkileyen kritik bir aşamadır. Sınav
                öncesinde liseleri tanımak, sadece sınav motivasyonu açısından
                değil, aynı zamanda doğru tercih yapabilmek için de büyük önem
                taşır.
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
                    Doğrudan Hedef Kitle
                  </h4>
                  <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    {["7. ve 8. Sınıf Öğrencileri", "Öğrenci Velileri"].map(
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
                    Dolaylı Hedef Kitle
                  </h4>
                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    {[
                      "Okul Psikolojik Danışmanları",
                      "Sınıf Rehber Öğretmenleri",
                      "Okul Yöneticileri",
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
                <div className="rounded-xl bg-blue-50 p-2">
                  <Network className="h-5 w-5 text-blue-600" />
                </div>
                Proje Paydaşları
              </h3>
              <p className="mb-6 text-sm text-slate-500">
                Bu platform, Akdeniz Rehberlik ve Araştırma Merkezi öncülüğünde
                kurumlar arası güçlü bir iş birliği ile hayata geçirilmiştir.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <Handshake className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      İl ve İlçe Millî Eğitim Müdürlükleri
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Resmiyet, erişim ve koordinasyön desteği.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Rehberlik ve Araştırma Merkezleri
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      İçerik üretimi, denetim ve müşavirlik.
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-slate-400">
                      Akdeniz RAM, Toroslar RAM, Yenişehir RAM, Mezitli RAM,
                      Erdemli RAM, Tarsus RAM, Silifke RAM, Mut RAM, Anamur RAM
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="mb-6 flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900">
                <div className="rounded-xl bg-blue-50 p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                Proje Ekibi
              </h3>
              <div className="space-y-3">
                {[
                  "Mehmet Yalçın",
                  "Gülmisal Kurtaran",
                  "Süheyla Küçük",
                  "Recep Bağlı",
                ].map((name) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
                      <span className="text-xs font-bold text-blue-600">
                        {name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

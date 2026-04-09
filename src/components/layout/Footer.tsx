import { BookOpen, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-[#0a0f1c] pt-20 pb-10">
      <div className="absolute top-0 left-1/2 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="mb-6 flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-600/20">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="block text-xl font-bold tracking-tight text-white">
                  Hedefim Lise
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-blue-300/80">
                  Yolum Bilinçli Tercih
                </span>
              </div>
            </div>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-400">
              Öğrencilerin doğru lise tercihleri yapabilmesi amacıyla Akdeniz
              Rehberlik ve Araştırma Merkezi koordinatörlüğünde yürütülen sosyal
              sorumluluk projesidir.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-6 font-semibold tracking-tight text-white">
              Proje Paydaşları
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              {["Akdeniz RAM", "Mezitli RAM", "Tarsus RAM", "Toroslar RAM", "Yenisehir RAM"].map(
                (item) => (
                  <li
                    key={item}
                    className="flex cursor-pointer items-center gap-2 transition-colors hover:text-blue-400"
                  >
                    <div className="h-1 w-1 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="mb-6 font-semibold tracking-tight text-white">
              İletişim & Destek
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                <span>
                  Akdeniz Rehberlik ve Araştırma Merkezi
                  <br />
                  Akdeniz, Mersin
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-blue-500" />
                <span>0 (324) 336 11 84</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-blue-500" />
                <a
                  href="mailto:akdenizram33@gmail.com"
                  className="transition-colors hover:text-blue-400"
                >
                  akdenizram33@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">
            &copy; 2026 Hedefim Lise, Yolum Bilinçli Tercih Projesi.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="transition-colors hover:text-white">
              Gizlilik Politikası
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Kullanım Koşulları
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

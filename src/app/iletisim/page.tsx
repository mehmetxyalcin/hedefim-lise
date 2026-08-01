import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "İletişim | Hedefim Lise",
  description:
    "Okul bilgisi güncelleme, hatalı bilgi bildirimi veya öneri ve görüşleriniz için bizimle iletişime geçin.",
};

export default function IletisimPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Başlık */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">İletişim</h1>
          <p className="mt-3 text-base text-slate-500">
            Soru, öneri veya bilgi güncelleme talepleriniz için bize ulaşın.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sol — Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-lg font-bold text-slate-900">Mesaj Gönder</h2>
              <ContactForm />
            </div>
          </div>

          {/* Sağ — Bilgi kartları */}
          <div className="flex flex-col gap-4">
            {/* İletişim Bilgileri */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                İletişim Bilgileri
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <a
                    href="mailto:akdenizram33@gmail.com"
                    className="text-sm text-slate-700 hover:text-blue-600"
                  >
                    akdenizram33@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="text-sm text-slate-700">Mersin, Türkiye</span>
                </li>
              </ul>
            </div>

            {/* Yanıt Süresi */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-800">Yanıt Süresi</h3>
              </div>
              <p className="text-2xl font-extrabold text-blue-700">1-2 iş günü</p>
              <p className="mt-1 text-xs text-blue-600">
                Mesajınızı aldıktan sonra mümkün olan en kısa sürede yanıt vermeye çalışıyoruz.
              </p>
            </div>

            {/* Sık İletişim Konuları */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                Sık İletişim Konuları
              </h3>
              <ul className="space-y-2">
                {[
                  "Okul bilgisi güncelleme",
                  "Yeni okul ekleme talebi",
                  "Hatalı bilgi bildirimi",
                  "Teknik sorun bildirimi",
                  "Öneri ve görüş paylaşımı",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

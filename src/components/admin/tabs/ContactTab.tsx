import type { School } from "@/types/school";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type Props = { school?: School };

export function ContactTab({ school }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900">İletişim Bilgileri</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tüm alanlar opsiyoneldir. Sadece dolu olanlar detay sayfasında görünür.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Adres</span>
          <textarea
            name="address"
            defaultValue={school?.address ?? ""}
            rows={2}
            placeholder="Örn: Şevket Sümer Mah. 2413 Sok. No:1 Akdeniz/Mersin"
            className={inputCls}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Telefon</span>
            <input
              type="tel"
              name="phone"
              defaultValue={school?.phone ?? ""}
              placeholder="0324 xxx xx xx"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Website</span>
            <input
              type="url"
              name="website"
              defaultValue={school?.website ?? ""}
              placeholder="https://okul.meb.gov.tr"
              className={inputCls}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Ulaşım Bilgisi
          </span>
          <textarea
            name="transportation_info"
            defaultValue={school?.transportationInfo ?? ""}
            rows={3}
            placeholder="Örn: 3 no'lu belediye otobüsü, 20 dakika yürüyüş mesafesi"
            className={inputCls}
          />
        </label>
      </div>
    </section>
  );
}

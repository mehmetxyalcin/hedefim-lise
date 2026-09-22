import type { School } from "@/types/school";
import { adminInput } from "@/components/admin/ui/styles";

const inputCls = adminInput;

type Props = { school?: School };

export function ContactTab({ school }: Props) {
  return (
    <section className="rounded-xl border border-admin-line bg-white p-5 shadow-admin-card">
      <div className="mb-5 border-b border-admin-line-soft pb-4">
        <h2 className="text-base font-bold text-admin-ink">İletişim bilgileri</h2>
        <p className="mt-1 text-sm text-admin-muted">
          Tüm alanlar opsiyoneldir. Sadece dolu olanlar detay sayfasında görünür.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-admin-body">Adres</span>
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
            <span className="mb-2 block text-sm font-semibold text-admin-body">Telefon</span>
            <input
              type="tel"
              name="phone"
              defaultValue={school?.phone ?? ""}
              placeholder="0324 xxx xx xx"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-admin-body">Website</span>
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
          <span className="mb-2 block text-sm font-semibold text-admin-body">
            Ulaşım bilgisi
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

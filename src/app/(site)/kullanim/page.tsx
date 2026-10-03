import type { Metadata } from "next";
import {
  DocLink,
  LegalDocument,
  Mail,
  type LegalSection,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "Hedefim Lise'yi kullanırken geçerli olan koşullar: bilgilerin doğruluğu, resmi kurumlarla ilişki ve sorumluluk.",
  alternates: {
    canonical: "/kullanim",
  },
  openGraph: {
    title: "Kullanım Koşulları | Hedefim Lise",
    description: "Hedefim Lise'yi kullanırken geçerli olan koşullar.",
    url: "/kullanim",
  },
};

const sections: LegalSection[] = [
  {
    id: "sitenin-amaci",
    title: "Sitenin amacı",
    body: (
      <p>
        Hedefim Lise, Mersin&apos;deki liseleri taban puanları, yüzdelik dilimleri, okul
        türleri, meslek alanları ve yerleştirme türleriyle tek yerde gösteren bir
        tercih rehberidir. Amacı öğrencilerin, velilerin ve rehber öğretmenlerin
        gerçekçi bir tercih listesi hazırlamasına yardımcı olmaktır. Siteyi kullanmak
        ücretsizdir ve hesap gerektirmez.
      </p>
    ),
  },
  {
    id: "bilgilerin-dogrulugu",
    title: "Bilgilerin doğruluğu",
    body: (
      <>
        <p>
          Okul bilgileri, kamuya açık resmi kaynaklardan ve okulların paylaştığı
          bilgilerden derlenir ve güncel tutulmaya çalışılır. Yine de bilgilerde hata,
          eksik ya da gecikme olabilir. Bu nedenle:
        </p>
        <ul>
          <li>
            Tercih yapmadan önce bilgileri Millî Eğitim Bakanlığının yayımladığı tercih
            kılavuzu ve resmi duyurularla doğrulayın.
          </li>
          <li>
            Geçmiş yılların taban puanları ve yüzdelik dilimleri sonraki yıl için bir
            garanti değildir; yalnızca fikir verir.
          </li>
          <li>
            Bir hata görürseniz <DocLink href="/iletisim">İletişim</DocLink> sayfasından
            bildirin; inceleyip düzeltiriz.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "resmi-kurumlar",
    title: "Resmi kurumlarla ilişkimiz",
    body: (
      <p>
        Hedefim Lise; Millî Eğitim Bakanlığının, rehberlik ve araştırma merkezlerinin
        (RAM) ya da başka bir kamu kurumunun resmi sitesi değildir ve bu kurumlar
        adına konuşmaz. Sitede adı geçen kurumlar yalnızca başvurulan kaynaklardır.
      </p>
    ),
  },
  {
    id: "sorumluluk",
    title: "Sorumluluğun sınırı",
    body: (
      <p>
        Site bilgilendirme amacıyla, olduğu gibi sunulur. Tercih kararı öğrenciye ve
        ailesine aittir; sitedeki bilgilere dayanılarak verilen kararların
        sonuçlarından Hedefim Lise sorumlu tutulamaz. Sitenin her zaman kesintisiz ya
        da hatasız çalışacağını garanti etmeyiz.
      </p>
    ),
  },
  {
    id: "tercihlerim",
    title: "Tercihlerim listesi",
    body: (
      <p>
        Tercihlerim listesi yalnızca kullandığınız tarayıcıda saklanır. Başka bir
        cihazda ya da tarayıcıda görünmez; tarayıcı verilerini silerseniz liste de
        silinir ve geri getirilemez.
      </p>
    ),
  },
  {
    id: "icerigin-kullanimi",
    title: "İçeriğin kullanımı",
    body: (
      <p>
        Sitedeki metinler ve tasarım Hedefim Lise&apos;ye, okul fotoğraflarının hakları
        ise sahiplerine aittir. Bilgileri kişisel ya da rehberlik amacıyla
        kullanabilir, kaynak göstererek paylaşabilirsiniz. İçeriği toplu olarak
        kopyalamak, otomatik araçlarla çekmek ya da ticari amaçla yeniden yayımlamak
        için önce bizden izin alın.
      </p>
    ),
  },
  {
    id: "baska-siteler",
    title: "Başka sitelere bağlantılar",
    body: (
      <p>
        Sitede okulların ve kurumların kendi sitelerine bağlantılar bulunabilir. Bu
        sitelerin içeriğinden ve gizlilik uygulamalarından sahipleri sorumludur.
      </p>
    ),
  },
  {
    id: "kisisel-veriler",
    title: "Kişisel veriler",
    body: (
      <p>
        Hangi bilgilerinizin nasıl işlendiğini{" "}
        <DocLink href="/gizlilik">Gizlilik ve kişisel veriler</DocLink> sayfasında
        anlatıyoruz.
      </p>
    ),
  },
  {
    id: "degisiklikler",
    title: "Değişiklikler ve iletişim",
    body: (
      <p>
        Bu koşulları gerektiğinde güncelleyebiliriz; son güncelleme tarihi sayfanın
        başında yazar. Sorularınız için <Mail /> adresine yazabilirsiniz.
      </p>
    ),
  },
];

export default function KullanimPage() {
  return (
    <LegalDocument
      title="Kullanım koşulları"
      lead="Hedefim Lise'yi kullanırken geçerli olan kuralları burada kısa ve açık biçimde topladık. Siteyi kullanarak bu koşulları kabul etmiş olursunuz."
      updated={{ iso: "2026-10-03", label: "3 Ekim 2026" }}
      sections={sections}
      related={{ href: "/gizlilik", label: "Gizlilik ve kişisel veriler" }}
    />
  );
}

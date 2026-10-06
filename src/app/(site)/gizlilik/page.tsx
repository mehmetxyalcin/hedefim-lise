import type { Metadata } from "next";
import {
  DataRows,
  DocLink,
  LegalDocument,
  Mail,
  type LegalSection,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Gizlilik ve Kişisel Veriler",
  description:
    "Hedefim Lise'de hangi bilgilerin, neden ve ne kadar süreyle işlendiği: KVKK aydınlatma metni.",
  alternates: {
    canonical: "/gizlilik",
  },
  openGraph: {
    title: "Gizlilik ve Kişisel Veriler | Hedefim Lise",
    description:
      "Hedefim Lise'de hangi bilgilerin, neden ve ne kadar süreyle işlendiği.",
    url: "/gizlilik",
  },
};

// Metindeki her işlem sitenin gerçekte yaptığına dayanır: iletişim formu
// (contact_messages), Google Analytics (kök düzen), Tercihlerim (localStorage),
// soru-cevap ziyaretçi soruları (question_submissions, Sorduklarım localStorage),
// barındırma Hostinger (Litvanya), veritabanı Supabase (Frankfurt).
// Yeni bir veri işleme eklenirse bu sayfa ve tarih birlikte güncellenmeli.
const sections: LegalSection[] = [
  {
    id: "veri-sorumlusu",
    title: "Veri sorumlusu",
    body: (
      <p>
        Kişisel verilerinizden sorumlu olan Hedefim Lise&apos;dir. Bu sayfayla ya da
        verilerinizle ilgili her soru için <Mail /> adresine yazabilirsiniz.
      </p>
    ),
  },
  {
    id: "islenen-bilgiler",
    title: "Hangi bilgileri işliyoruz",
    body: (
      <>
        <p>
          Siteyi kullanmak için hesap açmanız ya da bilgi vermeniz gerekmez. Bilgi
          yalnızca aşağıdaki durumlarda işlenir.
        </p>
        <DataRows
          rows={[
            {
              label: "İletişim formunu gönderdiğinizde",
              what: "Adınız, e-posta adresiniz, isterseniz telefon numaranız, mesajınızın konusu, ilgili okul ve mesajınız.",
              why: "Mesajınızı yanıtlamak; bildirdiğiniz hatalı ya da eksik okul bilgisini incelemek ve düzeltmek.",
              keep: "Mesaj yanıtlandıktan ve gereken düzeltme yapıldıktan sonra en geç 1 yıl içinde silinir.",
            },
            {
              label: "Siteyi gezdiğinizde (Google Analytics)",
              what: "Açtığınız sayfalar, ziyaret süresi, cihaz ve tarayıcı türü, yaklaşık konum (şehir düzeyinde). Çerezlerle toplanır; adınız ya da e-postanız toplanmaz.",
              why: "Sitenin hangi bölümlerinin kullanıldığını görmek ve siteyi iyileştirmek.",
              keep: "Google Analytics ayarlarındaki süre boyunca, en fazla 14 ay.",
            },
            {
              label: "Siteye her bağlandığınızda",
              what: "IP adresiniz, tarih ve saat, açılan sayfa ve tarayıcı bilgisi (teknik kayıtlar).",
              why: "Sitenin güvenliğini sağlamak ve teknik sorunları bulmak.",
              keep: "Barındırma ve altyapı sağlayıcılarımızın belirlediği kısa süre boyunca.",
            },
            {
              label: "Soru-Cevap'ta soru sorduğunuzda",
              what: "Sorunuz, seçtiğiniz konu ve rumuzunuz. Ad, e-posta ya da telefon istemeyiz. Kısa sürede çok soru gönderilmesini önlemek için IP adresinizden günlük değişen, geri çevrilemeyen bir özet tutulur; IP adresinizin kendisi kaydedilmez. Takip bağlantınızdaki anahtarı saklamayız, yalnızca özetini tutarız.",
              why: "Sorunuzu yanıtlamak ve yanıtı size takip bağlantısıyla göstermek. Yanıtlanan bir soru, kimliğinizi belirten bilgi olmadan düzenlenip herkese açık soru-cevaplara eklenebilir.",
              keep: "Soru yanıtlandıktan ya da yanıtlanmayacağı belirlendikten sonra en geç 1 yıl içinde silinir; herkese açık soru-cevaplara eklenen düzenlenmiş metin sitede kalır.",
            },
            {
              label: "Sorduklarım listesini kullandığınızda",
              what: "Sorduğunuz soruların takip bağlantıları. Yalnızca sizin tarayıcınızda saklanır; yanıt durumunu göstermek için bu bağlantılar sitemize gönderilir.",
              why: "Sorularınızın yanıtlanıp yanıtlanmadığını aynı tarayıcıda görebilmeniz.",
              keep: "Listeden çıkardığınızda ya da tarayıcı verilerini sildiğinizde silinir.",
            },
            {
              label: "Tercihlerim listesini kullandığınızda",
              what: "Listeye eklediğiniz okullar. Yalnızca sizin tarayıcınızda saklanır; bize gönderilmez, biz göremeyiz.",
              why: "Listenizi bir sonraki ziyaretinizde aynı tarayıcıda yeniden gösterebilmek.",
              keep: "Okulu listeden çıkardığınızda ya da tarayıcı verilerini sildiğinizde silinir.",
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "hukuki-sebep",
    title: "Hangi hukuki sebebe dayanıyoruz",
    body: (
      <>
        <p>
          Yukarıdaki bilgiler, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun
          (KVKK) 5. maddesinin 2. fıkrasının (f) bendine dayanılarak işlenir: temel hak
          ve özgürlüklerinize zarar vermemek kaydıyla, meşru menfaatimiz için zorunlu
          olması. Bu menfaatler şunlardır:
        </p>
        <ul>
          <li>mesajınızı yanıtlayabilmek ve okul bilgilerini doğru tutabilmek,</li>
          <li>siteyi güvenli biçimde işletebilmek,</li>
          <li>siteyi nasıl kullanıldığına bakarak iyileştirebilmek.</li>
        </ul>
      </>
    ),
  },
  {
    id: "paylasim",
    title: "Bilgileriniz kimlerle paylaşılır",
    body: (
      <>
        <p>
          Bilgilerinizi satmayız ve reklam için kullanmayız. Yalnızca siteyi
          çalıştırmak için hizmet aldığımız şu sağlayıcılar, bu hizmeti verebilmek
          için bilgilere erişebilir:
        </p>
        <ul>
          <li>
            <strong>Hostinger</strong>: sitenin barındırılması (sunucular Litvanya&apos;da),
          </li>
          <li>
            <strong>Supabase</strong>: veritabanı ve dosya saklama (sunucular
            Almanya&apos;da, Frankfurt),
          </li>
          <li>
            <strong>Google</strong>: ziyaret istatistikleri (Google Analytics; ABD dahil
            Google sunucuları).
          </li>
        </ul>
        <p>
          Bu sağlayıcıların sunucuları Türkiye dışında olduğundan, bilgileriniz yurt
          dışına aktarılmış olur. Kanunen zorunlu olduğunda bilgiler yetkili kamu
          kurumlarıyla da paylaşılabilir.
        </p>
      </>
    ),
  },
  {
    id: "cerezler",
    title: "Çerezler",
    body: (
      <>
        <p>
          Çerez, bir sitenin tarayıcınıza bıraktığı küçük bir dosyadır. Hedefim
          Lise&apos;de iki tür çerez kullanılır:
        </p>
        <ul>
          <li>
            <strong>Google Analytics çerezleri</strong> (adı <code>_ga</code> ile
            başlayanlar): ziyaret istatistikleri için.
          </li>
          <li>
            <strong>Oturum çerezi</strong>: yalnızca yönetim paneline giriş yapanlar
            için; ziyaretçilerde kullanılmaz.
          </li>
        </ul>
        <p>
          Tercihlerim ve Sorduklarım listeleri çerez değildir; tarayıcınızın kendi saklama alanında
          durur. Çerezleri tarayıcınızın ayarlarından silebilir ya da
          engelleyebilirsiniz. Google Analytics&apos;i bütün sitelerde kapatmak için
          Google&apos;ın{" "}
          <DocLink href="https://tools.google.com/dlpage/gaoptout">
            devre dışı bırakma eklentisini
          </DocLink>{" "}
          kullanabilirsiniz.
        </p>
      </>
    ),
  },
  {
    id: "haklariniz",
    title: "Haklarınız",
    body: (
      <>
        <p>KVKK&apos;nın 11. maddesine göre şu haklara sahipsiniz:</p>
        <ul>
          <li>kişisel verilerinizin işlenip işlenmediğini öğrenmek,</li>
          <li>işlendiyse buna ilişkin bilgi istemek,</li>
          <li>hangi amaçla işlendiğini ve bu amaca uygun kullanılıp kullanılmadığını öğrenmek,</li>
          <li>yurt içinde ya da yurt dışında kimlere aktarıldığını bilmek,</li>
          <li>eksik ya da yanlış işlendiyse düzeltilmesini istemek,</li>
          <li>silinmesini ya da yok edilmesini istemek,</li>
          <li>düzeltme ve silme işlemlerinin, verilerin aktarıldığı kişilere bildirilmesini istemek,</li>
          <li>yalnızca otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etmek,</li>
          <li>kanuna aykırı işlenmesi yüzünden zarara uğradıysanız zararın giderilmesini istemek.</li>
        </ul>
        <p>
          Bu haklarınızı kullanmak için <Mail /> adresine yazabilirsiniz. Başvurunuzu
          en geç 30 gün içinde yanıtlarız.
        </p>
      </>
    ),
  },
  {
    id: "ogrenciler",
    title: "Öğrenciler için bir not",
    body: (
      <p>
        Hedefim Lise&apos;yi ortaokul öğrencileri de kullanıyor. Siteyi gezmek için
        hiçbir bilgi vermeniz gerekmez. İletişim formuyla bize yazmak isterseniz bunu bir
        velinizle ya da öğretmeninizle birlikte yapmanızı öneririz.
      </p>
    ),
  },
  {
    id: "degisiklikler",
    title: "Bu metindeki değişiklikler",
    body: (
      <p>
        Bu metni sitedeki değişikliklere göre güncelleyebiliriz. Güncel hâli her
        zaman bu sayfadadır; son güncelleme tarihi sayfanın başında yazar.
      </p>
    ),
  },
];

export default function GizlilikPage() {
  return (
    <LegalDocument
      title="Gizlilik ve kişisel veriler"
      lead="Hedefim Lise'yi kullanırken hangi bilgilerinizin işlendiğini, neden işlendiğini ve ne kadar süre saklandığını bu sayfada anlatıyoruz. Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamındaki aydınlatma metnidir."
      updated={{ iso: "2026-10-06", label: "6 Ekim 2026" }}
      sections={sections}
      related={{ href: "/kullanim", label: "Kullanım koşulları" }}
    />
  );
}

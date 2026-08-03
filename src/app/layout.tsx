import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Archivo, Inter, Roboto_Mono, Source_Serif_4 } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-XQF1R11D55";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin-ext"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin-ext"],
});

// Landing dünyası (Yön #3): Archivo = başlık + büyük sayılar (grotesk otorite),
// Source Serif 4 = gövde (ılık okuma). Yalnızca landing'de uygulanır.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin-ext"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin-ext"],
  display: "swap",
});

// Yön sözleşmesi — new-work.md §5. Build çıktısında greplenebilir kalır (seed 87596005).
const DIRECTION_CONTRACT = `
IMPECCABLE DIRECTION CONTRACT — landing (seed 87596005; roll degraded, no challengers)
THESIS: Landing = Mersin yerleştirme kılavuzu, kendinden emin bir veri belgesi olarak; sayılar afiş ölçeğinde, yüzdelik ekseni kahraman. Reddeder: edu-SaaS hero-arama-+-3-kart şablonu ve soğuk steril form.
OWN-WORLD: Soğuk belge nötrü (ground #F3F5F4, ink #16211C) + petrol-teal #0C4A45 (otorite/eylem) + vermilyon #DC5A34 (tek sıcak sinyal: sen/act-here). Archivo (başlık+sayı) + Source Serif 4 (gövde). Tabular rakam.
STORY: Ziyaretçi Mersin liselerinin gerçek ölçeğini ve kendi konumunu tek hamlede görür; verinin güncel/yerel olduğuna inanır; yüzdeliğini girip listeye gider.
FIRST VIEWPORT: Küçük künye → dev başlık (184 afiş ölçeğinde) → tam-genişlik yüzdelik ekseni + satır-içi yüzdelik girişi (vermilyon işaret) → taban çizgisinde dev kanıt figürleri. Birincil eylem = yüzdelik girişi (teal).
FORM: Direction #3/7, grounded list (istatistik bülteni > yüzdelik ekseni > yerleştirme kılavuzu ...); seed 87596005.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
`.trim();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Hedefim Lise",
    template: "%s | Hedefim Lise",
  },
  description:
    "Lise tercih süreci için okul ve meslek alanı bilgilerinin sunulduğu rehber platform.",
  applicationName: "Hedefim Lise",
  openGraph: {
    title: "Hedefim Lise",
    description:
      "Okulları ve meslek alanlarını keşfedin, tercih sürecinizi daha kolay yönetin.",
    siteName: "Hedefim Lise",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Çentikli cihazlarda güvenli alan (env safe-area-inset-*) desteğini açar.
  viewportFit: "cover",
  themeColor: "#0a0f1c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${robotoMono.variable} ${archivo.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div hidden dangerouslySetInnerHTML={{ __html: `<!--\n${DIRECTION_CONTRACT}\n-->` }} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Google Analytics (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Roboto_Mono } from "next/font/google";
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
      className={`${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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

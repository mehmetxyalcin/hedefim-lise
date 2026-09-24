import { Literata, Schibsted_Grotesk } from "next/font/google";

// Blog dünyasının iki yüzü; yalnız .blog kapsamında (BlogFrame) yüklenir.
// Schibsted Grotesk = başlıklar ve plaka figürü, Literata = uzun okuma.
export const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin-ext"],
  display: "swap",
});

export const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin-ext"],
  display: "swap",
  axes: ["opsz"],
});

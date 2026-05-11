import type { Metadata } from "next";
import { FeatureSection } from "@/components/home/FeatureSection";
import { Hero } from "@/components/home/Hero";

export const metadata: Metadata = {
  title: "Hedefim Lise",
  description:
    "Mersin lise tercih süreci için okulları, meslek alanlarını ve tercih rehberliğini tek yerde keşfedin.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hedefim Lise",
    description:
      "Mersin'deki liseleri ve meslek alanlarını keşfedin, tercih sürecinizi güvenilir bilgilerle yönetin.",
    url: "/",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureSection />
    </>
  );
}

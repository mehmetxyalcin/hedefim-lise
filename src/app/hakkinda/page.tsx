import type { Metadata } from "next";
import { AboutProject } from "@/components/about/AboutProject";

export const metadata: Metadata = {
  title: "Hakkında",
  description:
    "Hedefim Lise projesinin amacı, lise tercih sürecindeki öğrenci ve velilere güvenilir rehberlik sunmaktır.",
  alternates: {
    canonical: "/hakkinda",
  },
  openGraph: {
    title: "Hakkında | Hedefim Lise",
    description:
      "Hedefim Lise projesinin lise tercih sürecine nasıl destek olduğunu öğrenin.",
    url: "/hakkinda",
  },
};

export default function HakkindaPage() {
  return <AboutProject />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { createVisitorClient } from "@/lib/supabase/visitor";
import { buildAtlas, type AtlasRowInput } from "@/lib/vocational-atlas";
import { VocationalAtlas } from "@/components/vocational/VocationalAtlas";

export const metadata: Metadata = {
  title: "Meslek Alanları",
  description:
    "Mesleki ve teknik liselerdeki alanları, becerileri ve kariyer yollarını keşfedin.",
  alternates: {
    canonical: "/alanlar",
  },
  openGraph: {
    title: "Meslek Alanları | Hedefim Lise",
    description:
      "Meslek alanlarını inceleyin, ilgi ve yeteneklerinize uygun eğitim yolunu planlayın.",
    url: "/alanlar",
  },
};

// Meslek atlası, anasayfanın belge dünyasında (.landing) durur: afiş başlık,
// altında bir hairline, sonra 8 sütunluk dizin paneli ve 4 sütunluk künye.
export default async function AlanlarPage() {
  const supabase = await createVisitorClient();
  const { data, error } = await supabase
    .from("vocational_fields")
    .select(
      "id, slug, title, branches, school_vocational_fields(school_id, schools(is_active))",
    )
    .order("title");

  const atlas = error ? null : buildAtlas((data ?? []) as AtlasRowInput[]);

  return (
    <div className="landing">
      <section className="container mx-auto max-w-6xl px-6 pt-8 pb-8 md:pt-10">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)] lg:col-span-7">
            Hangi alan, hangi{" "}
            <span className="text-[var(--teal)]">okulda?</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl lg:col-span-5 lg:pb-2">
            İlgi ve yeteneklerinize uygun alanı seçin; ne öğretildiğini ve
            Mersin&apos;de hangi okullarda bulunduğunu inceleyin.
          </p>
        </div>
      </section>

      <div className="border-t border-[var(--line)]">
        {atlas ? (
          <VocationalAtlas atlas={atlas} />
        ) : (
          <div className="container mx-auto max-w-6xl px-6 pt-8 pb-20">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-6 shadow-sm sm:p-8 lg:w-2/3">
              <p className="font-display text-xl font-bold text-[var(--ink)]">
                Alanlar şu anda yüklenemedi.
              </p>
              <p className="mt-2 text-[var(--ink-soft)]">
                Sayfayı biraz sonra yenileyin ya da bu arada{" "}
                <Link
                  href="/okullar"
                  className="font-semibold text-[var(--teal)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--teal)]"
                >
                  okul listesine
                </Link>{" "}
                göz atın.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

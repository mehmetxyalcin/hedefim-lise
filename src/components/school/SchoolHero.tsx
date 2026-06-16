import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { SchoolWithDetails } from "@/types/schoolDetail";

type Props = { school: SchoolWithDetails };

const gradientMap: Record<string, string> = {
  "Anadolu Lisesi": "from-blue-900 via-blue-800 to-blue-700",
  "Fen Lisesi": "from-purple-900 via-purple-800 to-purple-700",
  "Anadolu İmam Hatip Lisesi": "from-green-900 via-green-800 to-green-700",
  "Mesleki ve Teknik Anadolu Lisesi": "from-teal-900 via-teal-800 to-teal-700",
  "Anadolu Meslek ve Teknik Programı": "from-teal-900 via-teal-800 to-teal-700",
  "Sosyal Bilimler Lisesi": "from-indigo-900 via-indigo-800 to-indigo-700",
  "Spor Lisesi": "from-orange-900 via-orange-800 to-orange-700",
  "Güzel Sanatlar Lisesi": "from-pink-900 via-pink-800 to-pink-700",
};

export function SchoolHero({ school }: Props) {
  const heroImage = school.images[0] ?? null;
  const gradient =
    gradientMap[school.type] ?? "from-slate-900 via-slate-800 to-slate-700";

  return (
    <section className="relative w-full min-h-[420px]">
      {heroImage ? (
        <>
          <Image
            src={heroImage}
            alt={school.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        {/* Breadcrumb */}
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-white/60">
          <Link href="/" className="transition-colors hover:text-white">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link href="/okullar" className="transition-colors hover:text-white">
            Okullar
          </Link>
          <span>/</span>
          <Link
            href={`/okullar?tur=${encodeURIComponent(school.type)}`}
            className="transition-colors hover:text-white"
          >
            {school.type}
          </Link>
          <span>/</span>
          <span className="text-white/90">{school.name}</span>
        </nav>

        {/* Okul Türü Badge */}
        <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {school.type}
        </span>

        {/* Okul Adı */}
        <h1 className="mb-3 text-3xl font-bold leading-tight text-white md:text-5xl">
          {school.name}
        </h1>

        {/* İlçe */}
        <div className="flex items-center gap-1.5 text-white/80">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="text-sm md:text-base">{school.district}</span>
        </div>
      </div>
    </section>
  );
}

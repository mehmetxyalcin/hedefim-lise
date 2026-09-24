import Image from "next/image";
import { cn } from "@/lib/cn";
import { plateTone, type PlateTone } from "@/lib/blog";

type PlatePost = {
  category: string;
  highlight: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
};

const tones: Record<PlateTone, { plate: string; figure: string }> = {
  lemon: { plate: "bg-blog-lemon text-blog-ink", figure: "text-blog-ink" },
  ink: { plate: "bg-blog-ink text-white", figure: "text-blog-lemon" },
  paper: { plate: "bg-blog-sheet text-blog-ink", figure: "text-blog-ink" },
};

// Figür uzunluğuna göre boyut: kısa rakam plakayı doldurur, uzun ifade
// taşmadan iki satıra iner. Plakanın hem genişliği (cqw) hem yüksekliği (cqh)
// sınırdır; böylece geniş yazı kapağında da figür plakadan taşmaz.
function figureSize(text: string, fallback: boolean) {
  if (fallback) return "text-[min(12cqw,26cqh)] leading-[0.95] tracking-[-0.035em]";
  const length = [...text].length;
  if (length <= 3) return "text-[min(36cqw,64cqh)] leading-[0.8] tracking-[-0.04em]";
  if (length <= 6) return "text-[min(24cqw,50cqh)] leading-[0.85] tracking-[-0.04em]";
  if (length <= 10) return "text-[min(16cqw,40cqh)] leading-[0.9] tracking-[-0.04em]";
  return "text-[min(12cqw,26cqh)] leading-[0.95] tracking-[-0.035em]";
}

/**
 * Yazının kapağı: ders kitabı bölüm plakası. Görsel yoksa kategori tonunda
 * çizgili zemin ve büyük figür (kapak vurgusu, yoksa kategori adı). Görsel
 * yüklenmişse aynı ton plakanın çerçevesi içinde durur; vurgu varsa köşede
 * figür etiketi olarak kalır. Böylece fotoğraflı yazı da plaka sisteminde kalır.
 */
export function Plate({
  post,
  className,
  sizes,
  tone: toneOverride,
  priority = false,
  animate = false,
  figureAt = "bottom",
}: {
  post: PlatePost;
  className?: string;
  sizes: string;
  /** Kategori tonunu ezmek için (ör. öne çıkan yazı her zaman limon). */
  tone?: PlateTone;
  priority?: boolean;
  animate?: boolean;
  /** Geniş ve alçak kapakta figür üstte durur ki ilk ekranda görünsün. */
  figureAt?: "top" | "bottom";
}) {
  const tone = tones[toneOverride ?? plateTone(post.category)];
  const highlight = post.highlight?.trim() || null;

  if (post.coverImageUrl) {
    return (
      <div className={cn("relative overflow-hidden rounded-[4px] p-[2.5%] [container-type:size]", tone.plate, className)}>
        <div className="relative h-full w-full overflow-hidden rounded-[2px] bg-blog-sheet">
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ""}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        </div>
        {highlight && (
          <p
            aria-hidden="true"
            className={cn(
              // Küçük önizlemede okunmayacağı için gizlenir.
              "absolute bottom-0 left-0 rounded-tr-[4px] pt-[1.5%] @max-[260px]:hidden pr-[3%] pb-[2.5%] pl-[2.5%] font-blog-display text-[min(9cqw,18cqh)] leading-[0.9] font-extrabold tracking-[-0.04em]",
              tone.plate,
              tone.figure,
            )}
          >
            {highlight}
          </p>
        )}
      </div>
    );
  }

  const fallback = !highlight;
  const figure = highlight ?? post.category;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "blog-plate-ruled relative overflow-hidden rounded-[4px] select-none [container-type:size]",
        tone.plate,
        className,
      )}
    >
      <p
        className={cn(
          "absolute inset-x-[6%] font-blog-display font-extrabold text-balance",
          figureAt === "top" ? "top-[10%]" : "bottom-[7%]",
          figureSize(figure, fallback),
          tone.figure,
          animate && "blog-plate-in",
        )}
      >
        {figure}
      </p>
    </div>
  );
}

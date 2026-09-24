import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/cn";
import { authorContacts, authorInitials, bioParagraphs, plateTone, type AuthorContactKind } from "@/lib/blog";
import type { BlogAuthor } from "@/types/blog";

const monogramTones = {
  lemon: "bg-blog-lemon text-blog-ink",
  ink: "bg-blog-ink text-blog-lemon",
  paper: "bg-blog-sheet text-blog-ink",
} as const;

/** Yazarın fotoğrafı; yoksa adından türeyen tonda, baş harfli blog plakası. */
export function AuthorAvatar({
  author,
  sizes,
  className,
  priority = false,
}: {
  author: Pick<BlogAuthor, "name" | "photoUrl">;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (author.photoUrl) {
    return (
      <div className={cn("relative aspect-square overflow-hidden rounded-[4px] bg-blog-sheet", className)}>
        <Image src={author.photoUrl} alt={author.name} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={author.name}
      className={cn(
        "blog-plate-ruled relative aspect-square overflow-hidden rounded-[4px] select-none [container-type:size]",
        monogramTones[plateTone(author.name)],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-[8%] left-[9%] font-blog-display text-[min(44cqw,44cqh)] leading-[0.8] font-extrabold tracking-[-0.04em]"
      >
        {authorInitials(author.name)}
      </span>
    </div>
  );
}

// Marka ikonları lucide'da yok; aynı çizgi diliyle (24 kutu, 2 kalınlık) çizildi.
function BrandIcon({ kind, className }: { kind: "instagram" | "x" | "linkedin" | "youtube"; className?: string }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  switch (kind) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <path d="M17.5 6.5h.01" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M4 4l11.733 16h4.267l-11.733-16z" />
          <path d="M4 20l6.768-6.768m2.46-2.46L20 4" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      );
  }
}

function ContactIcon({ kind }: { kind: AuthorContactKind }) {
  const className = "h-4 w-4 shrink-0";
  if (kind === "email") return <Mail aria-hidden="true" className={className} />;
  if (kind === "phone") return <Phone aria-hidden="true" className={className} />;
  if (kind === "website") return <Globe aria-hidden="true" className={className} />;
  return <BrandIcon kind={kind} className={className} />;
}

/** İletişim satırları: ikon, tür etiketi ve değer; tümü bağlantıdır. */
export function AuthorContactList({ author, className }: { author: BlogAuthor; className?: string }) {
  const contacts = authorContacts(author);
  if (!contacts.length) return null;
  return (
    <dl className={cn("divide-y divide-blog-line border-y border-blog-line font-blog-display", className)}>
      {contacts.map((contact) => {
        const external = contact.kind !== "email" && contact.kind !== "phone";
        return (
          <div key={contact.kind} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4 py-3 text-[0.9375rem]">
            <dt className="flex items-center gap-2.5 text-blog-muted">
              <ContactIcon kind={contact.kind} />
              {contact.label}
            </dt>
            <dd className="min-w-0">
              <a
                href={contact.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer me" } : {})}
                className="blog-link font-semibold break-words text-blog-ink"
              >
                {contact.display}
                {external && <span className="sr-only"> (yeni sekmede açılır)</span>}
              </a>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function AuthorBio({ bio, className }: { bio: string | null; className?: string }) {
  const paragraphs = bioParagraphs(bio);
  if (!paragraphs.length) return null;
  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

/** Yazının sonundaki "Yazar hakkında" kartı. */
export function AuthorCard({ author, className }: { author: BlogAuthor; className?: string }) {
  const [firstParagraph] = bioParagraphs(author.bio);
  return (
    <section
      aria-labelledby="yazar-hakkinda"
      className={cn("grid grid-cols-[5.5rem_minmax(0,1fr)] gap-5 rounded-[4px] bg-blog-sheet p-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6 sm:p-6", className)}
    >
      <AuthorAvatar author={author} sizes="112px" />
      <div className="min-w-0">
        <h2 id="yazar-hakkinda" className="font-blog-display text-[1.25rem] leading-snug font-bold tracking-[-0.015em] text-blog-ink">
          <span className="sr-only">Yazar hakkında: </span>
          {author.name}
        </h2>
        {author.title && <p className="font-blog-display text-[0.9375rem] text-blog-ink-soft">{author.title}</p>}
        {firstParagraph && <p className="mt-3 line-clamp-3 text-[1rem] leading-relaxed text-blog-ink-soft">{firstParagraph}</p>}
        <Link
          href={`/blog/yazar/${author.slug}`}
          className="mt-3 inline-flex items-center gap-1.5 font-blog-display text-[0.9375rem] font-semibold text-blog-ink hover:underline hover:decoration-blog-lemon hover:decoration-[3px] hover:underline-offset-4"
        >
          {authorContacts(author).length ? "Profil ve iletişim bilgileri" : "Profil ve diğer yazıları"}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

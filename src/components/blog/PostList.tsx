import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatBlogDate, formatBlogDateShort, highlightSegments, readingMinutes } from "@/lib/blog";
import type { BlogPost } from "@/types/blog";
import { Plate } from "./Plate";

const titleLink =
  "decoration-blog-lemon decoration-[3px] underline-offset-4 group-hover:underline after:absolute after:inset-0 after:content-['']";

export function PostMeta({ post, className }: { post: BlogPost; className?: string }) {
  return (
    <p className={cn("font-blog-display text-[0.875rem] text-blog-muted", className)}>
      <span className="font-semibold text-blog-ink">{post.category}</span>
      <span aria-hidden="true"> · </span>
      <time dateTime={post.publishedAt ?? undefined} className="tabular-nums">
        {formatBlogDate(post.publishedAt)}
      </time>
      <span aria-hidden="true"> · </span>
      <span className="tabular-nums">{readingMinutes(post.body)} dk okuma</span>
    </p>
  );
}

/** Aranan kelimeler fosforlu kalemle işaretlenir. */
function Highlighted({ text, query }: { text: string; query?: string }) {
  if (!query) return text;
  return highlightSegments(text, query).map((segment, index) =>
    segment.match ? (
      <mark key={index} className="blog-mark">
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

/**
 * Eşit olmayan yazı seti: bir büyük plakalı yazı ve yanında metin öncelikli,
 * küçük plakalı girişler. Üç eş kart ızgarası yerine bölüm sayfası düzeni.
 */
export function PostSet({ posts, featuredId }: { posts: BlogPost[]; featuredId?: string }) {
  const toneOf = (post: BlogPost) => (post.id === featuredId ? ("lemon" as const) : undefined);
  const [first, ...rest] = posts;
  if (!first) return null;

  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
      <article className={cn("group relative flex flex-col", rest.length ? "lg:col-span-5" : "lg:col-span-6")}>
        <Plate post={first} tone={toneOf(first)} sizes="(min-width: 1024px) 480px, 100vw" className="aspect-[16/9] w-full" />
        <h3 className="mt-5 font-blog-display text-[1.375rem] leading-snug font-bold tracking-[-0.02em] text-balance text-blog-ink sm:text-[1.5rem]">
          <Link href={`/blog/${first.slug}`} className={titleLink}>
            {first.title}
          </Link>
        </h3>
        <p className="mt-3 max-w-[60ch] text-[1.0625rem] leading-relaxed text-blog-ink-soft">{first.excerpt}</p>
        <PostMeta post={first} className="mt-4" />
      </article>

      {rest.length > 0 && (
        <ul className="flex flex-col divide-y divide-blog-line border-t border-blog-line lg:col-span-7 lg:border-t-0">
          {rest.map((post) => (
            <li key={post.id} className="group relative grid grid-cols-[minmax(0,1fr)_5.5rem] gap-6 py-6 first:pt-6 lg:first:pt-0 sm:grid-cols-[minmax(0,1fr)_9rem]">
              <div className="min-w-0">
                <h3 className="font-blog-display text-[1.1875rem] leading-snug font-bold tracking-[-0.015em] text-balance text-blog-ink">
                  <Link href={`/blog/${post.slug}`} className={titleLink}>
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-[1rem] leading-relaxed text-blog-ink-soft">{post.excerpt}</p>
                <PostMeta post={post} className="mt-3" />
              </div>
              <Plate post={post} tone={toneOf(post)} sizes="144px" className="aspect-square w-full self-start" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** İçindekiler satırı: tarih sütunu, başlık, noktalı yol, kategori ve ayrı süre sütunu. */
export function ContentsRow({ post, query }: { post: BlogPost; query?: string }) {
  const minutes = readingMinutes(post.body);
  return (
    <li className="group relative border-b border-blog-line">
      <div className="grid gap-x-8 gap-y-1 py-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-baseline md:grid-cols-[8.5rem_minmax(0,1fr)_3.5rem]">
        <time
          dateTime={post.publishedAt ?? undefined}
          className="font-blog-display text-[0.875rem] text-blog-muted tabular-nums"
        >
          {formatBlogDateShort(post.publishedAt)}
        </time>
        <div className="flex min-w-0 items-baseline gap-3">
          <h3 className="min-w-0 font-blog-display text-[1.125rem] leading-snug font-semibold text-blog-ink sm:text-[1.1875rem]">
            <Link href={`/blog/${post.slug}`} className={titleLink}>
              <Highlighted text={post.title} query={query} />
            </Link>
          </h3>
          <span aria-hidden="true" className="blog-leader hidden md:block" />
          <span className="hidden shrink-0 font-blog-display text-[0.875rem] whitespace-nowrap text-blog-muted md:inline">
            {post.category}
          </span>
        </div>
        <span className="hidden text-right font-blog-display text-[0.9375rem] font-semibold text-blog-ink tabular-nums md:block">
          {minutes} dk
        </span>
        <p className="font-blog-display text-[0.8125rem] text-blog-muted sm:col-start-2 md:hidden">
          {post.category} · <span className="tabular-nums">{minutes} dk okuma</span>
        </p>
      </div>
    </li>
  );
}

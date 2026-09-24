import Link from "next/link";
import { cn } from "@/lib/cn";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { categoryParam, formatBlogDate, readingMinutes } from "@/lib/blog";
import { parseMarkdown, tableOfContents } from "@/lib/blog-markdown";
import type { BlogPost } from "@/types/blog";
import { ArticleBody } from "./ArticleBody";
import { AuthorAvatar, AuthorCard } from "./Author";
import { ArticleToc } from "./ArticleToc";
import { Plate } from "./Plate";
import { PostSet } from "./PostList";
import { ShareActions } from "./ShareActions";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Yazı sayfasının tamamı. Public rota ve yönetimdeki önizleme aynı bileşeni
 * kullanır; böylece önizleme yayındaki görünümün birebir aynısıdır.
 */
export function Article({
  post,
  url,
  related = [],
  featuredId,
  preview = false,
}: {
  post: BlogPost;
  url: string;
  related?: BlogPost[];
  /** Blogun en yeni yazısı; plakası her yerde limon. */
  featuredId?: string;
  preview?: boolean;
}) {
  const blocks = parseMarkdown(post.body);
  const toc = tableOfContents(blocks);
  const minutes = readingMinutes(post.body);
  const updated =
    post.publishedAt && new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > DAY
      ? post.updatedAt
      : null;

  return (
    <article className="pb-24 sm:pb-32">
      <header className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 sm:pt-12">
        <nav aria-label="Konum" className="font-blog-display text-[0.875rem]">
          <ol className="flex flex-wrap items-center gap-1 text-blog-muted">
            <li>
              <Link href="/blog" className="rounded-[3px] px-1 py-0.5 hover:bg-blog-sheet hover:text-blog-ink">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                href={`/blog?kategori=${categoryParam(post.category)}`}
                className="rounded-[3px] px-1 py-0.5 hover:bg-blog-sheet hover:text-blog-ink"
              >
                {post.category}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-6 lg:mt-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-9 xl:col-span-8">
            <h1 className="font-blog-display text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.035em] text-balance text-blog-ink sm:text-[3rem] lg:text-[3.75rem]">
              {post.title}
            </h1>
            <p className="mt-6 max-w-[40rem] text-[1.1875rem] leading-[1.6] text-blog-ink-soft sm:text-[1.3125rem]">
              {post.excerpt}
            </p>
          </div>
        </div>

        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-blog-ink pt-4 font-blog-display text-[0.875rem]">
          <div>
            <dt className="text-blog-muted">Yazan</dt>
            <dd className="font-semibold text-blog-ink">
              {post.author ? (
                <Link
                  href={`/blog/yazar/${post.author.slug}`}
                  className="inline-flex items-center gap-2 decoration-blog-lemon decoration-[3px] underline-offset-4 hover:underline"
                >
                  <AuthorAvatar author={post.author} sizes="24px" className="w-6" />
                  {post.author.name}
                </Link>
              ) : (
                post.authorName
              )}
            </dd>
          </div>
          <div>
            <dt className="text-blog-muted">Yayın</dt>
            <dd className="font-semibold text-blog-ink tabular-nums">
              {post.publishedAt ? (
                <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
              ) : (
                "Taslak"
              )}
            </dd>
          </div>
          {updated && (
            <div>
              <dt className="text-blog-muted">Güncelleme</dt>
              <dd className="font-semibold text-blog-ink tabular-nums">
                <time dateTime={updated}>{formatBlogDate(updated)}</time>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-blog-muted">Okuma</dt>
            <dd className="font-semibold text-blog-ink tabular-nums">{minutes} dakika</dd>
          </div>
        </dl>

        <Plate
          post={post}
          tone={post.id === featuredId ? "lemon" : undefined}
          priority
          animate
          figureAt="top"
          sizes="(min-width: 1240px) 1192px, 100vw"
          className="mt-8 aspect-[16/10] w-full sm:aspect-[5/2] lg:aspect-[3/1]"
        />
      </header>

      <div className="mx-auto mt-10 grid max-w-[1240px] gap-8 px-4 sm:px-6 lg:mt-16 lg:grid-cols-12 lg:gap-12">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <ArticleToc entries={toc} articleId="yazi-govdesi" />
            {!preview && (
              <div className="mt-8 hidden border-t border-blog-line pt-6 lg:block">
                <p className="mb-3 font-blog-display text-[0.8125rem] font-bold tracking-[0.06em] text-blog-ink uppercase">
                  Paylaş
                </p>
                <ShareActions url={url} title={post.title} className="flex-col items-start" />
              </div>
            )}
          </div>
        </aside>

        <div id="yazi-govdesi" className="min-w-0 lg:col-span-7">
          <div className="max-w-[68ch]">
            <ArticleBody blocks={blocks} />
          </div>

          {post.author && <AuthorCard author={post.author} className="mt-14 max-w-[68ch]" />}

          <footer className={cn("max-w-[68ch] border-t border-blog-ink pt-6", post.author ? "mt-10" : "mt-14")}>
            {!preview && (
              <div className="lg:hidden">
                <p className="mb-3 font-blog-display text-[0.9375rem] font-semibold text-blog-ink">Bu yazıyı paylaşın</p>
                <ShareActions url={url} title={post.title} />
              </div>
            )}
            <p className="mt-6 text-[1rem] leading-relaxed text-blog-ink-soft lg:mt-0">
              Yazıda eksik ya da hatalı bir bilgi mi gördünüz?{" "}
              <Link href="/iletisim" className="blog-link font-semibold text-blog-ink">
                Bize bildirin
              </Link>
              ; kontrol edip düzeltelim.
            </p>
          </footer>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <aside className="mt-16 grid gap-6 rounded-[4px] bg-blog-ink px-6 py-8 text-white sm:px-10 sm:py-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-8">
            <h2 className="font-blog-display text-[1.5rem] leading-tight font-bold tracking-[-0.02em] sm:text-[1.75rem]">
              Okuduklarınızı okul listesinde deneyin.
            </h2>
            <p className="mt-3 text-[1.0625rem] leading-[1.65] text-white/75">
              Mersin&apos;deki liseleri yüzdelik dilim, OBP, ilçe ve okul türüne göre süzün; beğendiklerinizi Tercihlerim
              listesine ekleyin.
            </p>
          </div>
          <div className="lg:col-span-4 lg:justify-self-end">
            <Link
              href="/okullar"
              className="inline-flex items-center gap-2 rounded-[4px] bg-blog-lemon px-5 py-3 font-blog-display text-[0.9375rem] font-semibold text-blog-ink transition-colors duration-150 hover:bg-white"
            >
              Okulları karşılaştır
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </aside>

        {related.length > 0 && (
          <section aria-labelledby="siradaki-yazilar" className="mt-20">
            <div className="mb-8 flex items-baseline justify-between gap-4 border-t-2 border-blog-ink pt-4">
              <h2
                id="siradaki-yazilar"
                className="font-blog-display text-[1.375rem] font-bold tracking-[-0.02em] text-blog-ink sm:text-[1.5rem]"
              >
                Sıradaki yazılar
              </h2>
              <Link href="/blog" className="blog-link font-blog-display text-[0.9375rem] font-semibold text-blog-ink">
                Tüm yazılar
              </Link>
            </div>
            <PostSet posts={related} featuredId={featuredId} />
          </section>
        )}
      </div>
    </article>
  );
}

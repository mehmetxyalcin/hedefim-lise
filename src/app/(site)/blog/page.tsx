import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { categoriesOf, clampPage, filterPosts, pageCount } from "@/lib/blog";
import { getPublishedPosts } from "@/lib/blog-data";
import { Plate } from "@/components/blog/Plate";
import { ContentsRow, PostMeta, PostSet } from "@/components/blog/PostList";
import type { BlogPost } from "@/types/blog";

const DESCRIPTION =
  "Lise tercihinde merak edilenleri sade bir dille anlatan rehber yazılar: yerleştirme kuralları, puanların okunuşu, takvim ve okul seçimi.";

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "Hedefim Lise Blog" }] },
  },
  openGraph: {
    title: "Blog | Hedefim Lise",
    description: DESCRIPTION,
    url: "/blog",
    type: "website",
  },
};

// Öne çıkan + üç son yazıdan sonra İçindekiler başlar; arşiv bu boyutta sayfalanır.
const FEATURED = 4;
const PAGE_SIZE = 12;

type PageProps = {
  searchParams: Promise<{ kategori?: string; ara?: string; sayfa?: string }>;
};

function blogHref(params: { kategori?: string; ara?: string; sayfa?: number }) {
  const query = new URLSearchParams();
  if (params.kategori) query.set("kategori", params.kategori);
  if (params.ara) query.set("ara", params.ara);
  if (params.sayfa && params.sayfa > 1) query.set("sayfa", String(params.sayfa));
  const qs = query.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

const pagerLink =
  "inline-flex h-11 items-center gap-2 rounded-[4px] px-4 font-blog-display text-[0.9375rem] font-semibold text-blog-ink transition-colors duration-150 hover:bg-blog-sheet";

function Pager({ page, total, kategori, ara }: { page: number; total: number; kategori: string; ara: string }) {
  if (total <= 1) return null;
  return (
    <nav aria-label="Sayfalar" className="mt-8 flex items-center justify-between gap-4 font-blog-display">
      {page > 1 ? (
        <Link href={blogHref({ kategori, ara, sayfa: page - 1 })} className={pagerLink}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Önceki
        </Link>
      ) : (
        <span />
      )}
      <p className="text-[0.875rem] text-blog-muted tabular-nums">
        Sayfa {page} / {total}
      </p>
      {page < total ? (
        <Link href={blogHref({ kategori, ara, sayfa: page + 1 })} className={pagerLink}>
          Sonraki
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function Lead({ post, featured }: { post: BlogPost; featured: boolean }) {
  return (
    <article className="group relative grid gap-7 lg:grid-cols-12 lg:gap-12">
      <Plate
        post={post}
        tone={featured ? "lemon" : undefined}
        priority
        animate
        sizes="(min-width: 1280px) 700px, (min-width: 1024px) 56vw, 100vw"
        className="aspect-[4/3] w-full sm:aspect-[16/10] lg:col-span-7"
      />
      <div className="flex flex-col justify-center lg:col-span-5">
        <h2 className="font-blog-display text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-blog-ink sm:text-[2.5rem] xl:text-[2.875rem]">
          <Link
            href={`/blog/${post.slug}`}
            className="decoration-blog-lemon decoration-[4px] underline-offset-[6px] group-hover:underline after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-5 text-[1.125rem] leading-[1.65] text-blog-ink-soft sm:text-[1.1875rem]">{post.excerpt}</p>
        <PostMeta post={post} className="mt-6" />
        <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-[4px] bg-blog-ink px-5 py-3 font-blog-display text-[0.9375rem] font-semibold text-white transition-colors duration-150 group-hover:bg-blog-lemon group-hover:text-blog-ink">
          Yazıyı oku
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

function SectionHeading({ id, children, aside }: { id: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-baseline justify-between gap-4 border-t-2 border-blog-ink pt-4">
      <h2 id={id} className="font-blog-display text-[1.375rem] font-bold tracking-[-0.02em] text-blog-ink sm:text-[1.5rem]">
        {children}
      </h2>
      {aside}
    </div>
  );
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const all = await getPublishedPosts();
  const categories = categoriesOf(all);
  const kategori = categories.some((category) => category.param === params.kategori) ? params.kategori! : "";
  const ara = (params.ara ?? "").trim().slice(0, 100);
  const posts = filterPosts(all, { kategori, ara });
  const searching = Boolean(ara);
  const activeCategory = categories.find((category) => category.param === kategori);

  // Arama sonuçları düz liste; diğer durumlarda ilk dört yazı vitrine çıkar.
  const showcase = searching ? [] : posts.slice(0, FEATURED);
  const archive = searching ? posts : posts.slice(FEATURED);
  const totalPages = pageCount(archive.length, PAGE_SIZE);
  const page = clampPage(params.sayfa, archive.length, PAGE_SIZE);
  const archivePage = archive.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showShowcase = page === 1 && showcase.length > 0;
  const [lead, ...recent] = showcase;
  // En yeni yazının plakası her yerde limondur: vitrinde, kendi sayfasında, önerilerde.
  const featuredId = all[0]?.id;

  return (
    <div className="pb-24 sm:pb-32">
      <header className="mx-auto max-w-[1240px] px-4 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h1 className="font-blog-display text-[4rem] leading-[0.85] font-extrabold tracking-[-0.04em] text-blog-ink sm:text-[5.5rem] lg:col-span-7 lg:text-[6rem]">
            Blog
          </h1>
          <div className="lg:col-span-5 lg:pb-2">
            <p className="text-[1.125rem] leading-[1.6] text-blog-ink-soft sm:text-[1.1875rem]">{DESCRIPTION}</p>
            {all.length > 0 && (
              <p className="mt-3 font-blog-display text-[0.875rem] text-blog-muted tabular-nums">
                {all.length} yazı ·{" "}
                <a href="/blog/rss.xml" className="blog-link text-blog-ink">
                  RSS ile takip et
                </a>
              </p>
            )}
          </div>
        </div>

        {all.length > 0 && (
          <div className="mt-10 flex flex-col gap-4 border-y border-blog-ink py-3 lg:mt-14 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Kategoriler" className="hide-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
              <ul className="flex gap-1 font-blog-display whitespace-nowrap">
                {[{ name: "Tümü", param: "", count: all.length }, ...categories].map((category) => {
                  const active = category.param === kategori && !searching;
                  return (
                    <li key={category.param || "tumu"}>
                      <Link
                        href={blogHref({ kategori: category.param })}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative inline-flex h-10 items-center gap-1.5 rounded-[4px] px-3 text-[0.9375rem] transition-colors duration-150",
                          active
                            ? "bg-blog-lemon font-semibold text-blog-ink"
                            : "text-blog-ink-soft hover:bg-blog-sheet hover:text-blog-ink",
                        )}
                      >
                        {category.name}
                        <span className={cn("text-[0.8125rem] tabular-nums", active ? "text-blog-lemon-ink" : "text-blog-muted")}>
                          {category.count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <form action="/blog" method="get" role="search" className="relative w-full lg:w-72">
              {kategori && <input type="hidden" name="kategori" value={kategori} />}
              <label htmlFor="blog-ara" className="sr-only">
                Yazılarda ara
              </label>
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-blog-muted" />
              <input
                id="blog-ara"
                type="search"
                name="ara"
                defaultValue={ara}
                placeholder="Yazılarda ara"
                className="h-10 w-full rounded-[4px] border border-blog-line bg-white pr-3 pl-9 font-blog-display text-[0.9375rem] text-blog-ink outline-none placeholder:text-blog-muted focus:border-blog-ink"
              />
            </form>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        {all.length === 0 ? (
          <section className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-12" aria-labelledby="blog-bos">
            <Plate
              post={{ category: "Genel", highlight: "Yakında", coverImageUrl: null, coverImageAlt: null }}
              tone="lemon"
              sizes="(min-width: 1024px) 700px, 100vw"
              className="aspect-[16/10] w-full lg:col-span-7"
            />
            <div className="flex flex-col justify-center lg:col-span-5">
              <h2 id="blog-bos" className="font-blog-display text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-blog-ink">
                İlk yazılar hazırlanıyor
              </h2>
              <p className="mt-4 text-[1.125rem] leading-[1.65] text-blog-ink-soft">
                Yazılar yayımlandığında burada görünecek. O zamana kadar sık sorulan soruların yanıtlarına ya da okul
                listesine göz atabilirsiniz.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 font-blog-display text-[0.9375rem] font-semibold">
                <Link href="/soru-cevap" className="inline-flex items-center gap-2 rounded-[4px] bg-blog-ink px-5 py-3 text-white hover:bg-blog-ink-soft">
                  Soru-Cevap
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link href="/okullar" className="inline-flex items-center gap-2 rounded-[4px] px-5 py-3 text-blog-ink hover:bg-blog-sheet">
                  Okulları incele
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <>
            {showShowcase && lead && (
              <section aria-label="Öne çıkan yazı" className="mt-10 lg:mt-14">
                <Lead post={lead} featured={lead.id === featuredId} />
              </section>
            )}

            {showShowcase && recent.length > 0 && (
              <section aria-labelledby="son-yazilar" className="mt-16 sm:mt-20">
                <SectionHeading id="son-yazilar">Son yazılar</SectionHeading>
                <PostSet posts={recent} featuredId={featuredId} />
              </section>
            )}

            {(archive.length > 0 || posts.length === 0) && (
              <section aria-labelledby="icindekiler" className={cn(showShowcase ? "mt-16 sm:mt-20" : "mt-10 lg:mt-14")}>
                <SectionHeading
                  id="icindekiler"
                  aside={
                    (searching || kategori) && (
                      <Link
                        href="/blog"
                        className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-1 font-blog-display text-[0.875rem] font-semibold text-blog-ink hover:bg-blog-sheet"
                      >
                        <X aria-hidden="true" className="h-3.5 w-3.5" />
                        Filtreyi kaldır
                      </Link>
                    )
                  }
                >
                  {searching ? (
                    <>
                      “{ara}” için <span className="tabular-nums">{posts.length}</span> sonuç
                    </>
                  ) : activeCategory ? (
                    `${activeCategory.name}: diğer yazılar`
                  ) : (
                    "İçindekiler"
                  )}
                </SectionHeading>

                {posts.length === 0 ? (
                  <div className="rounded-[4px] bg-blog-sheet px-6 py-10 text-center">
                    <p className="font-blog-display text-[1.125rem] font-semibold text-blog-ink">Aramanızla eşleşen yazı bulunamadı.</p>
                    <p className="mt-2 text-blog-ink-soft">Farklı bir kelime deneyin ya da tüm yazılara dönün.</p>
                    <Link href="/blog" className="blog-link mt-4 inline-block font-blog-display font-semibold text-blog-ink">
                      Tüm yazılar
                    </Link>
                  </div>
                ) : (
                  <>
                    <ol className="border-t border-blog-line">
                      {archivePage.map((post) => (
                        <ContentsRow key={post.id} post={post} query={ara} />
                      ))}
                    </ol>
                    <Pager page={page} total={totalPages} kategori={kategori} ara={ara} />
                  </>
                )}
              </section>
            )}

            <aside className="mt-20 grid gap-6 rounded-[4px] bg-blog-ink px-6 py-8 text-white sm:px-10 sm:py-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <h2 className="font-blog-display text-[1.5rem] leading-tight font-bold tracking-[-0.02em] sm:text-[1.75rem]">
                  Okumak bir adım, karşılaştırmak ikinci adım.
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
          </>
        )}
      </div>
    </div>
  );
}

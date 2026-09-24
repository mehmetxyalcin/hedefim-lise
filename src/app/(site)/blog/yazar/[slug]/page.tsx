import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AuthorAvatar, AuthorBio, AuthorContactList } from "@/components/blog/Author";
import { ContentsRow, PostSet } from "@/components/blog/PostList";
import { authorContacts, bioParagraphs, truncate } from "@/lib/blog";
import { getBlogAuthor, getPublishedPosts } from "@/lib/blog-data";
import { getSiteUrlWithPath } from "@/lib/site";

// Profil ilk istekte üretilir; yönetimden yapılan değişiklik "blog-posts"
// etiketini ve bu yolu yeniler.
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getBlogAuthor(slug);
  if (!author) return { title: "Yazar bulunamadı", robots: { index: false, follow: false } };

  const path = `/blog/yazar/${author.slug}`;
  const [firstParagraph] = bioParagraphs(author.bio);
  const description = truncate(
    firstParagraph ?? `${author.name}${author.title ? `, ${author.title}` : ""}: Hedefim Lise blogundaki yazıları.`,
    160,
  );

  return {
    title: `${author.name} | Blog`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: author.name,
      description,
      type: "profile",
      url: path,
      images: author.photoUrl ? [{ url: author.photoUrl, alt: author.name }] : undefined,
    },
  };
}

export default async function BlogAuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = await getBlogAuthor(slug);
  if (!author) notFound();

  const allPosts = await getPublishedPosts();
  const posts = allPosts.filter((post) => post.authorId === author.id);
  const [recent, older] = [posts.slice(0, 3), posts.slice(3)];
  const url = getSiteUrlWithPath(`/blog/yazar/${author.slug}`);
  const sameAs = authorContacts(author)
    .filter((contact) => contact.kind !== "email" && contact.kind !== "phone")
    .map((contact) => contact.href);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.title ?? undefined,
      description: bioParagraphs(author.bio)[0],
      image: author.photoUrl ?? undefined,
      sameAs: sameAs.length ? sameAs : undefined,
    },
  };

  return (
    <div className="pb-24 sm:pb-32">
      <script
        type="application/ld+json"
        // JSON-LD'de "<" kaçırılır; yazar metni script bloğunu kapatamaz.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

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
            <li aria-current="page" className="px-1 text-blog-ink">
              {author.name}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-12 lg:gap-12">
          <AuthorAvatar
            author={author}
            priority
            sizes="(min-width: 1024px) 360px, 60vw"
            className="w-2/3 max-w-[22rem] sm:w-1/2 lg:col-span-4 lg:w-full lg:max-w-none"
          />

          <div className="min-w-0 lg:col-span-8">
            <h1 className="font-blog-display text-[2.75rem] leading-[0.95] font-extrabold tracking-[-0.04em] text-balance text-blog-ink sm:text-[3.75rem] lg:text-[4.5rem]">
              {author.name}
            </h1>
            {author.title && (
              <p className="mt-4 text-[1.1875rem] leading-snug text-blog-ink-soft sm:text-[1.3125rem]">{author.title}</p>
            )}

            <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
              <AuthorBio
                bio={author.bio}
                className="max-w-[62ch] text-[1.125rem] leading-[1.75] text-blog-ink-soft sm:text-[1.1875rem]"
              />
              <div className="min-w-0">
                <AuthorContactList author={author} />
                <p className="mt-4 font-blog-display text-[0.875rem] text-blog-muted tabular-nums">
                  {posts.length ? `${posts.length} yazı` : "Henüz yayımlanmış yazısı yok"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {posts.length > 0 && (
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <section aria-labelledby="yazarin-yazilari" className="mt-16 sm:mt-20">
            <div className="mb-8 border-t-2 border-blog-ink pt-4">
              <h2
                id="yazarin-yazilari"
                className="font-blog-display text-[1.375rem] font-bold tracking-[-0.02em] text-blog-ink sm:text-[1.5rem]"
              >
                Yazıları
              </h2>
            </div>
            <PostSet posts={recent} featuredId={allPosts[0]?.id} />
          </section>

          {older.length > 0 && (
            <section aria-labelledby="yazarin-diger-yazilari" className="mt-16">
              <div className="mb-2 border-t-2 border-blog-ink pt-4">
                <h2
                  id="yazarin-diger-yazilari"
                  className="font-blog-display text-[1.375rem] font-bold tracking-[-0.02em] text-blog-ink sm:text-[1.5rem]"
                >
                  Daha eski yazıları
                </h2>
              </div>
              <ol className="border-t border-blog-line">
                {older.map((post) => (
                  <ContentsRow key={post.id} post={post} />
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

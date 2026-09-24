import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Article } from "@/components/blog/Article";
import { relatedPosts, truncate } from "@/lib/blog";
import { getPublishedPost, getPublishedPosts } from "@/lib/blog-data";
import { getSiteUrlWithPath } from "@/lib/site";

// Yazılar ilk istekte üretilir ve önbellekte kalır; yönetimden yapılan
// değişiklik "blog-posts" etiketini ve bu yolu yeniler.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Yazı bulunamadı", robots: { index: false, follow: false } };

  const path = `/blog/${post.slug}`;
  const description = truncate(post.excerpt, 160);
  const image = post.coverImageUrl ? [{ url: post.coverImageUrl, alt: post.coverImageAlt ?? post.title }] : undefined;

  return {
    title: post.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: path,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      section: post.category,
      authors: [post.authorName],
      images: image,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: image?.map((item) => item.url),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const posts = await getPublishedPosts();
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();

  const url = getSiteUrlWithPath(`/blog/${post.slug}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      articleSection: post.category,
      inLanguage: "tr-TR",
      mainEntityOfPage: url,
      image: post.coverImageUrl ?? undefined,
      author: { "@type": "Organization", name: post.authorName },
      publisher: { "@type": "Organization", name: "Hedefim Lise", url: getSiteUrlWithPath("/") },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: getSiteUrlWithPath("/blog") },
        { "@type": "ListItem", position: 2, name: post.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD'de "<" kaçırılır; yazı metni script bloğunu kapatamaz.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Article post={post} url={url} related={relatedPosts(post, posts)} featuredId={posts[0]?.id} />
    </>
  );
}

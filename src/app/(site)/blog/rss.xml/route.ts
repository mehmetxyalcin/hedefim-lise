import { getPublishedPosts } from "@/lib/blog-data";
import { getSiteUrlWithPath } from "@/lib/site";

export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = (await getPublishedPosts()).slice(0, 30);
  const blogUrl = getSiteUrlWithPath("/blog");

  const items = posts
    .map((post) => {
      const url = getSiteUrlWithPath(`/blog/${post.slug}`);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${new Date(post.publishedAt ?? post.createdAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Hedefim Lise Blog</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>Lise tercihinde merak edilenleri sade bir dille anlatan rehber yazılar.</description>
    <language>tr-TR</language>
    <atom:link href="${escapeXml(getSiteUrlWithPath("/blog/rss.xml"))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

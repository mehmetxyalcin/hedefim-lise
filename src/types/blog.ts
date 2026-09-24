export type BlogAuthor = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  updatedAt: string;
};

export type BlogAuthorRow = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
};

export function mapBlogAuthor(row: BlogAuthorRow): BlogAuthor {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    bio: row.bio,
    photoUrl: row.photo_url,
    email: row.email,
    phone: row.phone,
    websiteUrl: row.website_url,
    instagramUrl: row.instagram_url,
    xUrl: row.x_url,
    linkedinUrl: row.linkedin_url,
    youtubeUrl: row.youtube_url,
    updatedAt: row.updated_at,
  };
}

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  highlight: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  authorName: string;
  authorId: string | null;
  author: BlogAuthor | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  highlight: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  author_name: string;
  author_id?: string | null;
  /** `select("*, author:blog_authors(*)")` ile gömülü gelir. */
  author?: BlogAuthorRow | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

// Gömülü yazar sorgusu; hem ziyaretçi hem yönetim tarafı aynı biçimi okur.
export const BLOG_POST_SELECT = "*, author:blog_authors(*)";

export function mapBlogPost(row: BlogPostRow): BlogPost {
  const author = row.author ? mapBlogAuthor(row.author) : null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    highlight: row.highlight,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    authorName: author?.name ?? row.author_name,
    authorId: row.author_id ?? null,
    author,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

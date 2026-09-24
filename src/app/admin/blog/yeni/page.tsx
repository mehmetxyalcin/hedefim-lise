import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { blogCategoryOptions, loadAdminAuthors } from "@/lib/admin-blog";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { BlogPostForm } from "@/components/admin/blog/BlogPostForm";
import { saveBlogPost } from "../actions";

export const metadata: Metadata = {
  title: "Yeni yazı | Yönetim",
  robots: { index: false, follow: false },
};

export default async function AdminNewBlogPostPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, authors] = await Promise.all([
    supabase.from("blog_posts").select("category"),
    loadAdminAuthors(supabase),
  ]);

  return (
    <AdminPage width="form">
      <PageHeader trail={[{ label: "Blog", href: "/admin/blog" }]} title="Yeni yazı" />
      <BlogPostForm post={null} categories={blogCategoryOptions(data ?? [])} authors={authors} action={saveBlogPost} />
    </AdminPage>
  );
}

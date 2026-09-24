import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { blogCategoryOptions, loadAdminPost } from "@/lib/admin-blog";
import { postState } from "@/lib/blog";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { BlogPostForm } from "@/components/admin/blog/BlogPostForm";
import { deleteBlogPost, saveBlogPost } from "../../actions";

export const metadata: Metadata = {
  title: "Yazıyı düzenle | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function AdminEditBlogPostPage({ params, searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const flash = searchParams ? await searchParams : undefined;
  const [post, categories] = await Promise.all([
    loadAdminPost(supabase, id),
    supabase.from("blog_posts").select("category"),
  ]);
  if (!post) notFound();

  const live = postState(post) === "yayinda";

  return (
    <AdminPage width="form">
      <PageHeader
        trail={[{ label: "Blog", href: "/admin/blog" }]}
        title={post.title}
        actions={
          live && (
            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "ghost" })}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Sitede aç
            </a>
          )
        }
      />
      <FlashBanner success={flash?.success} error={flash?.error} />
      <BlogPostForm key={post.id} post={post} categories={blogCategoryOptions(categories.data ?? [])} action={saveBlogPost} />

      <form action={deleteBlogPost} className={cn(adminCard, "mt-10 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between")}>
        <input type="hidden" name="id" value={post.id} />
        <div>
          <h2 className="text-[15px] font-bold text-admin-ink">Yazıyı sil</h2>
          <p className="mt-1 text-[13px] text-admin-muted">
            Yazı ve adresi kalıcı olarak kaldırılır. Yalnız gizlemek için durumu Taslak yapmanız yeterli.
          </p>
        </div>
        <ConfirmButton
          message={`"${post.title}" yazısını silmek istediğinize emin misiniz? Bu işlem geri alınmaz.`}
          className={adminButton({ variant: "danger", size: "sm" })}
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          Yazıyı sil
        </ConfirmButton>
      </form>
    </AdminPage>
  );
}

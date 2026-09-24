import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { loadAdminAuthor } from "@/lib/admin-blog";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { AuthorForm } from "@/components/admin/blog/AuthorForm";
import { deleteBlogAuthor, saveBlogAuthor } from "../actions";

export const metadata: Metadata = {
  title: "Yazarı düzenle | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function AdminEditBlogAuthorPage({ params, searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const flash = searchParams ? await searchParams : undefined;
  const author = await loadAdminAuthor(supabase, id);
  if (!author) notFound();

  const { count } = await supabase.from("blog_posts").select("id", { head: true, count: "exact" }).eq("author_id", author.id);

  return (
    <AdminPage width="form">
      <PageHeader
        trail={[
          { label: "Blog", href: "/admin/blog" },
          { label: "Yazarlar", href: "/admin/blog/yazarlar" },
        ]}
        title={author.name}
      />
      <FlashBanner success={flash?.success} error={flash?.error} />
      <AuthorForm key={author.id} author={author} action={saveBlogAuthor} />

      <form action={deleteBlogAuthor} className={cn(adminCard, "mt-10 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between")}>
        <input type="hidden" name="id" value={author.id} />
        <div>
          <h2 className="text-[15px] font-bold text-admin-ink">Yazarı sil</h2>
          <p className="mt-1 text-[13px] text-admin-muted">
            Profil sayfası kaldırılır. {count ? `${count} yazısı` : "Yazıları"} silinmez; imzası düz metin olarak kalır.
          </p>
        </div>
        <ConfirmButton
          message={`"${author.name}" yazarını silmek istediğinize emin misiniz? Profil sayfası kaldırılır, yazıları yayında kalır.`}
          className={adminButton({ variant: "danger", size: "sm" })}
        >
          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
          Yazarı sil
        </ConfirmButton>
      </form>
    </AdminPage>
  );
}

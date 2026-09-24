import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { loadAdminPost } from "@/lib/admin-blog";
import { formatBlogDate, postState } from "@/lib/blog";
import { getSiteUrlWithPath } from "@/lib/site";
import { adminButton } from "@/components/admin/ui/Button";
import { Article } from "@/components/blog/Article";
import { BlogFrame } from "@/components/blog/BlogFrame";

export const metadata: Metadata = {
  title: "Önizleme | Yönetim",
  robots: { index: false, follow: false },
};

const STATE_TEXT = { taslak: "Taslak: ziyaretçiler göremez.", zamanlanmis: "Zamanlanmış", yayinda: "Yayında" } as const;

export default async function AdminBlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const post = await loadAdminPost(supabase, id);
  if (!post) notFound();

  const state = postState(post);

  return (
    <div>
      <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-admin-line bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6 lg:px-8">
        <p className="text-sm text-admin-body">
          <span className="font-semibold text-admin-ink">Önizleme</span> ·{" "}
          {state === "zamanlanmis" ? `${formatBlogDate(post.publishedAt)} tarihinde yayına girecek.` : STATE_TEXT[state]}
        </p>
        <Link href={`/admin/blog/${post.id}/duzenle`} className={adminButton({ size: "sm" })}>
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Düzenlemeye dön
        </Link>
      </div>
      <BlogFrame>
        <Article post={post} url={getSiteUrlWithPath(`/blog/${post.slug}`)} preview />
      </BlogFrame>
    </div>
  );
}

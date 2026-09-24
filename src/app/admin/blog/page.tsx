import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ExternalLink, Eye, EyeOff, Newspaper, Plus, Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { Badge, type BadgeTone } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminControl, adminFocus, adminInput } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { filterPosts, formatBlogDateShort, postState, readingMinutes, type BlogPostState } from "@/lib/blog";
import { mapBlogPost, type BlogPostRow } from "@/types/blog";

export const metadata: Metadata = {
  title: "Blog | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ success?: string; error?: string; ara?: string; durum?: string }>;
};

const STATES: Record<BlogPostState, { label: string; tone: BadgeTone; icon: React.ReactNode }> = {
  yayinda: { label: "Yayında", tone: "success", icon: <Eye aria-hidden="true" className="h-3 w-3" /> },
  zamanlanmis: { label: "Zamanlanmış", tone: "neutral", icon: <CalendarClock aria-hidden="true" className="h-3 w-3" /> },
  taslak: { label: "Taslak", tone: "neutral", icon: <EyeOff aria-hidden="true" className="h-3 w-3" /> },
};

export default async function AdminBlogPage({ searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const params = searchParams ? await searchParams : undefined;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <AdminPage width="narrow">
        <PageHeader title="Blog" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h2 className="font-bold">Blog tablosu yüklenemedi</h2>
          <p className="mt-2 text-sm">
            Supabase üzerinde 019_blog_posts.sql migration dosyasını uygulayın. Hata: {error.message}
          </p>
        </div>
      </AdminPage>
    );
  }

  const now = new Date();
  const posts = ((data ?? []) as BlogPostRow[]).map(mapBlogPost);
  const counts = { yayinda: 0, zamanlanmis: 0, taslak: 0 };
  for (const post of posts) counts[postState(post, now)] += 1;

  const durum = (["yayinda", "zamanlanmis", "taslak"] as const).find((value) => value === params?.durum) ?? "";
  const ara = (params?.ara ?? "").trim();
  const visible = filterPosts(posts, { ara }).filter((post) => !durum || postState(post, now) === durum);

  return (
    <AdminPage width="form">
      <PageHeader
        title="Blog"
        description={`${posts.length} yazı · ${counts.yayinda} yayında · ${counts.zamanlanmis} zamanlanmış · ${counts.taslak} taslak`}
        actions={
          <>
            <a href="/blog" target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "ghost" })}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Blogu görüntüle
            </a>
            <Link href="/admin/blog/yeni" className={adminButton({ variant: "primary" })}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Yeni yazı
            </Link>
          </>
        }
      />
      <FlashBanner success={params?.success} error={params?.error} />

      <form method="get" className="mb-4 flex flex-wrap gap-2" role="search">
        <label className="relative min-w-0 grow basis-60">
          <span className="sr-only">Yazılarda ara</span>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-admin-faint" />
          <input type="search" name="ara" defaultValue={ara} placeholder="Başlık, özet veya metinde ara" className={cn(adminInput, "pl-9")} />
        </label>
        <select name="durum" defaultValue={durum} aria-label="Yayın durumu" className={cn(adminControl, "grow sm:grow-0")}>
          <option value="">Tüm durumlar</option>
          <option value="yayinda">Yayında</option>
          <option value="zamanlanmis">Zamanlanmış</option>
          <option value="taslak">Taslak</option>
        </select>
        <button type="submit" className={adminButton()}>
          Uygula
        </button>
      </form>

      <div className={adminCard}>
        {visible.length === 0 ? (
          <EmptyState
            icon={<Newspaper aria-hidden="true" className="h-8 w-8" />}
            title={posts.length === 0 ? "Henüz yazı yok" : "Eşleşen yazı yok"}
            body={posts.length === 0 ? "İlk yazıyı “Yeni yazı” ile ekleyin." : "Aramayı ya da durum seçimini değiştirin."}
            action={
              posts.length === 0 ? (
                <Link href="/admin/blog/yeni" className={adminButton({ variant: "primary" })}>
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Yeni yazı
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-admin-line-soft">
            {visible.map((post) => {
              const state = STATES[postState(post, now)];
              return (
                <li key={post.id} className="group relative flex flex-col gap-2 px-5 py-4 transition-colors duration-150 hover:bg-admin-ground sm:flex-row sm:items-center sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/blog/${post.id}/duzenle`}
                      className={cn("rounded text-sm font-semibold text-admin-ink after:absolute after:inset-0 after:content-['']", adminFocus)}
                    >
                      {post.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-admin-muted">
                      {post.category} · /blog/{post.slug} · <span className="tabular-nums">{readingMinutes(post.body)} dk</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <Badge tone={state.tone} icon={state.icon}>
                      {state.label}
                    </Badge>
                    <span className="w-24 text-right text-xs text-admin-muted tabular-nums" title={post.publishedAt ?? undefined}>
                      {post.publishedAt ? formatBlogDateShort(post.publishedAt) : "Tarih yok"}
                    </span>
                    <Link
                      href={`/admin/blog/${post.id}/onizleme`}
                      target="_blank"
                      className={cn(adminButton({ variant: "ghost", size: "sm" }), "relative z-10")}
                    >
                      Önizle
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminPage>
  );
}

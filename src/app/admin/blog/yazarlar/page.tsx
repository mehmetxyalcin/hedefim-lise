import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserPen } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { authorContacts } from "@/lib/blog";
import { loadAdminAuthors } from "@/lib/admin-blog";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminFocus } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Yazarlar | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function AdminBlogAuthorsPage({ searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const params = searchParams ? await searchParams : undefined;

  const [{ error }, authors, { data: postRows }] = await Promise.all([
    supabase.from("blog_authors").select("id", { head: true, count: "exact" }),
    loadAdminAuthors(supabase),
    supabase.from("blog_posts").select("author_id").not("author_id", "is", null),
  ]);

  if (error) {
    return (
      <AdminPage width="narrow">
        <PageHeader trail={[{ label: "Blog", href: "/admin/blog" }]} title="Yazarlar" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h2 className="font-bold">Yazar tablosu yüklenemedi</h2>
          <p className="mt-2 text-sm">
            Supabase üzerinde 020_blog_authors.sql migration dosyasını uygulayın. Hata: {error.message}
          </p>
        </div>
      </AdminPage>
    );
  }

  const postCounts = new Map<string, number>();
  for (const row of (postRows ?? []) as { author_id: string }[]) {
    postCounts.set(row.author_id, (postCounts.get(row.author_id) ?? 0) + 1);
  }

  return (
    <AdminPage width="form">
      <PageHeader
        trail={[{ label: "Blog", href: "/admin/blog" }]}
        title="Yazarlar"
        description={`${authors.length} yazar · Her yazarın herkese açık bir profil sayfası vardır.`}
        actions={
          <Link href="/admin/blog/yazarlar/yeni" className={adminButton({ variant: "primary" })}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Yeni yazar
          </Link>
        }
      />
      <FlashBanner success={params?.success} error={params?.error} />

      <div className={adminCard}>
        {authors.length === 0 ? (
          <EmptyState
            icon={<UserPen aria-hidden="true" className="h-8 w-8" />}
            title="Henüz yazar yok"
            body="Yazar eklemediğiniz sürece yazılar “Hedefim Lise” imzasıyla yayımlanır."
            action={
              <Link href="/admin/blog/yazarlar/yeni" className={adminButton({ variant: "primary" })}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Yeni yazar
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-admin-line-soft">
            {authors.map((author) => {
              const count = postCounts.get(author.id) ?? 0;
              const contacts = authorContacts(author).length;
              return (
                <li
                  key={author.id}
                  className="group relative flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-admin-ground"
                >
                  {author.photoUrl ? (
                    // Küçük liste önizlemesi; optimizasyon gerekmez.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={author.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-admin-tint text-sm font-bold text-admin-tint-ink">
                      {author.name.trim().charAt(0).toLocaleUpperCase("tr-TR")}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/blog/yazarlar/${author.id}`}
                      className={cn("rounded text-sm font-semibold text-admin-ink after:absolute after:inset-0 after:content-['']", adminFocus)}
                    >
                      {author.name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-admin-muted">
                      {author.title ?? "Unvan yok"} · /blog/yazar/{author.slug}
                    </p>
                  </div>
                  <p className="hidden shrink-0 text-right text-xs text-admin-muted tabular-nums sm:block">
                    {count} yazı · {contacts} iletişim
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminPage>
  );
}

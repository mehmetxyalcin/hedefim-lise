import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Inbox, Mail, MailOpen, Reply } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { formatFullDate, formatRelativeDate } from "@/lib/admin-ledger";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Badge, type BadgeTone } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { adminButton } from "@/components/admin/ui/Button";
import { adminCard, adminFocus } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";
import { markMessageStatus } from "./actions";

export const metadata: Metadata = {
  title: "Mesajlar | Yönetim",
  robots: { index: false, follow: false },
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  school_id: number | null;
  school_name_text: string | null;
  message: string;
  status: "unread" | "read" | "replied";
  created_at: string;
};

const STATUS: Record<ContactMessage["status"], { label: string; tone: BadgeTone }> = {
  unread: { label: "Okunmadı", tone: "accent" },
  read: { label: "Okundu", tone: "neutral" },
  replied: { label: "Yanıtlandı", tone: "success" },
};

const FILTERS = [
  { key: null, label: "Tümü", status: null },
  { key: "okunmamis", label: "Okunmamış", status: "unread" },
  { key: "okundu", label: "Okundu", status: "read" },
  { key: "yanitlandi", label: "Yanıtlandı", status: "replied" },
] as const;

const MIGRATION_SQL = `CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  school_id integer REFERENCES schools(id) ON DELETE SET NULL,
  school_name_text text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON contact_messages FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "admin_select" ON contact_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_update" ON contact_messages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));`;

type PageProps = {
  searchParams?: Promise<{ mesaj?: string; durum?: string }>;
};

function hrefFor(durum: string | null, mesaj?: string | null) {
  const params = new URLSearchParams();
  if (durum) params.set("durum", durum);
  if (mesaj) params.set("mesaj", mesaj);
  const search = params.toString();
  return `/admin/mesajlar${search ? `?${search}` : ""}`;
}

export default async function AdminMesajlarPage({ searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const filter = FILTERS.find((f) => f.key === (params?.durum ?? null)) ?? FILTERS[0];
  const selectedId = params?.mesaj ?? null;

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <AdminPage width="narrow">
        <PageHeader title="Mesajlar" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
          <p className="mb-3 font-semibold text-rose-800">
            Tablo henüz oluşturulmamış veya erişim hatası: {error.message}
          </p>
          <p className="mb-3 text-sm text-rose-700">
            Supabase SQL editöründe aşağıdaki sorguyu çalıştırın:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-rose-950 p-4 text-xs text-rose-100">
            {MIGRATION_SQL}
          </pre>
        </div>
      </AdminPage>
    );
  }

  const all = (data ?? []) as ContactMessage[];
  const messages = filter.status ? all.filter((m) => m.status === filter.status) : all;
  const unread = all.filter((m) => m.status === "unread").length;
  const selected = selectedId ? (all.find((m) => m.id === selectedId) ?? null) : null;
  const now = new Date();

  let schoolSlug: string | null = null;
  if (selected?.school_id) {
    const { data: school } = await supabase
      .from("schools")
      .select("slug")
      .eq("id", selected.school_id)
      .maybeSingle();
    schoolSlug = school?.slug ?? null;
  }

  return (
    <AdminPage>
      <PageHeader title="Mesajlar" description={`${all.length} mesaj · ${unread} okunmamış`} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
        <section
          aria-label="Mesaj listesi"
          className={cn(adminCard, "overflow-hidden", selected && "hidden lg:block")}
        >
          <nav aria-label="Durum filtresi" className="flex gap-1 overflow-x-auto border-b border-admin-line p-2">
            {FILTERS.map((f) => (
              <Link
                key={f.label}
                href={hrefFor(f.key, selectedId)}
                aria-current={f.key === filter.key ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors",
                  f.key === filter.key
                    ? "bg-admin-tint font-semibold text-admin-tint-ink"
                    : "text-admin-body hover:bg-admin-line-soft",
                  adminFocus,
                )}
              >
                {f.label}
                {f.status === "unread" && unread > 0 && <span className="ml-1 tabular-nums">({unread})</span>}
              </Link>
            ))}
          </nav>
          {messages.length === 0 ? (
            <EmptyState
              icon={<Inbox aria-hidden="true" className="h-8 w-8" />}
              title={filter.status ? "Bu durumda mesaj yok" : "Henüz mesaj yok"}
              body="İletişim formundan gelen mesajlar burada listelenir."
            />
          ) : (
            <ul className="divide-y divide-admin-line-soft lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto">
              {messages.map((m) => {
                const isSelected = m.id === selectedId;
                const isUnread = m.status === "unread";
                return (
                  <li key={m.id}>
                    <Link
                      href={hrefFor(filter.key, m.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={cn(
                        "block px-4 py-3 transition-colors",
                        isSelected ? "bg-admin-tint" : "hover:bg-admin-ground",
                        adminFocus,
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {isUnread && (
                          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-admin-accent" />
                        )}
                        <span
                          className={cn(
                            "flex-1 truncate text-sm",
                            isUnread ? "font-bold text-admin-ink" : "font-medium text-admin-body",
                          )}
                        >
                          {m.name}
                        </span>
                        <span
                          className="shrink-0 text-xs text-admin-muted tabular-nums"
                          title={formatFullDate(m.created_at)}
                        >
                          {formatRelativeDate(m.created_at, now)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-sm",
                          isUnread ? "font-semibold text-admin-ink" : "text-admin-body",
                        )}
                      >
                        {m.subject}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-admin-muted">{m.message}</span>
                      {isUnread && <span className="sr-only">Okunmadı</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {selected ? (
          <article className={cn(adminCard, "p-5 lg:sticky lg:top-20")}>
            <Link
              href={hrefFor(filter.key)}
              className={cn(
                "mb-4 inline-flex items-center gap-1.5 rounded text-sm text-admin-muted hover:text-admin-ink lg:hidden",
                adminFocus,
              )}
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Mesajlar
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-admin-ink">{selected.subject}</h2>
                <p className="mt-1 text-sm text-admin-muted">{formatFullDate(selected.created_at)}</p>
              </div>
              <Badge tone={STATUS[selected.status]?.tone ?? "neutral"}>
                {STATUS[selected.status]?.label ?? selected.status}
              </Badge>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-admin-line pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-admin-muted">Gönderen</dt>
                <dd className="mt-0.5 font-semibold text-admin-ink">{selected.name}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-admin-muted">E-posta</dt>
                <dd className="mt-0.5 truncate">
                  <a
                    href={`mailto:${selected.email}`}
                    className={cn("rounded font-medium text-admin-accent hover:underline", adminFocus)}
                  >
                    {selected.email}
                  </a>
                </dd>
              </div>
              {selected.phone && (
                <div>
                  <dt className="text-xs text-admin-muted">Telefon</dt>
                  <dd className="mt-0.5 text-admin-ink tabular-nums">{selected.phone}</dd>
                </div>
              )}
              {(selected.school_name_text || selected.school_id) && (
                <div>
                  <dt className="text-xs text-admin-muted">İlgili okul</dt>
                  <dd className="mt-0.5 text-admin-ink">
                    {schoolSlug ? (
                      <Link
                        href={`/admin/okullar/${schoolSlug}/duzenle`}
                        className={cn("rounded font-medium text-admin-accent hover:underline", adminFocus)}
                      >
                        {selected.school_name_text ?? `#${selected.school_id}`}
                      </Link>
                    ) : (
                      (selected.school_name_text ?? `#${selected.school_id}`)
                    )}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-5 rounded-lg bg-admin-ground px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-admin-body">
              {selected.message}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                className={adminButton({ variant: "primary" })}
              >
                <Reply aria-hidden="true" className="h-4 w-4" />
                E-posta ile yanıtla
              </a>
              {selected.status !== "read" && (
                <form action={markMessageStatus.bind(null, selected.id, "read")}>
                  <button type="submit" className={adminButton()}>
                    <MailOpen aria-hidden="true" className="h-4 w-4" />
                    Okundu işaretle
                  </button>
                </form>
              )}
              {selected.status !== "replied" && (
                <form action={markMessageStatus.bind(null, selected.id, "replied")}>
                  <button type="submit" className={adminButton()}>
                    Yanıtlandı işaretle
                  </button>
                </form>
              )}
            </div>
          </article>
        ) : (
          <div className={cn(adminCard, "hidden lg:block")}>
            <EmptyState
              icon={<Mail aria-hidden="true" className="h-8 w-8" />}
              title="Bir mesaj seçin"
              body="Soldaki listeden bir mesaj açın. Açmak mesajın durumunu değiştirmez."
            />
          </div>
        )}
      </div>
    </AdminPage>
  );
}

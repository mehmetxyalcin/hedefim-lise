import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, X } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { markMessageStatus } from "./actions";

export const metadata: Metadata = {
  title: "Mesajlar | Admin",
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

const STATUS_LABELS: Record<string, string> = {
  unread: "Okunmadı",
  read: "Okundu",
  replied: "Yanıtlandı",
};

const STATUS_CLASSES: Record<string, string> = {
  unread: "bg-blue-100 text-blue-700",
  read: "bg-slate-100 text-slate-600",
  replied: "bg-emerald-100 text-emerald-700",
};

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
  searchParams?: Promise<{ mesaj?: string }>;
};

export default async function AdminMesajlarPage({ searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const selectedId = params?.mesaj ?? null;

  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Admin Paneli
          </Link>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="mb-3 font-semibold text-rose-700">
              Tablo henüz oluşturulmamış veya erişim hatası: {error.message}
            </p>
            <p className="mb-3 text-sm text-rose-600">
              Supabase SQL editöründe aşağıdaki sorguyu çalıştırın:
            </p>
            <pre className="overflow-x-auto rounded-xl bg-rose-900 p-4 text-xs text-rose-100">
              {MIGRATION_SQL}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  const messages = (data ?? []) as ContactMessage[];
  const selectedMessage = selectedId ? messages.find((m) => m.id === selectedId) ?? null : null;

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Başlık */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Admin Paneli
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              İletişim Mesajları
            </h1>
            {messages.filter((m) => m.status === "unread").length > 0 && (
              <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
                {messages.filter((m) => m.status === "unread").length} yeni
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Toplam {messages.length} mesaj
          </p>
        </div>

        {/* Seçili mesaj detayı */}
        {selectedMessage && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedMessage.subject}</h2>
                <p className="text-sm text-slate-500">
                  {new Date(selectedMessage.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Link
                href="/admin/mesajlar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Gönderen
                </p>
                <p className="mt-1 font-semibold text-slate-800">{selectedMessage.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  E-posta
                </p>
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="mt-1 flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-800"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {selectedMessage.email}
                </a>
              </div>
              {selectedMessage.phone && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Telefon
                  </p>
                  <p className="mt-1 text-slate-800">{selectedMessage.phone}</p>
                </div>
              )}
              {(selectedMessage.school_name_text || selectedMessage.school_id) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    İlgili Okul
                  </p>
                  <p className="mt-1 text-slate-800">
                    {selectedMessage.school_name_text ?? `#${selectedMessage.school_id}`}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mesaj
              </p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {selectedMessage.message}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <form
                action={markMessageStatus.bind(null, selectedMessage.id, "read")}
              >
                <button
                  type="submit"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Okundu İşaretle
                </button>
              </form>
              <form
                action={markMessageStatus.bind(null, selectedMessage.id, "replied")}
              >
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Yanıtlandı İşaretle
                </button>
              </form>
              <a
                href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Mail className="h-4 w-4" />
                E-posta ile Yanıtla
              </a>
            </div>
          </div>
        )}

        {/* Mesaj listesi */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {messages.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-400">
              Henüz mesaj bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Tarih
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Ad Soyad
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      E-posta
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Konu
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Durum
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {messages.map((msg) => (
                    <tr
                      key={msg.id}
                      className={`transition-colors hover:bg-slate-50 ${
                        selectedId === msg.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-slate-500">
                        <Link href={`/admin/mesajlar?mesaj=${msg.id}`} className="block">
                          {new Date(msg.created_at).toLocaleDateString("tr-TR")}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/mesajlar?mesaj=${msg.id}`}
                          className="block font-medium text-slate-800"
                        >
                          {msg.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <Link href={`/admin/mesajlar?mesaj=${msg.id}`} className="block">
                          {msg.email}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <Link href={`/admin/mesajlar?mesaj=${msg.id}`} className="block">
                          {msg.subject}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_CLASSES[msg.status] ?? STATUS_CLASSES["read"]
                          }`}
                        >
                          {STATUS_LABELS[msg.status] ?? msg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <form action={markMessageStatus.bind(null, msg.id, "read")}>
                            <button
                              type="submit"
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              Okundu
                            </button>
                          </form>
                          <form action={markMessageStatus.bind(null, msg.id, "replied")}>
                            <button
                              type="submit"
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Yanıtlandı
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

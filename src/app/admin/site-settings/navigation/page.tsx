import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { FormSubmitButton } from "@/components/admin/FormSubmitButton";
import { getAdminNavigationItems } from "@/lib/site-settings";
import type { NavigationItem } from "@/lib/site-settings";
import {
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,
  moveNavigationItem,
  toggleNavigationItemVisibility,
} from "../actions";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Menü Yönetimi",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
    editing?: string;
  }>;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function SettingsTabs({ active }: { active: "general" | "navigation" | "footer" }) {
  const tabs = [
    { id: "general" as const, href: "/admin/site-settings", label: "Genel" },
    { id: "navigation" as const, href: "/admin/site-settings/navigation", label: "Menü" },
    { id: "footer" as const, href: "/admin/site-settings/footer", label: "Footer" },
  ];
  return (
    <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
            active === tab.id
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function EditRow({
  item,
  isFirst,
  isLast,
}: {
  item: NavigationItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
      <form action={updateNavigationItem} className="space-y-4">
        <input type="hidden" name="id" value={item.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Etiket</span>
            <input
              name="label"
              defaultValue={item.label}
              required
              className={inputClassName}
              placeholder="Ana Sayfa"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Bağlantı</span>
            <input
              name="href"
              defaultValue={item.href}
              required
              className={inputClassName}
              placeholder="/okullar"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Hedef</span>
            <select
              name="target"
              defaultValue={item.target}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="_self">Aynı sekme</option>
              <option value="_blank">Yeni sekme</option>
            </select>
          </label>

          <label className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              name="is_visible"
              defaultChecked={item.is_visible}
              className="h-4 w-4"
            />
            <span className="text-sm font-semibold text-slate-700">Görünür</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-blue-100 pt-4">
          <FormSubmitButton label="Kaydet" pendingLabel="Kaydediliyor..." />
          <Link
            href="/admin/site-settings/navigation"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            İptal
          </Link>
        </div>
      </form>

      <div className="mt-3 flex gap-2 border-t border-blue-100 pt-3">
        <form action={moveNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={isFirst}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑ Yukarı
          </button>
        </form>
        <form action={moveNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={isLast}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓ Aşağı
          </button>
        </form>
        <form action={deleteNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            Sil
          </button>
        </form>
      </div>
    </div>
  );
}

function ReadRow({
  item,
  isFirst,
  isLast,
}: {
  item: NavigationItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">{item.label}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
            {item.href}
          </span>
          {item.target === "_blank" && (
            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              yeni sekme
            </span>
          )}
          {!item.is_visible && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              gizli
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Görünürlük toggle */}
        <form action={toggleNavigationItemVisibility}>
          <input type="hidden" name="id" value={item.id} />
          <input
            type="hidden"
            name="is_visible"
            value={item.is_visible ? "false" : "true"}
          />
          <button
            type="submit"
            title={item.is_visible ? "Gizle" : "Göster"}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              item.is_visible
                ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            {item.is_visible ? "👁 Gizle" : "👁 Göster"}
          </button>
        </form>

        {/* Sıralama */}
        <form action={moveNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={isFirst}
            aria-label="Yukarı taşı"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↑
          </button>
        </form>
        <form action={moveNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={isLast}
            aria-label="Aşağı taşı"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↓
          </button>
        </form>

        {/* Düzenle */}
        <Link
          href={`/admin/site-settings/navigation?editing=${item.id}`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Düzenle
        </Link>

        {/* Sil */}
        <form action={deleteNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            aria-label={`${item.label} öğesini sil`}
            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-100"
          >
            ✕
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function NavigationPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) return <h1>Yetkisiz erişim.</h1>;

  const params = searchParams ? await searchParams : undefined;
  const editingId = params?.editing;

  const items = await getAdminNavigationItems(supabase);

  return (
    <div className="min-h-[70vh] bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              ← Admin Paneli
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Site Ayarları
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Navbar&apos;da görünen menü öğelerini sıralayın ve düzenleyin.
          </p>
        </div>

        <SettingsTabs active="navigation" />

        {params?.success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {params.success}
          </div>
        )}

        {params?.error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {params.error}
          </div>
        )}

        {/* Mevcut öğeler */}
        <FormSection
          title="Mevcut Menü Öğeleri"
          description="Sıralamayı ↑↓ butonlarıyla, görünürlüğü 👁 ile değiştirebilirsiniz."
        >
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz menü öğesi yok.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) =>
                editingId === item.id ? (
                  <EditRow
                    key={item.id}
                    item={item}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                  />
                ) : (
                  <ReadRow
                    key={item.id}
                    item={item}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                  />
                ),
              )}
            </div>
          )}
        </FormSection>

        {/* Yeni öğe ekle */}
        <FormSection
          title="Yeni Menü Öğesi Ekle"
          description="Listeye yeni bir navigasyon bağlantısı ekleyin."
        >
          <form action={createNavigationItem} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Etiket
                </span>
                <input
                  name="label"
                  required
                  className={inputClassName}
                  placeholder="Örn: Haberler"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Bağlantı (href)
                </span>
                <input
                  name="href"
                  required
                  className={inputClassName}
                  placeholder="/haberler"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Hedef
              </span>
              <select
                name="target"
                defaultValue="_self"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="_self">Aynı sekme</option>
                <option value="_blank">Yeni sekme</option>
              </select>
            </label>
            <FormSubmitButton label="Ekle" pendingLabel="Ekleniyor..." />
          </form>
        </FormSection>
      </div>
    </div>
  );
}

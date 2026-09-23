import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { Card } from "@/components/admin/ui/Card";
import { adminInput } from "@/components/admin/ui/styles";
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton";
import { adminButton } from "@/components/admin/ui/Button";
import { ChevronDown, ChevronUp, Eye, EyeOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/admin/ui/Badge";
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
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
  title: "Menü | Yönetim",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
    editing?: string;
  }>;
};

const inputClassName = adminInput;

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
    <Card title={title} description={description}>
      {children}
    </Card>
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
    <div className="rounded-xl border border-admin-accent-soft bg-admin-tint/50 p-4">
      <form action={updateNavigationItem} className="space-y-4">
        <input type="hidden" name="id" value={item.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-admin-body">Etiket</span>
            <input
              name="label"
              defaultValue={item.label}
              required
              className={inputClassName}
              placeholder="Ana Sayfa"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-admin-body">Bağlantı</span>
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
            <span className="mb-2 block text-sm font-semibold text-admin-body">Hedef</span>
            <select
              name="target"
              defaultValue={item.target}
              className="rounded-xl border border-admin-line bg-white px-4 py-3 text-admin-ink outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
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
            <span className="text-sm font-semibold text-admin-body">Görünür</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-admin-tint pt-4">
          <AdminSubmitButton label="Kaydet" pendingLabel="Kaydediliyor…" />
          <Link
            href="/admin/site-settings/navigation"
            className={adminButton()}
          >
            İptal
          </Link>
        </div>
      </form>

      <div className="mt-3 flex gap-2 border-t border-admin-tint pt-3">
        <form action={moveNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={isFirst}
            className={adminButton({ size: "sm" })}
          >
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
            Yukarı
          </button>
        </form>
        <form action={moveNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={isLast}
            className={adminButton({ size: "sm" })}
          >
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
            Aşağı
          </button>
        </form>
        <form action={deleteNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <ConfirmButton
            message={`"${item.label}" menü öğesini silmek istediğinize emin misiniz?`}
            className={adminButton({ variant: "danger", size: "sm" })}
          >
            Sil
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}

function ReadRow({
  item,
  position,
  isFirst,
  isLast,
}: {
  item: NavigationItem;
  position: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-admin-line bg-white px-4 py-3">
      <span className="w-5 shrink-0 text-right text-xs text-admin-muted tabular-nums">{position}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-admin-ink">{item.label}</span>
          <span className="rounded-md bg-admin-line-soft px-2 py-0.5 font-mono text-xs text-admin-muted">
            {item.href}
          </span>
          {item.target === "_blank" && (
            <Badge>yeni sekme</Badge>
          )}
          {!item.is_visible && (
            <Badge tone="warning">gizli</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
            className={adminButton({ size: "sm" })}
          >
            {item.is_visible ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{item.is_visible ? "Gizle" : "Göster"}</span>
            <span className="sr-only sm:hidden">{item.is_visible ? "Gizle" : "Göster"}</span>
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
            className={adminButton({ variant: "ghost", size: "sm", className: "px-2" })}
          >
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          </button>
        </form>
        <form action={moveNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={isLast}
            aria-label="Aşağı taşı"
            className={adminButton({ variant: "ghost", size: "sm", className: "px-2" })}
          >
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </button>
        </form>

        {/* Düzenle */}
        <Link
          href={`/admin/site-settings/navigation?editing=${item.id}`}
          className={adminButton({ size: "sm" })}
        >
          Düzenle
        </Link>

        {/* Sil */}
        <form action={deleteNavigationItem}>
          <input type="hidden" name="id" value={item.id} />
          <ConfirmButton
            message={`"${item.label}" menü öğesini silmek istediğinize emin misiniz?`}
            aria-label={`${item.label} öğesini sil`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-admin-muted hover:bg-rose-50 hover:text-rose-700 focus-visible:text-rose-700"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}

export default async function NavigationPage({ searchParams }: PageProps) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) {
    return (
      <AdminPage width="narrow">
        <PageHeader title="Yetkisiz erişim" />
      </AdminPage>
    );
  }

  const params = searchParams ? await searchParams : undefined;
  const editingId = params?.editing;

  const items = await getAdminNavigationItems(supabase);

  return (
    <AdminPage width="narrow">
      <PageHeader title="Menü" description="Navbar'da görünen öğeler, sırası ve görünürlüğü." />
      <FlashBanner success={params?.success} error={params?.error} />

        {/* Mevcut öğeler */}
        <FormSection
          title="Menü öğeleri"
          description="Sırayı oklarla, görünürlüğü Gizle/Göster ile değiştirin."
        >
          {items.length === 0 ? (
            <p className="text-sm text-admin-muted">Henüz menü öğesi yok.</p>
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
                    position={index + 1}
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
          title="Yeni menü öğesi"
          description="Listeye yeni bir navigasyon bağlantısı ekleyin."
        >
          <form action={createNavigationItem} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-admin-body">
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
                <span className="mb-2 block text-sm font-semibold text-admin-body">
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
              <span className="mb-2 block text-sm font-semibold text-admin-body">
                Hedef
              </span>
              <select
                name="target"
                defaultValue="_self"
                className="rounded-xl border border-admin-line bg-white px-4 py-3 text-admin-ink outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10"
              >
                <option value="_self">Aynı sekme</option>
                <option value="_blank">Yeni sekme</option>
              </select>
            </label>
            <AdminSubmitButton
              label="Ekle"
              pendingLabel="Ekleniyor…"
              variant={editingId ? "secondary" : "primary"}
            />
          </form>
        </FormSection>
    </AdminPage>
  );
}

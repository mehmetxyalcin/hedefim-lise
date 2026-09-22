# Yönetim Paneli Yeniden Tasarımı — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin` altındaki tüm ekranları panele özel indigo "Veri Sağlık Defteri" arayüzüne taşımak: yan menülü kabuk, sekiz kontrollü okul defteri, künye paneli, dikey sekmeli okul formu ve aynı sözlükle yeniden düzenlenmiş diğer ekranlar.

**Architecture:** Genel sayfalar `src/app/(site)/` route group'una taşınır ve Navbar/Footer oraya gider; `/admin` kendi `AdminFrame` kabuğunu alır. İş kuralları saf modüllerde (`src/lib/school-health.ts`, `src/lib/admin-ledger.ts`) ve `node:test` ile test edilir. Görsel dil `.admin` kapsamlı CSS değişkenleri + Tailwind 4 `@theme inline` renkleriyle (`bg-admin-accent` vb.) kurulur; eski `slate/blue` sınıfları bir dönüştürme betiğiyle bu renklere çevrilir. Server action'lar, yetki ve veritabanı değişmez.

**Tech Stack:** Next.js 16.2.3 App Router, React 19.2.4, TypeScript strict, Tailwind CSS 4, Supabase JS (salt okuma sorguları), lucide-react, `node:test` + TypeScript transpile yükleyicisi + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-23-admin-panel-redesign-design.md`

## Global Constraints

- Kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili belgeyi oku (AGENTS.md). Bu planın dokunduğu belgeler: `01-app/03-api-reference/03-file-conventions/route-groups.md`, `layout.md`, `04-functions/cookies.md`, `use-search-params.md`, `use-router.md`, `use-pathname.md`.
- Server action imzaları, dönüş değerleri, `redirect` hedefleri ve dosya yolları değişmez (`src/app/admin/**/actions.ts`). Testler bu yolları yükler.
- `requireAdmin()` her admin sayfasında kendi çağrısıyla kalır. `src/proxy.ts`, `src/lib/admin-auth.ts`, RLS ve migration'lara dokunulmaz.
- Veritabanına yazan yeni kod yok. Yeni sorgular yalnız `select`.
- Supabase üst düzey sorguları 1000 satırla sınırlıdır. `school_facilities` (1.931 satır) ve diğer ilişki tabloları **okul sorgusuna gömülü** okunur; ayrı üst düzey sorguyla okunmaz.
- `tests/admin-form-draft.test.mjs` sözleşmesi: `SchoolFormTabs` konteynerindeki ilk `form` ana formdur ve içinde tek `button[type="submit"]` vardır; hata `role="alert"` içindedir; `SchoolFormTabs` ve içe aktardığı her dosya `next/navigation`dan yalnız `useRouter` ve `useSearchParams` kullanır; bu dosyalar global `CustomEvent` yerine `window.CustomEvent` kullanır.
- Panel renkleri yalnız `.admin` kapsamında tanımlıdır; Exam Blue (`blue-*`) ve `.landing` renkleri panelde kullanılmaz, `admin-*` renkleri panel dışında kullanılmaz.
- İndigo (`admin-accent`) yalnız: etkin menü öğesi, seçili satır, birincil düğme, odak halkası, okunmamış rozeti. Ekran başına tek dolu birincil düğme.
- Durum yalnız renkle anlatılmaz: her rozet ve pipin metin etiketi (`sr-only` ya da görünür) vardır.
- Kullanıcıya görünen metin Türkçe; alan terimleri aynen: yüzdelik dilim, OBP, LGS, yerel / merkezi yerleştirme, meslek alanı, ilçe.
- Sayılar `tabular-nums`; tarih biçimleri `tr-TR`, saat dilimi `Europe/Istanbul`.
- `SmartSchoolBasicFields.tsx` içindeki okul rengi varsayılanı (`bg-gradient-to-br from-slate-700 to-slate-900`) veritabanına yazılan veridir; hiçbir adımda değişmez.
- Her görevin sonunda: `npm test` geçer, `npx eslint .` 0 hata/0 uyarı. Üretim derlemesi: `NEXT_DIST_DIR=.next-verify npx next build`, ardından `rm -rf .next-verify` ve `git checkout -- tsconfig.json` (Next'in otomatik eklemesini geri al; `git diff tsconfig.json` boş olmalı).
- Commit mesajları İngilizce, `feat:`/`refactor:`/`docs:` önekli, sonunda boş satır + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `main`'e push yok. Push yalnız kullanıcı onayıyla.

## File Structure

**Yeni**
- `src/app/(site)/layout.tsx` — Navbar + `<main>` + Footer.
- `src/lib/school-health.ts` — sekiz kontrollü veri sağlığı kuralı (saf).
- `src/lib/admin-ledger.ts` — defter filtreleri, URL eşlemesi, sıralama, tarih biçimleri (saf).
- `tests/school-health.test.mjs`, `tests/admin-ledger.test.mjs`.
- `src/components/admin/ui/` — `styles.ts`, `Button.tsx`, `AdminSubmitButton.tsx`, `AdminPage.tsx`, `PageHeader.tsx`, `Card.tsx`, `Badge.tsx`, `FlashBanner.tsx`, `EmptyState.tsx`, `HealthPips.tsx`.
- `src/components/admin/shell/` — `nav.ts`, `AdminFrame.tsx`, `AdminSidebar.tsx`, `AdminTopbar.tsx`, `SchoolQuickSearch.tsx`, `UserMenu.tsx`.
- `src/components/admin/ledger/` — `LedgerSummary.tsx`, `SchoolLedger.tsx`, `LedgerFilters.tsx`, `LedgerTable.tsx`, `SchoolDetailPanel.tsx`, `BulkActionBar.tsx`.
- `src/components/admin/school-form/` — `SchoolTabRail.tsx`, `SaveBarStatus.tsx`.
- `src/components/admin/bulk-upload/` — `BulkUploadWizard.tsx`, `BasicUploadWizard.tsx`, `VocationalUploadWizard.tsx`, `ScoreUploadWizard.tsx`, `FacilityUploadWizard.tsx`, `shared.tsx`, `parsers.ts`.
- `scripts/admin-restyle.mjs` — tek seferlik sınıf dönüştürücü (Görev 14'te silinir).

**Taşınan (git mv):** `src/app/{page.tsx,alanlar,hakkinda,iletisim,istatistikler,login,okullar,soru-cevap,tercihlerim}` → `src/app/(site)/…`.

**Değişen:** `src/app/layout.tsx`, `src/app/globals.css`, `src/app/admin/layout.tsx`, tüm `src/app/admin/**/page.tsx`, `src/components/admin/SchoolFormTabs.tsx`, `src/components/admin/UnsavedChangesWarning.tsx`, `src/components/admin/tabs/*.tsx`, `src/components/admin/VocationalFieldsManager.tsx`, `SmartSchoolBasicFields.tsx`, `ImageUploadField.tsx`, `LogoUploadField.tsx`, `.impeccable/surfaces/src-app-page-tsx.md`, `PROJECT_HANDOFF.md`, `DESIGN.md`.

**Silinen:** `src/components/admin/AdminSchoolList.tsx`, `src/components/admin/DeleteSchoolButton.tsx`, `src/components/admin/BulkUploadWizard.tsx` (yeni klasöre taşınır), `scripts/admin-restyle.mjs` (son görevde).

---

### Task 1: Genel sayfaları `(site)` route group'una taşı

**Files:**
- Create: `src/app/(site)/layout.tsx`
- Modify: `src/app/layout.tsx`
- Move: `src/app/{page.tsx,alanlar,hakkinda,iletisim,istatistikler,login,okullar,soru-cevap,tercihlerim}` → `src/app/(site)/`
- Modify: `.impeccable/surfaces/src-app-page-tsx.md`

**Interfaces:**
- Produces: kök layout artık yalnız `<html>/<body>` + fontlar + GA + `{children}` render eder. `/admin` Navbar/Footer almaz; admin layout'u `flex-1` bir kapsayıcı sağlamakla yükümlüdür (Görev 5).

- [ ] **Step 1: Next belgelerini oku**

Run: `sed -n 1,60p node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`
Beklenen: route group'ların URL'ye girmediği ve tek kök layout'ta tam sayfa yenileme olmadığı.

- [ ] **Step 2: Dosyaları taşı**

```bash
mkdir -p "src/app/(site)"
git mv src/app/page.tsx "src/app/(site)/page.tsx"
for d in alanlar hakkinda iletisim istatistikler login okullar soru-cevap tercihlerim; do git mv "src/app/$d" "src/app/(site)/$d"; done
ls src/app "src/app/(site)"
```

Beklenen `src/app`: `(site) admin api auth favicon.ico globals.css layout.tsx robots.ts sitemap.ts`.

- [ ] **Step 3: Göreli importları denetle**

Run: `grep -rn "from ['\"]\.\./" "src/app/(site)" ; grep -rn "@/app/\(okullar\|alanlar\|iletisim\|login\|soru-cevap\|tercihlerim\|hakkinda\|istatistikler\)" src tests`
Beklenen: ilk komut yalnız taşınan klasörün kendi içindeki göreli importları gösterir (klasörler bütün taşındığı için bozulmaz); ikinci komut boş. Boş değilse o importu `@/app/(site)/…` yoluna çevir.

- [ ] **Step 4: `(site)` layout'unu yaz** — `src/app/(site)/layout.tsx`

```tsx
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

// Genel sitenin kromu. /admin bu grubun dışında kalır ve kendi kabuğunu kullanır.
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Kök layout'tan Navbar/Footer'ı çıkar** — `src/app/layout.tsx`

`import { Footer } …` ve `import { Navbar } …` satırlarını sil. `<body>` içindeki

```tsx
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
```

bloğunu şu satırla değiştir:

```tsx
        {children}
```

`<div hidden dangerouslySetInnerHTML …>` ve `<Script>` blokları aynen kalır.

- [ ] **Step 6: Landing tasarım özetinin yollarını güncelle**

```bash
sed -i '' 's#src/app/page.tsx#src/app/(site)/page.tsx#g' .impeccable/surfaces/src-app-page-tsx.md
grep -n "src/app" .impeccable/surfaces/src-app-page-tsx.md
```

Beklenen: `primary_target: "src/app/(site)/page.tsx"`. Dosya adı (slug) değişmez.

- [ ] **Step 7: Doğrula**

```bash
npm test && npx eslint . && NEXT_DIST_DIR=.next-verify npx next build; rm -rf .next-verify; git checkout -- tsconfig.json; git diff --stat tsconfig.json
```

Beklenen: 44 test geçer, lint temiz, derleme çıktısında `/`, `/okullar`, `/okullar/[slug]`, `/alanlar`, `/admin` yolları listelenir; `tsconfig.json` farkı boş.

- [ ] **Step 8: Commit**

```bash
git add -A src/app .impeccable/surfaces/src-app-page-tsx.md
git commit -m "refactor: move public routes into a (site) route group

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Panel token'ları, ortak UI parçaları ve dönüştürme betiği

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/admin/ui/styles.ts`, `Button.tsx`, `AdminSubmitButton.tsx`, `AdminPage.tsx`, `PageHeader.tsx`, `Card.tsx`, `Badge.tsx`, `FlashBanner.tsx`, `EmptyState.tsx`
- Create: `scripts/admin-restyle.mjs`

**Interfaces:**
- Produces:
  - Tailwind renkleri (yalnız `.admin` içinde çözülür): `admin-ground`, `admin-surface`, `admin-ink`, `admin-body`, `admin-muted`, `admin-faint`, `admin-line`, `admin-line-soft`, `admin-line-strong`, `admin-accent`, `admin-accent-deep`, `admin-accent-soft`, `admin-tint`, `admin-tint-ink`, `admin-missing`; gölge `shadow-admin-card`.
  - `styles.ts`: `adminInput`, `adminLabel`, `adminHint`, `adminCard`, `adminFocus` (string sabitleri).
  - `Button.tsx`: `type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger"`, `type AdminButtonSize = "sm" | "md"`, `adminButton(opts?: { variant?; size?; className? }): string`, `AdminButton` (buton öznitelikleri + `variant`, `size`, `loading`).
  - `AdminSubmitButton({ label, pendingLabel?, variant?, className? })`.
  - `AdminPage({ children, width?: "wide" | "form" | "narrow" })`.
  - `PageHeader({ trail: string[]; title: ReactNode; description?: ReactNode; actions?: ReactNode })`.
  - `Card({ title?, description?, actions?, children, className?, bodyClassName? })`.
  - `Badge({ tone?: "neutral" | "accent" | "success" | "warning" | "danger"; children; icon?: ReactNode })`.
  - `FlashBanner({ success?: string; error?: string })`.
  - `EmptyState({ icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode })`.
  - `node scripts/admin-restyle.mjs <dosyalar…>`.

- [ ] **Step 1: Tailwind 4 tema değişkeni davranışını doğrula**

Run: `grep -n "inline" node_modules/tailwindcss/dist/lib.d.ts | head -5; grep -rn "@theme inline" src/app/globals.css`
Beklenen: projede `@theme inline` zaten kullanılıyor (landing fontları). `inline`, utility'nin `var(--admin-…)` değerini doğrudan yazmasını sağlar; değişken yalnız `.admin` altında tanımlı olduğu için renkler panel dışında çözülmez.

- [ ] **Step 2: Token'ları ekle** — `src/app/globals.css`

Mevcut `@theme inline { … }` bloğunun kapanış `}` satırından hemen önce ekle:

```css
  /* Yönetim paneli (.admin kapsamı) — değerler yalnız .admin altında tanımlı. */
  --color-admin-ground: var(--admin-ground);
  --color-admin-surface: var(--admin-surface);
  --color-admin-ink: var(--admin-ink);
  --color-admin-body: var(--admin-body);
  --color-admin-muted: var(--admin-muted);
  --color-admin-faint: var(--admin-faint);
  --color-admin-line: var(--admin-line);
  --color-admin-line-soft: var(--admin-line-soft);
  --color-admin-line-strong: var(--admin-line-strong);
  --color-admin-accent: var(--admin-accent);
  --color-admin-accent-deep: var(--admin-accent-deep);
  --color-admin-accent-soft: var(--admin-accent-soft);
  --color-admin-tint: var(--admin-tint);
  --color-admin-tint-ink: var(--admin-tint-ink);
  --color-admin-missing: var(--admin-missing);
  --shadow-admin-card: 0 1px 2px rgb(30 34 53 / 0.04), 0 4px 12px rgb(30 34 53 / 0.04);
```

`.landing ::selection { … }` bloğundan sonra ekle:

```css
/* ── Yönetim paneli: "Veri Sağlık Defteri" ──────────────────────────────
   Yalnız .admin kapsamında. Tek vurgu indigo; yalnız yön bulma için
   (etkin menü, seçili satır, birincil eylem, odak). Emerald/amber/rose
   yalnız anlam taşırken. Exam Blue ve landing renkleri buraya girmez. */
.admin {
  --admin-ground: #f4f5fa;
  --admin-surface: #ffffff;
  --admin-ink: #1e2235;
  --admin-body: #3d4257;
  --admin-muted: #5b6178;
  --admin-faint: #6f748a; /* beyaz üzerinde ≈4.8:1 — küçük meta metin için AA */
  --admin-line: #e6e8f0;
  --admin-line-soft: #eef0f6;
  --admin-line-strong: #d3d6e2;
  --admin-accent: #4f46e5;
  --admin-accent-deep: #4338ca;
  --admin-accent-soft: #c7d2fe;
  --admin-tint: #eef2ff;
  --admin-tint-ink: #3730a3;
  --admin-missing: #c2410c;
  background-color: var(--admin-ground);
  color: var(--admin-ink);
  font-variant-numeric: normal;
}
.admin ::selection {
  background: var(--admin-accent);
  color: #ffffff;
}
@keyframes admin-fade-out {
  0%, 85% { opacity: 1; }
  100% { opacity: 0; }
}
.admin .admin-fade-out {
  animation: admin-fade-out 4s ease-out forwards;
}
@media (prefers-reduced-motion: reduce) {
  .admin *, .admin *::before, .admin *::after {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
  .admin .admin-fade-out { animation: none; }
}
```

Not: spec'teki "soluk metin" değeri `#8a8fa3` idi; beyaz üzerinde 3.3:1 kaldığı için `#6f748a`'ya koyulaştırıldı ve ikincil gövde tonu `admin-body` eklendi. Görev 15'te spec'e işlenir.

- [ ] **Step 3: Ortak sınıflar** — `src/components/admin/ui/styles.ts`

```ts
// Panelin ortak sınıf sözlüğü. Her ekran girişlerini, kartlarını ve odak
// halkasını buradan alır; sekmelerde kopya sınıf tanımı tutulmaz.
export const adminFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const adminInput =
  "min-h-10 w-full rounded-lg border border-admin-line-strong bg-white px-3 py-2 text-sm text-admin-ink outline-none transition-colors duration-150 placeholder:text-admin-faint hover:border-admin-faint focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:bg-admin-line-soft disabled:text-admin-muted";

export const adminLabel = "mb-1.5 block text-[13px] font-semibold text-admin-body";

export const adminHint = "mt-1.5 block text-xs text-admin-muted";

export const adminCard = "rounded-xl border border-admin-line bg-white shadow-admin-card";
```

- [ ] **Step 4: Düğme** — `src/components/admin/ui/Button.tsx`

```tsx
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

export type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type AdminButtonSize = "sm" | "md";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<AdminButtonVariant, string> = {
  primary: "bg-admin-accent text-white hover:bg-admin-accent-deep",
  secondary: "border border-admin-line-strong bg-white text-admin-body hover:bg-admin-line-soft",
  ghost: "text-admin-body hover:bg-admin-line-soft",
  danger: "text-rose-700 hover:bg-rose-50",
};

const sizes: Record<AdminButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export function adminButton({
  variant = "secondary",
  size = "md",
  className,
}: { variant?: AdminButtonVariant; size?: AdminButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], adminFocus, className);
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  loading?: boolean;
};

export function AdminButton({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={adminButton({ variant, size, className: cn(loading && "cursor-wait", className) })}
      {...rest}
    >
      {loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Gönderme düğmesi** — `src/components/admin/ui/AdminSubmitButton.tsx`

```tsx
"use client";

import { useFormStatus } from "react-dom";
import { AdminButton, type AdminButtonVariant } from "@/components/admin/ui/Button";

// Server action'lı formlar için. useFormStatus <form> içindeki bir alt
// bileşenden çağrılmalı; bu bileşen o sarmalayıcıdır (ui/SubmitButton ile aynı).
type Props = {
  label: React.ReactNode;
  pendingLabel?: React.ReactNode;
  variant?: AdminButtonVariant;
  className?: string;
};

export function AdminSubmitButton({
  label,
  pendingLabel = "Kaydediliyor…",
  variant = "primary",
  className,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <AdminButton type="submit" variant={variant} loading={pending} className={className}>
      {pending ? pendingLabel : label}
    </AdminButton>
  );
}
```

- [ ] **Step 6: Sayfa kapsayıcısı ve başlık** — `AdminPage.tsx`, `PageHeader.tsx`

```tsx
// src/components/admin/ui/AdminPage.tsx
import { cn } from "@/lib/cn";

const widths = {
  wide: "max-w-[1440px]",
  form: "max-w-[1160px]",
  narrow: "max-w-[860px]",
} as const;

export function AdminPage({
  children,
  width = "wide",
}: {
  children: React.ReactNode;
  width?: keyof typeof widths;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8", widths[width])}>
      {children}
    </div>
  );
}
```

```tsx
// src/components/admin/ui/PageHeader.tsx
type Props = {
  trail: string[];
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({ trail, title, description, actions }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-admin-muted">{trail.join(" / ")}</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-admin-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-admin-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
```

- [ ] **Step 7: Kart, rozet, boş durum** — `Card.tsx`, `Badge.tsx`, `EmptyState.tsx`

```tsx
// src/components/admin/ui/Card.tsx
import { cn } from "@/lib/cn";
import { adminCard } from "@/components/admin/ui/styles";

type Props = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Card({ title, description, actions, children, className, bodyClassName }: Props) {
  return (
    <section className={cn(adminCard, className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-admin-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold text-admin-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-admin-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
```

```tsx
// src/components/admin/ui/Badge.tsx
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-admin-line-soft text-admin-body",
  accent: "bg-admin-tint text-admin-tint-ink",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-800",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
```

```tsx
// src/components/admin/ui/EmptyState.tsx
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-admin-faint">{icon}</div>}
      <p className="text-sm font-semibold text-admin-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-admin-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 8: Bildirim bandı** — `src/components/admin/ui/FlashBanner.tsx`

```tsx
"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { adminFocus } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";

// ?success= / ?error= mesajları. Kapatınca yalnız bu görünümde gizlenir.
export function FlashBanner({ success, error }: { success?: string; error?: string }) {
  const [hidden, setHidden] = useState<string | null>(null);
  const message = error ?? success;
  if (!message || hidden === message) return null;
  const isError = Boolean(error);

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      {isError ? (
        <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CircleCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={() => setHidden(message)}
        aria-label="Bildirimi kapat"
        className={cn("-m-1 rounded p-1 opacity-70 hover:opacity-100", adminFocus)}
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 9: Dönüştürme betiği** — `scripts/admin-restyle.mjs`

```js
// Tek seferlik: admin dosyalarındaki slate/gray/blue Tailwind renklerini
// panelin admin-* renklerine, büyük köşe ve gölgeyi panel ölçüsüne çevirir.
// "gradient" içeren satırlara dokunmaz: okul renk sınıfları veritabanına yazılan veridir.
// Kullanım: node scripts/admin-restyle.mjs <dosya...>
import { readFileSync, writeFileSync } from "node:fs";

const neutral = {
  50: "admin-ground", 100: "admin-line-soft", 200: "admin-line", 300: "admin-line-strong",
  400: "admin-faint", 500: "admin-muted", 600: "admin-body", 700: "admin-body",
  800: "admin-ink", 900: "admin-ink",
};
const accent = {
  50: "admin-tint", 100: "admin-tint", 200: "admin-accent-soft", 300: "admin-accent-soft",
  400: "admin-accent", 500: "admin-accent", 600: "admin-accent", 700: "admin-accent-deep",
  800: "admin-accent-deep", 900: "admin-accent-deep",
};
const MAP = { slate: neutral, gray: neutral, blue: accent };
const COLOR = /\b(slate|gray|blue)-(50|100|200|300|400|500|600|700|800|900)\b/g;

function restyleLine(line) {
  if (line.includes("gradient")) return line;
  return line
    .replace(COLOR, (_, color, shade) => MAP[color][shade])
    .replace(/\brounded-(2xl|3xl)\b/g, "rounded-xl")
    .replace(/\bshadow-sm\b/g, "shadow-admin-card")
    .replace(/\bfont-extrabold\b/g, "font-bold");
}

for (const file of process.argv.slice(2)) {
  const before = readFileSync(file, "utf8");
  const after = before.split("\n").map(restyleLine).join("\n");
  if (after !== before) {
    writeFileSync(file, after);
    console.log(`restyled ${file}`);
  }
}
```

- [ ] **Step 10: Betiği sına**

```bash
printf 'a "text-slate-500 bg-blue-600 rounded-2xl shadow-sm"\nb "bg-gradient-to-br from-slate-700 to-slate-900"\n' > /tmp/restyle-check.txt
node scripts/admin-restyle.mjs /tmp/restyle-check.txt && cat /tmp/restyle-check.txt && rm /tmp/restyle-check.txt
```

Beklenen:
```
restyled /tmp/restyle-check.txt
a "text-admin-muted bg-admin-accent rounded-xl shadow-admin-card"
b "bg-gradient-to-br from-slate-700 to-slate-900"
```

- [ ] **Step 11: Doğrula ve commit**

```bash
npm test && npx eslint . && npx tsc --noEmit
git add src/app/globals.css src/components/admin/ui scripts/admin-restyle.mjs
git commit -m "feat: admin-scoped tokens and shared UI primitives

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Veri sağlığı kuralı

**Files:**
- Create: `src/lib/school-health.ts`
- Test: `tests/school-health.test.mjs`

**Interfaces:**
- Produces:
  - `type HealthCheckId = "gorsel" | "aciklama" | "tesis" | "dil" | "puan" | "kontenjan" | "alan" | "telefon"`
  - `type HealthStatus = "ok" | "missing" | "na"`
  - `type SchoolFormTab = "temel" | "iletisim" | "puanlar" | "tesisler" | "meslekler"`
  - `HEALTH_CHECKS: readonly { id: HealthCheckId; short: string; label: string; tab: SchoolFormTab }[]` (sabit sıra)
  - `MIN_DESCRIPTION_LENGTH = 80`
  - `type HealthInput = { type: string; description: string; images: string[]; languages: string[]; phone: string | null; vocationalFieldCount: number; facilityCount: number; scoreYears: number[]; quotaYears: number[] }`
  - `type HealthYears = { scoreYear: number | null; quotaYear: number | null }`
  - `type HealthItem = { id: HealthCheckId; label: string; short: string; tab: SchoolFormTab; status: HealthStatus; message: string | null }`
  - `type SchoolHealth = { items: HealthItem[]; missing: number; required: number; complete: boolean }`
  - `latestYear(years: Iterable<number>): number | null`
  - `isVocationalType(type: string): boolean`
  - `evaluateSchoolHealth(input: HealthInput, years: HealthYears): SchoolHealth`
  - `parseHealthCheckId(raw: string | null | undefined): HealthCheckId | null`
  - `missingTabs(health: SchoolHealth): Set<SchoolFormTab>`
  - `countMissing(list: SchoolHealth[], id: HealthCheckId): number`

- [ ] **Step 1: Başarısız testi yaz** — `tests/school-health.test.mjs`

```js
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/school-health.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const { HEALTH_CHECKS, latestYear, isVocationalType, evaluateSchoolHealth, parseHealthCheckId, missingTabs, countMissing } = exports;
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const years = { scoreYear: 2025, quotaYear: 2026 };
const full = {
  type: 'Anadolu Lisesi', description: 'x'.repeat(80), images: ['a.jpg'], languages: ['İngilizce'], phone: '0324 000 00 00',
  vocationalFieldCount: 0, facilityCount: 3, scoreYears: [2024, 2025], quotaYears: [2026],
};
const status = (h) => Object.fromEntries(h.items.map((i) => [i.id, i.status]));

test('checks keep a fixed order with short codes and target tabs', () => {
  eq(HEALTH_CHECKS.map((c) => [c.id, c.short, c.tab]), [
    ['gorsel','G','temel'], ['aciklama','A','temel'], ['tesis','T','tesisler'], ['dil','D','temel'],
    ['puan','P','puanlar'], ['kontenjan','K','puanlar'], ['alan','M','meslekler'], ['telefon','☎','iletisim'],
  ]);
});

test('a complete non-vocational school passes seven checks and skips the field check', () => {
  const h = evaluateSchoolHealth(full, years);
  eq(status(h), { gorsel:'ok', aciklama:'ok', tesis:'ok', dil:'ok', puan:'ok', kontenjan:'ok', alan:'na', telefon:'ok' });
  eq({ missing: h.missing, required: h.required, complete: h.complete }, { missing: 0, required: 7, complete: true });
});

test('missing items carry readable messages', () => {
  const h = evaluateSchoolHealth({ ...full, description: 'kısa', images: [], languages: [], phone: '  ', facilityCount: 0, scoreYears: [2024], quotaYears: [] }, years);
  const messages = Object.fromEntries(h.items.filter((i) => i.status === 'missing').map((i) => [i.id, i.message]));
  eq(messages, {
    gorsel: 'Görsel yok', aciklama: 'Açıklama kısa (4/80)', tesis: 'Tesis kaydı yok', dil: 'Yabancı dil yok',
    puan: '2025 puanı yok', kontenjan: '2026 kontenjanı yok', telefon: 'Telefon yok',
  });
  assert.equal(h.complete, false);
  assert.equal(h.missing, 7);
  assert.equal(evaluateSchoolHealth({ ...full, description: '   ' }, years).items[1].message, 'Açıklama yok');
});

test('vocational schools need a field; detection is Turkish case-insensitive', () => {
  assert.equal(isVocationalType('Mesleki ve Teknik Anadolu Lisesi'), true);
  assert.equal(isVocationalType('ÇOK PROGRAMLI ANADOLU LİSESİ MESLEK'), true);
  assert.equal(isVocationalType('Fen Lisesi'), false);
  const voc = { ...full, type: 'Mesleki ve Teknik Anadolu Lisesi' };
  assert.equal(status(evaluateSchoolHealth(voc, years)).alan, 'missing');
  assert.equal(status(evaluateSchoolHealth({ ...voc, vocationalFieldCount: 2 }, years)).alan, 'ok');
});

test('score and quota checks are not required when the dataset has no year', () => {
  const h = evaluateSchoolHealth({ ...full, scoreYears: [], quotaYears: [] }, { scoreYear: null, quotaYear: null });
  eq([status(h).puan, status(h).kontenjan, h.required], ['na', 'na', 5]);
});

test('latest year, id parsing, tabs and counts', () => {
  assert.equal(latestYear([2023, 2025, 2024]), 2025);
  assert.equal(latestYear([]), null);
  assert.equal(parseHealthCheckId('puan'), 'puan');
  for (const v of ['PUAN', '', null, undefined, 'herhangi']) assert.equal(parseHealthCheckId(v), null);
  const h = evaluateSchoolHealth({ ...full, phone: null, quotaYears: [] }, years);
  eq([...missingTabs(h)].sort(), ['iletisim', 'puanlar']);
  assert.equal(countMissing([h, evaluateSchoolHealth(full, years)], 'telefon'), 1);
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `node --test tests/school-health.test.mjs`
Beklenen: FAIL — `ENOENT … src/lib/school-health.ts`.

- [ ] **Step 3: Kuralı yaz** — `src/lib/school-health.ts`

```ts
// Yönetim panelinin veri sağlığı kuralı: her okul için sabit sırada sekiz kontrol.
// Defter, künye paneli ve okul formu bu tek kuralı kullanır. Saf modül;
// Supabase veya React içermez (tests/school-health.test.mjs).

export type HealthCheckId =
  | "gorsel"
  | "aciklama"
  | "tesis"
  | "dil"
  | "puan"
  | "kontenjan"
  | "alan"
  | "telefon";

export type HealthStatus = "ok" | "missing" | "na";

export type SchoolFormTab = "temel" | "iletisim" | "puanlar" | "tesisler" | "meslekler";

export const HEALTH_CHECKS: readonly {
  id: HealthCheckId;
  short: string;
  label: string;
  tab: SchoolFormTab;
}[] = [
  { id: "gorsel", short: "G", label: "Görsel", tab: "temel" },
  { id: "aciklama", short: "A", label: "Açıklama", tab: "temel" },
  { id: "tesis", short: "T", label: "Tesis", tab: "tesisler" },
  { id: "dil", short: "D", label: "Yabancı dil", tab: "temel" },
  { id: "puan", short: "P", label: "Puan", tab: "puanlar" },
  { id: "kontenjan", short: "K", label: "Kontenjan", tab: "puanlar" },
  { id: "alan", short: "M", label: "Meslek alanı", tab: "meslekler" },
  { id: "telefon", short: "☎", label: "Telefon", tab: "iletisim" },
];

export const MIN_DESCRIPTION_LENGTH = 80;

export type HealthInput = {
  type: string;
  description: string;
  images: string[];
  languages: string[];
  phone: string | null;
  vocationalFieldCount: number;
  facilityCount: number;
  scoreYears: number[];
  quotaYears: number[];
};

// Veri kümesinin son puan ve kontenjan yılları; tabloda hiç kayıt yoksa null.
export type HealthYears = { scoreYear: number | null; quotaYear: number | null };

export type HealthItem = {
  id: HealthCheckId;
  label: string;
  short: string;
  tab: SchoolFormTab;
  status: HealthStatus;
  message: string | null;
};

export type SchoolHealth = {
  items: HealthItem[];
  missing: number;
  required: number;
  complete: boolean;
};

export function latestYear(years: Iterable<number>): number | null {
  let latest: number | null = null;
  for (const year of years) {
    if (Number.isFinite(year) && (latest === null || year > latest)) latest = year;
  }
  return latest;
}

export function isVocationalType(type: string): boolean {
  return type.toLocaleLowerCase("tr-TR").includes("meslek");
}

type Verdict = { status: HealthStatus; message: string | null };

const ok: Verdict = { status: "ok", message: null };
const na: Verdict = { status: "na", message: null };
const missing = (message: string): Verdict => ({ status: "missing", message });

function judge(id: HealthCheckId, input: HealthInput, years: HealthYears): Verdict {
  switch (id) {
    case "gorsel":
      return input.images.length > 0 ? ok : missing("Görsel yok");
    case "aciklama": {
      const length = input.description.trim().length;
      if (length === 0) return missing("Açıklama yok");
      return length >= MIN_DESCRIPTION_LENGTH
        ? ok
        : missing(`Açıklama kısa (${length}/${MIN_DESCRIPTION_LENGTH})`);
    }
    case "tesis":
      return input.facilityCount > 0 ? ok : missing("Tesis kaydı yok");
    case "dil":
      return input.languages.length > 0 ? ok : missing("Yabancı dil yok");
    case "puan":
      if (years.scoreYear === null) return na;
      return input.scoreYears.includes(years.scoreYear)
        ? ok
        : missing(`${years.scoreYear} puanı yok`);
    case "kontenjan":
      if (years.quotaYear === null) return na;
      return input.quotaYears.includes(years.quotaYear)
        ? ok
        : missing(`${years.quotaYear} kontenjanı yok`);
    case "alan":
      if (!isVocationalType(input.type)) return na;
      return input.vocationalFieldCount > 0 ? ok : missing("Meslek alanı yok");
    case "telefon":
      return (input.phone ?? "").trim().length > 0 ? ok : missing("Telefon yok");
  }
}

export function evaluateSchoolHealth(input: HealthInput, years: HealthYears): SchoolHealth {
  const items = HEALTH_CHECKS.map((check) => ({ ...check, ...judge(check.id, input, years) }));
  const missingCount = items.filter((item) => item.status === "missing").length;
  const required = items.filter((item) => item.status !== "na").length;
  return { items, missing: missingCount, required, complete: missingCount === 0 };
}

export function parseHealthCheckId(raw: string | null | undefined): HealthCheckId | null {
  return HEALTH_CHECKS.find((check) => check.id === raw)?.id ?? null;
}

export function missingTabs(health: SchoolHealth): Set<SchoolFormTab> {
  return new Set(health.items.filter((item) => item.status === "missing").map((item) => item.tab));
}

export function countMissing(list: SchoolHealth[], id: HealthCheckId): number {
  return list.filter((health) =>
    health.items.some((item) => item.id === id && item.status === "missing"),
  ).length;
}
```

- [ ] **Step 4: Testi geçir**

Run: `node --test tests/school-health.test.mjs`
Beklenen: 6 test PASS.

- [ ] **Step 5: Tüm testler, lint, commit**

```bash
npm test && npx eslint .
git add src/lib/school-health.ts tests/school-health.test.mjs
git commit -m "feat: eight-check school data health rule

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Defter mantığı (filtre, URL, sıralama, tarih)

**Files:**
- Create: `src/lib/admin-ledger.ts`
- Test: `tests/admin-ledger.test.mjs`

**Interfaces:**
- Consumes: `parseHealthCheckId`, `HealthCheckId`, `SchoolHealth` (Görev 3); `buildTurkishNameRegex(input: string): string` (`src/lib/turkishSearch.ts`).
- Produces:
  - `type LedgerRow = { id: number; name: string; slug: string; district: string; type: string; isActive: boolean; updatedAt: string | null; createdAt: string | null; health: SchoolHealth }`
  - `type LedgerStatus = "aktif" | "pasif"`, `type LedgerMissing = HealthCheckId | "herhangi"`
  - `type LedgerSort = "ad" | "ad-ters" | "guncel" | "yeni" | "ilce" | "tur" | "eksik"`
  - `LEDGER_SORT_LABELS: Record<LedgerSort, string>`
  - `type LedgerFilters = { ara: string; ilce: string | null; tur: string | null; durum: LedgerStatus | null; eksik: LedgerMissing | null; sirala: LedgerSort }`
  - `DEFAULT_LEDGER_FILTERS: LedgerFilters`
  - `parseLedgerFilters(params: { get(name: string): string | null }): LedgerFilters`
  - `ledgerSearch(filters: LedgerFilters, extra?: Record<string, string | null | undefined>): string` (başında `?` ya da boş dize)
  - `countActiveFilters(filters: LedgerFilters): number`
  - `applyLedgerFilters(rows: LedgerRow[], filters: LedgerFilters): LedgerRow[]`
  - `formatRelativeDate(value: string | null, now: Date): string`
  - `formatFullDate(value: string | null): string`

- [ ] **Step 1: Başarısız testi yaz** — `tests/admin-ledger.test.mjs`

```js
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';
function load(file) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,URLSearchParams,require:(name)=>{
    if (!name.startsWith('@/')) throw new Error(`unexpected import ${name}`);
    const base = `src/${name.slice(2)}`; return load(existsSync(base+'.ts')?base+'.ts':base+'.tsx');
  }});
  return exports;
}
const { evaluateSchoolHealth } = load('src/lib/school-health.ts');
const L = load('src/lib/admin-ledger.ts');
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const years = { scoreYear: 2025, quotaYear: 2026 };
const base = { type:'Anadolu Lisesi', description:'x'.repeat(90), images:['a'], languages:['İngilizce'], phone:'1', vocationalFieldCount:0, facilityCount:1, scoreYears:[2025], quotaYears:[2026] };
const row = (id, name, extra = {}, health = {}) => ({
  id, name, slug: `okul-${id}`, district: 'Akdeniz', type: 'Anadolu Lisesi', isActive: true,
  updatedAt: '2026-09-01T10:00:00Z', createdAt: '2026-01-01T10:00:00Z',
  health: evaluateSchoolHealth({ ...base, ...health }, years), ...extra,
});
const rows = [
  row(1, 'Zeytinlibahçe Anadolu Lisesi', { district: 'Erdemli', updatedAt: '2026-09-20T10:00:00Z' }),
  row(2, 'İmam Hatip Lisesi', { type: 'Anadolu İmam Hatip Lisesi', isActive: false }, { phone: null, scoreYears: [] }),
  row(3, 'Çamlıyayla Fen Lisesi', { createdAt: '2026-09-10T10:00:00Z' }, { images: [] }),
];
const names = (list) => list.map((r) => r.id);
const filters = (qs) => L.parseLedgerFilters(new URLSearchParams(qs));

test('parses filters and ignores unknown values', () => {
  eq(filters(''), { ara:'', ilce:null, tur:null, durum:null, eksik:null, sirala:'ad' });
  eq(filters('ara=%20imam%20&ilce=Erdemli&durum=pasif&eksik=puan&sirala=eksik'),
    { ara:'imam', ilce:'Erdemli', tur:null, durum:'pasif', eksik:'puan', sirala:'eksik' });
  eq(filters('durum=hepsi&eksik=yok&sirala=constructor'), { ara:'', ilce:null, tur:null, durum:null, eksik:null, sirala:'ad' });
  assert.equal(filters('eksik=herhangi').eksik, 'herhangi');
});

test('builds a search string without defaults and with extras', () => {
  assert.equal(L.ledgerSearch(L.DEFAULT_LEDGER_FILTERS), '');
  assert.equal(L.ledgerSearch({ ...L.DEFAULT_LEDGER_FILTERS, eksik: 'puan', sirala: 'eksik' }, { okul: 'okul-3', bos: null }),
    '?eksik=puan&sirala=eksik&okul=okul-3');
  assert.equal(L.countActiveFilters(filters('ara=a&ilce=b&sirala=guncel')), 2);
});

test('search is Turkish case-insensitive across name, district, type and slug', () => {
  eq(names(L.applyLedgerFilters(rows, filters('ara=imam'))), [2]);
  eq(names(L.applyLedgerFilters(rows, filters('ara=ÇAMLI'))), [3]);
  eq(names(L.applyLedgerFilters(rows, filters('ara=erdemli'))), [1]);
  eq(names(L.applyLedgerFilters(rows, filters('ara=okul-2'))), [2]);
});

test('status and missing filters use the health rule', () => {
  eq(names(L.applyLedgerFilters(rows, filters('durum=pasif'))), [2]);
  eq(names(L.applyLedgerFilters(rows, filters('durum=aktif'))), [3, 1]);
  eq(names(L.applyLedgerFilters(rows, filters('eksik=gorsel'))), [3]);
  eq(names(L.applyLedgerFilters(rows, filters('eksik=herhangi'))), [3, 2]);
});

test('sorts by name, recency and missing count with Turkish collation', () => {
  eq(names(L.applyLedgerFilters(rows, filters(''))), [3, 2, 1]);
  eq(names(L.applyLedgerFilters(rows, filters('sirala=ad-ters'))), [1, 2, 3]);
  eq(names(L.applyLedgerFilters(rows, filters('sirala=guncel'))), [1, 3, 2]);
  eq(names(L.applyLedgerFilters(rows, filters('sirala=yeni'))), [3, 2, 1]);
  eq(names(L.applyLedgerFilters(rows, filters('sirala=eksik'))), [2, 3, 1]);
});

test('relative dates follow the Istanbul calendar day', () => {
  const now = new Date('2026-09-23T09:00:00Z');
  assert.equal(L.formatRelativeDate('2026-09-23T01:00:00Z', now), 'bugün');
  assert.equal(L.formatRelativeDate('2026-09-22T20:59:00Z', now), 'dün');
  assert.equal(L.formatRelativeDate('2026-09-22T21:30:00Z', now), 'bugün');
  assert.equal(L.formatRelativeDate('2026-09-19T10:00:00Z', now), '4 gün önce');
  assert.equal(L.formatRelativeDate('2026-09-12T10:00:00Z', now), '12 Eyl');
  assert.equal(L.formatRelativeDate('2025-03-02T10:00:00Z', now), '2 Mar 2025');
  assert.equal(L.formatRelativeDate(null, now), '—');
  assert.equal(L.formatRelativeDate('bozuk', now), '—');
  assert.match(L.formatFullDate('2026-09-12T10:05:00Z'), /12 Eylül 2026.*13:05/);
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `node --test tests/admin-ledger.test.mjs`
Beklenen: FAIL — `ENOENT … src/lib/admin-ledger.ts`.

- [ ] **Step 3: Modülü yaz** — `src/lib/admin-ledger.ts`

```ts
// Yönetim defterinin saf mantığı: URL filtreleri, arama, sıralama ve tarih
// biçimleri. SchoolLedger (istemci) ve testler bunu kullanır.
import { buildTurkishNameRegex } from "@/lib/turkishSearch";
import {
  parseHealthCheckId,
  type HealthCheckId,
  type SchoolHealth,
} from "@/lib/school-health";

export type LedgerRow = {
  id: number;
  name: string;
  slug: string;
  district: string;
  type: string;
  isActive: boolean;
  updatedAt: string | null;
  createdAt: string | null;
  health: SchoolHealth;
};

export type LedgerStatus = "aktif" | "pasif";
export type LedgerMissing = HealthCheckId | "herhangi";
export type LedgerSort = "ad" | "ad-ters" | "guncel" | "yeni" | "ilce" | "tur" | "eksik";

export const LEDGER_SORT_LABELS: Record<LedgerSort, string> = {
  ad: "Okul adı (A-Z)",
  "ad-ters": "Okul adı (Z-A)",
  guncel: "Son güncellenen",
  yeni: "Son eklenen",
  ilce: "İlçe",
  tur: "Tür",
  eksik: "En çok eksik",
};

export type LedgerFilters = {
  ara: string;
  ilce: string | null;
  tur: string | null;
  durum: LedgerStatus | null;
  eksik: LedgerMissing | null;
  sirala: LedgerSort;
};

export const DEFAULT_LEDGER_FILTERS: LedgerFilters = {
  ara: "",
  ilce: null,
  tur: null,
  durum: null,
  eksik: null,
  sirala: "ad",
};

type ParamSource = { get(name: string): string | null };

export function parseLedgerFilters(params: ParamSource): LedgerFilters {
  const text = (key: string) => (params.get(key) ?? "").trim();
  const durum = text("durum");
  const eksik = text("eksik");
  const sirala = text("sirala");

  return {
    ara: text("ara"),
    ilce: text("ilce") || null,
    tur: text("tur") || null,
    durum: durum === "aktif" || durum === "pasif" ? durum : null,
    eksik: eksik === "herhangi" ? "herhangi" : parseHealthCheckId(eksik),
    sirala: Object.hasOwn(LEDGER_SORT_LABELS, sirala) ? (sirala as LedgerSort) : "ad",
  };
}

export function ledgerSearch(
  filters: LedgerFilters,
  extra: Record<string, string | null | undefined> = {},
): string {
  const params = new URLSearchParams();
  if (filters.ara) params.set("ara", filters.ara);
  if (filters.ilce) params.set("ilce", filters.ilce);
  if (filters.tur) params.set("tur", filters.tur);
  if (filters.durum) params.set("durum", filters.durum);
  if (filters.eksik) params.set("eksik", filters.eksik);
  if (filters.sirala !== "ad") params.set("sirala", filters.sirala);
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

export function countActiveFilters(filters: LedgerFilters): number {
  return [filters.ara, filters.ilce, filters.tur, filters.durum, filters.eksik].filter(Boolean).length;
}

const compareText = (first: string, second: string) =>
  first.localeCompare(second, "tr", { sensitivity: "base" });

function timeOf(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function matchesMissing(row: LedgerRow, missing: LedgerMissing | null): boolean {
  if (!missing) return true;
  if (missing === "herhangi") return !row.health.complete;
  return row.health.items.some((item) => item.id === missing && item.status === "missing");
}

export function applyLedgerFilters(rows: LedgerRow[], filters: LedgerFilters): LedgerRow[] {
  const pattern = filters.ara ? new RegExp(buildTurkishNameRegex(filters.ara), "i") : null;

  return rows
    .filter((row) => {
      if (pattern && !pattern.test(`${row.name} ${row.district} ${row.type} ${row.slug}`)) return false;
      if (filters.ilce && row.district !== filters.ilce) return false;
      if (filters.tur && row.type !== filters.tur) return false;
      if (filters.durum === "aktif" && !row.isActive) return false;
      if (filters.durum === "pasif" && row.isActive) return false;
      return matchesMissing(row, filters.eksik);
    })
    .sort((first, second) => {
      const byName = compareText(first.name, second.name);
      switch (filters.sirala) {
        case "ad-ters":
          return -byName;
        case "guncel":
          return timeOf(second.updatedAt) - timeOf(first.updatedAt) || byName;
        case "yeni":
          return timeOf(second.createdAt) - timeOf(first.createdAt) || byName;
        case "ilce":
          return compareText(first.district, second.district) || byName;
        case "tur":
          return compareText(first.type, second.type) || byName;
        case "eksik":
          return second.health.missing - first.health.missing || byName;
        default:
          return byName;
      }
    });
}

const TIME_ZONE = "Europe/Istanbul";
const DAY = 86_400_000;
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// İstanbul takvim gününün UTC gece yarısı; gün farkını saat diliminden bağımsız yapar.
function dayKey(date: Date): number {
  return Date.parse(`${dayKeyFormat.format(date)}T00:00:00Z`);
}

export function formatRelativeDate(value: string | null, now: Date): string {
  const date = parseDate(value);
  if (!date) return "—";
  const days = Math.round((dayKey(now) - dayKey(date)) / DAY);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün önce`;
  const sameYear = dayKeyFormat.format(now).slice(0, 4) === dayKeyFormat.format(date).slice(0, 4);
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

export function formatFullDate(value: string | null): string {
  const date = parseDate(value);
  if (!date) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
```

- [ ] **Step 4: Testi geçir**

Run: `node --test tests/admin-ledger.test.mjs`
Beklenen: 6 test PASS. `'12 Eyl'` ya da `'2 Mar 2025'` farklı çıkarsa (ICU sürümü `Eyl.` gibi nokta ekleyebilir) `node -e 'console.log(new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"short",timeZone:"Europe/Istanbul"}).format(new Date("2026-09-12T10:00:00Z")))'` çıktısına bak; testteki beklenen dizeyi Node'un gerçek çıktısıyla eşitle, uygulamayı değil.

- [ ] **Step 5: Tüm testler, lint, commit**

```bash
npm test && npx eslint .
git add src/lib/admin-ledger.ts tests/admin-ledger.test.mjs
git commit -m "feat: ledger filters, sorting and date helpers for the admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Kabuk (yan menü, üst bar, hızlı arama) ve giriş ekranı

**Files:**
- Create: `src/components/admin/shell/nav.ts`, `AdminFrame.tsx`, `AdminSidebar.tsx`, `AdminTopbar.tsx`, `SchoolQuickSearch.tsx`, `UserMenu.tsx`
- Modify: `src/app/admin/layout.tsx`, `src/app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `adminFocus`, `adminInput`, `adminButton`, `AdminSubmitButton` (Görev 2); `buildTurkishNameRegex`; `signOutAdmin` (`src/app/admin/login/actions.ts`, `"use server"`); `requireAdmin`.
- Produces:
  - `type QuickSearchSchool = { id: number; name: string; slug: string; district: string }`
  - `ADMIN_SIDEBAR_COOKIE = "admin_sidebar"` (`nav.ts`)
  - `AdminFrame({ collapsed, email, unreadCount, schoolCount, schools, children })`
  - Her admin sayfası kabuğun `<main>` içinde render edilir ve kendi `AdminPage` kapsayıcısını kullanır (Görev 6+).

- [ ] **Step 1: Next belgelerini oku**

Run: `sed -n 1,80p node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md; sed -n 1,60p node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md`
Beklenen: `cookies()` async; layout'ta okumak sayfayı dinamik yapar (admin zaten `headers()` ile dinamik).

- [ ] **Step 2: Menü yapısı** — `src/components/admin/shell/nav.ts`

```ts
import {
  BriefcaseBusiness,
  CircleHelp,
  FileSpreadsheet,
  Mail,
  PanelBottom,
  PanelTop,
  School,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const ADMIN_SIDEBAR_COOKIE = "admin_sidebar";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: "schools" | "unread";
  isActive: (pathname: string) => boolean;
};

export const ADMIN_NAV: { group: string; items: AdminNavItem[] }[] = [
  {
    group: "İçerik",
    items: [
      {
        href: "/admin",
        label: "Okullar",
        icon: School,
        count: "schools",
        isActive: (p) =>
          p === "/admin" ||
          (p.startsWith("/admin/okullar/") && !p.startsWith("/admin/okullar/toplu-yukle")),
      },
      {
        href: "/admin/okullar/toplu-yukle",
        label: "Toplu yükleme",
        icon: FileSpreadsheet,
        isActive: (p) => p.startsWith("/admin/okullar/toplu-yukle"),
      },
      {
        href: "/admin/meslek-alanlari",
        label: "Meslek alanları",
        icon: BriefcaseBusiness,
        isActive: (p) => p.startsWith("/admin/meslek-alanlari"),
      },
    ],
  },
  {
    group: "Ziyaretçiler",
    items: [
      {
        href: "/admin/mesajlar",
        label: "Mesajlar",
        icon: Mail,
        count: "unread",
        isActive: (p) => p.startsWith("/admin/mesajlar"),
      },
      {
        href: "/admin/soru-cevap",
        label: "Soru-cevap",
        icon: CircleHelp,
        isActive: (p) => p.startsWith("/admin/soru-cevap"),
      },
    ],
  },
  {
    group: "Site",
    items: [
      {
        href: "/admin/site-settings",
        label: "Genel ayarlar",
        icon: Settings,
        isActive: (p) => p === "/admin/site-settings",
      },
      {
        href: "/admin/site-settings/navigation",
        label: "Menü",
        icon: PanelTop,
        isActive: (p) => p.startsWith("/admin/site-settings/navigation"),
      },
      {
        href: "/admin/site-settings/footer",
        label: "Alt bilgi",
        icon: PanelBottom,
        isActive: (p) => p.startsWith("/admin/site-settings/footer"),
      },
    ],
  },
];
```

- [ ] **Step 3: Yan menü** — `src/components/admin/shell/AdminSidebar.tsx`

Menü bağlantıları düz `<a>` değil `Link` olur; okul formundaki `UnsavedChangesWarning` belgedeki tüm `<a>` tıklamalarını yakaladığı için `Link` (bir `<a>` render eder) da uyarıyı tetikler.

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";
import { ADMIN_NAV } from "@/components/admin/shell/nav";

type Props = {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  unreadCount: number;
  schoolCount: number;
  variant: "rail" | "drawer";
};

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  unreadCount,
  schoolCount,
  variant,
}: Props) {
  const pathname = usePathname() ?? "";
  const compact = variant === "rail" && collapsed;

  return (
    <nav aria-label="Yönetim menüsü" className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center gap-2.5 border-b border-admin-line", compact ? "justify-center px-2" : "px-5")}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-accent text-[13px] font-bold text-white">
          HL
        </span>
        {!compact && (
          <span className="leading-tight">
            <span className="block text-sm font-bold text-admin-ink">Hedefim Lise</span>
            <span className="block text-xs text-admin-muted">Yönetim</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.group} className="mb-5">
            {compact ? (
              <div className="mx-auto mb-2 h-px w-6 bg-admin-line" aria-hidden="true" />
            ) : (
              <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wide text-admin-faint uppercase">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.isActive(pathname);
                const count =
                  item.count === "unread" ? unreadCount : item.count === "schools" ? schoolCount : 0;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      title={compact ? item.label : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2.5 rounded-lg text-sm transition-colors duration-150",
                        compact ? "justify-center px-0" : "px-2.5",
                        active
                          ? "bg-admin-tint font-semibold text-admin-tint-ink"
                          : "text-admin-body hover:bg-admin-line-soft hover:text-admin-ink",
                        adminFocus,
                      )}
                    >
                      <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                      {compact ? (
                        <span className="sr-only">{item.label}</span>
                      ) : (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!compact && count > 0 && (
                        <span
                          className={cn(
                            "tabular-nums text-xs",
                            item.count === "unread"
                              ? "rounded-full bg-admin-accent px-1.5 py-px font-semibold text-white"
                              : "text-admin-muted",
                          )}
                        >
                          {count}
                          {item.count === "unread" && <span className="sr-only"> okunmamış</span>}
                        </span>
                      )}
                      {compact && item.count === "unread" && count > 0 && (
                        <span className="sr-only">{count} okunmamış</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {variant === "rail" && onToggleCollapsed && (
        <div className="border-t border-admin-line p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-lg text-sm text-admin-muted hover:bg-admin-line-soft hover:text-admin-ink",
              compact ? "justify-center" : "px-2.5",
              adminFocus,
            )}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="h-[18px] w-[18px]" />
            )}
            {compact ? <span className="sr-only">Menüyü genişlet</span> : "Daralt"}
          </button>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 4: Hızlı arama** — `src/components/admin/shell/SchoolQuickSearch.tsx`

Sonuçlar gerçek `<a>` öğeleridir; Enter etkin bağlantıya `click()` gönderir. Böylece okul formundaki kaydedilmemiş değişiklik uyarısı `router.push` ile atlanmaz.

```tsx
"use client";

import { useId, useMemo, useRef, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { buildTurkishNameRegex } from "@/lib/turkishSearch";
import { cn } from "@/lib/cn";

export type QuickSearchSchool = { id: number; name: string; slug: string; district: string };

const MAX_RESULTS = 8;

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function SchoolQuickSearch({ schools }: { schools: QuickSearchSchool[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const text = query.trim();
    if (!text) return [];
    const pattern = new RegExp(buildTurkishNameRegex(text), "i");
    return schools.filter((s) => pattern.test(`${s.name} ${s.district}`)).slice(0, MAX_RESULTS);
  }, [query, schools]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showList = open && query.trim().length > 0;
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      listRef.current?.querySelectorAll("a")[activeIndex]?.click();
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-admin-faint" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-label="Okul ara ve düzenle"
        placeholder="Okul ara ve düzenle…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-lg border border-admin-line-strong bg-admin-ground pr-10 pl-9 text-sm text-admin-ink outline-none placeholder:text-admin-faint focus:border-admin-accent focus:bg-white focus:ring-2 focus:ring-admin-accent/20"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-admin-line px-1.5 text-[11px] text-admin-faint sm:block">
        /
      </kbd>
      {showList && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-admin-line bg-white p-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-admin-muted">Eşleşen okul yok.</li>
          ) : (
            results.map((school, index) => (
              <li key={school.id} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}>
                <a
                  href={`/admin/okullar/${school.slug}/duzenle`}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm",
                    index === activeIndex ? "bg-admin-tint text-admin-tint-ink" : "text-admin-ink",
                  )}
                >
                  <span className="block truncate font-medium">{school.name}</span>
                  <span className="block text-xs text-admin-muted">{school.district}</span>
                </a>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Kullanıcı menüsü** — `src/components/admin/shell/UserMenu.tsx`

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { signOutAdmin } from "@/app/admin/login/actions";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

function initials(email: string) {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toLocaleUpperCase("tr-TR") || "?";
}

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Hesap menüsü: ${email}`}
        onClick={() => setOpen((value) => !value)}
        className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-admin-tint text-xs font-bold text-admin-tint-ink", adminFocus)}
      >
        {initials(email)}
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-admin-line bg-white p-1 shadow-lg">
          <p className="truncate px-3 py-2 text-xs text-admin-muted">{email}</p>
          <form action={signOutAdmin}>
            <button
              type="submit"
              role="menuitem"
              className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-admin-body hover:bg-rose-50 hover:text-rose-700", adminFocus)}
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Çıkış yap
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Üst bar** — `src/components/admin/shell/AdminTopbar.tsx`

```tsx
"use client";

import { ExternalLink, Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminButton } from "@/components/admin/ui/Button";
import { adminFocus } from "@/components/admin/ui/styles";
import { SchoolQuickSearch, type QuickSearchSchool } from "@/components/admin/shell/SchoolQuickSearch";
import { UserMenu } from "@/components/admin/shell/UserMenu";

export function AdminTopbar({
  email,
  schools,
  onOpenMenu,
}: {
  email: string;
  schools: QuickSearchSchool[];
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-admin-line bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Menüyü aç"
        className={cn("-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-admin-body hover:bg-admin-line-soft lg:hidden", adminFocus)}
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>
      <SchoolQuickSearch schools={schools} />
      <div className="ml-auto flex items-center gap-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={adminButton({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          Siteyi aç
        </a>
        <UserMenu email={email} />
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Çerçeve** — `src/components/admin/shell/AdminFrame.tsx`

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";
import { AdminSidebar } from "@/components/admin/shell/AdminSidebar";
import { AdminTopbar } from "@/components/admin/shell/AdminTopbar";
import { ADMIN_SIDEBAR_COOKIE } from "@/components/admin/shell/nav";
import type { QuickSearchSchool } from "@/components/admin/shell/SchoolQuickSearch";

type Props = {
  collapsed: boolean;
  email: string;
  unreadCount: number;
  schoolCount: number;
  schools: QuickSearchSchool[];
  children: React.ReactNode;
};

export function AdminFrame({ collapsed: initialCollapsed, email, unreadCount, schoolCount, schools, children }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${ADMIN_SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/admin; max-age=31536000; samesite=lax`;
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const sidebarProps = { unreadCount, schoolCount };

  return (
    <div className="admin flex min-h-screen w-full flex-1">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        İçeriğe geç
      </a>

      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-admin-line bg-white transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <AdminSidebar variant="rail" collapsed={collapsed} onToggleCollapsed={toggleCollapsed} {...sidebarProps} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Yönetim menüsü">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-admin-ink/40"
          />
          <div ref={drawerRef} className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Menüyü kapat"
              className={cn("absolute top-3.5 right-3 flex h-9 w-9 items-center justify-center rounded-lg text-admin-body hover:bg-admin-line-soft", adminFocus)}
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <AdminSidebar variant="drawer" collapsed={false} onNavigate={() => setDrawerOpen(false)} {...sidebarProps} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar email={email} schools={schools} onOpenMenu={() => setDrawerOpen(true)} />
        <main id="admin-main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Admin layout'u** — `src/app/admin/layout.tsx` (tümünü değiştir)

```tsx
import { cookies, headers } from "next/headers";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminFrame } from "@/components/admin/shell/AdminFrame";
import { ADMIN_SIDEBAR_COOKIE } from "@/components/admin/shell/nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <div className="admin flex min-h-screen w-full flex-1">{children}</div>;
  }

  // Yalnız kabuk verisi içindir; her sayfa kendi requireAdmin() kontrolünü yapar.
  const { supabase, user, profile } = await requireAdmin();
  const [cookieStore, schoolsResult, unreadResult] = await Promise.all([
    cookies(),
    supabase.from("schools").select("id, name, slug, district").order("name"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "unread"),
  ]);
  const schools = schoolsResult.data ?? [];

  return (
    <AdminFrame
      collapsed={cookieStore.get(ADMIN_SIDEBAR_COOKIE)?.value === "collapsed"}
      email={profile.email ?? user.email ?? ""}
      unreadCount={unreadResult.count ?? 0}
      schoolCount={schools.length}
      schools={schools}
    >
      {children}
    </AdminFrame>
  );
}
```

- [ ] **Step 9: Giriş ekranı** — `src/app/admin/login/page.tsx`

`SubmitButton` importunu `import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";` ve `import { adminInput, adminLabel, adminHint } from "@/components/admin/ui/styles";` ile değiştir. `return (…)` bloğunu şu şekilde değiştir (fonksiyonun üst kısmı, `getSafeNext` ve yönlendirme aynen kalır):

```tsx
  return (
    <div className="flex w-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-accent text-sm font-bold text-white">
            HL
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-admin-ink">Hedefim Lise</span>
            <span className="block text-xs text-admin-muted">Yönetim</span>
          </span>
        </div>
        <div className="rounded-xl border border-admin-line bg-white p-6 shadow-admin-card">
          <h1 className="text-xl font-bold tracking-tight text-admin-ink">Giriş yap</h1>
          <p className="mt-1 text-sm text-admin-muted">Yönetim paneline e-posta ve şifrenizle girin.</p>

          {params?.error && (
            <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {params.error}
            </div>
          )}

          <form action={signInAdmin} className="mt-5 space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <label className="block">
              <span className={adminLabel}>E-posta</span>
              <input type="email" name="email" required autoComplete="email" className={adminInput} placeholder="ornek@site.com" />
            </label>
            <label className="block">
              <span className={adminLabel}>Şifre</span>
              <input type="password" name="password" required minLength={8} autoComplete="current-password" className={adminInput} />
              <span className={adminHint}>En az 8 karakter.</span>
            </label>
            <AdminSubmitButton label="Giriş yap" pendingLabel="Giriş yapılıyor…" className="w-full" />
          </form>
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 10: Derle ve dev sunucusunda aç**

```bash
npx tsc --noEmit && npx eslint . && npm test
```

`.claude/launch.json` yoksa oluştur:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "hedefim-dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev:preview", "--", "-p", "3105"], "port": 3105 }
  ]
}
```

`preview_start {name: "hedefim-dev"}` ile aç, `/admin/login` sayfasını masaüstü ve 390px genişlikte kontrol et. `/admin` için kullanıcıdan uygulama içi tarayıcıda kendisinin giriş yapmasını iste (parola girme). Kontrol: yan menü grupları, etkin öğe, daraltma (sayfa yenilenince durum korunur), `/` ile arama odağı, Enter ile düzenleme ekranı, mobilde hamburger çekmecesi, Esc kapatır, Navbar/Footer admin'de görünmez, `/` ana sayfada görünür.

- [ ] **Step 11: Commit**

```bash
git add src/components/admin/shell src/app/admin/layout.tsx src/app/admin/login/page.tsx .claude/launch.json
git commit -m "feat: admin shell with grouped sidebar, quick search and user menu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Okullar defteri ve künye paneli

**Files:**
- Create: `src/components/admin/ui/HealthPips.tsx`, `src/components/admin/ledger/LedgerSummary.tsx`, `SchoolLedger.tsx`, `LedgerFilters.tsx`, `LedgerTable.tsx`, `SchoolDetailPanel.tsx`, `BulkActionBar.tsx`
- Modify: `src/app/admin/page.tsx`
- Delete: `src/components/admin/AdminSchoolList.tsx`, `src/components/admin/DeleteSchoolButton.tsx`

**Interfaces:**
- Consumes: `evaluateSchoolHealth`, `latestYear`, `countMissing`, `HEALTH_CHECKS`, `HealthItem` (Görev 3); `LedgerRow`, `parseLedgerFilters`, `ledgerSearch`, `applyLedgerFilters`, `countActiveFilters`, `LEDGER_SORT_LABELS`, `formatRelativeDate`, `formatFullDate` (Görev 4); UI parçaları (Görev 2); `toggleSchoolStatus`, `bulkUpdateSchoolStatus`, `deleteSchool` (`(formData: FormData) => Promise<void>`).
- Produces: `HealthPips({ items: HealthItem[]; size?: "sm" | "md" })`, `HealthLegend()`.

- [ ] **Step 1: Pipler** — `src/components/admin/ui/HealthPips.tsx`

```tsx
import { HEALTH_CHECKS, type HealthItem } from "@/lib/school-health";
import { cn } from "@/lib/cn";

const STATUS_TEXT = { ok: "tamam", missing: "eksik", na: "gerekmez" } as const;

function Pip({ status, size }: { status: HealthItem["status"]; size: "sm" | "md" }) {
  const box = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  if (status === "na") {
    return <span className={cn("flex items-center justify-center", box)}><span className="h-0.5 w-full rounded bg-admin-line-strong" /></span>;
  }
  return (
    <span
      className={cn(
        "rounded-[3px]",
        box,
        status === "ok" ? "bg-emerald-600" : "border-[1.5px] border-admin-missing bg-white",
      )}
    />
  );
}

// Sekiz kontrol her zaman aynı sırada, aynı yerde; satır kırılmaz.
export function HealthPips({ items, size = "sm" }: { items: HealthItem[]; size?: "sm" | "md" }) {
  const missing = items.filter((item) => item.status === "missing");
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span aria-hidden="true" className="inline-flex items-center gap-1">
        {items.map((item) => (
          <span key={item.id} title={`${item.label}: ${STATUS_TEXT[item.status]}`}>
            <Pip status={item.status} size={size} />
          </span>
        ))}
      </span>
      <span className="sr-only">
        {missing.length === 0 ? "Eksik yok" : `Eksik: ${missing.map((item) => item.label).join(", ")}`}
      </span>
    </span>
  );
}

export function HealthLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-admin-muted">
      <span className="inline-flex items-center gap-1.5"><Pip status="ok" size="sm" />tamam</span>
      <span className="inline-flex items-center gap-1.5"><Pip status="missing" size="sm" />eksik</span>
      <span className="inline-flex items-center gap-1.5"><Pip status="na" size="sm" />gerekmez</span>
      <span>{HEALTH_CHECKS.map((check) => `${check.short} ${check.label.toLocaleLowerCase("tr-TR")}`).join(" · ")}</span>
    </p>
  );
}
```

- [ ] **Step 2: Özet şeridi** — `src/components/admin/ledger/LedgerSummary.tsx`

```tsx
import Link from "next/link";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

export type LedgerSummaryData = {
  active: number;
  passive: number;
  complete: number;
  total: number;
  scoreYear: number | null;
  missingScore: number;
  unread: number;
};

function Stat({ href, label, value, suffix, tone = "default" }: {
  href: string; label: string; value: number; suffix?: string; tone?: "default" | "attention";
}) {
  return (
    <Link
      href={href}
      className={cn("group flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-admin-ground", adminFocus, value === 0 && "opacity-60")}
    >
      <span className="text-xs text-admin-muted group-hover:text-admin-body">{label}</span>
      <span className={cn("text-xl font-bold tabular-nums", tone === "attention" && value > 0 ? "text-admin-missing" : "text-admin-ink")}>
        {value}
        {suffix && <span className="ml-1 text-xs font-medium text-admin-muted">{suffix}</span>}
      </span>
    </Link>
  );
}

export function LedgerSummary({ data }: { data: LedgerSummaryData }) {
  return (
    <div className="mb-5 grid grid-cols-2 divide-admin-line overflow-hidden rounded-xl border border-admin-line bg-white shadow-admin-card sm:grid-cols-3 lg:grid-cols-5 lg:divide-x [&>*]:border-admin-line max-lg:[&>*]:border-b">
      <Stat href="/admin?durum=aktif" label="Yayında" value={data.active} />
      <Stat href="/admin?durum=pasif" label="Pasif" value={data.passive} />
      <Stat href="/admin?eksik=herhangi" label="Tam kayıt" value={data.complete} suffix={`/ ${data.total}`} />
      {data.scoreYear !== null && (
        <Stat href="/admin?eksik=puan" label={`${data.scoreYear} puanı yok`} value={data.missingScore} tone="attention" />
      )}
      <Stat href="/admin/mesajlar?durum=okunmamis" label="Okunmamış mesaj" value={data.unread} />
    </div>
  );
}
```

Not: "Tam kayıt" bağlantısı eksiği olan okulları açar (`eksik=herhangi`), çünkü işin yapılacağı yer orasıdır; `title` özniteliğini ekle: `title="Eksiği olan okulları göster"`. `Stat`'a isteğe bağlı `title?: string` prop'u ekleyip `Link`'e geçir.

- [ ] **Step 3: Filtre çubuğu** — `src/components/admin/ledger/LedgerFilters.tsx`

```tsx
"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { HEALTH_CHECKS } from "@/lib/school-health";
import {
  LEDGER_SORT_LABELS,
  countActiveFilters,
  type LedgerFilters as Filters,
  type LedgerSort,
  type LedgerStatus,
  type LedgerMissing,
} from "@/lib/admin-ledger";
import { adminInput } from "@/components/admin/ui/styles";
import { AdminButton } from "@/components/admin/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  filters: Filters;
  districts: string[];
  types: string[];
  shown: number;
  total: number;
  onChange: (next: Filters) => void;
};

const selectClass = cn(adminInput, "w-auto min-w-0 pr-8");

export function LedgerFilters({ filters, districts, types, shown, total, onChange }: Props) {
  const [query, setQuery] = useState(filters.ara);
  const timer = useRef<number | undefined>(undefined);
  const active = countActiveFilters(filters);

  function onQuery(value: string) {
    setQuery(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange({ ...filters, ara: value.trim() }), 200);
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Bu listede ara</span>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-admin-faint" />
          <input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Ad, ilçe, tür veya slug" className={cn(adminInput, "pl-9")} />
        </label>
        <select aria-label="İlçe" value={filters.ilce ?? ""} onChange={(e) => onChange({ ...filters, ilce: e.target.value || null })} className={selectClass}>
          <option value="">Tüm ilçeler</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select aria-label="Okul türü" value={filters.tur ?? ""} onChange={(e) => onChange({ ...filters, tur: e.target.value || null })} className={selectClass}>
          <option value="">Tüm türler</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select aria-label="Durum" value={filters.durum ?? ""} onChange={(e) => onChange({ ...filters, durum: (e.target.value || null) as LedgerStatus | null })} className={selectClass}>
          <option value="">Tüm durumlar</option>
          <option value="aktif">Yayında</option>
          <option value="pasif">Pasif</option>
        </select>
        <select
          aria-label="Eksik kontrol"
          value={filters.eksik ?? ""}
          onChange={(e) => onChange({ ...filters, eksik: (e.target.value || null) as LedgerMissing | null })}
          className={cn(selectClass, filters.eksik && "border-admin-accent-soft bg-admin-tint text-admin-tint-ink")}
        >
          <option value="">Eksik: hepsi</option>
          <option value="herhangi">Eksiği olan</option>
          {HEALTH_CHECKS.map((c) => <option key={c.id} value={c.id}>Eksik: {c.label}</option>)}
        </select>
        <select aria-label="Sıralama" value={filters.sirala} onChange={(e) => onChange({ ...filters, sirala: e.target.value as LedgerSort })} className={selectClass}>
          {Object.entries(LEDGER_SORT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-admin-muted">
        <span className="tabular-nums">{shown} / {total} okul</span>
        {active > 0 && (
          <AdminButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              onChange({ ara: "", ilce: null, tur: null, durum: null, eksik: null, sirala: filters.sirala });
            }}
          >
            Filtreleri sıfırla ({active})
          </AdminButton>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Tablo** — `src/components/admin/ledger/LedgerTable.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";
import { HEALTH_CHECKS } from "@/lib/school-health";
import { formatFullDate, formatRelativeDate, type LedgerRow } from "@/lib/admin-ledger";
import { HealthPips } from "@/components/admin/ui/HealthPips";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

type Props = {
  rows: LedgerRow[];
  now: Date;
  selectedSlug: string | null;
  checkedIds: Set<number>;
  onOpen: (slug: string) => void;
  onToggleChecked: (id: number) => void;
  onToggleAll: () => void;
};

export function LedgerTable({ rows, now, selectedSlug, checkedIds, onOpen, onToggleChecked, onToggleAll }: Props) {
  const allRef = useRef<HTMLInputElement>(null);
  const checkedVisible = rows.filter((row) => checkedIds.has(row.id)).length;
  const allChecked = rows.length > 0 && checkedVisible === rows.length;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = checkedVisible > 0 && !allChecked;
  }, [checkedVisible, allChecked]);

  return (
    <div className="overflow-hidden rounded-xl border border-admin-line bg-white shadow-admin-card">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-16 z-10 bg-admin-ground/95 text-xs text-admin-muted backdrop-blur">
          <tr className="border-b border-admin-line">
            <th scope="col" className="w-10 py-2.5 pl-4">
              <input ref={allRef} type="checkbox" checked={allChecked} disabled={rows.length === 0} onChange={onToggleAll} aria-label="Görünen okulların hepsini seç" className="h-4 w-4 accent-admin-accent" />
            </th>
            <th scope="col" className="py-2.5 pr-3 font-semibold">Okul</th>
            <th scope="col" className="py-2.5 pr-3 font-semibold">
              <span aria-hidden="true" className="inline-flex gap-1 font-mono text-[11px] tracking-tight">
                {HEALTH_CHECKS.map((c) => <span key={c.id} className="w-2.5 text-center">{c.short}</span>)}
              </span>
              <span className="sr-only">Veri sağlığı</span>
            </th>
            <th scope="col" className="hidden py-2.5 pr-4 text-right font-semibold md:table-cell">Güncel</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = row.slug === selectedSlug;
            return (
              <tr
                key={row.id}
                onClick={() => onOpen(row.slug)}
                className={cn("cursor-pointer border-b border-admin-line-soft last:border-0 transition-colors", selected ? "bg-admin-tint" : "hover:bg-admin-ground")}
              >
                <td className="py-2.5 pl-4" onClick={(event) => event.stopPropagation()}>
                  <input type="checkbox" checked={checkedIds.has(row.id)} onChange={() => onToggleChecked(row.id)} aria-label={`${row.name} okulunu seç`} className="h-4 w-4 accent-admin-accent" />
                </td>
                <td className="max-w-0 py-2.5 pr-3">
                  <button
                    type="button"
                    data-ledger-slug={row.slug}
                    aria-pressed={selected}
                    onClick={(event) => { event.stopPropagation(); onOpen(row.slug); }}
                    className={cn("block w-full truncate rounded text-left font-semibold", selected ? "text-admin-tint-ink" : "text-admin-ink", adminFocus)}
                  >
                    {row.name}
                  </button>
                  <span className="flex items-center gap-1.5 truncate text-xs text-admin-muted">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", row.isActive ? "bg-emerald-600" : "bg-amber-600")} aria-hidden="true" />
                    <span>{row.isActive ? "Yayında" : "Pasif"}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{row.district} · {row.type}</span>
                  </span>
                </td>
                <td className="py-2.5 pr-3"><HealthPips items={row.health.items} /></td>
                <td className="hidden py-2.5 pr-4 text-right text-xs whitespace-nowrap text-admin-muted tabular-nums md:table-cell" title={formatFullDate(row.updatedAt)}>
                  {formatRelativeDate(row.updatedAt, now)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Künye paneli** — `src/components/admin/ledger/SchoolDetailPanel.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import type { LedgerRow } from "@/lib/admin-ledger";
import { formatFullDate } from "@/lib/admin-ledger";
import { HealthPips } from "@/components/admin/ui/HealthPips";
import { Badge } from "@/components/admin/ui/Badge";
import { adminButton } from "@/components/admin/ui/Button";
import { adminFocus } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";

type Action = (formData: FormData) => void | Promise<void>;

type Props = {
  row: LedgerRow;
  onClose: () => void;
  toggleStatusAction: Action;
  deleteAction: Action;
};

export function SchoolDetailPanel({ row, onClose, toggleStatusAction, deleteAction }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const editHref = `/admin/okullar/${row.slug}/duzenle`;
  const missing = row.health.items.filter((item) => item.status === "missing");
  const okCount = row.health.items.filter((item) => item.status === "ok").length;
  const naLabels = row.health.items.filter((item) => item.status === "na").map((item) => item.label.toLocaleLowerCase("tr-TR"));

  useEffect(() => {
    headingRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [row.slug, onClose]);

  return (
    <>
      <button type="button" aria-label="Paneli kapat" onClick={onClose} className="fixed inset-0 z-40 bg-admin-ink/30 xl:hidden" />
      <aside
        aria-label={`${row.name} künyesi`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-white shadow-xl xl:sticky xl:top-20 xl:z-auto xl:max-h-[calc(100vh-6rem)] xl:w-auto xl:max-w-none xl:rounded-xl xl:border xl:border-admin-line xl:shadow-admin-card"
      >
        <div className="flex items-start gap-3 border-b border-admin-line p-5">
          <div className="min-w-0 flex-1">
            <h2 ref={headingRef} tabIndex={-1} className="text-base leading-snug font-bold text-admin-ink outline-none">{row.name}</h2>
            <p className="mt-1 text-xs text-admin-muted">{row.district} · {row.type}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={row.isActive ? "success" : "warning"}>{row.isActive ? "Yayında" : "Pasif"}</Badge>
              <HealthPips items={row.health.items} size="md" />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Paneli kapat" className={cn("-m-1 rounded-lg p-1.5 text-admin-muted hover:bg-admin-line-soft", adminFocus)}>
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold text-admin-muted">
              {missing.length === 0 ? "Eksik yok" : `Eksikler (${missing.length})`}
            </h3>
            {missing.length > 0 && (
              <ul className="divide-y divide-admin-line-soft rounded-lg border border-admin-line">
                {missing.map((item) => (
                  <li key={item.id}>
                    <a href={`${editHref}?tab=${item.tab}`} className={cn("flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-admin-ground", adminFocus)}>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] border-[1.5px] border-admin-missing" aria-hidden="true" />
                      <span className="flex-1 text-admin-ink">{item.message}</span>
                      <span className="inline-flex items-center text-xs font-semibold text-admin-accent">Düzelt<ChevronRight aria-hidden="true" className="h-3.5 w-3.5" /></span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-admin-muted">
              {okCount} kontrol tamam{naLabels.length > 0 && ` · ${naLabels.join(", ")}: gerekmez`}
            </p>
          </section>
          <p className="text-xs text-admin-muted">Son güncelleme: {formatFullDate(row.updatedAt)}</p>
        </div>

        <div className="space-y-2 border-t border-admin-line p-5">
          <a href={editHref} className={adminButton({ variant: "primary", className: "w-full" })}>
            <Pencil aria-hidden="true" className="h-4 w-4" />Düzenle
          </a>
          <div className="grid grid-cols-2 gap-2">
            {row.isActive ? (
              <Link href={`/okullar/${row.slug}`} target="_blank" rel="noopener noreferrer" className={adminButton({ size: "sm" })}>
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />Sitede aç
              </Link>
            ) : (
              <span className={adminButton({ size: "sm", className: "pointer-events-none opacity-50" })} aria-disabled="true" title="Pasif okul sitede görünmez">
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />Sitede aç
              </span>
            )}
            <form
              action={toggleStatusAction}
              onSubmit={(event) => {
                if (row.isActive && !window.confirm(`"${row.name}" okulunu pasif hale getirmek istediğinize emin misiniz? Pasif okullar yayındaki listede görünmez.`)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="is_active" value={String(!row.isActive)} />
              <button type="submit" className={adminButton({ size: "sm", className: "w-full" })}>
                {row.isActive ? <EyeOff aria-hidden="true" className="h-3.5 w-3.5" /> : <Eye aria-hidden="true" className="h-3.5 w-3.5" />}
                {row.isActive ? "Pasifleştir" : "Aktifleştir"}
              </button>
            </form>
          </div>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm(`"${row.name}" okulunu silmek istediğinize emin misiniz? Bu işlem geri alınmaz.`)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={row.id} />
            <button type="submit" className={adminButton({ variant: "danger", size: "sm", className: "w-full" })}>
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Okulu sil
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
```

Onay metinleri `AdminSchoolList.tsx` ve `DeleteSchoolButton.tsx` içindekilerle birebir aynıdır.

- [ ] **Step 6: Toplu işlem çubuğu** — `src/components/admin/ledger/BulkActionBar.tsx`

```tsx
"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { AdminButton, adminButton } from "@/components/admin/ui/Button";

type Action = (formData: FormData) => void | Promise<void>;

export function BulkActionBar({ ids, onClear, action }: { ids: number[]; onClear: () => void; action: Action }) {
  if (ids.length === 0) return null;
  const hidden = ids.map((id) => <input key={id} type="hidden" name="ids" value={id} />);

  return (
    <div role="region" aria-label="Toplu işlemler" className="sticky bottom-4 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-admin-line bg-white px-4 py-3 shadow-lg">
      <p className="mr-auto text-sm font-semibold text-admin-ink tabular-nums">{ids.length} okul seçildi</p>
      <form action={action}>
        {hidden}
        <input type="hidden" name="is_active" value="true" />
        <button type="submit" className={adminButton({ size: "sm" })}><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" />Aktif yap</button>
      </form>
      <form
        action={action}
        onSubmit={(event) => {
          if (!window.confirm(`${ids.length} okulu pasif hale getirmek istediğinize emin misiniz? Pasif okullar yayındaki listede görünmez.`)) {
            event.preventDefault();
          }
        }}
      >
        {hidden}
        <input type="hidden" name="is_active" value="false" />
        <button type="submit" className={adminButton({ size: "sm" })}><XCircle aria-hidden="true" className="h-3.5 w-3.5 text-amber-700" />Pasif yap</button>
      </form>
      <AdminButton variant="ghost" size="sm" onClick={onClear}>Seçimi temizle</AdminButton>
    </div>
  );
}
```

- [ ] **Step 7: Defter** — `src/components/admin/ledger/SchoolLedger.tsx`

```tsx
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import {
  applyLedgerFilters,
  ledgerSearch,
  parseLedgerFilters,
  type LedgerFilters as Filters,
  type LedgerRow,
} from "@/lib/admin-ledger";
import { LedgerFilters } from "@/components/admin/ledger/LedgerFilters";
import { LedgerTable } from "@/components/admin/ledger/LedgerTable";
import { SchoolDetailPanel } from "@/components/admin/ledger/SchoolDetailPanel";
import { BulkActionBar } from "@/components/admin/ledger/BulkActionBar";
import { HealthLegend } from "@/components/admin/ui/HealthPips";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { AdminButton } from "@/components/admin/ui/Button";

type Action = (formData: FormData) => void | Promise<void>;

type Props = {
  rows: LedgerRow[];
  nowIso: string;
  bulkStatusAction: Action;
  toggleStatusAction: Action;
  deleteAction: Action;
};

const compareText = (a: string, b: string) => a.localeCompare(b, "tr", { sensitivity: "base" });

export function SchoolLedger({ rows, nowIso, bulkStatusAction, toggleStatusAction, deleteAction }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const searchParams = useSearchParams();
  const filters = parseLedgerFilters(searchParams);
  const selectedSlug = searchParams.get("okul");
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const lastOpener = useRef<string | null>(null);

  const districts = useMemo(() => [...new Set(rows.map((r) => r.district).filter(Boolean))].sort(compareText), [rows]);
  const types = useMemo(() => [...new Set(rows.map((r) => r.type).filter(Boolean))].sort(compareText), [rows]);
  const visible = useMemo(() => applyLedgerFilters(rows, filters), [rows, filters]);
  const selected = selectedSlug ? rows.find((r) => r.slug === selectedSlug) ?? null : null;
  const rowIds = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);
  const checkedIds = [...checked].filter((id) => rowIds.has(id));

  const navigate = useCallback(
    (next: Filters, okul: string | null) => {
      router.replace(`${pathname}${ledgerSearch(next, { okul })}`, { scroll: false });
    },
    [pathname, router],
  );

  const close = useCallback(() => {
    navigate(filters, null);
    const slug = lastOpener.current;
    if (slug) window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-ledger-slug="${CSS.escape(slug)}"]`)?.focus());
  }, [filters, navigate]);

  function toggle(id: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setChecked((current) => {
      const next = new Set(current);
      const allVisible = visible.length > 0 && visible.every((r) => next.has(r.id));
      for (const r of visible) {
        if (allVisible) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
  }

  return (
    <div className={selected ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start" : undefined}>
      <div className="min-w-0">
        <LedgerFilters
          key={filters.ara}
          filters={filters}
          districts={districts}
          types={types}
          shown={visible.length}
          total={rows.length}
          onChange={(next) => navigate(next, selectedSlug)}
        />
        {visible.length === 0 ? (
          <div className="rounded-xl border border-admin-line bg-white shadow-admin-card">
            <EmptyState
              icon={<SearchX aria-hidden="true" className="h-8 w-8" />}
              title="Bu filtrelere uyan okul yok"
              body="Filtreleri gevşetin ya da sıfırlayın."
              action={<AdminButton onClick={() => navigate({ ...filters, ara: "", ilce: null, tur: null, durum: null, eksik: null }, null)}>Filtreleri sıfırla</AdminButton>}
            />
          </div>
        ) : (
          <LedgerTable
            rows={visible}
            now={now}
            selectedSlug={selectedSlug}
            checkedIds={new Set(checkedIds)}
            onOpen={(slug) => {
              lastOpener.current = slug;
              navigate(filters, slug);
            }}
            onToggleChecked={toggle}
            onToggleAll={toggleAll}
          />
        )}
        <div className="mt-3"><HealthLegend /></div>
        <BulkActionBar ids={checkedIds} onClear={() => setChecked(new Set())} action={bulkStatusAction} />
      </div>
      {selected && (
        <SchoolDetailPanel row={selected} onClose={close} toggleStatusAction={toggleStatusAction} deleteAction={deleteAction} />
      )}
    </div>
  );
}
```

`LedgerFilters`'a `key={filters.ara}` verilir: arama kutusu yerel durumu URL'den dışarıdan (geri tuşu, sayaç bağlantısı) değişince yeniden kurulur. Kendi yazdığımız değer URL'ye 200 ms sonra aynı dizeyle gider; `onQuery` değeri `trim()` ettiği için bitişte boşluk yazılırsa kutu bir kez yeniden kurulabilir, bu kabul edilen bir durumdur.

- [ ] **Step 8: Sayfa** — `src/app/admin/page.tsx` (tümünü değiştir)

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { mapSchool } from "@/lib/supabase/public";
import { countMissing, evaluateSchoolHealth, latestYear } from "@/lib/school-health";
import type { LedgerRow } from "@/lib/admin-ledger";
import { bulkUpdateSchoolStatus, deleteSchool, toggleSchoolStatus } from "@/app/admin/okullar/actions";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { adminButton } from "@/components/admin/ui/Button";
import { LedgerSummary } from "@/components/admin/ledger/LedgerSummary";
import { SchoolLedger } from "@/components/admin/ledger/SchoolLedger";

export const metadata: Metadata = {
  title: "Okullar | Yönetim",
  robots: { index: false, follow: false },
};

type AdminPageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

type LedgerSourceRow = Parameters<typeof mapSchool>[0] & {
  school_facilities?: { facility_id: string }[] | null;
  school_scores?: { year: number }[] | null;
  school_quotas?: { year: number }[] | null;
};

export default async function AdminSchoolsPage({ searchParams }: AdminPageProps) {
  const { supabase } = await requireAdmin();
  const params = searchParams ? await searchParams : undefined;

  // İlişkiler gömülü okunur: üst düzey sorgular 1000 satırla sınırlı, tesis ilişkisi bunu aşıyor.
  const [schoolsResult, unreadResult] = await Promise.all([
    supabase
      .from("schools")
      .select("*, school_vocational_fields(vocational_field_id), school_facilities(facility_id), school_scores(year), school_quotas(year)")
      .order("name"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "unread"),
  ]);

  if (schoolsResult.error) {
    return (
      <AdminPage>
        <PageHeader trail={["İçerik", "Okullar"]} title="Okullar" />
        <FlashBanner error={`Okullar yüklenemedi: ${schoolsResult.error.message}`} />
      </AdminPage>
    );
  }

  const source = (schoolsResult.data ?? []) as LedgerSourceRow[];
  const years = {
    scoreYear: latestYear(source.flatMap((r) => (r.school_scores ?? []).map((s) => s.year))),
    quotaYear: latestYear(source.flatMap((r) => (r.school_quotas ?? []).map((q) => q.year))),
  };

  const rows: LedgerRow[] = source.map((raw) => {
    const school = mapSchool({ ...raw, school_scores: [] });
    return {
      id: school.id,
      name: school.name,
      slug: school.slug,
      district: school.district,
      type: school.type,
      isActive: school.isActive !== false,
      updatedAt: school.updatedAt ?? school.createdAt ?? null,
      createdAt: school.createdAt ?? null,
      health: evaluateSchoolHealth(
        {
          type: school.type,
          description: school.description,
          images: school.images,
          languages: school.languages,
          phone: school.phone,
          vocationalFieldCount: school.vocationalFields?.length ?? 0,
          facilityCount: raw.school_facilities?.length ?? 0,
          scoreYears: (raw.school_scores ?? []).map((s) => s.year),
          quotaYears: (raw.school_quotas ?? []).map((q) => q.year),
        },
        years,
      ),
    };
  });

  const active = rows.filter((r) => r.isActive).length;

  return (
    <AdminPage>
      <PageHeader
        trail={["İçerik", "Okullar"]}
        title="Okullar"
        description="Kayıtların veri sağlığı, yayın durumu ve düzenleme."
        actions={
          <Link href="/admin/okullar/yeni" className={adminButton({ variant: "primary" })}>
            <Plus aria-hidden="true" className="h-4 w-4" />Yeni okul
          </Link>
        }
      />
      <FlashBanner success={params?.success} error={params?.error} />
      <LedgerSummary
        data={{
          active,
          passive: rows.length - active,
          complete: rows.filter((r) => r.health.complete).length,
          total: rows.length,
          scoreYear: years.scoreYear,
          missingScore: countMissing(rows.map((r) => r.health), "puan"),
          unread: unreadResult.count ?? 0,
        }}
      />
      <SchoolLedger
        rows={rows}
        nowIso={new Date().toISOString()}
        bulkStatusAction={bulkUpdateSchoolStatus}
        toggleStatusAction={toggleSchoolStatus}
        deleteAction={deleteSchool}
      />
    </AdminPage>
  );
}
```

`mapSchool` parametre tipi `school_scores` alanında tam kayıt bekliyorsa ve `{ ...raw, school_scores: [] }` tip hatası verirse, `LedgerSourceRow` tanımında `Omit<Parameters<typeof mapSchool>[0], "school_scores">` kullan ve çağrıyı `mapSchool({ ...raw, school_scores: [] } as Parameters<typeof mapSchool>[0])` yap.

- [ ] **Step 9: Eski bileşenleri sil**

```bash
git rm src/components/admin/AdminSchoolList.tsx src/components/admin/DeleteSchoolButton.tsx
grep -rn "AdminSchoolList\|DeleteSchoolButton" src tests
```
Beklenen: grep boş.

- [ ] **Step 10: Doğrula**

```bash
npx tsc --noEmit && npx eslint . && npm test
```

Oturumlu tarayıcıda `/admin` (1440 ve 390 genişlik): özet sayılarının SQL ile tutarlı olduğunu kontrol et (`select count(*) filter (where is_active)` vb.; "2025 puanı yok" = 29 okul, 22 Eylül verisiyle), sayaç bağlantıları filtreyi uygular, arama `imam` → İmam Hatip okulları, `?eksik=puan` yalnız P piпi boş okulları gösterir, satıra tıklayınca panel açılır (URL'de `okul=`), Esc kapatır ve odak satıra döner, "Düzelt →" doğru sekmeyi açar. Aktif/pasif ve silme düğmelerine **basma**; yalnız onay penceresinin açıldığını görüp İptal et.

- [ ] **Step 11: Commit**

```bash
git add -A src/app/admin/page.tsx src/components/admin
git commit -m "feat: school ledger with health pips, detail panel and linked counters

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Okul formu — dikey sekme rayı, yapışkan kaydet çubuğu, sekmelerin yeniden stili

**Files:**
- Create: `src/components/admin/school-form/SchoolTabRail.tsx`, `SaveBarStatus.tsx`
- Modify: `src/components/admin/SchoolFormTabs.tsx`, `src/components/admin/UnsavedChangesWarning.tsx`
- Modify: `src/app/admin/okullar/[slug]/duzenle/page.tsx`, `src/app/admin/okullar/yeni/page.tsx`
- Modify (dönüştürme + elle): `src/components/admin/tabs/*.tsx`, `SmartSchoolBasicFields.tsx`, `ImageUploadField.tsx`, `LogoUploadField.tsx`
- Test: `tests/admin-form-draft.test.mjs` (değişmez; geçmeli)

**Interfaces:**
- Consumes: `SchoolHealth`, `missingTabs`, `evaluateSchoolHealth`, `latestYear` (Görev 3); `AdminSubmitButton`, `adminButton`, `adminInput`, `adminLabel`, `Badge`, `PageHeader`, `AdminPage`, `FlashBanner` (Görev 2).
- Produces:
  - `SchoolFormTabs` yeni prop: `health?: SchoolHealth`; kaldırılan prop: `publicHref`.
  - Pencere olayı `"admin-form-dirty"` (`CustomEvent<boolean>`), `UnsavedChangesWarning` yayınlar.
  - `SchoolTabRail({ tabs, activeTab, hrefFor, health, lockedTabs })`.

- [ ] **Step 1: Kirli durum olayını ekle** — `src/components/admin/UnsavedChangesWarning.tsx`

`markDirty` ve `markSubmitting` fonksiyonlarını şöyle değiştir (geri kalan dosya aynen):

```tsx
    const announce = (dirty: boolean) => {
      // Global CustomEvent yerine window.CustomEvent: test ortamı (vm + jsdom) global vermez.
      window.dispatchEvent(new window.CustomEvent("admin-form-dirty", { detail: dirty }));
    };

    const markDirty = () => {
      if (!isSubmittingRef.current && !isDirtyRef.current) {
        isDirtyRef.current = true;
        announce(true);
      }
    };

    const markSubmitting = () => {
      isSubmittingRef.current = true;
      isDirtyRef.current = false;
      announce(false);
    };
```

Not: eski `markDirty` her olayda `isDirtyRef.current = true` yapıyordu; yeni sürüm yalnız ilk değişimde olay yayınlar, ref davranışı aynıdır.

Başarılı kayıttan sonra aynı formda yeni değişiklik yapılabilmesi için `isSubmittingRef` sıfırlanmalı; bugün sıfırlanmıyor (kayıttan sonra uyarı hiç çıkmıyor). Bu davranışı değiştirme; kapsam dışı. `SaveBarStatus` yalnız olayı dinler.

- [ ] **Step 2: Kaydet çubuğu durum metni** — `src/components/admin/school-form/SaveBarStatus.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { CircleCheck } from "lucide-react";

// Solda: kaydedilmemiş değişiklik uyarısı ya da son başarılı kaydın bildirimi.
export function SaveBarStatus({ success }: { success: string | null }) {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    function onDirty(event: Event) {
      setDirty(Boolean((event as CustomEvent<boolean>).detail));
    }
    window.addEventListener("admin-form-dirty", onDirty);
    return () => window.removeEventListener("admin-form-dirty", onDirty);
  }, []);

  if (dirty) {
    return (
      <p className="flex items-center gap-2 text-sm text-admin-body">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-600" />
        Kaydedilmemiş değişiklik var
      </p>
    );
  }

  if (success) {
    return (
      <p key={success} role="status" className="admin-fade-out flex items-center gap-2 text-sm font-medium text-emerald-800">
        <CircleCheck aria-hidden="true" className="h-4 w-4" />
        {success}
      </p>
    );
  }

  return <p className="text-sm text-admin-muted">Değişiklikler kaydedilince sitede güncellenir.</p>;
}
```

`key={success}`: aynı mesaj ikinci kez gelse de nesne kimliği değişmediği için animasyon tekrar başlamaz; `SchoolFormTabs` durum nesnesi her kayıtta yeni olduğundan Step 4'te `key` olarak sayaç kullanılır.

- [ ] **Step 3: Sekme rayı** — `src/components/admin/school-form/SchoolTabRail.tsx`

```tsx
import { Lock } from "lucide-react";
import { missingTabs, type SchoolHealth } from "@/lib/school-health";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  activeTab: string;
  hrefFor: (id: string) => string;
  health?: SchoolHealth;
  lockedTabs: string[];
};

// Sekmeler düz <a href>: UnsavedChangesWarning bağlantı tıklamalarını yakalar.
export function SchoolTabRail({ tabs, activeTab, hrefFor, health, lockedTabs }: Props) {
  const gaps = health ? missingTabs(health) : new Set<string>();

  return (
    <nav aria-label="Okul bölümleri" className="rounded-xl border border-admin-line bg-white shadow-admin-card lg:sticky lg:top-20">
      {health && (
        <div className="hidden border-b border-admin-line px-4 py-3 lg:block">
          <p className="text-xs text-admin-muted">Veri sağlığı</p>
          <p className="text-sm font-bold text-admin-ink tabular-nums">
            {health.required - health.missing} / {health.required} tamam
          </p>
        </div>
      )}
      <ul className="hide-scrollbar flex overflow-x-auto p-1.5 lg:flex-col lg:overflow-visible">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          const locked = lockedTabs.includes(tab.id);
          const hasGap = gaps.has(tab.id);
          const body = (
            <>
              <span className="flex-1 whitespace-nowrap">{tab.label}</span>
              {locked && <Lock aria-hidden="true" className="h-3.5 w-3.5" />}
              {!locked && hasGap && (
                <>
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-admin-missing" />
                  <span className="sr-only">(eksik var)</span>
                </>
              )}
            </>
          );
          const classes = cn(
            "flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
            active ? "bg-admin-tint font-semibold text-admin-tint-ink" : "text-admin-body hover:bg-admin-line-soft",
          );
          return (
            <li key={tab.id} className="shrink-0">
              {locked ? (
                <span aria-disabled="true" title="Önce temel bilgileri kaydedin" className={cn(classes, "cursor-not-allowed text-admin-faint hover:bg-transparent")}>
                  {body}
                </span>
              ) : (
                <a href={hrefFor(tab.id)} aria-current={active ? "page" : undefined} className={cn(classes, adminFocus)}>
                  {body}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: `SchoolFormTabs` düzeni** — `src/components/admin/SchoolFormTabs.tsx`

Değişiklikler (dosyanın geri kalanı ve bütün prop'lar aynı kalır):

1. İmportlar: `ExternalLink` ve `SubmitButton` importlarını kaldır; ekle:
```tsx
import { useRef } from "react";  // mevcut react importuna useRef ekle
import { AdminSubmitButton } from "@/components/admin/ui/AdminSubmitButton";
import { adminButton } from "@/components/admin/ui/Button";
import { SchoolTabRail } from "@/components/admin/school-form/SchoolTabRail";
import { SaveBarStatus } from "@/components/admin/school-form/SaveBarStatus";
import type { SchoolHealth } from "@/lib/school-health";
```
2. `TABS` etiketlerini cümle düzenine çevir: `"Temel bilgiler"`, `"İletişim"`, `"Puanlar ve kontenjan"`, `"Tesisler"`, `"Meslek alanları"`, `"Burslar"`, `"Projeler"`, `"Diğer bilgiler"`.
3. `Props`: `publicHref?: string;` satırını sil, `health?: SchoolHealth;` ekle. Fonksiyon parametrelerinde `publicHref` yerine `health`.
4. Kayıt sayacı: `useActionState` satırlarından sonra
```tsx
  const saveCount = useRef(0);
  const lastState = useRef<ActionResult | null>(null);
  const current = activeState();
  if (current && current !== lastState.current) {
    lastState.current = current;
    saveCount.current += 1;
  }
```
Bu blok `activeState` tanımından **sonra** gelmeli; `activeState` fonksiyon bildirimi olduğu için yukarı taşınır (hoisting) ama okunabilirlik için bloğu `tabHref` fonksiyonundan sonra yerleştir. Lint "ref render sırasında yazılmaz" kuralı (`react-hooks/refs`) hata verirse sayaç yerine `key={current?.message}` kullan ve bu adımı atla.
5. `return` bloğunu şu iskeletle değiştir; `{/* Mini-action tab'ları … */}` bloklarının içeriği (ScoresTab … ProjectsTab çağrıları) aynen taşınır:

```tsx
  const lockedTabs = school ? [] : TABS.filter((t) => !MAIN_SAVE_TABS.includes(t.id)).map((t) => t.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
      <SchoolTabRail tabs={TABS} activeTab={activeTab} hrefFor={(id) => tabHref(id as TabId)} health={health} lockedTabs={lockedTabs} />

      <div className="min-w-0 space-y-6">
        {isMainSaveTab && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const dispatch = mainSaveAction();
              startTransition(() => dispatch(data));
            }}
            action={mainSaveAction()}
            data-admin-school-form="true"
            className="space-y-6"
          >
            <UnsavedChangesWarning />
            {school && <input type="hidden" name="id" value={school.id} />}
            {school && <input type="hidden" name="school_id" value={school.id} />}

            {activeTab === "temel" && <BasicInfoTab school={school} />}
            {activeTab === "iletisim" && <ContactTab school={school} />}
            {activeTab === "diger" && <OtherInfoTab school={school} />}

            {activeState()?.success === false && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                {activeState()!.message}
              </div>
            )}

            <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-xl border border-admin-line bg-white px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <SaveBarStatus
                key={saveCount.current}
                success={activeState()?.success === true ? activeState()!.message : null}
              />
              <div className="flex shrink-0 gap-2">
                <Link href={cancelHref} className={adminButton()}>İptal</Link>
                <AdminSubmitButton label={submitLabel} />
              </div>
            </div>
          </form>
        )}

        {/* mini-action sekmeleri: mevcut bloklar aynen */}

        {!school && !isMainSaveTab && (
          <div className="rounded-xl border border-admin-line bg-white px-6 py-10 text-center shadow-admin-card">
            <p className="text-sm font-semibold text-admin-ink">Bu bölüm okul kaydedildikten sonra açılır.</p>
            <p className="mt-1 text-sm text-admin-muted">Önce “Temel bilgiler” bölümünü kaydedin.</p>
          </div>
        )}
      </div>
    </div>
  );
```

Başarı metni artık `✓` öneki taşımaz, hata metni `✗` öneki taşımaz; ikon ve renk anlamı verir. Test yalnız hata metninin `role="alert"` içinde geçtiğini kontrol eder.

- [ ] **Step 5: Taslak koruma testini çalıştır**

Run: `node --test tests/admin-form-draft.test.mjs`
Beklenen: PASS. `form.querySelector('button[type="submit"]')` artık `AdminSubmitButton`'dır; testin mock'u `@/components/admin/ui/*` dosyalarını `load()` ile yükler. `usePathname` veya global `CustomEvent` hatası görürsen ilgili dosyada `window.CustomEvent` / prop kullanımına dön.

- [ ] **Step 6: Düzenleme sayfası** — `src/app/admin/okullar/[slug]/duzenle/page.tsx`

1. İmportlar: `Link` kalabilir (kullanılmıyorsa sil); ekle:
```tsx
import { ExternalLink } from "lucide-react";
import { evaluateSchoolHealth, latestYear } from "@/lib/school-health";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { Badge } from "@/components/admin/ui/Badge";
import { adminButton } from "@/components/admin/ui/Button";
```
2. `Promise.all` dizisine iki salt okuma sorgusu ekle ve yapı bozmada karşılık gelen adları ver:
```tsx
    supabase.from("school_scores").select("year").order("year", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("school_quotas").select("year").order("year", { ascending: false }).limit(1).maybeSingle(),
```
```tsx
    { data: latestScoreRow },
    { data: latestQuotaRow },
```
3. `scores` ve `quotas` hesaplandıktan sonra:
```tsx
  const health = evaluateSchoolHealth(
    {
      type: school.type,
      description: school.description,
      images: school.images,
      languages: school.languages,
      phone: school.phone,
      vocationalFieldCount: selectedFieldIds.length,
      facilityCount: selectedFacilityIds.length,
      scoreYears: scores.map((s) => s.year),
      quotaYears: quotas.map((q) => q.year),
    },
    {
      scoreYear: latestYear(latestScoreRow ? [latestScoreRow.year] : []),
      quotaYear: latestYear(latestQuotaRow ? [latestQuotaRow.year] : []),
    },
  );
```
`mapSchoolScore` / `mapSchoolQuota` çıktısında yıl alanının adı `year` değilse (`src/types/schoolDetail.ts`'e bak) doğru alan adını kullan.
4. `return` bloğunu değiştir:
```tsx
  return (
    <AdminPage width="form">
      <PageHeader
        trail={["İçerik", "Okullar", "Düzenle"]}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {school.name}
            <Badge tone={school.isActive ? "success" : "warning"}>{school.isActive ? "Yayında" : "Pasif"}</Badge>
          </span>
        }
        actions={
          publicHref ? (
            <a href={publicHref} target="_blank" rel="noopener noreferrer" className={adminButton()}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />Sitede aç
            </a>
          ) : undefined
        }
      />
      <FlashBanner success={query?.success} error={query?.error} />
      <SchoolFormTabs
        school={school}
        health={health}
        cancelHref="/admin"
        submitLabel="Değişiklikleri kaydet"
        {/* publicHref satırı silinir; diğer bütün prop'lar aynen */}
      />
    </AdminPage>
  );
```
`<h1>Okul bulunamadı.</h1>` ve `<h1>Yetkisiz erişim.</h1>` dönüşlerini `<AdminPage><PageHeader trail={["İçerik", "Okullar"]} title="Okul bulunamadı" /></AdminPage>` biçimine çevir (yetkisiz metni için title "Yetkisiz erişim").

- [ ] **Step 7: Yeni okul sayfası** — `src/app/admin/okullar/yeni/page.tsx`

Dış `<div className="min-h-[70vh] …">` ve başlık bloğunu şu yapıyla değiştir; `SchoolFormTabs` çağrısında `publicHref` yoksa dokunma, `submitLabel="Okulu kaydet"` yap:

```tsx
    <AdminPage width="form">
      <PageHeader trail={["İçerik", "Okullar", "Yeni"]} title="Yeni okul" description="Önce temel bilgileri kaydedin; diğer bölümler kayıttan sonra açılır." />
      <FlashBanner success={params?.success} error={params?.error} />
      <SchoolFormTabs … />
    </AdminPage>
```

- [ ] **Step 8: Sekmeleri dönüştür**

```bash
node scripts/admin-restyle.mjs src/components/admin/SchoolFormTabs.tsx src/components/admin/tabs/*.tsx src/components/admin/SmartSchoolBasicFields.tsx src/components/admin/ImageUploadField.tsx src/components/admin/LogoUploadField.tsx
grep -n "gradient" src/components/admin/SmartSchoolBasicFields.tsx
```
Beklenen: grep çıktısı `initialColor = "bg-gradient-to-br from-slate-700 to-slate-900",` (değişmemiş).

- [ ] **Step 9: Sekmelerde elle düzeltme**

Her `tabs/*.tsx` ve `SmartSchoolBasicFields.tsx` için:
1. Dosyadaki yerel `const inputCls = "…"` / `inputClassName` tanımını sil; `import { adminInput, adminLabel, adminHint } from "@/components/admin/ui/styles";` ekle; kullanım yerlerinde `inputCls` → `adminInput`. Tanımdan farklı ek sınıf taşıyan satırlarda `cn(adminInput, "…")` kullan.
2. `<span className="mb-2 block text-sm font-semibold text-admin-body">` biçimindeki alan etiketlerini `className={adminLabel}` yap.
3. `<section className="rounded-xl border … p-5 …">` + başlık `div` kalıplarını `Card` bileşenine çevir: `<Card title="Kimlik">…</Card>`. Başlıkları cümle düzenine çevir ("Kimlik Bilgileri" → "Kimlik", "Tanıtım ve Görsel" → "Tanıtım ve görsel", "Kurumsal Özellikler" → "Kurumsal özellikler", "İçerik Listeleri" → "İçerik listeleri", "Yayın Durumu" → "Yayın durumu", "İletişim Bilgileri" → "İletişim bilgileri", "Diğer Bilgiler" → "Diğer bilgiler", "Tesis ve İmkânlar" → "Tesis ve imkânlar", "Meslek Alanları ve Dallar" → "Meslek alanları ve dallar", "Burs İmkânları" → "Burs imkânları", "Puan Bilgileri" → "Puan bilgileri").
4. `BasicInfoTab` "Tanıtım ve görsel" kartında açıklama alanına canlı sayaç ekle. `BasicInfoTab` sunucu bileşeni ise küçük bir istemci bileşeni yaz: `src/components/admin/school-form/DescriptionField.tsx`:
```tsx
"use client";
import { useState } from "react";
import { MIN_DESCRIPTION_LENGTH } from "@/lib/school-health";
import { adminInput, adminLabel } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";

export function DescriptionField({ defaultValue }: { defaultValue: string }) {
  const [length, setLength] = useState(defaultValue.trim().length);
  const short = length < MIN_DESCRIPTION_LENGTH;
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className={cn(adminLabel, "mb-0")}>Açıklama</span>
        <span className={cn("text-xs tabular-nums", short ? "text-admin-missing" : "text-admin-muted")}>
          {length}/{MIN_DESCRIPTION_LENGTH}{short && " · kısa"}
        </span>
      </span>
      <textarea name="description" defaultValue={defaultValue} required rows={5} onChange={(e) => setLength(e.target.value.trim().length)} className={adminInput} />
    </label>
  );
}
```
ve `BasicInfoTab` içindeki açıklama `<label>`'ını `<DescriptionField defaultValue={school?.description ?? ""} />` ile değiştir. (`name="description"` korunur; taslak testi bu alanı adla bulur.)
5. `ScoresTab.tsx`: puan (`obpScore`, `lgsScore`, `percentile`) ve kontenjan (`sinavliCount`, `sinavsizCount`) değerlerini gösteren öğelere `tabular-nums text-right` ekle; ↑↓ ve silme düğmelerine `aria-label` ekle (örn. `aria-label="Puan kaydını sil"`). `ScholarshipsTab`/`ProjectsTab`/`FacilitiesTab`/`VocationalTab` içindeki ↑ ↓ metin düğmelerini `ChevronUp`/`ChevronDown` ikonlu, `aria-label="Yukarı taşı"` / `"Aşağı taşı"` düğmelere çevir; `title` kalabilir.
6. Kaydet/ekle düğmelerindeki `SubmitButton` importlarını `AdminSubmitButton`'a çevir.

- [ ] **Step 10: Doğrula**

```bash
npx tsc --noEmit && npx eslint . && npm test
grep -rn "blue-\|slate-" src/components/admin/tabs src/components/admin/SchoolFormTabs.tsx src/components/admin/SmartSchoolBasicFields.tsx | grep -v gradient
```
Beklenen: testler geçer; son grep boş.

Oturumlu tarayıcıda bir okulun düzenleme ekranını aç (1440 ve 390): ray, veri sağlığı özeti, eksik noktaları, sekme geçişleri, kaydet çubuğu yapışkan, bir alanı değiştirince "Kaydedilmemiş değişiklik var", başka sekmeye tıklayınca onay penceresi (İptal et). **Kaydet'e basma.** `/admin/okullar/yeni`: kilitli sekmeler.

- [ ] **Step 11: Commit**

```bash
git add -A src/components/admin src/app/admin/okullar
git commit -m "feat: school form with health rail, sticky save bar and restyled tabs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Mesajlar — iki bölmeli gelen kutusu

**Files:**
- Modify: `src/app/admin/mesajlar/page.tsx` (tümü)

**Interfaces:**
- Consumes: `markMessageStatus(id, status)` (değişmez), `formatRelativeDate`, `formatFullDate`, UI parçaları.

- [ ] **Step 1: Sayfayı yeniden yaz** — `src/app/admin/mesajlar/page.tsx`

`metadata`, `ContactMessage` tipi ve `MIGRATION_SQL` sabiti aynen kalır. `STATUS_LABELS`/`STATUS_CLASSES` yerine:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Inbox, Mail, MailOpen } from "lucide-react";
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

type PageProps = { searchParams?: Promise<{ mesaj?: string; durum?: string }> };

function hrefFor(durum: string | null, mesaj?: string | null) {
  const params = new URLSearchParams();
  if (durum) params.set("durum", durum);
  if (mesaj) params.set("mesaj", mesaj);
  const search = params.toString();
  return `/admin/mesajlar${search ? `?${search}` : ""}`;
}
```

Sayfa gövdesi:

```tsx
export default async function AdminMesajlarPage({ searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const filter = FILTERS.find((f) => f.key === (params?.durum ?? null)) ?? FILTERS[0];
  const selectedId = params?.mesaj ?? null;

  const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });

  if (error) {
    return (
      <AdminPage width="narrow">
        <PageHeader trail={["Ziyaretçiler", "Mesajlar"]} title="Mesajlar" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
          <p className="mb-3 font-semibold text-rose-800">Tablo henüz oluşturulmamış veya erişim hatası: {error.message}</p>
          <p className="mb-3 text-sm text-rose-700">Supabase SQL editöründe aşağıdaki sorguyu çalıştırın:</p>
          <pre className="overflow-x-auto rounded-lg bg-rose-950 p-4 text-xs text-rose-100">{MIGRATION_SQL}</pre>
        </div>
      </AdminPage>
    );
  }

  const all = (data ?? []) as ContactMessage[];
  const messages = filter.status ? all.filter((m) => m.status === filter.status) : all;
  const unread = all.filter((m) => m.status === "unread").length;
  const selected = selectedId ? all.find((m) => m.id === selectedId) ?? null : null;
  const now = new Date();

  let schoolSlug: string | null = null;
  if (selected?.school_id) {
    const { data: school } = await supabase.from("schools").select("slug").eq("id", selected.school_id).maybeSingle();
    schoolSlug = school?.slug ?? null;
  }

  return (
    <AdminPage>
      <PageHeader trail={["Ziyaretçiler", "Mesajlar"]} title="Mesajlar" description={`${all.length} mesaj · ${unread} okunmamış`} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
        <section aria-label="Mesaj listesi" className={cn(adminCard, "overflow-hidden", selected && "hidden lg:block")}>
          <nav aria-label="Durum filtresi" className="flex gap-1 overflow-x-auto border-b border-admin-line p-2">
            {FILTERS.map((f) => (
              <Link
                key={f.label}
                href={hrefFor(f.key, selectedId)}
                aria-current={f.key === filter.key ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[13px] whitespace-nowrap",
                  f.key === filter.key ? "bg-admin-tint font-semibold text-admin-tint-ink" : "text-admin-body hover:bg-admin-line-soft",
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
            <ul className="max-h-[calc(100vh-14rem)] divide-y divide-admin-line-soft overflow-y-auto">
              {messages.map((m) => {
                const isSelected = m.id === selectedId;
                const isUnread = m.status === "unread";
                return (
                  <li key={m.id}>
                    <Link
                      href={hrefFor(filter.key, m.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={cn("block px-4 py-3 transition-colors", isSelected ? "bg-admin-tint" : "hover:bg-admin-ground", adminFocus)}
                    >
                      <span className="flex items-center gap-2">
                        {isUnread && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-admin-accent" />}
                        <span className={cn("flex-1 truncate text-sm", isUnread ? "font-bold text-admin-ink" : "font-medium text-admin-body")}>{m.name}</span>
                        <span className="shrink-0 text-xs text-admin-muted tabular-nums">{formatRelativeDate(m.created_at, now)}</span>
                      </span>
                      <span className={cn("mt-0.5 block truncate text-sm", isUnread ? "font-semibold text-admin-ink" : "text-admin-body")}>{m.subject}</span>
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
            <Link href={hrefFor(filter.key)} className={cn("mb-4 inline-flex items-center gap-1.5 text-sm text-admin-muted hover:text-admin-ink lg:hidden", adminFocus)}>
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />Mesajlar
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-admin-ink">{selected.subject}</h2>
                <p className="mt-1 text-sm text-admin-muted">{formatFullDate(selected.created_at)}</p>
              </div>
              <Badge tone={STATUS[selected.status].tone}>{STATUS[selected.status].label}</Badge>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-admin-line pt-5 sm:grid-cols-2">
              <div><dt className="text-xs text-admin-muted">Gönderen</dt><dd className="mt-0.5 font-semibold text-admin-ink">{selected.name}</dd></div>
              <div><dt className="text-xs text-admin-muted">E-posta</dt><dd className="mt-0.5"><a href={`mailto:${selected.email}`} className={cn("font-medium text-admin-accent hover:underline", adminFocus)}>{selected.email}</a></dd></div>
              {selected.phone && <div><dt className="text-xs text-admin-muted">Telefon</dt><dd className="mt-0.5 text-admin-ink">{selected.phone}</dd></div>}
              {(selected.school_name_text || selected.school_id) && (
                <div>
                  <dt className="text-xs text-admin-muted">İlgili okul</dt>
                  <dd className="mt-0.5 text-admin-ink">
                    {schoolSlug ? (
                      <Link href={`/admin/okullar/${schoolSlug}/duzenle`} className={cn("font-medium text-admin-accent hover:underline", adminFocus)}>
                        {selected.school_name_text ?? `#${selected.school_id}`}
                      </Link>
                    ) : (
                      selected.school_name_text ?? `#${selected.school_id}`
                    )}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-5 rounded-lg bg-admin-ground px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-admin-body">{selected.message}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`} className={adminButton({ variant: "primary" })}>
                <Mail aria-hidden="true" className="h-4 w-4" />E-posta ile yanıtla
              </a>
              {selected.status !== "read" && (
                <form action={markMessageStatus.bind(null, selected.id, "read")}>
                  <button type="submit" className={adminButton()}><MailOpen aria-hidden="true" className="h-4 w-4" />Okundu işaretle</button>
                </form>
              )}
              {selected.status !== "replied" && (
                <form action={markMessageStatus.bind(null, selected.id, "replied")}>
                  <button type="submit" className={adminButton()}>Yanıtlandı işaretle</button>
                </form>
              )}
            </div>
          </article>
        ) : (
          <div className={cn(adminCard, "hidden lg:block")}>
            <EmptyState icon={<Mail aria-hidden="true" className="h-8 w-8" />} title="Bir mesaj seçin" body="Soldaki listeden bir mesaj açın." />
          </div>
        )}
      </div>
    </AdminPage>
  );
}
```

Açmak durumu değiştirmez (spec). `markMessageStatus` yalnız düğmeyle çağrılır.

- [ ] **Step 2: Doğrula**

```bash
npx tsc --noEmit && npx eslint . && npm test
```

Oturumlu tarayıcıda `/admin/mesajlar`, `?durum=okunmamis`, bir mesaj seçili (1440 ve 390; mobilde yalnız detay ve geri bağlantısı görünür). Durum düğmelerine **basma**.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/mesajlar/page.tsx
git commit -m "feat: two-pane inbox for contact messages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Soru-cevap

**Files:**
- Modify: `src/app/admin/soru-cevap/page.tsx`

- [ ] **Step 1: Renkleri dönüştür**

Run: `node scripts/admin-restyle.mjs src/app/admin/soru-cevap/page.tsx`

- [ ] **Step 2: Başlık, filtre, yeni soru kartı ve gruplama**

1. İmportlar: `ArrowLeft`, `CircleHelp` çıkar; `Plus`, `Search` ekle; `SubmitButton` → `AdminSubmitButton`; ekle `AdminPage`, `PageHeader`, `FlashBanner`, `Badge`, `EmptyState`, `adminButton`, `adminInput`, `adminLabel`, `adminCard`, `cn`. Yerel `inputClassName` sabitini sil, kullanım yerlerinde `adminInput`.
2. `PageProps.searchParams` tipine `ara?: string; kategori?: string` ekle.
3. `faqs` hesaplandıktan sonra:
```tsx
  const query = (params?.ara ?? "").trim().toLocaleLowerCase("tr-TR");
  const categoryFilter = params?.kategori ?? "";
  const visible = faqs.filter((faq) =>
    (!categoryFilter || faq.category === categoryFilter) &&
    (!query || `${faq.question} ${faq.answer}`.toLocaleLowerCase("tr-TR").includes(query)),
  );
  const groups = [...new Set(visible.map((faq) => faq.category))].map((category) => ({
    category,
    items: visible.filter((faq) => faq.category === category),
  }));
  const allCategories = [...new Set([...categories, ...faqs.map((faq) => faq.category)])];
```
`mapFaq` çıktısında yanıt alanının adı `answer` değilse `src/types/faq.ts`'e bakıp doğru adı kullan.
4. Dış kapsayıcı ve başlık: `<AdminPage width="narrow">` + 
```tsx
      <PageHeader
        trail={["Ziyaretçiler", "Soru-cevap"]}
        title="Soru-cevap"
        description={`${faqs.length} soru · ${faqs.filter((f) => f.isPublished).length} yayında`}
        actions={<a href="/soru-cevap" target="_blank" rel="noopener noreferrer" className={adminButton({ variant: "ghost" })}>Sayfayı görüntüle</a>}
      />
      <FlashBanner success={params?.success} error={params?.error} />
```
Hata dönüşündeki kapsayıcıyı da `AdminPage` + `PageHeader` yap.
5. "Yeni soru-cevap ekle" `<section>`'ını `<details className={cn(adminCard, "mb-6 group")}>` ile sar; `summary`:
```tsx
        <summary className={cn(adminButton({ variant: "primary" }), "m-4 w-fit list-none marker:content-none")}>
          <Plus aria-hidden="true" className="h-4 w-4" />Yeni soru
        </summary>
        <div className="border-t border-admin-line p-5">{/* mevcut createFaq formu aynen */}</div>
```
Formun içindeki kaydet düğmesi `AdminSubmitButton` olur, etiketi "Soruyu kaydet".
6. Liste üstüne GET filtresi:
```tsx
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Sorularda ara</span>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-admin-faint" />
          <input type="search" name="ara" defaultValue={params?.ara ?? ""} placeholder="Soru veya yanıtta ara" className={cn(adminInput, "pl-9")} />
        </label>
        <select name="kategori" defaultValue={categoryFilter} aria-label="Kategori" className={cn(adminInput, "w-auto")}>
          <option value="">Tüm kategoriler</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className={adminButton()}>Uygula</button>
      </form>
```
7. Soru listesini gruplu render et: her grup için `<h2 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-admin-muted uppercase">{group.category} · {group.items.length}</h2>` ardından grubun `details` öğeleri (mevcut `details` markup'ı aynen, renkler dönüştürülmüş). Kategori rozeti grup başlığına taşındığı için `summary` içindeki kategori `span`'ını sil; "Yayında/Taslak" rozetini `<Badge tone={faq.isPublished ? "success" : "neutral"} icon={…}>` yap; "Sıra: N" → `<span className="text-xs text-admin-muted tabular-nums">#{faq.sortOrder}</span>`. `visible.length === 0` ise `<EmptyState title="Eşleşen soru yok" body="Aramayı ya da kategoriyi değiştirin." />`.
8. Silme formunun düğmesini `className={adminButton({ variant: "danger", size: "sm" })}` yap; onay davranışı varsa aynen.

- [ ] **Step 3: Doğrula ve commit**

```bash
npx tsc --noEmit && npx eslint . && npm test
grep -n "blue-\|slate-" src/app/admin/soru-cevap/page.tsx
git add src/app/admin/soru-cevap/page.tsx
git commit -m "feat: grouped, searchable FAQ management

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Beklenen: grep boş. Tarayıcıda `/admin/soru-cevap` ve `?ara=nakil` (1440/390). Kaydet/sil düğmelerine **basma**.

---

### Task 10: Meslek alanları

**Files:**
- Modify: `src/app/admin/meslek-alanlari/page.tsx`, `src/components/admin/VocationalFieldsManager.tsx`

- [ ] **Step 1: Okul sayısını oku** — `page.tsx`

Sorguyu değiştir ve sayıyı ekle:
```tsx
  const { data: fields, error } = await supabase
    .from("vocational_fields")
    .select("id, title, slug, vocational_branches(id, name), school_vocational_fields(school_id)")
    .order("title");
```
```tsx
  const vocFields = ((fields ?? []) as (VocFieldWithBranches & { school_vocational_fields?: { school_id: number }[] })[]).map(
    ({ school_vocational_fields, ...field }) => ({ ...field, school_count: school_vocational_fields?.length ?? 0 }),
  );
```
Kapsayıcı ve başlık:
```tsx
    <AdminPage width="narrow">
      <PageHeader trail={["İçerik", "Meslek alanları"]} title="Meslek alanları" description={`${vocFields.length} alan · ${vocFields.reduce((n, f) => n + f.vocational_branches.length, 0)} dal. Toplu yüklemede ve okul düzenlemede kullanılır.`} />
      <VocationalFieldsManager initialFields={vocFields} />
    </AdminPage>
```
Hata dönüşünü `<AdminPage><PageHeader trail={["İçerik", "Meslek alanları"]} title="Meslek alanları" /><FlashBanner error={`Veriler yüklenemedi: ${error.message}`} /></AdminPage>` yap.

- [ ] **Step 2: Yöneticiyi güncelle** — `VocationalFieldsManager.tsx`

1. `VocFieldWithBranches` tipine `school_count?: number;` ekle.
2. `node scripts/admin-restyle.mjs src/components/admin/VocationalFieldsManager.tsx`
3. Alan başlığındaki `{field.vocational_branches.length} dal` rozetinden sonra ekle:
```tsx
                    {typeof field.school_count === "number" && (
                      <span className="text-xs text-admin-muted tabular-nums">{field.school_count} okul</span>
                    )}
```
4. "Düzenle" düğmesinin `text-admin-accent hover:bg-admin-tint` sınıfı kalabilir (ikincil eylem, dolgu değil). "Sil" düğmesi `rose` kalır. Modal'daki birincil düğme `bg-admin-accent` olmalı; kontrol et.
5. Dosyada kalan `blue-`/`slate-` yok: `grep -n "blue-\|slate-" src/components/admin/VocationalFieldsManager.tsx` boş.

- [ ] **Step 3: Doğrula ve commit**

```bash
npx tsc --noEmit && npx eslint . && npm test
git add src/app/admin/meslek-alanlari/page.tsx src/components/admin/VocationalFieldsManager.tsx
git commit -m "feat: vocational fields list with school counts in the admin style

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Tarayıcıda `/admin/meslek-alanlari`: 78 alan, sayılar, bir alanı aç/kapat. Ekle/sil/yeniden adlandır **yapma**.

---

### Task 11: Site ayarları (Genel, Menü, Alt bilgi)

**Files:**
- Modify: `src/app/admin/site-settings/page.tsx`, `navigation/page.tsx`, `footer/page.tsx`

- [ ] **Step 1: Renkleri dönüştür**

Run: `node scripts/admin-restyle.mjs src/app/admin/site-settings/page.tsx src/app/admin/site-settings/navigation/page.tsx src/app/admin/site-settings/footer/page.tsx`

- [ ] **Step 2: Her üç sayfada**

1. `function SettingsTabs(…) { … }` tanımını ve `<SettingsTabs active="…" />` kullanımını sil (menü bu işi görür).
2. Yerel `inputClassName` sabitini sil; `adminInput`'u içe aktar ve kullan. `FormSection` yardımcıları varsa gövdesini `Card` ile değiştir: `function FormSection({ children, description, title }) { return <Card title={title} description={description}>{children}</Card>; }`.
3. Dış `<div className="min-h-[70vh] …"><div className="mx-auto max-w-3xl">` + geri bağlantısı + `<h1>` bloğunu değiştir:
   - Genel: `<AdminPage width="narrow"><PageHeader trail={["Site", "Genel ayarlar"]} title="Genel ayarlar" description="Site başlığı ve logo." />`
   - Menü: `<AdminPage width="narrow"><PageHeader trail={["Site", "Menü"]} title="Menü" description="Navbar'da görünen öğeler, sırası ve görünürlüğü." />`
   - Alt bilgi: `<AdminPage width="narrow"><PageHeader trail={["Site", "Alt bilgi"]} title="Alt bilgi" description="Footer metinleri, bağlantılar ve sosyal medya hesapları." />`
4. `params?.success` / `params?.error` bloklarını `<FlashBanner success={params?.success} error={params?.error} />` ile değiştir.
5. `SubmitButton` → `AdminSubmitButton` (import ve kullanımlar). "İptal" bağlantılarına `className={adminButton()}`.
6. `<h1>Yetkisiz erişim.</h1>` dönüşleri `<AdminPage><PageHeader trail={["Site"]} title="Yetkisiz erişim" /></AdminPage>`.
7. Menü sayfasında öğe satırına sıra numarası: satır bileşeni dizinin `index`'ini alıyorsa başa `<span className="w-6 text-right text-xs text-admin-muted tabular-nums">{index + 1}</span>` ekle; almıyorsa `items.map((item, index) => …)` çağrısına `index` prop'u ekle. Yukarı/aşağı metin düğmelerini `ChevronUp`/`ChevronDown` ikonlu, `aria-label="Yukarı taşı"`/`"Aşağı taşı"` düğmelere çevir. Görünürlük düğmesi satırda kalır (mevcut `toggleNavigationItemVisibility` formu).
8. Kalan `blue-`/`slate-` sınıfı olmadığını denetle.

- [ ] **Step 3: Doğrula ve commit**

```bash
npx tsc --noEmit && npx eslint . && npm test
grep -rn "blue-\|slate-\|SettingsTabs" src/app/admin/site-settings
git add src/app/admin/site-settings
git commit -m "feat: site settings as three admin pages in the new style

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Beklenen: grep boş. Tarayıcıda üç sayfa (1440/390). Kaydet/sil/taşı **yapma**.

---

### Task 12: `BulkUploadWizard` bölünmesi (yalnız taşıma)

**Files:**
- Create: `src/components/admin/bulk-upload/{parsers.ts,shared.tsx,BasicUploadWizard.tsx,VocationalUploadWizard.tsx,ScoreUploadWizard.tsx,FacilityUploadWizard.tsx,BulkUploadWizard.tsx}`
- Delete: `src/components/admin/BulkUploadWizard.tsx`
- Modify: `src/app/admin/okullar/toplu-yukle/page.tsx` (import yolu)

**Interfaces:**
- Produces: `export function BulkUploadWizard()` yeni yolda: `@/components/admin/bulk-upload/BulkUploadWizard`. JSX, durum makineleri, action çağrıları, metinler, sınıflar **birebir aynı**; yalnız dosya sınırları değişir.

Kaynak dosyadaki sembollerin satır aralıkları (commit `0c7842d` itibarıyla; taşımadan önce `grep -n "^function \|^export function \|^const \|^type " src/components/admin/BulkUploadWizard.tsx` ile yeniden doğrula):

| Satırlar | Sembol | Hedef |
| --- | --- | --- |
| 39–52 | `MAX_ROWS`, `MAX_VOC_ROWS`, `str`, `normalizeStr` | `parsers.ts` |
| 54–204 | `RowStatus`, `ParsedRow`, `ExtractedRow`, `parseQuota`, `parseBoardingType`, `parseEducationType`, `extractRow`, `validateRow` | `parsers.ts` |
| 206–280 | `VocationalRawRow`, `VocationalValidatedRow`, `SchoolGroup`, `ScoreParsedRow`, `parseScore`, `parsePercentile`, `FacilityParsedGroup`, `parseFacilities` | `parsers.ts` |
| 282–404 | `StepIndicator`, `Pill`, `UploadDropzone` | `shared.tsx` |
| 406–855 | `BasicUploadWizard` | `BasicUploadWizard.tsx` |
| 857–1285 | `VocationalUploadWizard` | `VocationalUploadWizard.tsx` |
| 1287–1692 | `ScoreUploadWizard` | `ScoreUploadWizard.tsx` |
| 1694–2081 | `FacilityUploadWizard` | `FacilityUploadWizard.tsx` |
| 2083–2119 | `BulkUploadWizard` | `bulk-upload/BulkUploadWizard.tsx` |

- [ ] **Step 1: Satır aralıklarını doğrula**

Run: `grep -n "^function \|^export function \|^const \|^type " src/components/admin/BulkUploadWizard.tsx`
Beklenen: tablodaki başlangıç satırları. Farklıysa tabloyu güncel satırlarla kullan.

- [ ] **Step 2: Parçaları kopyala**

```bash
SRC=src/components/admin/BulkUploadWizard.tsx; D=src/components/admin/bulk-upload; mkdir -p $D
sed -n '39,280p'   $SRC > $D/parsers.body
sed -n '282,404p'  $SRC > $D/shared.body
sed -n '406,855p'  $SRC > $D/Basic.body
sed -n '857,1285p' $SRC > $D/Vocational.body
sed -n '1287,1692p' $SRC > $D/Score.body
sed -n '1694,2081p' $SRC > $D/Facility.body
sed -n '2083,2119p' $SRC > $D/Root.body
```

- [ ] **Step 3: Dosyaları başlıklarla kur**

Her hedef dosya = başlık + gövde. Gövdedeki sembollerin önüne `export` ekle (`parsers.ts` ve `shared.tsx` içindeki tüm `function`, `const`, `type` tanımları ve alt sihirbaz fonksiyonları). Başlıklar:

`parsers.ts` (istemci yönergesi yok; saf yardımcılar):
```ts
// Toplu yükleme: satır ayrıştırma ve doğrulama yardımcıları (BulkUploadWizard'dan taşındı).
import { excludeInvalidSchools, parseImportNumber } from "@/lib/import-validation";
import { DISTRICTS } from "@/data/districts";
import { SCHOOL_TYPES } from "@/data/schoolTypes";
```
(Gövdede kullanılmayan importları sonra lint'e göre sil.)

`shared.tsx`:
```tsx
"use client";

import { Upload } from "lucide-react";
```

Alt sihirbaz dosyaları (`BasicUploadWizard.tsx` vb.): kaynak dosyanın 1–37. satırlarındaki importların tamamını kopyala, `"use client";` ile başla, ardından
```tsx
import { /* bu dosyanın kullandığı parser sembolleri */ } from "@/components/admin/bulk-upload/parsers";
import { StepIndicator, Pill, UploadDropzone } from "@/components/admin/bulk-upload/shared";
```
ekle ve fonksiyonu `export function …` yap. Kullanılmayan importları Step 5'teki lint çıktısına göre sil.

`bulk-upload/BulkUploadWizard.tsx`:
```tsx
"use client";

import { useState } from "react";
import { BasicUploadWizard } from "@/components/admin/bulk-upload/BasicUploadWizard";
import { VocationalUploadWizard } from "@/components/admin/bulk-upload/VocationalUploadWizard";
import { ScoreUploadWizard } from "@/components/admin/bulk-upload/ScoreUploadWizard";
import { FacilityUploadWizard } from "@/components/admin/bulk-upload/FacilityUploadWizard";
```
+ `Root.body`.

Dosyaları birleştir (örnek, Basic için):
```bash
{ printf '%s\n' '"use client";' ''; sed -n '3,37p' $SRC; printf '%s\n' 'import { … } from "@/components/admin/bulk-upload/parsers";' 'import { StepIndicator, Pill, UploadDropzone } from "@/components/admin/bulk-upload/shared";' ''; sed 's/^function BasicUploadWizard/export function BasicUploadWizard/' $D/Basic.body; } > $D/BasicUploadWizard.tsx
```
`…` yerine o dosyanın gövdesinde geçen parser sembollerini yaz (`grep -o` ile bul: `grep -oE "\b(MAX_ROWS|MAX_VOC_ROWS|str|normalizeStr|extractRow|validateRow|parseScore|parsePercentile|parseFacilities|parseQuota|RowStatus|ParsedRow|ExtractedRow|VocationalRawRow|VocationalValidatedRow|SchoolGroup|ScoreParsedRow|FacilityParsedGroup)\b" $D/Basic.body | sort -u`). Tipler için `import type` kullan.

- [ ] **Step 4: Eski dosyayı kaldır, sayfayı bağla**

```bash
rm $D/*.body
git rm src/components/admin/BulkUploadWizard.tsx
sed -i '' 's#@/components/admin/BulkUploadWizard#@/components/admin/bulk-upload/BulkUploadWizard#' src/app/admin/okullar/toplu-yukle/page.tsx
```

- [ ] **Step 5: Derle, lint, test**

```bash
npx tsc --noEmit && npx eslint src/components/admin/bulk-upload && npm test
wc -l src/components/admin/bulk-upload/*
```
Beklenen: hata yok (kullanılmayan import uyarılarını silerek gider). Toplam satır ≈ eski 2.119 + başlıklar. Davranış değişikliği yok; `git diff --stat` yalnız taşıma gösterir.

- [ ] **Step 6: Tarayıcıda duman testi**

Oturumlu tarayıcıda `/admin/okullar/toplu-yukle`: dört mod arasında geçiş, her modda dosya alanı görünür. Dosya yükleme ve "Yükle" **yapma**.

- [ ] **Step 7: Commit**

```bash
git add -A src/components/admin src/app/admin/okullar/toplu-yukle/page.tsx
git commit -m "refactor: split the bulk upload wizard into per-mode files

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Toplu yükleme yeniden stili

**Files:**
- Modify: `src/components/admin/bulk-upload/*.tsx`, `src/app/admin/okullar/toplu-yukle/page.tsx`

- [ ] **Step 1: Renkleri dönüştür**

Run: `node scripts/admin-restyle.mjs src/components/admin/bulk-upload/*.tsx src/app/admin/okullar/toplu-yukle/page.tsx`

- [ ] **Step 2: Mod seçim kartları** — `bulk-upload/BulkUploadWizard.tsx`

`tabs` dizisini ve mod seçiciyi şu yapıyla değiştir (durum ve alt sihirbaz çağrıları aynen):

```tsx
const MODES = [
  { key: "basic" as const, label: "Temel bilgiler", sheet: "Okullar", body: "Yeni okul ekler veya kurum koduyla eşleşen okulları günceller. Yeni okullar pasif eklenir." },
  { key: "vocational" as const, label: "Meslek alanları ve dallar", sheet: "Meslek Alanları", body: "Okulların alan ve dal ilişkilerini değiştirir." },
  { key: "scores" as const, label: "Puanlar", sheet: "Puanlar", body: "Yıllık OBP, LGS ve yüzdelik değerlerini yazar; boş hücre mevcut değeri korur." },
  { key: "facilities" as const, label: "Tesisler", sheet: "Tesisler", body: "Okulların tesis ilişkilerini değiştirir; bilinmeyen tesis okulu durdurur." },
];
```
```tsx
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="Yükleme türü">
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(m.key)}
              className={cn(
                "rounded-xl border bg-white p-4 text-left transition-colors",
                active ? "border-admin-accent ring-2 ring-admin-accent/20" : "border-admin-line hover:border-admin-line-strong",
                adminFocus,
              )}
            >
              <span className={cn("block text-sm font-bold", active ? "text-admin-tint-ink" : "text-admin-ink")}>{m.label}</span>
              <span className="mt-1 block text-xs text-admin-muted">Excel sayfası: {m.sheet}</span>
              <span className="mt-2 block text-[13px] leading-snug text-admin-body">{m.body}</span>
            </button>
          );
        })}
      </div>
      {/* mode === … alt sihirbazlar aynen */}
    </div>
```
Mod açıklama metinleri `PROJECT_HANDOFF.md` §6'daki davranışla uyumludur; farklı bir sayfa adı kullanılıyorsa `src/app/api/admin/okul-sablonu/route.ts` içindeki sayfa adlarıyla eşitle (`grep -n "book_append_sheet\|SheetNames" src/app/api/admin/okul-sablonu/route.ts`).

`cn` ve `adminFocus` importlarını ekle.

- [ ] **Step 3: Adım göstergesi** — `bulk-upload/shared.tsx`

`StepIndicator` gövdesini değiştir (imza aynı):
```tsx
export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Dosya", "Önizleme", "Sonuç"];
  return (
    <ol className="flex items-center gap-2" aria-label={`Adım ${step} / 3`}>
      {steps.map((label, index) => {
        const id = index + 1;
        const state = id < step ? "done" : id === step ? "current" : "todo";
        return (
          <li key={label} className="flex flex-1 flex-col gap-1.5" aria-current={state === "current" ? "step" : undefined}>
            <span className={cn("h-1 rounded-full", state === "todo" ? "bg-admin-line" : "bg-admin-accent")} />
            <span className={cn("text-xs", state === "current" ? "font-semibold text-admin-ink" : "text-admin-muted")}>
              {id}. {label}{state === "done" && <span className="sr-only"> (tamamlandı)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
```
`Pill` renk haritası: `green` → `bg-emerald-50 text-emerald-800`, `yellow` → `bg-amber-50 text-amber-800`, `red` → `bg-rose-50 text-rose-800`, `slate` → `bg-admin-line-soft text-admin-body`; sayılar `tabular-nums`. `cn` importu ekle.

- [ ] **Step 4: Sayfa başlığı** — `toplu-yukle/page.tsx`

```tsx
    <AdminPage>
      <PageHeader
        trail={["İçerik", "Toplu yükleme"]}
        title="Toplu yükleme"
        description="Excel veya CSV dosyasıyla birden fazla okulu tek seferde ekleyin ya da güncelleyin. Kayıttan önce her zaman önizleme gösterilir."
        actions={
          <a href="/api/admin/okul-sablonu" className={adminButton()}>
            <Download aria-hidden="true" className="h-4 w-4" />Şablonu indir
          </a>
        }
      />
      <BulkUploadWizard />
    </AdminPage>
```
Alt sihirbazlarda ayrıca şablon bağlantısı varsa kalabilir.

- [ ] **Step 5: Önizleme tabloları**

Her alt sihirbazda önizleme tablosu sayı hücrelerine (`<td>` içinde puan, kontenjan, satır no) `tabular-nums text-right`; durum hücrelerini `Badge` ile göster: yeni → `tone="accent"` "Yeni", güncelleme → `tone="neutral"` "Güncellenecek", hata → `tone="danger"` "Atlanacak". Mevcut `status` değerleri ve koşullu mantık aynen kalır; yalnız görünüm değişir. "Yükle (N okul)" birincil düğmesi `adminButton({ variant: "primary" })`, disabled koşulu aynen.

- [ ] **Step 6: Doğrula ve commit**

```bash
npx tsc --noEmit && npx eslint . && npm test
grep -rn "blue-\|slate-" src/components/admin/bulk-upload src/app/admin/okullar/toplu-yukle
git add -A src/components/admin/bulk-upload src/app/admin/okullar/toplu-yukle/page.tsx
git commit -m "feat: bulk upload with mode cards, progress steps and status badges

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Beklenen: grep boş. Tarayıcıda dört mod (1440/390). Bir önizleme denemesi yapılacaksa kullanıcıdan izin iste; "Yükle"ye **basma**.

---

### Task 14: Son tarama, doğrulama ve belgeler

**Files:**
- Delete: `scripts/admin-restyle.mjs`
- Modify: `PROJECT_HANDOFF.md`, `docs/superpowers/specs/2026-09-23-admin-panel-redesign-design.md` (renk notu)

- [ ] **Step 1: Kalan eski sınıflar**

```bash
grep -rn "blue-\|slate-\|gray-" src/app/admin src/components/admin | grep -v gradient
grep -rln "@/components/ui/SubmitButton" src/app/admin src/components/admin
grep -rn "min-h-\[70vh\]\|Admin Paneli\|← Admin" src/app/admin src/components/admin
```
Beklenen: üçü de boş. Çıkan her satırı ilgili görevin kalıbıyla düzelt.

- [ ] **Step 2: Betiği sil**

```bash
git rm scripts/admin-restyle.mjs
```

- [ ] **Step 3: Tam doğrulama**

```bash
npm test && npx eslint . && NEXT_DIST_DIR=.next-verify npx next build; rm -rf .next-verify; git checkout -- tsconfig.json; git status --short
```
Beklenen: tüm testler (44 + 12 yeni) geçer; lint 0/0; derleme başarılı; `git status` yalnız bu görevin dosyaları.

- [ ] **Step 4: Tasarım dedektörü**

Run: `/Users/mehmetyalcin/.claude/skills/impeccable/scripts/impeccable detect --json src/app/admin src/components/admin src/app/globals.css`
Mekanik bulguları düzelt (tek tur); kalanları Görev 15'teki incelemeye aktarmak üzere not et.

- [ ] **Step 5: Oturumlu tarayıcı turu**

Kullanıcı uygulama içi tarayıcıda giriş yapmış olmalı. Her ekran için 1440 ve 390 genişlikte ekran görüntüsü al, `.impeccable/review/` altına kaydet (`desktop-<ekran>.png`, `mobile-<ekran>.png`): `/admin`, `/admin?okul=<bir-slug>`, `/admin/okullar/<slug>/duzenle`, `…?tab=puanlar`, `/admin/okullar/yeni`, `/admin/okullar/toplu-yukle`, `/admin/meslek-alanlari`, `/admin/mesajlar?mesaj=<id>`, `/admin/soru-cevap`, üç site ayarı sayfası, `/admin/login` (çıkış yapmadan: ayrı gizli sekme ya da kullanıcıdan izin). Genel site regresyonu: `/`, `/okullar`, bir okul detayı, `/alanlar`, `/iletisim` Navbar/Footer ile açılır. Konsol hatası yok. Bulunan kusurları tek topluca düzelt, bir tur daha doğrula (en fazla iki tur).

- [ ] **Step 6: Belgeleri güncelle**

`PROJECT_HANDOFF.md` sonuna ekle:

```markdown
## 23. Yönetim paneli yeniden tasarımı — 23 Eylül 2026

Tasarım: `docs/superpowers/specs/2026-09-23-admin-panel-redesign-design.md`; plan: `docs/superpowers/plans/2026-09-23-admin-panel-redesign.md`. Dal: `feat/admin-panel-redesign`.

- Genel sayfalar `src/app/(site)/` route group'unda; Navbar/Footer `(site)/layout.tsx` içinde. URL'ler aynı. `/admin` kendi kabuğunu (`components/admin/shell/AdminFrame.tsx`) kullanır.
- Panel görsel dili `.admin` kapsamında (indigo `#4f46e5`, `admin-*` Tailwind renkleri). Genel site Exam Blue, ana sayfa `.landing` olarak kalır.
- Veri sağlığı kuralı `src/lib/school-health.ts` (8 kontrol; son puan/kontenjan yılı veriden). Eski "eksik içerik" göstergesi (eski dizi sütunlarını okuyordu) kaldırıldı.
- `/admin` = okullar defteri: bağlantılı özet sayaçları, URL'de filtreler (`ara`, `ilce`, `tur`, `durum`, `eksik`, `sirala`, `okul`), künye paneli, toplu işlem çubuğu. İlişkiler okul sorgusuna gömülü okunur (tesis ilişkisi 1000 satır sınırını aşıyor).
- Okul formu: dikey sekme rayı + veri sağlığı özeti, yapışkan kaydet çubuğu, `admin-form-dirty` olayı. Mesajlar iki bölmeli; SSS gruplu ve aranabilir; site ayarları üç ayrı menü sayfası; toplu yükleme `components/admin/bulk-upload/` altında mod başına dosya.
- Bilinen sınır: `toggleSchoolStatus`/`deleteSchool` action'ları `/admin?success=…` adresine yönlendirdiği için bu işlemlerden sonra defter filtreleri sıfırlanır (action sözleşmesi değiştirilmedi).
- Server action, yetki, RLS ve veritabanı değişmedi. Testler: <N> (yeni: `school-health`, `admin-ledger`), lint 0, derleme başarılı. Oturumlu tarayıcıda masaüstü/mobil kontrol edildi; canlı veriye yazan işlem denenmedi.
```
`<N>`'yi Step 3'teki gerçek test sayısıyla doldur. §3'teki sayfa tablosunda `src/app/page.tsx` → `src/app/(site)/page.tsx` ve diğer genel yol girişlerini güncelle.

Spec'te `## 2. Panel görsel dili` tablosunun altına not ekle: "Uygulamada soluk metin AA için `#6f748a`'ya koyulaştırıldı; ikincil gövde tonu `admin-body #3d4257` ve eksik işareti `admin-missing #c2410c` eklendi."

- [ ] **Step 7: Commit**

```bash
git add -A PROJECT_HANDOFF.md docs/superpowers/specs .impeccable/review scripts src
git commit -m "docs: record the admin panel redesign in the handoff notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Bitiş incelemesi ve `DESIGN.md`

**Files:**
- Modify: `DESIGN.md`, `.impeccable/design.json` (belgeleyici yazar)

- [ ] **Step 1: Bitiş incelemesi**

`impeccable-finish-reviewer` alt ajanını taze bağlamla çalıştır. Girdi paketi: özgün istek (Sneat yönü, modern/sade/işlevsel, "senin dokunuşların"), onaylanan yanıtlar (indigo yalnız panelde; 1–2 kişi masaüstü; gerçek tablolara göre eksik kuralı; Veri Sağlık Defteri; route group; wizard bölünmesi), yüzey özeti `.impeccable/surfaces/src-app-admin-layout-tsx.md` (direction contract), spec yolu, `.impeccable/review/` altındaki ekran görüntüleri (hepsi zorunlu), Görev 14 Step 4 dedektör bulguları, craft-floor referansı `/Users/mehmetyalcin/.claude/skills/impeccable/reference/craft-floor.md`, kod yolu (build code-led; onaylı comp yok). Dönüşteki karar kelimesine göre davran: `fix` → düzeltmeleri tek topluca uygula, yeniden görüntü al, aynı inceleyiciden doğrulama iste (en fazla iki tur); `recapture` → görüntüleri yeniden al; `ship` → devam.

- [ ] **Step 2: `DESIGN.md` belgeleme**

`impeccable-documenter` alt ajanını çalıştır: proje kökü, artifact yolları (`src/app/admin`, `src/components/admin`, `src/app/globals.css` `.admin` bölümü), direction contract, PRODUCT.md, yazma sınırı: `DESIGN.md` içinde yalnız yeni bir "Admin Surface World (Veri Sağlık Defteri)" bölümü ve `.impeccable/design.json`; landing ve Exam Blue bölümlerine dokunma, yalnız "Scope note" satırındaki "admin" ifadesini yeni bölüme yönlendir. Çıktıyı doğrula: token taşıyan bölüm + `design.json` güncel.

- [ ] **Step 3: Son kontrol ve commit**

```bash
npm test && npx eslint .
git add DESIGN.md .impeccable/design.json
git commit -m "docs: document the admin surface world in DESIGN.md

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git log --oneline main..HEAD
```

Kullanıcıya özet ver: yapılanlar, doğrulama kanıtları, bilinen sınır (durum/silme sonrası filtre sıfırlanması), inceleme kararı. `main`'e birleştirme ve push için **ayrıca onay iste** (push canlı yayındır).

---
name: Hedefim Lise
description: Mersin lise tercih rehberi — güven veren koyu chrome, berrak açık veri gövdesi.
colors:
  exam-blue: "#2563eb"
  exam-blue-deep: "#1d4ed8"
  exam-blue-bright: "#3b82f6"
  exam-blue-tint: "#eff6ff"
  exam-blue-tint-strong: "#dbeafe"
  ink: "#0f172a"
  slate-body: "#334155"
  slate-muted: "#64748b"
  slate-faint: "#94a3b8"
  line: "#e2e8f0"
  line-soft: "#f1f5f9"
  surface: "#f8fafc"
  canvas: "#ffffff"
  night-chrome: "#0a0f1c"
  night-hero: "#071426"
  success: "#059669"
  success-tint: "#ecfdf5"
  danger: "#e11d48"
  danger-tint: "#fff1f2"
  highlight: "#b45309"
  highlight-tint: "#fffbeb"
  cyan-glow: "#22d3ee"
  landing-doc-ground: "#f3f5f4"
  landing-doc-panel: "#ffffff"
  landing-ink: "#16211c"
  landing-ink-soft: "#3a4742"
  landing-ink-faint: "#5f6c68"
  landing-line: "#d8dedb"
  landing-teal: "#0c4a45"
  landing-teal-deep: "#083a36"
  landing-teal-tint: "#e3ece9"
  landing-vermilion: "#dc5a34"
  landing-vermilion-deep: "#c24325"
  landing-teal-ring: "rgba(12, 74, 69, 0.16)"
  admin-ground: "#f4f5fa"
  admin-surface: "#ffffff"
  admin-ink: "#1e2235"
  admin-body: "#3d4257"
  admin-muted: "#5b6178"
  admin-faint: "#656a80"
  admin-line: "#e6e8f0"
  admin-line-soft: "#eef0f6"
  admin-line-strong: "#d3d6e2"
  admin-accent: "#4f46e5"
  admin-accent-deep: "#4338ca"
  admin-accent-soft: "#c7d2fe"
  admin-tint: "#eef2ff"
  admin-tint-ink: "#3730a3"
  admin-missing: "#c2410c"
  admin-ok: "#059669"
  admin-ok-tint: "#ecfdf5"
  admin-ok-ink: "#065f46"
  admin-warning: "#d97706"
  admin-warning-tint: "#fffbeb"
  admin-warning-ink: "#92400e"
  admin-danger: "#be123c"
  admin-danger-tint: "#fff1f2"
  admin-danger-ink: "#9f1239"
typography:
  display:
    fontFamily: "Inter, Arial, Helvetica, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, Arial, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Arial, Helvetica, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  landing-display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  landing-body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  landing-micro:
    fontFamily: "Roboto Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.18em"
  admin-page-title:
    fontFamily: "Inter, system-ui, Arial, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  admin-figure:
    fontFamily: "Inter, system-ui, Arial, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    fontFeature: "tnum"
  admin-card-title:
    fontFamily: "Inter, system-ui, Arial, Helvetica, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.4
  admin-body:
    fontFamily: "Inter, system-ui, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  admin-label:
    fontFamily: "Inter, system-ui, Arial, Helvetica, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  admin-meta:
    fontFamily: "Inter, system-ui, Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  admin-code:
    fontFamily: "Inter, system-ui, Arial, Helvetica, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.exam-blue}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.exam-blue-deep}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.line-soft}"
    textColor: "{colors.slate-body}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.slate-body}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.slate-body}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  chip:
    backgroundColor: "{colors.exam-blue-tint}"
    textColor: "{colors.exam-blue-deep}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
  button-landing-primary:
    backgroundColor: "{colors.landing-teal}"
    textColor: "{colors.landing-doc-panel}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-landing-primary-hover:
    backgroundColor: "{colors.landing-teal-deep}"
    textColor: "{colors.landing-doc-panel}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  input-landing:
    backgroundColor: "{colors.landing-doc-ground}"
    textColor: "{colors.landing-ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  admin-button-primary:
    backgroundColor: "{colors.admin-accent}"
    textColor: "{colors.admin-surface}"
    typography: "{typography.admin-body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  admin-button-primary-hover:
    backgroundColor: "{colors.admin-accent-deep}"
    textColor: "{colors.admin-surface}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  admin-button-secondary:
    backgroundColor: "{colors.admin-surface}"
    textColor: "{colors.admin-body}"
    typography: "{typography.admin-body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  admin-button-secondary-hover:
    backgroundColor: "{colors.admin-line-soft}"
    textColor: "{colors.admin-body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  admin-button-ghost:
    textColor: "{colors.admin-body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  admin-button-danger:
    textColor: "{colors.admin-danger}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  admin-button-danger-hover:
    backgroundColor: "{colors.admin-danger-tint}"
    textColor: "{colors.admin-danger}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  admin-button-sm:
    typography: "{typography.admin-label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  admin-input:
    backgroundColor: "{colors.admin-surface}"
    textColor: "{colors.admin-ink}"
    typography: "{typography.admin-body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
  admin-card:
    backgroundColor: "{colors.admin-surface}"
    textColor: "{colors.admin-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  admin-badge:
    backgroundColor: "{colors.admin-line-soft}"
    textColor: "{colors.admin-body}"
    typography: "{typography.admin-meta}"
    rounded: "6px"
    padding: "2px 8px"
  admin-badge-accent:
    backgroundColor: "{colors.admin-tint}"
    textColor: "{colors.admin-tint-ink}"
    rounded: "6px"
    padding: "2px 8px"
  admin-nav-item:
    textColor: "{colors.admin-body}"
    typography: "{typography.admin-body}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  admin-nav-item-active:
    backgroundColor: "{colors.admin-tint}"
    textColor: "{colors.admin-tint-ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  admin-unread-badge:
    backgroundColor: "{colors.admin-accent}"
    textColor: "{colors.admin-surface}"
    typography: "{typography.admin-meta}"
    rounded: "{rounded.full}"
    padding: "1px 6px"
  admin-ledger-row-selected:
    backgroundColor: "{colors.admin-tint}"
    textColor: "{colors.admin-tint-ink}"
  admin-pip-ok:
    backgroundColor: "{colors.admin-ok}"
    rounded: "3px"
    size: "10px"
  admin-pip-missing:
    backgroundColor: "{colors.admin-surface}"
    textColor: "{colors.admin-missing}"
    rounded: "3px"
    size: "10px"
  admin-sidebar:
    backgroundColor: "{colors.admin-surface}"
    width: "240px"
  admin-sidebar-collapsed:
    backgroundColor: "{colors.admin-surface}"
    width: "72px"
  admin-topbar:
    backgroundColor: "{colors.admin-surface}"
    height: "64px"
---

# Design System: Hedefim Lise

## Overview

**Creative North Star: "Güvenilir Rehberlik Masası" (The Trusted Guidance Desk)**

Hedefim Lise sits with an anxious 8th-grader (and their parent, and their counselor) at the moment a life choice is being made, and its whole job is to feel like a calm, credible desk to make that choice at. The system runs on a deliberate duality: a **deep-navy chrome world** — the sticky navbar (`#0a0f1c`), the footer, and the dark page headers on interior surfaces (istatistikler, hakkında, alan detayı) — frames the product like a confident night sky you're navigating by, while the **body is a bright, orderly workspace** of near-white canvas, cool slate neutrals, and a single decisive blue. The dark frame supplies gravity and trust; the light body supplies clarity and speed. Nothing shouts except the one place a decision happens.

> **Scope note (2026-08).** The landing route (`/`) no longer uses the old dark-navy `#071426` hero with cyan/amber aurora glows — that hero and its search panel were deleted. The landing now runs its own light, landing-scoped visual world documented in **Landing Surface World (Yön #3 — Yerleştirme Kılavuzu)** below. Everything else — okullar, school detail, alanlar, istatistikler, Navbar/Footer, and the `ui/` primitives — still runs the Exam Blue system this document describes. The admin (`/admin/**`) no longer does: it runs its own scoped world, documented in **Admin Surface World (Veri Sağlık Defteri)** below.

The temperament is **reassuring and calm**: measured spacing, soft rounded surfaces, thin hairline borders, and shadows so light they read as breath rather than weight. Color is rationed — the blue is a signal, not a mood — and the semantic hues (emerald, rose, amber) appear only to mean something. This is an Operate system wearing a Persuade hero: the landing frame earns trust, then gets out of the way so filtering, comparing, and shortlisting stay effortless.

**Key Characteristics:**
- Dark, trustworthy chrome (navbar, footer, interior page headers) over a bright, scannable data body.
- One decisive accent (Exam Blue) rationed against a broad cool-slate neutral field.
- Soft, "resting" surfaces — generous radii, hairline borders, whisper-light shadows.
- Semantic color (emerald/rose/amber) used only to carry meaning, never decoration.
- Calm density: roomy on marketing surfaces, efficient but never cramped in tools.

## Colors

A disciplined cool palette: one confident blue signal over an extensive slate-neutral field, bracketed by two near-black navies for chrome, with tightly-scoped semantic accents.

### Primary
- **Exam Blue** (#2563eb): The single decisive accent — primary CTAs ("Ara", "Detaylı İncele"), active filters, focused inputs, links, selected states. It is the one color that means "act here".
- **Exam Blue Deep** (#1d4ed8): Hover/active depth for primary actions and emphasized figures.
- **Exam Blue Bright** (#3b82f6): Focus-border companion, paired with a soft `ring` at 10–20% opacity.
- **Exam Blue Tint / Tint Strong** (#eff6ff / #dbeafe): Selected chips, badge backgrounds, subtle highlight fills.

### Neutral
- **Ink** (#0f172a — slate-900): Headings and highest-emphasis figures.
- **Slate Body** (#334155 — slate-700): Default body and control text.
- **Slate Muted** (#64748b — slate-500): Secondary text, result counts, helper copy.
- **Slate Faint** (#94a3b8 — slate-400): Icons, placeholders, de-emphasized meta.
- **Line** (#e2e8f0 — slate-200): The default hairline border on cards, inputs, and dividers.
- **Line Soft** (#f1f5f9 — slate-100): Inner dividers, secondary-button fills.
- **Surface** (#f8fafc — slate-50): Page background and inset control fills.
- **Canvas** (#ffffff): Card and elevated-surface background.

### Chrome (the dark frame)
- **Night Chrome** (#0a0f1c): The sticky navbar (~90% opacity with backdrop blur; white text, slate-300 links), the footer, and the dark page headers on interior surfaces (istatistikler, hakkında, alan detayı).
- **Night Hero** (#071426): **Retired.** This was the base of the old landing hero; the hero was deleted in the 2026-08 landing redesign and the value no longer appears in the codebase. Do not reintroduce it.
- **Cyan Glow** (#22d3ee): Atmospheric accent for the *dark chrome world only* — soft blurs and eyebrow accents on the dark interior page headers (istatistikler, statistics dashboard, hakkında). It no longer appears on the landing.

### Semantic
- **Success** (#059669 — emerald-600) on **Success Tint** (#ecfdf5): positive stats, confirmations.
- **Danger** (#e11d48 — rose-600) on **Danger Tint** (#fff1f2): destructive/clear actions, "Tümünü Temizle", errors.
- **Highlight** (#b45309 — amber-700) on **Highlight Tint** (#fffbeb): cautions and callouts.

### Named Rules
**The One-Signal Rule.** Exam Blue is the only color that invites action. It should cover well under ~10% of any body screen — its scarcity is what makes "act here" legible. Never use blue as a decorative fill.

**The Meaning-Only Rule.** Emerald, rose, and amber never appear for decoration — each is a claim (good / destructive / caution). If a color isn't carrying meaning, it's slate.

**The Two-Worlds Rule (amended 2026-08).** Cyan and glow treatments live *only* in the dark chrome world (navbar, footer, dark interior page headers). The light Exam Blue body is blue-and-slate; a cyan glow in a data card breaks the system. The old third member of this rule — the dark aurora hero — no longer exists: the landing is now its own light **document world** (see Landing Surface World), and neither cyan, aurora glows, nor Exam Blue may appear inside it.

## Typography

**Display / UI Font (intended):** Inter (loaded as `--font-geist-sans`)
**Body Font (as-shipped):** Inter / system stack (`body { font-family: var(--font-sans), "Inter", … }` in `globals.css`)
**Mono Font:** Roboto Mono (`--font-geist-mono`) — code/numeric affordances site-wide; on the landing it is the micro-label voice.
**Landing Fonts (scoped):** Archivo (`--font-archivo`) and Source Serif 4 (`--font-source-serif`) are loaded **globally** in `layout.tsx` via next/font, but they *apply only within the `.landing` scope* — Archivo through the `font-display` utility, Source Serif 4 as the `.landing` base `font-family` and the `font-reading` utility. Do not use them on Exam Blue surfaces.

**Character:** A neutral, highly legible grotesque program. Personality comes from *weight contrast and tight tracking*, not from a characterful typeface — headings run heavy (extrabold) with negative letter-spacing, body stays quiet and readable. This restraint is on-brand: the data is the star.

> **Drift resolved:** the old `body { font-family: Arial, … }` hardcode has been fixed; `globals.css` now sets `body { font-family: var(--font-sans), "Inter", system-ui, … }`, so Inter is the actual rendered UI face.

### Hierarchy
- **Display** (800, `clamp(2.25rem, 6vw, 4.5rem)`, line-height 1.15, tracking -0.02em): Page-level display headlines on Exam Blue surfaces (`.type-display`). The old landing-hero use — white text with a gradient-clipped amber keyword — no longer exists; the landing's larger Archivo display is documented in Landing Surface World.
- **Headline** (800, ~1.75–2.25rem, tracking -0.01em): Page titles ("Sana Uygun Liseleri Keşfet"), section leads.
- **Title** (700, ~1.25–1.5rem): Card titles (school names), dialog headers.
- **Body** (400–500, 1rem, line-height ~1.6): Descriptions, form values, helper text.
- **Label** (700, ~0.6875rem, tracking 0.08em, UPPERCASE): The signature meta-tag — school type, district, section eyebrows. Small, bold, wide-tracked, uppercase.

### Named Rules
**The Heavy-Head Rule.** Hierarchy is carried by weight, not size alone: headings are 700–800 with slightly negative tracking; body stays 400–500. Never set a heading below 700.

**The Uppercase-Label Rule.** Category/meta text is uppercase, bold, wide-tracked, and tiny (≤11px). It is a texture, not a headline — never uppercase running copy.

## Layout

A centered, max-width column system on a slate-50 page. Marketing surfaces use `max-w-5xl` (hero) and the app body uses `max-w-7xl` with `px-6` gutters. The schools experience is a **sticky filter rail + results ledger** two-column grid on desktop (`lg:` and up): a flat, borderless ~248px filter rail (`lg:sticky lg:top-24`) whose selects and yerleştirme segmented control apply instantly (the name search submits on Enter / Ara), beside a results column. Results are **one bordered white panel of divided rows**, not a stack of cards: each row is a single link (school name, then `type · district` meta in slate-500) with the latest-year score right-aligned in a tabular column under a `{year} puanı` header. No school description and no per-row buttons appear in the list; the detail page carries them. Applied filters (including the landing's score ranges) show as removable blue-tint chips. Below `lg` the rail collapses into a sticky filter/sort bar plus bottom-sheets. Spacing rhythm follows Tailwind's 4px scale, with `gap-5`/`gap-8` between cards and sections and generous vertical padding (`pt-10 pb-24`) framing content. Density is calm on Persuade/Read surfaces and efficient-but-airy in the tools — rows breathe, nothing is cramped.

## Elevation & Depth

**Flat-by-default with whisper shadows.** Surfaces rest on hairline `Line` borders, not drop shadows; depth is primarily tonal (canvas cards floating on the slate-50 surface). Shadows are soft and mostly reserved for hover. The dominant token is `shadow-sm`; hover on school cards lifts to a soft, tinted `shadow-xl shadow-slate-200/50`. Primary buttons carry a faint colored shadow (`shadow-blue-600/20`) that deepens on hover.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)` — `shadow-sm`): default on cards, bars, inputs.
- **Card Hover Lift** (`shadow-xl` tinted `slate-200/50`): interactive cards on hover, paired with `hover:-translate-y-0.5` and a border shift to `slate-300`. The `/okullar` list rows do not lift; they take a `slate-50` wash.
- **Action Glow** (`shadow-blue-600/20 → /40`): primary buttons, deepening on hover.
- ~~**Hero Float**~~ Retired with the old dark hero: the `shadow-2xl shadow-sky-950/45` hero-search float no longer exists.

### Named Rules
**The Flat-Rest Rule.** Surfaces are flat at rest and defined by their hairline border. Shadow is a *response to state* (hover, focus, the hero's lifted search) — never ambient decoration on a static card.

## Shapes

Soft, consistent, generously rounded. The radius vocabulary is tight: **12px (`rounded-xl`)** is the workhorse for inputs, buttons, chips, and small controls; **16–24px (`rounded-2xl`/`rounded-3xl`)** for cards and panels; **`rounded-full`** for pills, badges, avatars, and the hero's aurora blobs. Borders are single-pixel hairlines in `Line` (occasionally at partial opacity, `slate-200/80`). Corners never go sharp (0px) in the body and never mix radii within one component. Icons are Lucide, thin-stroke, 16–20px, in `Slate Faint` until a control activates.

## Components

### Buttons
- **Shape:** Rounded (`rounded-xl`, 12px); full pills for compact chips/toggles.
- **Primary:** `Exam Blue` fill, white text, `py-2.5–3 px-5`, `font-semibold`, faint blue shadow. Used for the one main action on a surface.
- **Hover / Focus:** Background → `Exam Blue Deep`, `-translate-y-0.5` lift, shadow deepens to `blue-600/40`; transitions ~200ms.
- **Secondary:** `Line Soft` (slate-100) fill, `Slate Body` text, hover to slate-200 — for "Filtreleri Temizle" and low-emphasis actions.
- **Destructive-text:** rose-600 underlined text ("Tümünü Temizle"), no fill.

### Chips / Badges
- **Style:** Small rounded-md/full tags; `Exam Blue Tint` bg + `Exam Blue Deep` text for active filters; slate/white bordered variants for meta.
- **Meta badge:** the signature `text-[10px] font-bold uppercase tracking-wider` label with a hairline border and tinted fill (type = blue tint, district = slate tint).
- **State:** Selected = blue tint + blue text; unselected = white/slate with hover border-blue-300.

### Cards / Containers
- **Corner Style:** `rounded-2xl`/`rounded-3xl` (16–24px).
- **Background:** `Canvas` on the `Surface` page.
- **Shadow Strategy:** `shadow-sm` at rest → tinted `shadow-xl` on hover (see Elevation).
- **Border:** hairline `Line` (often `slate-200/80`), shifting to `slate-300` on hover.
- **Internal Padding:** `p-5` to `p-7` (20–28px).

### Inputs / Fields
- **Style:** `Surface` (slate-50) fill, hairline `Line` border, `rounded-lg`/`rounded-xl`, leading Lucide icon in `Slate Faint`.
- **Focus:** Border → `Exam Blue Bright`, background → white, soft `ring-4 ring-blue-500/10`; icon tints toward blue.
- **Select:** custom appearance-none with a rotated `ChevronRight` chevron.

### Navigation
- **Style:** Sticky, `Night Chrome` at ~90% with backdrop blur, hairline `white/5` bottom border, `h-20`.
- **Logo mark:** gradient `blue-600 → blue-400` rounded-xl tile with a white icon and blue shadow.
- **Links:** `slate-300`, `text-sm font-medium`, hover to white on `white/5`; the primary nav action is a translucent `white/10` pill.
- **Mobile:** collapses to a sheet; the schools page adds a sticky filter/sort bar and bottom-sheets.

### Hero Search — removed (2026-08)
The old signature — a white `rounded-2xl` panel with `shadow-2xl` straddling the dark hero, cyan focus rings, "Okul Ara" submit — was deleted with the dark hero. The landing's decision control is now the **Percentile Scale** (`src/components/home/PercentileScale.tsx`), documented in Landing Surface World below. Do not rebuild the hero search.

## Landing Surface World (Yön #3 — Yerleştirme Kılavuzu)

**Scope (critical):** This world exists **only inside the `.landing` wrapper** that `src/app/(site)/page.tsx` puts around the landing route (`/`). Its tokens are CSS custom properties defined on `.landing` in `globals.css`; they do not exist outside it. The Navbar and Footer that frame the landing remain incumbent Night Chrome. Every other page keeps the Exam Blue system above. The two palettes never mix on one surface: no Exam Blue, cyan, or aurora inside `.landing`; no teal/vermilion outside it.

**Creative North Star (landing): "Yerleştirme Kılavuzu" (The Placement Guide).** The landing is a confident data *document* — a printed statistics bulletin, not an edu-SaaS hero. Numbers run at poster scale; the percentile axis is the hero. The direction contract (seed 87596005) is embedded greppable in `layout.tsx`.

### Colors (landing-scoped)

Color is a **separation tool, not decoration**: neutrals and typography carry the load; the two hues each mean exactly one thing.

- **Doc Ground** (`--doc-ground`, #F3F5F4): the page paper — a cool, faintly green-cast off-white.
- **Doc Panel** (`--doc-panel`, #FFFFFF): raised panels (percentile scale card, featured strip, bento cards).
- **Ink / Ink Soft / Ink Faint** (#16211C / #3A4742 / #5F6C68): headings and figures / body copy / micro-labels and de-emphasized ticks. Ink Faint is 5.0:1 on Doc Ground — AA for the 10–11px labels.
- **Line** (`--line`, #D8DEDB): every hairline — section dividers, panel borders, the axis baseline.
- **Teal / Teal Deep / Teal Tint** (#0C4A45 / #083A36 / #E3ECE9): **authority + the primary action.** Button fills (hover → deep), reachable axis ticks, the highlighted keyword in the h1, focused input borders, link accents, tinted type badges. Focus rings use `--teal-ring` (rgba(12,74,69,0.16), ring-4).
- **Vermilion / Vermilion Deep** (#DC5A34 / #C24325): **the single warm signal — the user's own position and act-here only.** The "sen" marker on the axis (line + diamond) is Vermilion; its label and inline validation errors are Vermilion Deep. `::selection` inside `.landing` is Vermilion Deep with white text (5.1:1).

**The Sen Rule.** Vermilion marks exactly one thing: *you*. It never fills a button, tints a card, or decorates. If vermilion appears, it is either the user's own selection on the scale (the range handles and their labels) or an error the user must act on.

**The One-Authority Rule.** Teal is the only action color on the landing. Exam Blue never crosses into `.landing`; teal/vermilion never leave it.

### Typography (landing-scoped)

- **Archivo** (`font-display`, `--font-archivo`): headlines and every large numeral — grotesk authority.
- **Source Serif 4** (`font-reading`, `--font-source-serif`): the `.landing` base font — warm reading body.
- **Roboto Mono** (`font-mono`): the document meta-grammar — micro-labels at 10–11px, uppercase, wide-tracked (0.14–0.18em), medium/bold, in Ink Faint. Used for the "{year} verileri", axis end-labels, figure captions, section codes, source disclaimers, and inline errors.
- **Poster headline:** the h1 is Archivo 800 at `clamp(2.5rem, 7vw, 5.5rem)`, line-height 1.02, tracking -0.02em, with one teal keyword ("ölçekte").
- **Proof figures:** giant tabular Archivo numerals (`text-5xl`/`text-6xl`, 800, leading-none) sitting on a hairline-topped baseline row, each captioned by a mono micro-label. Featured-school score runs `text-4xl` in teal.

**The Tabular Rule.** Every numeral that represents data gets `font-variant-numeric: tabular-nums` (the `.tabular` utility).

**The Turkish-Comma Rule.** Every percentile prints with a comma decimal (`5,00`, `%1,23`) via the shared `fmt()` pattern (`toFixed(2).replace(".", ",")`). Never a dot.

### Layout & structure

A `max-w-6xl` centered column with `px-6` gutters on the Doc Ground. The page reads as one continuous document: headline → score-scale panel → featured strip → bento → disclaimer footnote, each act separated by a full-width `border-t` hairline rather than background changes. **There is no document masthead** — it repeated the Navbar's brand 80px below itself, and the data year it carried already lives in the scale header. Panels are `rounded-2xl`, Doc Panel fill, `Line` border, `shadow-sm`. The bento is asymmetric: one dominant 2×2 card (the tercih robotu) plus two supporting cards, each carrying a mono section code eyebrow ("01 — birincil araç", "02 — alan rehberi", "03 — proje okulları").

**The cadence is deliberate, not uniform.** Vertical intervals run 48 · 20 · 32 · 56 ‖ 48 · 16 · 56 ‖ **80** · 16 · 48 · 40 · 64: tight inside a unit, a medium beat between units, and exactly **one 80px interval** on the whole page — above *Tercih sürecinizi kolaylaştıran araçlar* — because that is the only real act break. The featured strip is the scale's evidence, so it sits closer to the hero than the tool grid does. Equal padding on every section is the failure state this replaced.

### Motion (landing-scoped)

Quiet and functional. Axis ticks transition `background-color`/`opacity` over 200ms. The user marker slides via `transition: left 300ms cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) and first appears with the `marker-in` 300ms opacity fade (no pop). Cards hover-lift `-translate-y-1` over 300ms with a teal top-rule + arrow reveal.

### Percentile Scale (landing signature)

`src/components/home/PercentileScale.tsx` — the owned visual idea: Mersin's high schools as a strip-plot on one axis, inside a Doc Panel card.

- **Two metrics, two distributions.** Mersin's schools are admitted two different ways and most hold only one number: **55** have an LGS percentile (merkezi yerleştirme), **126** have an OBP score (yerel yerleştirme), and only 26 have both. A single-metric scale would hide 100 schools, so the panel opens with a `role="tablist"` segmented control — *Yüzdelik dilimi* / *OBP puanı*, each carrying its own honest school count — and the whole axis, labels, input labels, scope note, and submit params switch with it. Switching metrics **resets the range to the new scale's ends**: %0,94 and 0,94 OBP are not the same number. A metric with no data is disabled, and the panel opens on whichever metric has data.
- **Distribution:** one 1px full-height tick **per school** (not per score record) across a min→max axis over a hairline baseline.
- **The axis always ascends left to right; the meaning of the ends does not.** Low percentile is more competitive, high OBP is more competitive. Rather than flipping the number line (which would lie about direction), the ` · en rekabetçi` suffix moves to whichever end the active metric makes competitive — left for yüzdelik, right for OBP. End-labels are 10px mono.
- **The One-Tick-Per-School Rule.** A school can hold several latest-year records (one per meslek alanı). The scale plots schools, so each school is reduced to a single value: **its most accessible latest-year value** — the *highest* percentile, the *lowest* OBP (`src/lib/school-scores.ts`). The header states the honest school count (`N okul`), never the record count.
- **Multi-Program Schools.** Çok programlı Anadolu liseleri store OBP per program (`school_scores.program`: `anadolu_lisesi` / `meslek`; `null` = school-wide). The scale still plots one tick per school (lowest OBP). On `/okullar`, the "Anadolu Lisesi" / "Anadolu Meslek Programı" type filters also list multi-program schools that offer that program and use that program's OBP for the card, OBP sort and OBP range; with no type filter the card shows two rows, "Anadolu Lisesi" and "Meslek Programı" (`src/lib/school-programs.ts`).
- **Range selection:** two Vermilion handles define a band. Ticks inside the band go teal at 0.75 over a `Teal Tint` band fill; outside ticks fade to Ink Faint at 0.14. A live "N okul bu aralıkta" readout updates (`aria-live="polite"`).
- **The handles:** 2px Vermilion lines with rotated-square caps, each a `role="slider"` (aria-valuemin/max/now/text, arrow/PageUp/Home/End keys) inside a 44px pointer-capture grab zone with `touch-none`. Labels sit *above* the axis so they never collide with the end-labels; they merge into one `%X,XX – %Y,YY` label when the handles come within 16% of each other, and clamp at the 8%/92% edges. Position transitions are suppressed while dragging.
- **Input contract:** two free-text decimal fields mirror the handles (comma or dot) and are labelled by the active metric (*Yüzdelik aralığı* / *OBP aralığı*); values must be 0–100 and start ≤ end — invalid submits show an inline mono error in Vermilion Deep and do not navigate.
- **The Scale-Is-The-Filter Rule.** The selected band is a *real filter*, and `/okullar` resolves it with the **same definition the scale draws** (most-accessible latest-year value per school), so a tick inside the band is exactly a school in the result. Submit routes to `/okullar?{metric}_min=X&{metric}_max=Y&siralama=…` — `yuzdelik_min/max` + `yuzdelik_asc`, or `obp_min/max` + `obp_desc` — and the full range returns exactly the scale's own count (verified: yüzdelik 55, OBP 126, both together 26). A full-range selection sends no filter params. The two ranges are independent params and intersect when both are present. A range survives sidebar filter changes, sorting, and pagination, and shows above the list as a removable filter chip whose × drops **only that range**, keeping the other filters.
- **The One-Door Rule.** The landing offers exactly **one** control that navigates to `/okullar`. İlçe and okul türü are `<select>`s inside the scale panel's own action row — not a second search bar — so range, district, and type submit together through the single "Okulları gör" button. Each select's first option is a real, selectable "Tüm …" value (never `disabled hidden`), so "all" is reachable again after a choice; wrappers carry `min-w-0` because a `<select>`'s min-content width follows its longest option.
- **Empty data:** falls back to a one-line "Ölçek verisi şu anda yüklenemedi." and a plain route to `/okullar` (graceful ISR/DB-failure degradation, `revalidate = 86400`).

**Proof figures live in the tool card.** The 184 / 13 / {year} tabular figures are not a free-floating band: they sit inside the dominant bento card, under a hairline, grouped with its CTA, so the corpus numbers read as evidence for the tool they describe and fill the 2×2 card rather than leaving it hollow. They drop out entirely when counts are null. The independence disclaimer is a section footnote under the bento — never inside a clickable card.

### Do's and Don'ts (landing)

- **Do** carry all meta text in the mono micro-label voice (10–11px, uppercase, 0.14–0.18em tracking, Ink Faint).
- **Do** keep panels flat: `Line` hairline + `shadow-sm`, hover states only.
- **Don't** use vermilion for anything but the user's position or an actionable error.
- **Don't** import Exam Blue, cyan, gradients, or aurora glows into `.landing`.
- **Don't** turn the percentile input into a filter, print a percentile with a dot decimal, or set data numerals without `.tabular`.

## Admin Surface World (Veri Sağlık Defteri)

**Scope (critical):** This world exists **only inside the `.admin` wrapper**. `AdminFrame` (`src/components/admin/shell/AdminFrame.tsx`) puts it around every signed-in `/admin/**` route, and `src/app/admin/layout.tsx` puts a bare `.admin` div around `/admin/login`. Its values are CSS custom properties (`--admin-*`) defined on `.admin` in `globals.css`, exposed to Tailwind as `admin-*` colour utilities and `shadow-admin-card` through `@theme inline`; the utilities resolve to nothing outside the scope. The public Navbar and Footer never render here. The palettes never mix: no Exam Blue, cyan, landing teal/vermilion, Archivo, Source Serif, or mono micro-labels inside `.admin`, and no admin indigo outside it.

**Creative North Star (admin): "Veri Sağlık Defteri" (The Data-Health Ledger).** An Operate surface for one or two maintainers of the school dataset. It is a ledger, not a KPI dashboard: the school list is the heart, a strip of counters sits on top of it and filters it, and every school row carries the same eight health pips in the same order. Direction contract: `.impeccable/surfaces/src-app-admin-layout-tsx.md` (seed 24c19b31).

### Colors (admin-scoped)

A cool, faintly violet-grey field with one indigo for wayfinding and three semantic hues that only ever mean something.

- **Ledger Ground** (`admin-ground`): the page behind everything; also the hover wash on ledger rows, counters and list links, and the sticky table-header fill (at 95% with backdrop blur).
- **Sheet White** (`admin-surface`): cards, sidebar, top bar (95% with blur), inputs, panels, floating bars.
- **Ink / Body / Muted / Faint** (`admin-ink`, `admin-body`, `admin-muted`, `admin-faint`): headings and school names / control and label text / descriptions, meta rows, table headers, dates / placeholders, nav group names, zero-value counters, empty-state icons. Faint is tuned to stay at or above 4.5:1 even on the ground.
- **Line / Line Soft / Line Strong** (`admin-line`, `admin-line-soft`, `admin-line-strong`): card borders and section dividers / row dividers, neutral badge and hover fills, disabled input fill / input and secondary-button borders, the "gerekmez" dash, the scrollbar thumb.
- **Wayfinding Indigo** (`admin-accent`, hover `admin-accent-deep`): the one filled primary button, the focus ring, the unread count badge and its collapsed-rail dot, the "Düzelt" and in-list text links, `::selection`, caret, and checkbox/radio `accent-color`.
- **Indigo Tint / Tint Ink** (`admin-tint`, `admin-tint-ink`): the "you are here" pair: active nav item, active form tab, selected ledger row and its school name, the active pip-code filter, the avatar monogram, the accent badge. `admin-accent-soft` is the border of tinted indigo controls.
- **Missing Orange** (`admin-missing`): one meaning only: *this record is missing something*. The outlined missing pip, the tab-rail gap marker, and the "Eksik kayıt" / "En büyük eksik" counter figures.
- **Semantic** (Tailwind emerald / amber / rose steps, not CSS variables): `admin-ok` fills the ok pip and the "Yayında" dot; `admin-ok-tint`/`admin-ok-ink` are the success badge and flash banner. `admin-warning` is the "Pasif" dot and the unsaved-changes dot; its tint/ink are the warning badge. `admin-danger` is destructive text and the sign-out hover; `admin-danger-tint`/`admin-danger-ink` are the danger hover, error badge and error banner.

**The Wayfinding Rule.** Indigo means "you are here" or "go here", and nothing else: active nav, selected row, the one filled primary per screen, the focus ring, the unread badge, and links. It never colours a status, a figure, a success icon, or a decorative fill. State belongs to emerald, amber, rose and missing-orange.

**The Meaning-Only Rule (admin).** Emerald, amber, rose and orange appear only as claims: ok / passive or unsaved / destructive or error / missing. A counter with nothing to report drops to `admin-faint`, not to a colour.

### Typography (admin-scoped)

One family, Inter (the site-wide `--font-sans` stack), on a fixed rem scale: no clamps and no fluid type in the admin. Hierarchy comes from weight (700 titles, 600 labels, 400 body) and a short ramp: **20px** page titles (`admin-page-title`, tight tracking) and counter figures (`admin-figure`); **16px** detail-panel school name; **15px** card titles (`admin-card-title`); **14px** body, controls, nav, table cells (`admin-body`); **13px** form labels, breadcrumbs, small buttons, card descriptions (`admin-label`); **12px** meta rows, hints, badges, table headers, group names (`admin-meta`); **11px** only for the pip-code column header (`admin-code`).

**The Tabular Rule (admin).** Every figure that is compared or counted carries tabular numerals: counters, nav counts, "N okul seçildi", "N / N tamam", table dates.

**The Sentence-Case Rule.** Every label, group name, button and header is sentence case in Turkish ("Toplu yükleme", "Yeni okul", "Okunmamış mesaj"). The admin has no uppercase, no wide tracking, and no eyebrow labels; the Exam Blue Uppercase-Label Rule does not apply inside `.admin`.

### Layout (admin-scoped)

- **Shell:** a white sidebar at **240px** that collapses to a **72px** icon rail (width transition 200ms; state persisted in the `admin_sidebar` cookie), grouped İçerik / Ziyaretçiler / Site; in the rail, group names become 24px hairlines and labels move to `title` + screen-reader text. Beside it, a sticky **64px** top bar: school quick-search ("Okul ara ve düzenle…", `/` shortcut), "Siteyi aç" ghost link, and the avatar menu. Below `lg` the sidebar becomes a 288px (max 85vw) drawer over an ink/40 scrim, opened from a menu button in the top bar.
- **Page widths:** `AdminPage` is **left-aligned** so titles hold the same x position from page to page: **wide 1440px** (ledger, lists), **form 1160px** (school form, settings), **narrow 860px**. Padding 16 / 24 / 32px by breakpoint, 24px vertical (32px at `lg`).
- **Page header:** title at 20px with an optional one-line description, actions right-aligned on the same baseline; sub-pages get a real back link (one crumb) or a breadcrumb trail (several). 24px below the header.
- **Ledger:** counter strip, filter bar, legend, then the table. The table header sticks under the top bar (`top-16`). When a school is opened, the künye panel docks as a **360px** right column at `xl`; below `xl` it is a full-height slide-over (max 384px) over an ink/30 scrim.
- **School form:** a **220px** sticky tab rail beside the fluid form at `lg`; below `lg` the rail becomes a horizontal scroll strip. A sticky save bar floats at the bottom (16px inset).
- **Phones:** single-column grids clamp to the viewport; pips move under the school name and the code header and date column hide below `md`; the counter strip runs 2 / 3 / 5 columns.

### Elevation & Depth (admin-scoped)

Two tiers. **Resting sheets** (cards, the ledger, the counter strip, the tab rail, the docked panel) carry a hairline `admin-line` border plus the barely-there two-layer `shadow-admin-card`; this is a deliberate departure from the Exam Blue Flat-Rest Rule, scoped to `.admin`. **Floating layers** (bulk action bar, save bar, user menu, drawer, slide-over) use a standard large shadow because they sit over content. Nothing lifts or translates on hover; hover is a colour wash only.

Motion is short and functional: colour transitions at 150ms, the sidebar width at 200ms. Under `prefers-reduced-motion`, every transition and animation inside `.admin` is set to 0ms.

### Shapes (admin-scoped)

Two radii carry almost everything: **8px** (`rounded-lg`) for buttons, inputs, nav items, tabs, banners and inner lists; **12px** (`rounded-xl`) for cards and floating bars. Badges are 6px; pips are 3px squares; the avatar, unread badge and status dots are round. Borders are single-pixel hairlines. Icons are Lucide at 16px in controls, 18px in the sidebar, 14px in small buttons.

### Components (admin-scoped)

- **Buttons** (`AdminButton` / `adminButton()`): 8px radius, 600 weight, 150ms colour transition, disabled at 50% opacity. `md` is 40px tall × 16px padding at 14px; `sm` is 32px × 12px at 13px. Variants: **primary** (indigo fill, white text, hover deep indigo), **secondary** (white, line-strong border, body text, hover line-soft; the default), **ghost** (no fill, hover line-soft), **danger** (rose-700 text, no fill, hover rose-50). `loading` swaps in a spinner and sets `aria-busy`; `AdminSubmitButton` binds that to the form's pending state ("Kaydediliyor…").
- **Focus** (`adminFocus`): a 2px indigo ring with a 2px white offset on every interactive element.
- **Inputs** (`adminControl` / `adminInput`): white, line-strong border, 8px radius, min-height 40px, 14px ink text, faint placeholder; hover darkens the border to faint; focus turns the border indigo with a 2px indigo/20 ring; disabled is line-soft with muted text. Labels are 13px/600 body with 6px below; hints are 12px muted with 6px above.
- **Card** (`Card`, `adminCard`): 12px radius, hairline, resting card shadow; optional header row (15px/700 title, 13px muted description, right-aligned actions) over a hairline, 20px body padding.
- **Badge:** 6px radius, 12px/600, tones neutral / accent / success / warning / danger, each a -50 tint with -800 text.
- **Flash banner:** 8px radius, bordered emerald or rose tint, a check or alert icon, a dismiss button; `role="status"` for success and `role="alert"` for errors.
- **Empty state:** centred faint icon, 14px/600 title, muted body at `max-w-sm`, optional action.
- **Navigation item:** 36px tall, 8px radius, 18px icon; active = indigo tint + tint-ink + 600 with `aria-current="page"`; idle = body text, hover line-soft wash. Counts sit right: the school count in muted tabular text, the unread count as a round indigo badge (a dot with a white ring in the collapsed rail).
- **Ledger counter strip** (`LedgerSummary`): five linked counters in one bordered strip separated by 1px line gaps, each a 12px muted label over a 20px/700 tabular figure. The two gap counters use missing-orange; zero values fall to faint. Every counter is a link that filters the ledger.
- **Ledger table** (`LedgerTable`): school name 14px/600 ink over a 12px muted meta row (status dot + "Yayında"/"Pasif" · ilçe · tür); pips column 124px; relative date right-aligned and tabular with the full date in `title`. Rows get a ground wash on hover; the selected row is indigo tint. The pip-code header is also a filter: each code toggles "missing in this check" with `aria-pressed`. Multi-select checkboxes open a sticky **bulk action bar** (secondary sm buttons with emerald/amber icons, a ghost "Seçimi temizle").
- **Künye panel** (`SchoolDetailPanel`): name, meta, status badge and md pips; a bordered list of missing items, each an outlined orange pip, the message, and an indigo "Düzelt ›" link to the exact form tab (`?tab=`); then "N kontrol tamam · …: gerekmez". Footer actions: full-width secondary "Düzenle", sm "Sitede aç" and "Pasifleştir/Aktifleştir", a danger "Okulu sil". Escape closes it; focus moves to the heading.
- **School form tab rail** (`SchoolTabRail`): a "Veri sağlığı · N / N tamam" header, tabs styled like nav items, the outlined orange pip on any tab with a gap (with screen-reader "(eksik var)"), and a lock icon on tabs that wait for the first save. The **save bar** says "Kaydedilmemiş değişiklik var" with an amber dot while dirty, the success message in emerald after a save, and otherwise a muted hint.

### Health Pips (admin signature)

`src/lib/school-health.ts` is the single rule for the ledger, the künye panel and the form. Every school gets **eight fixed checks in a fixed order**: **G** görsel, **A** açıklama (at least 80 characters), **T** tesis, **D** yabancı dil, **P** puan (latest score year), **K** kontenjan (latest quota year), **M** meslek alanı (only for vocational types), **Tel** telefon (a phone icon in the code header and legend). Each check is **ok**, **missing**, or **na** ("gerekmez").

- **The Never-Colour-Only Rule.** State is carried by shape first: ok = a **filled** emerald square, missing = an **outlined** orange square (1.5px border on white), not required = a **dash** in line-strong. Each pip has a `title` ("Görsel: eksik"), and the row carries a screen-reader sentence ("Eksik: Görsel, Telefon" or "Eksik yok").
- **The Fixed-Row Rule.** Eight pips, always in the same order and position, 4px apart, never wrapping (`whitespace-nowrap`), so columns can be scanned down the ledger. Size is 10px in rows and 12px in the panel.
- **The One-Vocabulary Rule.** The whole admin uses the same three words for data state: *tamam / eksik / gerekmez*, and the same pair for publish state: *Yayında / Pasif*. The legend above the ledger defines both the states and the eight codes (codes only at `md` and up, where the code header is visible).

### Do's and Don'ts (admin)

- **Do** keep every admin value on the `admin-*` utilities; new admin surfaces compose `AdminPage`, `PageHeader`, `Card`, `AdminButton` and the `adminControl`/`adminLabel`/`adminHint` strings rather than restyling.
- **Do** give each screen exactly one filled indigo primary; all other actions are secondary, ghost, or danger.
- **Do** make destructive actions quiet: danger-variant text or icon buttons (never a filled red button) behind a confirmation (`ConfirmButton` or a `window.confirm` on submit) that names the record and the consequence.
- **Do** carry state with shape plus text (filled / outlined / dash, dot + word) and the one state vocabulary.
- **Do** set counted figures in tabular numerals, and keep labels in sentence case.
- **Don't** use indigo for status, success, figures or decoration; don't use emerald, amber, rose or orange without a meaning.
- **Don't** add KPI cards or charts that don't filter the ledger; counters are links.
- **Don't** add uppercase eyebrows, wide-tracked labels, fluid display type, or hover lifts inside `.admin`.
- **Don't** reorder, wrap or drop pips, or signal a pip state by colour alone.
- **Don't** let Exam Blue, cyan, landing teal/vermilion, or the landing fonts into `.admin`.


## Do's and Don'ts

### Do:
- **Do** ration `Exam Blue` (#2563eb) to the single most important action per surface; keep it well under ~10% of a body screen.
- **Do** define surfaces with hairline `Line` (#e2e8f0) borders and keep them flat at rest; let shadow appear only on hover/focus.
- **Do** use the uppercase, bold, wide-tracked ≤11px label for category/meta text, and carry hierarchy with weight (700–800 heads).
- **Do** keep radii in the 12 / 16–24px family and never mix radii within one component.
- **Do** reserve emerald/rose/amber for genuine meaning (success / destructive / caution).
- **Do** confine cyan and glow treatments to the dark chrome world (navbar, footer, dark interior page headers) only.

### Don't:
- **Don't** mix `gray-*` and `slate-*` neutrals; the system is `slate` — legacy `gray-*` classes (mobile sheets) are drift to migrate.
- **Don't** introduce a second accent hue into the Exam Blue body; blue is the only action color there.
- **Don't** put gradient-clipped text or cyan glows on body/data surfaces — they belong to the dark chrome world, and the old hero devices (aurora, gradient keyword) are retired entirely.
- **Don't** cross the landing boundary in either direction: no Exam Blue/cyan inside `.landing`, no landing teal/vermilion/Archivo/Source Serif on Exam Blue surfaces.
- **Don't** add ambient drop-shadows to resting cards; depth is tonal + hairline first.
- **Don't** set headings below 700 weight or uppercase running body copy.

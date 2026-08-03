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
---

# Design System: Hedefim Lise

## Overview

**Creative North Star: "Güvenilir Rehberlik Masası" (The Trusted Guidance Desk)**

Hedefim Lise sits with an anxious 8th-grader (and their parent, and their counselor) at the moment a life choice is being made, and its whole job is to feel like a calm, credible desk to make that choice at. The system runs on a deliberate duality: a **deep-navy chrome world** — the sticky navbar (`#0a0f1c`), the footer, and the dark page headers on interior surfaces (istatistikler, hakkında, alan detayı) — frames the product like a confident night sky you're navigating by, while the **body is a bright, orderly workspace** of near-white canvas, cool slate neutrals, and a single decisive blue. The dark frame supplies gravity and trust; the light body supplies clarity and speed. Nothing shouts except the one place a decision happens.

> **Scope note (2026-08).** The landing route (`/`) no longer uses the old dark-navy `#071426` hero with cyan/amber aurora glows — that hero and its search panel were deleted. The landing now runs its own light, landing-scoped visual world documented in **Landing Surface World (Yön #3 — Yerleştirme Kılavuzu)** below. Everything else — okullar, school detail, alanlar, istatistikler, admin, Navbar/Footer, and the `ui/` primitives — still runs the Exam Blue system this document describes.

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

A centered, max-width column system on a slate-50 page. Marketing surfaces use `max-w-5xl` (hero) and the app body uses `max-w-7xl` with `px-6` gutters. The schools experience is a **sticky sidebar + results** two-column grid on desktop (`lg:` and up): a 300px filter rail (`lg:sticky lg:top-24`) beside a fluid results column; below `lg` the sidebar collapses into a sticky filter bar plus a bottom-sheet. Spacing rhythm follows Tailwind's 4px scale, with `gap-5`/`gap-8` between cards and sections and generous vertical padding (`pt-10 pb-24`) framing content. Density is calm on Persuade/Read surfaces and efficient-but-airy in the tools — rows breathe, nothing is cramped.

## Elevation & Depth

**Flat-by-default with whisper shadows.** Surfaces rest on hairline `Line` borders, not drop shadows; depth is primarily tonal (canvas cards floating on the slate-50 surface). Shadows are soft and mostly reserved for hover. The dominant token is `shadow-sm`; hover on school cards lifts to a soft, tinted `shadow-xl shadow-slate-200/50`. Primary buttons carry a faint colored shadow (`shadow-blue-600/20`) that deepens on hover.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)` — `shadow-sm`): default on cards, bars, inputs.
- **Card Hover Lift** (`shadow-xl` tinted `slate-200/50`): school cards on hover, paired with `hover:-translate-y-0.5` and a border shift to `slate-300`.
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

**Scope (critical):** This world exists **only inside the `.landing` wrapper** that `src/app/page.tsx` puts around the landing route (`/`). Its tokens are CSS custom properties defined on `.landing` in `globals.css`; they do not exist outside it. The Navbar and Footer that frame the landing remain incumbent Night Chrome. Every other page keeps the Exam Blue system above. The two palettes never mix on one surface: no Exam Blue, cyan, or aurora inside `.landing`; no teal/vermilion outside it.

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
- **Roboto Mono** (`font-mono`): the document meta-grammar — micro-labels at 10–11px, uppercase, wide-tracked (0.14–0.18em), medium/bold, in Ink Faint. Used for the masthead tagline, "{year} verileri", axis end-labels, figure captions, section codes, source disclaimers, and inline errors.
- **Poster headline:** the h1 is Archivo 800 at `clamp(2.5rem, 7vw, 5.5rem)`, line-height 1.02, tracking -0.02em, with one teal keyword ("ölçekte").
- **Proof figures:** giant tabular Archivo numerals (`text-5xl`/`text-6xl`, 800, leading-none) sitting on a hairline-topped baseline row, each captioned by a mono micro-label. Featured-school score runs `text-4xl` in teal.

**The Tabular Rule.** Every numeral that represents data gets `font-variant-numeric: tabular-nums` (the `.tabular` utility).

**The Turkish-Comma Rule.** Every percentile prints with a comma decimal (`5,00`, `%1,23`) via the shared `fmt()` pattern (`toFixed(2).replace(".", ",")`). Never a dot.

### Layout & structure

A `max-w-6xl` centered column with `px-6` gutters on the Doc Ground. The page reads as one continuous document: a slim **masthead strip** (brand + mono tagline left, "{year} verileri" right) under a hairline, then headline → percentile scale panel → featured strip → bento → disclaimer footnote, each section separated by a full-width `border-t` hairline rather than background changes. The masthead's mono tagline is `hidden sm:inline` so the strip's two ends never interleave on narrow screens. Panels are `rounded-2xl`, Doc Panel fill, `Line` border, `shadow-sm`. The bento is asymmetric: one dominant 2×2 card (the tercih robotu) plus two supporting cards, each carrying a mono section code eyebrow ("01 — birincil araç", "02 — alan rehberi", "03 — proje okulları").

### Motion (landing-scoped)

Quiet and functional. Axis ticks transition `background-color`/`opacity` over 200ms. The user marker slides via `transition: left 300ms cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) and first appears with the `marker-in` 300ms opacity fade (no pop). Cards hover-lift `-translate-y-1` over 300ms with a teal top-rule + arrow reveal.

### Percentile Scale (landing signature)

`src/components/home/PercentileScale.tsx` — the owned visual idea: Mersin's high schools as a strip-plot on one axis, inside a Doc Panel card.

- **Two metrics, two distributions.** Mersin's schools are admitted two different ways and most hold only one number: **55** have an LGS percentile (merkezi yerleştirme), **126** have an OBP score (yerel yerleştirme), and only 26 have both. A single-metric scale would hide 100 schools, so the panel opens with a `role="tablist"` segmented control — *Yüzdelik dilimi* / *OBP puanı*, each carrying its own honest school count — and the whole axis, labels, input labels, scope note, and submit params switch with it. Switching metrics **resets the range to the new scale's ends**: %0,94 and 0,94 OBP are not the same number. A metric with no data is disabled, and the panel opens on whichever metric has data.
- **Distribution:** one 1px full-height tick **per school** (not per score record) across a min→max axis over a hairline baseline.
- **The axis always ascends left to right; the meaning of the ends does not.** Low percentile is more competitive, high OBP is more competitive. Rather than flipping the number line (which would lie about direction), the ` · en rekabetçi` suffix moves to whichever end the active metric makes competitive — left for yüzdelik, right for OBP. End-labels are 10px mono.
- **The One-Tick-Per-School Rule.** A school can hold several latest-year records (one per meslek alanı). The scale plots schools, so each school is reduced to a single value: **its most competitive latest-year value** — the *lowest* percentile, the *highest* OBP. The header states the honest school count (`N okul`), never the record count.
- **Range selection:** two Vermilion handles define a band. Ticks inside the band go teal at 0.75 over a `Teal Tint` band fill; outside ticks fade to Ink Faint at 0.14. A live "N okul bu aralıkta" readout updates (`aria-live="polite"`).
- **The handles:** 2px Vermilion lines with rotated-square caps, each a `role="slider"` (aria-valuemin/max/now/text, arrow/PageUp/Home/End keys) inside a 44px pointer-capture grab zone with `touch-none`. Labels sit *above* the axis so they never collide with the end-labels; they merge into one `%X,XX – %Y,YY` label when the handles come within 16% of each other, and clamp at the 8%/92% edges. Position transitions are suppressed while dragging.
- **Input contract:** two free-text decimal fields mirror the handles (comma or dot) and are labelled by the active metric (*Yüzdelik aralığı* / *OBP aralığı*); values must be 0–100 and start ≤ end — invalid submits show an inline mono error in Vermilion Deep and do not navigate.
- **The Scale-Is-The-Filter Rule.** The selected band is a *real filter*, and `/okullar` resolves it with the **same definition the scale draws** (most-competitive latest-year value per school), so a tick inside the band is exactly a school in the result. Submit routes to `/okullar?{metric}_min=X&{metric}_max=Y&siralama=…` — `yuzdelik_min/max` + `yuzdelik_asc`, or `obp_min/max` + `obp_desc` — and the full range returns exactly the scale's own count (verified: yüzdelik 55, OBP 126, both together 26). A full-range selection sends no filter params. The two ranges are independent params and intersect when both are present. A range survives sidebar filter changes, sorting, and pagination, and shows above the list as a labelled banner whose *temizle* link drops **only that range**, keeping the other filters.
- **The One-Door Rule.** The landing offers exactly **one** control that navigates to `/okullar`. İlçe and okul türü are `<select>`s inside the scale panel's own action row — not a second search bar — so range, district, and type submit together through the single "Okulları gör" button. Each select's first option is a real, selectable "Tüm …" value (never `disabled hidden`), so "all" is reachable again after a choice; wrappers carry `min-w-0` because a `<select>`'s min-content width follows its longest option.
- **Empty data:** falls back to a one-line "Ölçek verisi şu anda yüklenemedi." and a plain route to `/okullar` (graceful ISR/DB-failure degradation, `revalidate = 86400`).

**Proof figures live in the tool card.** The 184 / 13 / {year} tabular figures are not a free-floating band: they sit inside the dominant bento card, under a hairline, grouped with its CTA, so the corpus numbers read as evidence for the tool they describe and fill the 2×2 card rather than leaving it hollow. They drop out entirely when counts are null. The independence disclaimer is a section footnote under the bento — never inside a clickable card.

### Do's and Don'ts (landing)

- **Do** carry all meta text in the mono micro-label voice (10–11px, uppercase, 0.14–0.18em tracking, Ink Faint).
- **Do** keep panels flat: `Line` hairline + `shadow-sm`, hover states only.
- **Don't** use vermilion for anything but the user's position or an actionable error.
- **Don't** import Exam Blue, cyan, gradients, or aurora glows into `.landing`.
- **Don't** turn the percentile input into a filter, print a percentile with a dot decimal, or set data numerals without `.tabular`.

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

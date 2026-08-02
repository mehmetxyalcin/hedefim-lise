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
---

# Design System: Hedefim Lise

## Overview

**Creative North Star: "Güvenilir Rehberlik Masası" (The Trusted Guidance Desk)**

Hedefim Lise sits with an anxious 8th-grader (and their parent, and their counselor) at the moment a life choice is being made, and its whole job is to feel like a calm, credible desk to make that choice at. The system runs on a deliberate duality: a **deep-navy "chrome and headline" world** — the sticky navbar (`#0a0f1c`) and the hero (`#071426`) with soft cyan/amber aurora glows and a faint grid — frames the product like a confident night sky you're navigating by, while the **body is a bright, orderly workspace** of near-white canvas, cool slate neutrals, and a single decisive blue. The dark frame supplies gravity and trust; the light body supplies clarity and speed. Nothing shouts except the one place a decision happens.

The temperament is **reassuring and calm**: measured spacing, soft rounded surfaces, thin hairline borders, and shadows so light they read as breath rather than weight. Color is rationed — the blue is a signal, not a mood — and the semantic hues (emerald, rose, amber) appear only to mean something. This is an Operate system wearing a Persuade hero: the landing frame earns trust, then gets out of the way so filtering, comparing, and shortlisting stay effortless.

**Key Characteristics:**
- Dark, trustworthy chrome + hero over a bright, scannable data body.
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
- **Night Chrome** (#0a0f1c): The sticky navbar, ~90% opacity with backdrop blur; white text, slate-300 links.
- **Night Hero** (#071426): The hero base, layered with radial cyan/sky/orange/rose glows and a faint white grid.
- **Cyan Glow** (#22d3ee): Hero-only atmospheric accent (aurora blur, focus rings inside the hero search).

### Semantic
- **Success** (#059669 — emerald-600) on **Success Tint** (#ecfdf5): positive stats, confirmations.
- **Danger** (#e11d48 — rose-600) on **Danger Tint** (#fff1f2): destructive/clear actions, "Tümünü Temizle", errors.
- **Highlight** (#b45309 — amber-700) on **Highlight Tint** (#fffbeb): cautions and callouts.

### Named Rules
**The One-Signal Rule.** Exam Blue is the only color that invites action. It should cover well under ~10% of any body screen — its scarcity is what makes "act here" legible. Never use blue as a decorative fill.

**The Meaning-Only Rule.** Emerald, rose, and amber never appear for decoration — each is a claim (good / destructive / caution). If a color isn't carrying meaning, it's slate.

**The Two-Worlds Rule.** Cyan and the aurora glows live *only* in the dark chrome/hero. The light body is blue-and-slate; a cyan glow in a data card breaks the system.

## Typography

**Display / UI Font (intended):** Inter (loaded as `--font-geist-sans`)
**Body Font (as-shipped):** Arial / Helvetica system stack
**Mono Font:** Roboto Mono (`--font-geist-mono`), rare — code/numeric affordances only.

**Character:** A neutral, highly legible grotesque program. Personality comes from *weight contrast and tight tracking*, not from a characterful typeface — headings run heavy (extrabold) with negative letter-spacing, body stays quiet and readable. This restraint is on-brand: the data is the star.

> **Known drift:** Inter is loaded and declared as `--font-sans`, but `globals.css` hardcodes `body { font-family: Arial, Helvetica, sans-serif }`, so most text currently renders in the system stack, not Inter. Treat Inter as the intended UI face and unify on it (see Don'ts).

### Hierarchy
- **Display** (800, `clamp(2.25rem, 6vw, 4.5rem)`, line-height 1.15, tracking -0.02em): Hero headline only. Frequently pairs a gradient-clipped keyword (amber→orange→rose) inside white text — a hero-only device.
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

**Flat-by-default with whisper shadows.** Surfaces rest on hairline `Line` borders, not drop shadows; depth is primarily tonal (canvas cards floating on the slate-50 surface). Shadows are soft and mostly reserved for hover and for the hero search bar. The dominant token is `shadow-sm`; hover on school cards lifts to a soft, tinted `shadow-xl shadow-slate-200/50`. Primary buttons carry a faint colored shadow (`shadow-blue-600/20`) that deepens on hover.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)` — `shadow-sm`): default on cards, bars, inputs.
- **Card Hover Lift** (`shadow-xl` tinted `slate-200/50`): school cards on hover, paired with `hover:-translate-y-0.5` and a border shift to `slate-300`.
- **Action Glow** (`shadow-blue-600/20 → /40`): primary buttons, deepening on hover.
- **Hero Float** (`shadow-2xl shadow-sky-950/45`): the hero search panel lifting off the dark hero.

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

### Hero Search (signature)
A white, `rounded-2xl`, heavily-lifted panel (`shadow-2xl`) straddling the dark hero, holding inset slate-50 select fields that warm to `sky-50` on hover and gain a cyan focus ring — the one place the cyan world touches an interactive control. Its "Okul Ara" submit is the standard **Primary (Exam Blue)** button; the hero's decision action obeys the One-Signal Rule like every other surface — no amber/orange CTA exception.

## Do's and Don'ts

### Do:
- **Do** ration `Exam Blue` (#2563eb) to the single most important action per surface; keep it well under ~10% of a body screen.
- **Do** define surfaces with hairline `Line` (#e2e8f0) borders and keep them flat at rest; let shadow appear only on hover/focus.
- **Do** use the uppercase, bold, wide-tracked ≤11px label for category/meta text, and carry hierarchy with weight (700–800 heads).
- **Do** keep radii in the 12 / 16–24px family and never mix radii within one component.
- **Do** reserve emerald/rose/amber for genuine meaning (success / destructive / caution).
- **Do** confine cyan and aurora glows to the dark chrome and hero only.

### Don't:
- **Don't** let the Inter override stand — unify the body/UI font on Inter (remove or fix the `body { font-family: Arial… }` rule) so type is consistent with intent.
- **Don't** mix `gray-*` and `slate-*` neutrals; the system is `slate` — legacy `gray-*` classes (mobile sheets) are drift to migrate.
- **Don't** introduce a second accent hue into the body; blue is the only action color.
- **Don't** put gradient-clipped text or cyan glows on body/data surfaces — they are hero-only devices.
- **Don't** add ambient drop-shadows to resting cards; depth is tonal + hairline first.
- **Don't** set headings below 700 weight or uppercase running body copy.

---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/home/Hero.tsx","src/components/home/PercentileScale.tsx","src/components/home/FeaturedSchoolStrip.tsx","src/components/home/FeatureSection.tsx"]
---

# Surface Brief — Landing (`/`)

**Scope:** `src/app/page.tsx` + `src/components/home/{Hero,PercentileScale,FeaturedSchoolStrip,FeatureSection}.tsx`, styled by the `.landing` scope in `globals.css`. The landing world (Yön #3 — Yerleştirme Kılavuzu, seed 87596005) is **landing-scoped only**; Navbar/Footer and every other route stay in the incumbent Exam Blue system (see DESIGN.md → Landing Surface World).

**Mode:** Persuade.

**Audience / job / action:** An anxious Mersin 8th-grader (plus parent/counselor) mid-tercih. Job: see the real scale of Mersin's high schools and their own position in one move, and believe the data is current and local. Action: enter their LGS percentile and go to `/okullar` sorted by it.

**Direction:** A confident data *document* — statistics-bulletin grammar (masthead, hairline-sectioned column, mono micro-labels, poster-scale tabular figures) on a cool paper ground, teal authority + one vermilion "sen" signal. Rejects the edu-SaaS hero-search-plus-3-cards template and the old dark aurora hero.

**Memorable moment:** the full-width percentile axis — every school as a tick on one strip-plot, and the user's vermilion "sen" marker dropping onto it live as they type, with reachable ticks lighting teal.

**Constraints:**
- Percentile input is a sort signal, never a threshold filter.
- Vermilion = user's position / actionable error only; teal = only action color; no Exam Blue/cyan inside `.landing`.
- Turkish comma decimals; tabular numerals; low percentile = more competitive = left end.
- ISR (revalidate 86400) with graceful degradation: null counts hide the figure row, empty percentiles show a fallback line.

**Unresolved / backlog:**
- Marker label anchor *snaps* between alignments at the 8%/92% thresholds instead of sliding continuously — acceptable, revisit if it reads as a jump.
- ~~Document masthead doubles the Navbar brand~~ — resolved 2026-08: the masthead row was deleted outright; the year it carried lives in the scale header.
- Proof figures could push to `text-7xl`/`text-8xl` for truer poster scale.
- Resting state (no input) could hint the marker affordance (e.g. ghost marker or nudge) — currently only the placeholder suggests it.

---
target: landing
total_score: 23
max_score: 28
na_heuristics: 7,9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-02T07-52-35Z
slug: src-components-home
---
# Landing critique (Hero + FeatureSection)

Method: DEGRADED single-context (no sub-agent spawn per operating guidance; author has deep prior context on this surface this session).

Mode: Persuade.

## Design Health (Persuade; H7/H9/H10 n/a)
Total 23/28 (82%) — Good.
- H1 Status 3, H2 Real-world 4, H3 Control 3, H4 Consistency 3, H5 Error-prev 3, H6 Recognition 4, H8 Aesthetic/Minimal 3.

## Design specificity: category-interchangeable
Dark hero + aurora glows + gradient-clipped word + 3 icon-tile feature cards = generic AI/SaaS landing template. Product character ("Mersin's trusted guidance desk") under-expressed. Detector agrees: ai-color-palette (cyan), radial-spotlight-glow, dark-glow ×2, gradient-text ×3, icon-tile-stack ×3, nested-cards ×2.

## Priority issues
- [P1] CTA color inconsistency: hero primary CTA is amber→rose gradient while the entire product's primary action is Exam Blue. Trains "orange = go" on landing, "blue = go" everywhere else.
- [P2] Feature cards use multi-accent (cyan/orange/emerald) — conflicts with DESIGN.md One-Signal (blue) + Two-Worlds (cyan = hero-only). These are body cards borrowing hero hues.
- [P2] Busy hero: 4 aurora blobs + grid overlay + gradient text + glass badge + 2 trust chips compete; aesthetic/minimal suffers.
- [P2] Generic feature-card template (56px icon tile above h3) — the universal AI feature-card shape.
- [P3] line-length ~113ch on disclaimer; gradient text is a craft-floor refuse-default.

## Persona red flags
- Jordan (first-timer): "RAM Onaylı İçerik" — RAM abbreviation unexplained; anxious parent may not parse it.
- Casey (mobile): hero very tall (pt-12 pb-32) → lots of scroll before content; CTA full-width good.
- Riley: empty search → /okullar (all schools), no broken state. OK.

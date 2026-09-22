---
version: 1
slug: "src-app-admin-layout-tsx"
primary_target: "src/app/admin/layout.tsx"
related_targets: ["src/app/admin/page.tsx","src/components/admin"]
---

# Yönetim paneli (/admin)

Mode: Operate. Audience: one or two maintainers of the Mersin school dataset, mostly on desktop. Job: find a school, see what its record is missing, fix it; keep status, messages, FAQ and site chrome current. Constraints: server actions, auth, RLS, form-draft preservation, bulk-import preview/atomicity unchanged. Spec: docs/superpowers/specs/2026-09-23-admin-panel-redesign-design.md.

Memorable moment: the eight fixed health pips per school row, and "Düzelt →" landing on the exact form tab that fixes the gap.

Unresolved: none at approval time.

## Direction contract

THESIS: The admin is a data-health ledger, not a KPI dashboard. The school list is the heart; counters sit on top of it and filter it. Refuses the category template of vanity KPI cards plus a decorative chart above an unrelated table.

OWN-WORLD: Admin-scoped world under `.admin`: cool gray ground #f4f5fa, white cards and white grouped icon sidebar, ink #1e2235, one indigo #4f46e5 reserved for wayfinding (active nav, selected row, primary action, focus). Emerald/amber/rose only as meaning. Inter, fixed rem scale, tabular numerals. Health pips: filled square = ok, orange outline = missing, dash = not required.

STORY: The maintainer opens /admin, sees how many records are complete and which gap is largest, clicks a counter to filter, opens a school's künye panel, follows "Düzelt →" to the right tab, saves, and returns to a ledger that reflects it.

FIRST VIEWPORT: Left white sidebar (İçerik / Ziyaretçiler / Site groups, collapsible), top bar with "Okul ara ve düzenle" and avatar. Page header "Okullar" with the single indigo "Yeni okul". One-row summary strip of five linked counters, filter bar, then the sticky-header ledger with 8 pips per row; künye panel docked right at xl.

FORM: Veri Sağlık Defteri — position 1 on the grounded list (chosen by the user as IMPECCABLE'S PICK over the assigned preflight-checklist direction); seed 24c19b31. Raises kept: fixed-position unbroken pip row; state never color-only; one primary action per screen; indigo for wayfinding only; one state vocabulary; tabular right-aligned numbers.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

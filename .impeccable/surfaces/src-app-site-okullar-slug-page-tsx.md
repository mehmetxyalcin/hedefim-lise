---
version: 1
slug: "src-app-site-okullar-slug-page-tsx"
primary_target: "src/app/(site)/okullar/[slug]/page.tsx"
related_targets: ["src/components/school"]
---

# Surface Brief — School detail (`/okullar/[slug]`)

**Scope:** `src/app/(site)/okullar/[slug]/page.tsx` + `src/components/school/**`. Moves into the landing document world (`.landing`, Yön #3) like the contact page, the Meslek Atlası and the field pages (owner's choice, 2026-10-02). Header and footer stay Exam Blue.

**Mode:** Operate. Visitor: an 8th-grader, parent or counselor arriving from `/okullar` or a field page with a score in hand. Job: can I get in, how many seats, what does it teach, what is it like, how do I get there; then add it to Tercihlerim.

**Owner's pins:** the photo is small and opens large with zoom; "Tesisler ve imkânlar" is closed by default and opens on click; every other section stays open; scores and kontenjan lead the first screen.

## Direction contract

THESIS: The school page is a placement ledger: every year's taban score and kontenjan for this school on one ruled grid, trend read along the row. Refuses the photo-hero + icon-card stack the page used to be and the year-tab card that hid three of four years.

OWN-WORLD: Landing paper (Doc Ground, Doc Panel, Line hairlines), Archivo tabular figures, Source Serif reading text, Roboto Mono only for data labels and year heads. Teal = action and data fill; vermilion = errors only. No cards in cards; the ledger's rules carry the page.

STORY: The visitor sees the name and a small framed photo, then immediately the scores for 2023–2026 and seat counts. Margin notes explain yüzdelik dilim, LGS, OBP and kontenjan beside the figure. Below: the school's own description, its fields (open), facilities (closed), and a künye of logistics and contact. They add the school to Tercihlerim.

FIRST VIEWPORT: Back link; one identity strip: 120×90 framed photo button (zoom badge), Archivo h1, type · district · placement line, teal "Tercihlerime ekle" right (mobile: fixed bottom bar). Under it, 8 cols: the ledger panel, h2 "Hangi puanla öğrenci alıyor?", mono year heads, one group per yerleştirme (merkezi with a Yüzdelik/LGS switch, yerel OBP), then "Kaç öğrenci alıyor?" with exact-length seat bars in the same year columns. 4 cols: term notes aligned to each group.

FORM: Ledger-first ("Puan çizelgesi önde"), position 4 of 7 on the grounded list, seed a8eaba08. Raises kept: fixed year columns, values flip in place on metric change (split-flap); ledger owns first viewport (vertical feed); rules carry the page (Crouwel); seat bars at exact length, one scale (labanotation); sections open with the question they answer (wayfinding); term notes in the margin (centre-rail). Signature interaction: the metric switch's left-to-right flap cascade. Photo opens in a native dialog with click/wheel/pinch zoom and drag pan.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Schools with no score rows (özel eğitim, MEM, some arts/sports): the ledger states plainly that no score is recorded and points to the school's phone; no claims about their admission route.

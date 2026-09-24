---
version: 1
slug: "src-app-site-blog-page-tsx"
primary_target: "src/app/(site)/blog/page.tsx"
related_targets: ["src/app/(site)/blog/[slug]/page.tsx","src/components/blog"]
---

# Blog (/blog, /blog/[slug])

Mode: Read. Audience: 8th graders, parents (phones, evening), guidance counselors (desktop, daytime). Job: understand one part of the Mersin lise tercih process in plain Turkish, then move on to the school list. Content is admin-managed (Supabase `blog_posts`), categories free-text, optional cover image and optional "kapak vurgusu" (short key figure).

User brief (2026-09-24): NOT Exam Blue. "Profesyonel, göze hitap eden, karmaşık olmayan ama kaliteli hissettiren." Structure delegated to Claude. Admin-managed, 2 seeded drafts, "Blog" menu item visible.

Scope: its own world inside a `.blog` wrapper between the shared light header and dark footer. No Exam Blue, landing teal/vermilion, Archivo/Source Serif, or admin indigo inside it.

## Direction contract

THESIS: The blog is a well-set textbook chapter set: every post opens on a printed chapter plate carrying its key figure, and the archive reads like an İçindekiler page. Refuses the SaaS hero + three-equal-card grid and the cream-serif magazine.
OWN-WORLD: White paper, ink #14161a, lemon spot colour (citrus / highlighter) owning whole plates, ink-black and paper-grey plates as the two other tones. Schibsted Grotesk for heads and the monumental figure, Literata for reading. Highlighter `mark` on key terms and link hover. Hairline ink rules, square-ish 4px corners, tabular dates.
STORY: Visitor sees the newest guide as a big plate + headline, scans recent guides and the dotted contents list, opens one, reads a calm 68ch column with a sticky "Bu yazıda" margin, then shares it or goes to the school list.
FIRST VIEWPORT: Monumental "Blog" title left with one-line dek right; category tabs + search on one hairline row; lead split: large lemon plate with the post's figure (left 7 cols), title/excerpt/meta/read link (right 5). Primary action = open the lead post.
FORM: Direction #3/7 (ders kitabı bölüm sayfası); seed 7e5d5fdf. Raises: Ikeda → all figures tabular and column-aligned; cutting bench → current TOC section marked by a shape, not colour; Posada → one flood colour owns each plate; PC-98 → the article margin is a fixed region on every post; Miura → mobile TOC is a compact packet that deploys; alphabet storm → one face does the monumental work.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

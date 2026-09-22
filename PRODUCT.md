# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are 8th-grade students in Mersin (LGS candidates) who are choosing a high school, together with their **parents** and school **guidance counselors (rehber öğretmenler)**. The student is the decision-maker; parents research alongside them; counselors run the same flow repeatedly across many students. Usage peaks during the LGS results → preference (tercih) window each summer, when users arrive already holding a percentile/OBP score and needing to build a shortlist.

## Product Purpose

Help Mersin families navigate high school selection by presenting every local high school with the concrete data a preference decision needs — score thresholds (yüzdelik dilim / OBP), district, school type, vocational fields, and placement type — all filterable and comparable in one place. Success means a student or parent can confidently build a realistic preference list without hunting across scattered official sources.

## Positioning

The differentiator is **current, reliable, locally-curated data for Mersin high schools**, surfaced through practical filtering and comparison — not a generic national listing and not a raw official atlas. The value is accuracy + local focus + usability, not breadth of coverage.

## Operating Context

Used mostly in the LGS results-to-preference window. Typical flow: filter schools (name, district, school type, vocational field, placement type) → open a school detail page → compare → assemble a shortlist ("Tercihlerim"). Guidance counselors repeat this per student. A contact form lets users report corrections or missing/incorrect school data, which feeds back into the maintained dataset.

## Capabilities and Constraints

- **Public surfaces:** school directory with detailed filtering (name search, district, school type, vocational field, placement type, page size, and sorting by name / percentile / OBP); school detail pages; vocational field pages ("Alanlar"); a statistics dashboard ("İstatistikler"); a Q&A / FAQ page ("Soru-Cevap"); a personal shortlist ("Tercihlerim"); "Hakkında"; and "İletişim".
- **Admin surfaces:** Supabase-auth login; school CRUD with image upload, bulk upload, vocational-field relations, and per-year score records; vocational field management; contact-message inbox; FAQ management; and site settings (navigation, footer, partners title).
- **Data:** Supabase-backed. Schools carry per-year scores (OBP, LGS, percentile), district, type, placement type, vocational fields, features, and contact info.
- **Domain terminology to preserve exactly:** yüzdelik dilim, OBP (Ortaöğretim Başarı Puanı), LGS, yerel / merkezi yerleştirme, meslek alanı, ilçe.
- **Scope:** Mersin high schools only (established by product copy).
- **Technical constraints:** Next.js 16 (App Router) + Supabase; deployed as a Node app (`next start`) on Hostinger, auto-deployed from GitHub `main`. Google Analytics (gtag, `G-XQF1R11D55`) is wired in the root layout.

## Brand Commitments

- **Name:** "Hedefim Lise".
- **Voice:** Turkish, plain and reassuring — readable by a nervous 8th-grader as well as a parent or counselor.
- **No official institutional affiliation.** A volunteer project built by people who work at Akdeniz Rehberlik ve Araştırma Merkezi (RAM), but **not an official RAM project** (confirmed by the owner, 22 Sep 2026). Copy must not say the project is run, coordinated, or endorsed by RAM, MEB, a municipality, or a foundation, and must not use RAM's institutional phone, address, or mailbox as project contact. RAMs and Millî Eğitim Müdürlükleri may appear only as sources consulted. Project contact: info@hedefimlise.com. The footer's partner-links section has no confirmed official partner or endorsement; do not invent partners.

## Evidence on Hand

- A real, admin-maintained Mersin school dataset in Supabase (schools, per-year scores, vocational fields, FAQs, contact messages).
- No testimonials, external press, benchmarks, official endorsements, or confirmed partner logos exist yet — future work must not fabricate them.

## Product Principles

1. **Accuracy over breadth** — a smaller, correct, current Mersin dataset beats a large stale one.
2. **Decision-first** — every screen should move the student closer to a realistic, defensible preference list.
3. **Serve three literacies at once** — students, parents, and counselors read the same pages; keep language plain enough for an anxious 8th-grader.
4. **Don't overclaim** — no implied official backing; the honest value is current, reliable local data.
5. **Preserve domain terminology** exactly as Mersin families and counselors use it.

## Accessibility & Inclusion

Turkish-language and mobile-first — many families browse on phones during the tercih window. Turkish text and search must handle Turkish casing correctly (the İ/ı, I/i distinction). No formal accessibility standard has been established yet.

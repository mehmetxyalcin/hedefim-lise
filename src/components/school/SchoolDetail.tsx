import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { buildLedger, formatPhone, groupSchoolFields, turkishTitleCase } from "@/lib/school-detail";
import type { SchoolWithDetails } from "@/types/schoolDetail";
import { DT, FOCUS, INLINE_LINK, MICRO, SECTION_TITLE, TEXT_ACTION } from "./doc-styles";
import { FavoriteButton } from "./FavoriteButton";
import { SchoolPhoto } from "./SchoolPhoto";
import { ScoreLedger } from "./ScoreLedger";

// Okul sayfası, alan sayfaları gibi anasayfanın belge dünyasında (.landing)
// durur. Kimlik tek şerittir (küçük fotoğraf + ad); ilk ekranın sahibi puan
// cetvelidir. Altında 8 sütun ana metin (alanlar, tanıtım, kapalı gelen
// tesisler), 4 sütun künye. Künye yalnız veride olanı yazar.

type Props = { school: SchoolWithDetails };

const PLACEMENT: Record<string, { value: string; via: string }> = {
  merkezi: { value: "Merkezi", via: "LGS puanıyla" },
  yerel: { value: "Yerel", via: "OBP ile" },
  yerel_merkezi: { value: "Merkezi ve yerel", via: "LGS puanı ve OBP ile" },
};

const BOARDING: Record<string, string> = {
  yok: "Yok",
  kiz: "Kız öğrenciler için",
  erkek: "Erkek öğrenciler için",
  kiz_erkek: "Kız ve erkek öğrenciler için",
};

// Künye satırı: ilk satırın üst çizgisi mürekkep, diğerleri hairline.
const ROW = "border-t border-[var(--line)] py-4 first:border-[var(--ink)] first:pt-5";
const FACT = "mt-1.5 font-display text-base font-bold text-[var(--ink)]";
const PROSE = "mt-1.5 text-[15px] leading-relaxed text-[var(--ink-soft)]";

function websiteHref(website: string) {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function SchoolDetail({ school }: Props) {
  const ledger = buildLedger(school.scores, school.quotas);
  const fields = groupSchoolFields(
    school.vocationalFieldsWithBranches.map((f) => ({
      id: f.id,
      slug: f.slug,
      title: f.title,
      branches: f.selectedBranches.map((b) => b.name),
    })),
  );
  const sinavliCount = fields.filter((f) => f.sinavli || f.sinavliOnly).length;
  const baseCount = fields.filter((f) => !f.sinavliOnly).length;
  const description = paragraphs(school.description ?? "");
  const otherInfo = school.otherInfo?.trim() ?? "";
  const placement = PLACEMENT[school.placementType];
  const boarding = BOARDING[school.boardingType];
  const languages = school.languages.map(turkishTitleCase).filter(Boolean);
  const hours =
    school.schoolHoursStart && school.schoolHoursEnd
      ? `${school.schoolHoursStart.slice(0, 5)}–${school.schoolHoursEnd.slice(0, 5)}`
      : null;
  const transport = school.transportationInfo?.trim() ?? "";

  return (
    <div className="landing">
      <section className="container mx-auto max-w-6xl px-6 pt-5 pb-6 md:pt-8 md:pb-9">
        <Link href="/okullar" className={TEXT_ACTION}>
          <ArrowLeft className="h-4 w-4" />
          Okul listesi
        </Link>
        <div className="mt-4 flex items-start gap-4 sm:mt-5 sm:items-center sm:gap-6">
          {school.images.length > 0 && <SchoolPhoto images={school.images} name={school.name} />}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[clamp(1.5rem,3.6vw,2.875rem)] leading-[1.06] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)]">
              {school.name}
            </h1>
            <p className="mt-2 text-[15px] leading-snug text-[var(--ink-soft)] md:mt-3 md:text-[17px]">
              <Link href={`/okullar?tur=${encodeURIComponent(school.type)}`} className={INLINE_LINK}>
                {school.type}
              </Link>
              <span aria-hidden className="mx-2 text-[var(--ink-faint)]">
                ·
              </span>
              <Link href={`/okullar?ilce=${encodeURIComponent(school.district)}`} className={INLINE_LINK}>
                {school.district}
              </Link>
              {placement && (
                <>
                  <span aria-hidden className="mx-2 text-[var(--ink-faint)]">
                    ·
                  </span>
                  <span>{placement.value.toLocaleLowerCase("tr-TR")} yerleştirme</span>
                </>
              )}
            </p>
          </div>
          <div className="hidden shrink-0 lg:block">
            <FavoriteButton school={school} />
          </div>
        </div>
      </section>

      <div className="border-t border-[var(--line)]">
        <div className="container mx-auto max-w-6xl px-6 pt-6 pb-16 sm:pt-8 lg:pb-20">
          <ScoreLedger ledger={ledger} phone={school.phone} />

          <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-12">
            <div className="min-w-0 space-y-12 lg:col-span-8">
              {fields.length > 0 && (
                <section aria-labelledby="alanlar-baslik">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--ink)] pt-5">
                    <h2 id="alanlar-baslik" className={SECTION_TITLE}>
                      Hangi meslek alanları var?
                    </h2>
                    <span className={`tabular ${MICRO}`}>
                      {baseCount > 0 && `${baseCount} alan`}
                      {baseCount > 0 && sinavliCount > 0 && " · "}
                      {sinavliCount > 0 && `${sinavliCount} sınavlı program`}
                    </span>
                  </div>
                  <ul className="mt-3 grid sm:grid-cols-2 sm:gap-x-8">
                    {fields.map((field) => (
                      <li key={field.id} className="border-b border-[var(--line)] py-3.5">
                        <Link
                          href={`/alanlar/${field.slug}`}
                          className={`rounded-sm font-display text-base leading-snug font-bold text-[var(--ink)] transition-colors hover:text-[var(--teal)] ${FOCUS}`}
                        >
                          {field.title}
                        </Link>
                        {field.sinavliOnly && (
                          <span className={`mt-1 block ${MICRO} text-[var(--teal)]`}>Sınavlı program</span>
                        )}
                        {field.branches.length > 0 && (
                          <p className="mt-1 text-[15px] leading-snug text-[var(--ink-soft)]">
                            {field.branches.join(", ")}
                          </p>
                        )}
                        {field.sinavli && (
                          <Link
                            href={`/alanlar/${field.sinavli.slug}`}
                            className={`mt-2 inline-flex items-center gap-1 rounded-sm font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--teal)] uppercase transition-colors hover:text-[var(--teal-deep)] ${FOCUS}`}
                          >
                            Sınavlı programı da var
                            <ArrowUpRight className="h-3 w-3" strokeWidth={2.25} />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(description.length > 0 || otherInfo) && (
                <section aria-labelledby="tanitim-baslik">
                  <h2 id="tanitim-baslik" className={`border-t border-[var(--ink)] pt-5 ${SECTION_TITLE}`}>
                    Nasıl bir okul?
                  </h2>
                  <div className="mt-4 max-w-[65ch] space-y-4 text-[17px] leading-[1.7] text-[var(--ink-soft)]">
                    {description.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {otherInfo && (
                    <div className="mt-6 max-w-[65ch] border-t border-[var(--line)] pt-4">
                      <p className={DT}>Ek bilgi</p>
                      <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-[var(--ink-soft)]">
                        {otherInfo}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {school.scholarships.length > 0 && (
                <section aria-labelledby="burs-baslik">
                  <h2 id="burs-baslik" className={`border-t border-[var(--ink)] pt-5 ${SECTION_TITLE}`}>
                    Burs imkânı var mı?
                  </h2>
                  <ul className="mt-3">
                    {school.scholarships.map((s) => (
                      <li key={s.id} className="border-b border-[var(--line)] py-3.5">
                        <p className="font-display text-base font-bold text-[var(--ink)]">{s.title}</p>
                        {s.description && <p className={PROSE}>{s.description}</p>}
                        {s.amountInfo && (
                          <p className="mt-1.5 font-display text-[15px] font-bold text-[var(--teal)]">
                            {s.amountInfo}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {school.schoolProjects.length > 0 && (
                <section aria-labelledby="proje-baslik">
                  <h2 id="proje-baslik" className={`border-t border-[var(--ink)] pt-5 ${SECTION_TITLE}`}>
                    Hangi projeleri yürütüyor?
                  </h2>
                  <ul className="mt-3">
                    {school.schoolProjects.map((p) => (
                      <li key={p.id} className="flex gap-4 border-b border-[var(--line)] py-4">
                        {p.imageUrl && (
                          <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--doc-panel)]">
                            <Image src={p.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-display text-base font-bold text-[var(--ink)]">{p.title}</p>
                          {p.description && <p className={PROSE}>{p.description}</p>}
                          {p.linkUrl && (
                            <a
                              href={p.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`mt-2 ${TEXT_ACTION}`}
                            >
                              Projeyi incele
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {school.facilities.length > 0 && (
                <details className="disclosure group/fac border-t border-[var(--ink)]">
                  <summary
                    className={`group/sum flex cursor-pointer items-center gap-3 rounded-md pt-5 pb-4 ${FOCUS}`}
                  >
                    <h2
                      className={`${SECTION_TITLE} transition-colors group-hover/sum:text-[var(--teal)]`}
                    >
                      Tesisler ve imkânlar
                    </h2>
                    <span className={`tabular ${MICRO}`}>{school.facilities.length}</span>
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 font-display text-sm font-bold text-[var(--teal)]">
                      <span className="group-open/fac:hidden">Göster</span>
                      <span className="hidden group-open/fac:inline">Gizle</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open/fac:rotate-180" />
                    </span>
                  </summary>
                  <ul className="gap-x-8 pb-2 sm:columns-2 lg:columns-3">
                    {school.facilities.map((facility) => (
                      <li
                        key={facility.id}
                        className="flex break-inside-avoid items-baseline gap-2.5 border-b border-[color-mix(in_srgb,var(--line)_60%,transparent)] py-2 text-[15px] leading-snug text-[var(--ink)]"
                      >
                        <span aria-hidden className="h-1.5 w-1.5 shrink-0 -translate-y-px rounded-[1px] bg-[var(--teal)]" />
                        {facility.name}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            <aside aria-labelledby="kunye-baslik" className="lg:col-span-4">
              <h2 id="kunye-baslik" className="sr-only">
                Okul künyesi
              </h2>
              <dl>
                {placement && (
                  <div className={ROW}>
                    <dt className={DT}>Yerleştirme</dt>
                    <dd className={FACT}>
                      {placement.value}
                      <span className="ml-1.5 font-reading text-[15px] font-normal text-[var(--ink-soft)]">
                        {placement.via}
                      </span>
                    </dd>
                  </div>
                )}
                <div className={ROW}>
                  <dt className={DT}>Öğretim</dt>
                  <dd className={FACT}>
                    {school.educationType === "ikili" ? "İkili öğretim" : "Normal öğretim"}
                  </dd>
                </div>
                {boarding && (
                  <div className={ROW}>
                    <dt className={DT}>Pansiyon</dt>
                    <dd className={FACT}>{boarding}</dd>
                  </div>
                )}
                {hours && (
                  <div className={ROW}>
                    <dt className={DT}>Ders saatleri</dt>
                    <dd className={`${FACT} tabular`}>{hours}</dd>
                    {school.schoolHoursNote && <dd className={PROSE}>{school.schoolHoursNote}</dd>}
                  </div>
                )}
                {languages.length > 0 && (
                  <div className={ROW}>
                    <dt className={DT}>Yabancı diller</dt>
                    <dd className={FACT}>{languages.join(", ")}</dd>
                  </div>
                )}
                {transport && (
                  <div className={ROW}>
                    <dt className={DT}>Nasıl gidilir?</dt>
                    <dd className={`${PROSE} whitespace-pre-line`}>{transport}</dd>
                  </div>
                )}
                {school.address && (
                  <div className={ROW}>
                    <dt className={DT}>Adres</dt>
                    <dd className={PROSE}>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${school.name}, ${school.address}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={INLINE_LINK}
                      >
                        {school.address}
                      </a>
                      <span className="mt-1 block font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--ink-faint)] uppercase">
                        Haritada açılır
                      </span>
                    </dd>
                  </div>
                )}
                {school.phone && (
                  <div className={ROW}>
                    <dt className={DT}>Telefon</dt>
                    <dd className={`${FACT} tabular`}>
                      <a href={`tel:${school.phone.replace(/\s+/g, "")}`} className={INLINE_LINK}>
                        {formatPhone(school.phone)}
                      </a>
                    </dd>
                  </div>
                )}
                {school.website && (
                  <div className={ROW}>
                    <dt className={DT}>Web sitesi</dt>
                    <dd className={cn(FACT, "break-all")}>
                      <a
                        href={websiteHref(school.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={INLINE_LINK}
                      >
                        {school.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              <div className="border-t border-[var(--line)] pt-5">
                <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  Eksik ya da hatalı bir bilgi mi gördünüz?{" "}
                  <Link href="/iletisim" className={`font-semibold text-[var(--teal)] ${INLINE_LINK}`}>
                    Bize bildirin
                  </Link>
                  .
                </p>
                <p className="mt-4 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
                  Bağımsız bir rehberdir; puan ve kontenjanlar resmi MEB
                  kaynaklarından teyit edilmelidir.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Telefonda tercih düğmesi altta yapışık durur; sayfa bitince altbilgiyi örtmez. */}
      <div className="sticky bottom-0 z-30 border-t border-[var(--line)] bg-[var(--doc-panel)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <FavoriteButton school={school} className="w-full" />
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ScoreRow } from "@/lib/score-display";
import { baseTitle, isSinavli } from "@/lib/vocational-atlas";
import type { VocationalField } from "@/types/vocationalField";

// Alan sayfası, atlasın devamı olarak anasayfanın belge dünyasında (.landing)
// durur: başlık + dek, altında 8 sütun okul listesi ve 4 sütun künye.
// Künye yalnız veride olanı yazar; boş alan için örnek metin uydurulmaz.

export type DetailSchool = {
  id: number;
  slug: string;
  name: string;
  type: string;
  district: string;
  score: { single: ScoreRow | null; rows: ScoreRow[] | null };
};

type VocationalDetailProps = {
  field: VocationalField;
  schools: DetailSchool[];
  scoreYear: number | null;
  sibling: { slug: string; title: string } | null;
};

const MICRO =
  "font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ink-faint)]";
const DT =
  "font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ink-faint)]";
// Künye satırı: ilk satırın üst çizgisi mürekkep, diğerleri hairline.
const ROW = "border-t border-[var(--line)] first:border-[var(--ink)]";
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal-ring)]";
const TEXT_ACTION = `inline-flex items-center gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)] ${FOCUS}`;

function byDistrict(schools: DetailSchool[]) {
  const map = new Map<string, DetailSchool[]>();
  for (const school of schools) {
    const key = school.district?.trim() || "İlçe belirtilmemiş";
    const list = map.get(key);
    if (list) list.push(school);
    else map.set(key, [school]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "tr"))
    .map(
      ([district, list]) =>
        [district, list.sort((a, b) => a.name.localeCompare(b.name, "tr"))] as const,
    );
}

export function VocationalDetail({
  field,
  schools,
  scoreYear,
  sibling,
}: VocationalDetailProps) {
  const sinavli = isSinavli(field.title);
  const title = sinavli ? baseTitle(field.title) : field.title;
  const groups = byDistrict(schools);
  const description = field.description.trim();
  const skills = field.skills.trim();
  const career = field.career.trim();
  const branches = field.branches.map((b) => b.trim()).filter(Boolean);
  const yearLabel = scoreYear != null ? `${scoreYear} ` : "son yıl ";
  // Açıklama yoksa dek listeyi tanıtır; liste de boşsa hiç yazılmaz.
  const dek =
    description ||
    (schools.length === 0
      ? null
      : sinavli
        ? `Bu programı sunan Mersin okulları ve ${yearLabel}puanları.`
        : `Bu alanı okutan Mersin okulları ve ${yearLabel}puanları.`);

  return (
    <div className="landing">
      <section className="container mx-auto max-w-6xl px-6 pt-6 pb-8 md:pt-8">
        <Link href="/alanlar" className={TEXT_ACTION}>
          <ArrowLeft className="h-4 w-4" />
          Meslek atlası
        </Link>
        <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12">
          <h1 className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.04] font-extrabold tracking-[-0.02em] text-balance text-[var(--ink)] lg:col-span-7">
            {title}
            {sinavli && (
              <span className="mt-2 block text-[0.5em] leading-tight text-[var(--teal)]">
                sınavlı program
              </span>
            )}
          </h1>
          {dek && (
            <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-soft)] md:text-xl lg:col-span-5 lg:pb-2">
              {dek}
            </p>
          )}
        </div>
      </section>

      <div className="border-t border-[var(--line)]">
        <div className="container mx-auto grid max-w-6xl gap-10 px-6 pt-8 pb-16 lg:grid-cols-12 lg:gap-12 lg:pb-20">
          <section
            aria-labelledby="okullar-baslik"
            className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] shadow-sm lg:col-span-8"
          >
            <h2
              id="okullar-baslik"
              className="px-5 pt-5 pb-4 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:px-6 sm:pt-6 md:text-[1.75rem]"
            >
              {sinavli ? "Bu programı sunan okullar" : "Bu alanı okutan okullar"}
            </h2>

            {groups.length === 0 ? (
              <div className="border-t border-[var(--line)] px-5 py-10 sm:px-6">
                <p className="font-display text-lg font-bold text-[var(--ink)]">
                  Bu alana bağlı okul kaydı yok.
                </p>
                <p className="mt-1.5 text-[var(--ink-soft)]">
                  Okul bilgisi eksikse{" "}
                  <Link
                    href="/iletisim"
                    className={`rounded-sm font-semibold text-[var(--teal)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--teal)] ${FOCUS}`}
                  >
                    bize bildirin
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <>
                <div
                  aria-hidden
                  className={`flex justify-between border-t border-[var(--line)] px-5 pt-3 pb-1 sm:px-6 ${MICRO}`}
                >
                  <span>İlçe · okul</span>
                  <span>{scoreYear != null ? `${scoreYear} puanı` : "Puan"}</span>
                </div>
                {groups.map(([district, list]) => (
                  <section
                    key={district}
                    aria-label={district}
                    className="border-t border-[var(--line)] px-5 pb-2 sm:px-6"
                  >
                    <h3 className="flex items-baseline gap-2 pt-4 pb-1 font-display text-[15px] font-extrabold tracking-tight text-[var(--teal)]">
                      {district}
                      <span className="tabular font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--ink-faint)]">
                        {list.length} OKUL
                      </span>
                    </h3>
                    <ul className="divide-y divide-[color-mix(in_srgb,var(--line)_60%,transparent)]">
                      {list.map((school) => (
                        <li key={school.id}>
                          <Link
                            href={`/okullar/${school.slug}`}
                            className={`group -mx-2 grid gap-y-1.5 rounded-lg px-2 py-3 transition-colors hover:bg-[var(--doc-ground)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 ${FOCUS}`}
                          >
                            <span className="min-w-0">
                              <span className="block font-display text-[1.0625rem] leading-snug font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--teal)]">
                                {school.name}
                              </span>
                              <span className="mt-0.5 block text-sm leading-snug text-[var(--ink-soft)]">
                                {school.type}
                              </span>
                            </span>
                            <ScoreCell score={school.score} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
            <dl>
              {schools.length > 0 && (
                <div className={`${ROW} pt-5 pb-7`}>
                  <dt className={DT}>Mersin&apos;de</dt>
                  <dd className="mt-3">
                    <span className="tabular font-display text-5xl leading-none font-extrabold tracking-tight text-[var(--ink)]">
                      {schools.length}
                    </span>
                    <span className="ml-2 font-display text-lg font-bold text-[var(--ink)]">
                      okul
                    </span>
                    <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                      <span className="tabular">{groups.length}</span> ilçede.
                    </p>
                  </dd>
                </div>
              )}

              {(sinavli || sibling) && (
                <div className={`${ROW} py-5`}>
                  <dt className={DT}>Sınavlı program</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                    {sinavli
                      ? "Öğrencisini LGS puanıyla, merkezi yerleştirmeyle alır."
                      : "Bu alanın öğrencisini LGS puanıyla, merkezi yerleştirmeyle alan bir programı da var."}
                    {sibling && (
                      <span className="mt-3 block">
                        <Link href={`/alanlar/${sibling.slug}`} className={TEXT_ACTION}>
                          {sinavli ? "Sınavsız programı gör" : "Sınavlı programı gör"}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </span>
                    )}
                  </dd>
                </div>
              )}

              {branches.length > 0 && (
                <div className={`${ROW} py-5`}>
                  <dt className={DT}>Dallar</dt>
                  <dd className="mt-2">
                    <ul className="space-y-1.5">
                      {branches.map((branch) => (
                        <li
                          key={branch}
                          className="font-display text-base font-bold text-[var(--ink)]"
                        >
                          {branch}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}

              {skills && (
                <div className={`${ROW} py-5`}>
                  <dt className={DT}>Gerekli beceriler</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                    {skills}
                  </dd>
                </div>
              )}

              {career && (
                <div className={`${ROW} py-5`}>
                  <dt className={DT}>Kariyer yolları</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
                    {career}
                  </dd>
                </div>
              )}
            </dl>

            {schools.length > 0 && (
              <div className="border-t border-[var(--line)] pt-6">
                <Link
                  href={`/okullar?alan=${field.id}`}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)] ${FOCUS}`}
                >
                  Okul listesinde filtrele
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-2.5 text-center text-sm text-[var(--ink-soft)]">
                  İlçe, tür ve puana göre daraltın.
                </p>
              </div>
            )}

            <p className="mt-8 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
              Bağımsız bir rehberdir; alan ve okul bilgileri resmi MEB
              kaynaklarından teyit edilmelidir.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

// /okullar listesinin puan sütunuyla aynı karar (lib/score-display), belge dilinde.
// Telefonda puan adın altına iner ve sola yaslanır; adı dar sütuna sıkıştırmaz.
function ScoreCell({ score }: { score: DetailSchool["score"] }) {
  if (score.single) {
    return (
      <span className="flex items-baseline gap-2 sm:block sm:text-right">
        <span className="tabular block font-display text-lg leading-tight font-extrabold text-[var(--ink)]">
          {score.single.value}
        </span>
        <span className={`block sm:mt-0.5 ${MICRO}`}>{score.single.label}</span>
      </span>
    );
  }
  if (score.rows) {
    return (
      <span className="flex flex-wrap gap-x-6 gap-y-1 sm:block sm:space-y-1">
        {score.rows.map((row) => (
          <span key={row.label} className="flex items-baseline gap-2.5 sm:justify-end">
            <span className={`whitespace-nowrap ${MICRO}`}>{row.label}</span>
            <span className="tabular font-display text-sm font-bold text-[var(--ink)] sm:w-[4.25rem] sm:text-right">
              {row.value}
            </span>
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="text-sm text-[var(--ink-faint)] sm:text-right">
      <span aria-hidden="true" className="hidden sm:inline">
        —
      </span>
      <span className={`sm:sr-only ${MICRO}`}>Puan verisi yok</span>
    </span>
  );
}

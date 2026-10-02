"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  formatPhone,
  METRIC_FORMAT,
  type Ledger,
  type LedgerGroup,
  type LedgerMetric,
  type QuotaRow,
} from "@/lib/school-detail";
import { FOCUS, MICRO } from "./doc-styles";

// Puan cetveli: okulun son yıllardaki taban puanları ve kontenjanı tek bir
// ızgarada. Yıl sütunları bütün gruplarda aynı yerde durur; son yıl sütunu
// teal bir bantla boydan boya işaretlidir. Yüzdelik/LGS değişince sütunlar
// kaymaz, yalnız hücreler soldan sağa yerinde döner.

type Props = {
  ledger: Ledger;
  phone: string | null;
};

const PLACEMENT: Record<LedgerGroup["placement"], { title: string; via: string }> = {
  merkezi: { title: "Merkezi yerleştirme", via: "LGS ile" },
  yerel: { title: "Yerel yerleştirme", via: "OBP ile" },
};

const METRIC_LABEL: Record<LedgerMetric, string> = {
  yuzdelik: "Yüzdelik dilim",
  lgs: "LGS puanı",
  obp: "OBP",
};

const QUOTA_LABEL: Record<QuotaRow["key"], string> = {
  sinavli: "Sınavlı kontenjan",
  sinavsiz: "Sınavsız kontenjan",
};

// Hücre yazısı sütuna sığacak kadar küçülür (container query); tavanı satır
// türü belirler. Archivo rakamlarının ortalama genişliği ~0,6em.
function fit(max: string, chars: number): CSSProperties {
  return { fontSize: `min(${max}, calc(100cqi / ${(Math.max(chars, 4) * 0.6).toFixed(2)}))` };
}

export function ScoreLedger({ ledger, phone }: Props) {
  const { years, groups, quotas, quotaMax } = ledger;
  const merkezi = groups.find((g) => g.placement === "merkezi");
  const [metric, setMetric] = useState<LedgerMetric>(merkezi?.metrics[0] ?? "yuzdelik");
  // Hücreler yalnız kullanıcı ölçüyü değiştirdikten sonra döner; ilk açılışta
  // değerler animasyonsuz, olduğu gibi görünür.
  const [flipped, setFlipped] = useState(false);
  const hasData = years.length > 0;
  const lastSlice = quotas.length > 0 ? "quota" : groups.at(-1)?.placement;

  const chooseMetric = (next: LedgerMetric) => {
    if (next === metric) return;
    setMetric(next);
    setFlipped(true);
  };

  return (
    <section
      aria-labelledby="puan-baslik"
      style={{ "--n": Math.max(years.length, 1) } as CSSProperties}
    >
      <Slice
        position="first"
        note={
          hasData ? (
            <>
              <strong className="font-display font-bold text-[var(--ink)]">Taban puan,</strong>{" "}
              okula o yıl yerleşen son öğrencinin puanıdır. Yıllar soldan sağa
              ilerler; değişimi satır boyunca okuyun.
            </>
          ) : null
        }
      >
        <h2
          id="puan-baslik"
          className="font-display text-2xl leading-tight font-extrabold tracking-tight text-[var(--ink)] md:text-[1.75rem]"
        >
          Hangi puanla öğrenci alıyor?
        </h2>
      </Slice>

      {!hasData ? (
        <Slice position="last">
          <EmptyScores phone={phone} />
        </Slice>
      ) : (
        <>
          <Slice band>
            <div aria-hidden className="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] pt-4 pb-2">
              {years.map((year, i) => (
                <span
                  key={year}
                  className={cn(
                    "px-2.5 text-right font-mono text-[11px] font-medium tracking-[0.14em] tabular",
                    i === years.length - 1
                      ? "font-bold text-[var(--ink)]"
                      : "text-[var(--ink-faint)]",
                  )}
                >
                  {year}
                </span>
              ))}
            </div>
          </Slice>

          {groups.length === 0 && (
            <Slice band divided>
              <p className="py-4 text-[15px] text-[var(--ink-soft)]">
                Bu okul için kayıtlı taban puan yok.
              </p>
            </Slice>
          )}

          {groups.map((group) => {
            const active = group.placement === "merkezi" ? metric : group.metrics[0];
            return (
              <Slice
                key={group.placement}
                band
                divided
                position={lastSlice === group.placement ? "last" : undefined}
                note={<GroupNote group={group} metric={active} />}
              >
                <GroupBlock
                  group={group}
                  metric={active}
                  years={years}
                  flipped={flipped && group.placement === "merkezi"}
                  onMetric={group.placement === "merkezi" ? chooseMetric : undefined}
                />
              </Slice>
            );
          })}

          {quotas.length > 0 && (
            <Slice
              band
              divided
              position="last"
              note={<QuotaNote rows={quotas} />}
            >
              <QuotaBlock rows={quotas} years={years} max={quotaMax} />
            </Slice>
          )}
        </>
      )}
    </section>
  );
}

// Panel, her biri kendi kenar notunu taşıyan dilimlerden oluşur: masaüstünde
// not dilimin hizasında sağ sütunda, telefonda dilimin içinde altta durur.
function Slice({
  children,
  note,
  band = false,
  divided = false,
  position,
}: {
  children: ReactNode;
  note?: ReactNode;
  band?: boolean;
  divided?: boolean;
  position?: "first" | "last";
}) {
  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
      <div
        className={cn(
          "ledger-slice border-x border-[var(--line)] bg-[var(--doc-panel)] px-[var(--pad)] lg:col-span-8",
          band && "ledger-band",
          divided && "border-t",
          position === "first" && "rounded-t-2xl border-t pt-5 sm:pt-6",
          position === "last" && "rounded-b-2xl border-b pb-3 shadow-sm",
        )}
      >
        {children}
        {note && (
          // Telefonda not panelin içinde durur; son yıl bandı notun arkasından geçmez.
          <p className="relative -mx-[var(--pad)] bg-[var(--doc-panel)] px-[var(--pad)] pt-1 pb-4 text-sm leading-relaxed text-[var(--ink-soft)] lg:hidden">
            {note}
          </p>
        )}
      </div>
      {note && (
        <p
          className={cn(
            "hidden text-[15px] leading-relaxed text-[var(--ink-soft)] lg:col-span-4 lg:block",
            position === "first" ? "pt-6" : "border-t border-[var(--line)] pt-4",
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function GroupNote({ group, metric }: { group: LedgerGroup; metric: LedgerMetric }) {
  const hasFields = group.rows.some((row) => row.key.startsWith("alan:"));
  const hasPrograms = group.rows.some((row) => row.key.startsWith("program:"));
  const term = <strong className="font-display font-bold text-[var(--ink)]">{METRIC_LABEL[metric]}:</strong>;
  return (
    <>
      {metric === "yuzdelik" && (
        <>
          {term} okula LGS ile yerleşen son öğrencinin Türkiye genelindeki dilimi.
          Sayı küçüldükçe okula girmek zorlaşır.
        </>
      )}
      {metric === "lgs" && (
        <>
          {term} aynı öğrencinin 500 üzerinden aldığı puan. Puan büyüdükçe okula
          girmek zorlaşır.
        </>
      )}
      {metric === "obp" && (
        <>
          {term} ortaokul yıl sonu başarı puanlarından hesaplanır, 100
          üzerindendir. Puan büyüdükçe okula girmek zorlaşır.
        </>
      )}
      {hasFields && " Alan satırları o alanın sınavlı programıdır."}
      {hasPrograms && " Çok programlı okulda her programın taban puanı ayrıdır."}
    </>
  );
}

function GroupBlock({
  group,
  metric,
  years,
  flipped,
  onMetric,
}: {
  group: LedgerGroup;
  metric: LedgerMetric;
  years: number[];
  flipped: boolean;
  onMetric?: (metric: LedgerMetric) => void;
}) {
  const { title, via } = PLACEMENT[group.placement];
  const format = METRIC_FORMAT[metric];
  // Ölçü değişince satırlar yerinde kalır; o ölçüde kaydı olmayan hücre "—" olur.
  const rows = group.rows.map((row) => ({
    ...row,
    cells: row.values[metric] ?? years.map(() => null),
  }));
  // Tek "okul geneli" satırı büyük yazılır ve etiketi görünmez; birden çok
  // satırda her satırın adı değerlerin üstünde tam genişlikte durur.
  const single = rows.length === 1 && rows[0].key === "genel";
  const chars = Math.max(
    ...rows.flatMap((row) => row.cells.map((v) => (v == null ? 1 : format(v).length))),
  );
  const last = years.length - 1;

  return (
    <div className="pt-4">
      {/* Anahtar başlığın yanında durur; son yıl bandına taşmaz. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h3 className="font-display text-[15px] font-extrabold tracking-tight text-[var(--teal)]">
          {title}
          <span className={`ml-2 align-[1px] ${MICRO}`}>{via}</span>
        </h3>
        {onMetric && group.metrics.length > 1 && (
          <div
            role="group"
            aria-label="Gösterilen puan"
            className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] p-1"
          >
            {group.metrics.map((option) => {
              const selected = option === metric;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onMetric(option)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-display text-[13px] font-bold tracking-tight transition-colors",
                    FOCUS,
                    selected
                      ? "bg-[var(--teal)] text-white"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
                  )}
                >
                  {METRIC_LABEL[option]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        role="table"
        aria-label={`${title}, taban ${METRIC_LABEL[metric].toLocaleLowerCase("tr-TR")}`}
        className="mt-2"
      >
        <div role="rowgroup" className="sr-only">
          <div role="row">
            <span role="columnheader">Program</span>
            {years.map((year) => (
              <span key={year} role="columnheader">
                {year}
              </span>
            ))}
          </div>
        </div>
        <div role="rowgroup" className="divide-y divide-[color-mix(in_srgb,var(--line)_60%,transparent)]">
          {rows.map((row) => (
            <div
              key={row.key}
              role="row"
              className={cn(
                "grid grid-cols-[repeat(var(--n),minmax(0,1fr))] items-baseline",
                single ? "pt-1 pb-4" : "py-2.5",
              )}
            >
              <span
                role="rowheader"
                className={
                  single
                    ? "sr-only"
                    : "col-span-full pb-1 font-display text-[15px] leading-snug font-bold text-[var(--ink)]"
                }
              >
                {row.label}
              </span>
              {row.cells.map((value, i) => (
                <span
                  key={years[i]}
                  role="cell"
                  className="ledger-cell px-2.5 text-right"
                >
                  {value == null ? (
                    <span className="font-display text-[var(--ink-faint)]/60" aria-label="Kayıt yok">
                      —
                    </span>
                  ) : (
                    <span
                      key={`${metric}-${value}`}
                      className={cn(
                        "inline-block font-display leading-none tracking-tight tabular",
                        i === last
                          ? "font-extrabold text-[var(--ink)]"
                          : "font-bold text-[var(--ink-soft)]",
                        flipped && "ledger-flap",
                      )}
                      style={{
                        ...fit(
                          single ? (i === last ? "2.75rem" : "1.625rem") : i === last ? "1.25rem" : "1.0625rem",
                          chars,
                        ),
                        animationDelay: flipped ? `${i * 55}ms` : undefined,
                      }}
                    >
                      {format(value)}
                    </span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuotaNote({ rows }: { rows: QuotaRow[] }) {
  const term = (text: string) => (
    <strong className="font-display font-bold text-[var(--ink)]">{text}</strong>
  );
  const sinavli = rows.some((row) => row.key === "sinavli");
  const sinavsiz = rows.some((row) => row.key === "sinavsiz");
  return (
    <>
      {sinavli && sinavsiz ? (
        <>
          {term("Sınavlı kontenjan")} LGS ile merkezi yerleştirmeye,{" "}
          {term("sınavsız kontenjan")} OBP ile yerel yerleştirmeye ayrılan öğrenci sayısıdır.
        </>
      ) : sinavli ? (
        <>{term("Sınavlı kontenjan")} LGS ile merkezi yerleştirmeye ayrılan öğrenci sayısıdır.</>
      ) : (
        <>{term("Sınavsız kontenjan")} OBP ile yerel yerleştirmeye ayrılan öğrenci sayısıdır.</>
      )}
    </>
  );
}

function QuotaBlock({ rows, years, max }: { rows: QuotaRow[]; years: number[]; max: number }) {
  const last = years.length - 1;
  return (
    <div className="pt-4">
      <h3 className="font-display text-[15px] font-extrabold tracking-tight text-[var(--teal)]">
        Kaç öğrenci alıyor?
      </h3>
      <div role="table" aria-label="Kontenjan, öğrenci sayısı" className="mt-2">
        <div role="rowgroup" className="sr-only">
          <div role="row">
            <span role="columnheader">Kontenjan</span>
            {years.map((year) => (
              <span key={year} role="columnheader">
                {year}
              </span>
            ))}
          </div>
        </div>
        <div role="rowgroup" className="divide-y divide-[color-mix(in_srgb,var(--line)_60%,transparent)]">
          {rows.map((row) => (
            <div
              key={row.key}
              role="row"
              className="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] items-end py-2.5"
            >
              <span
                role="rowheader"
                className="col-span-full pb-1.5 font-display text-[15px] leading-snug font-bold text-[var(--ink)]"
              >
                {QUOTA_LABEL[row.key]}
              </span>
              {row.values.map((value, i) => (
                <span key={years[i]} role="cell" className="px-2.5 text-right">
                  {value == null ? (
                    <span className="font-display text-[var(--ink-faint)]/60" aria-label="Kayıt yok">
                      —
                    </span>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "font-display text-[1.0625rem] leading-none tracking-tight tabular",
                          i === last
                            ? "font-extrabold text-[var(--ink)]"
                            : "font-bold text-[var(--ink-soft)]",
                        )}
                      >
                        {value}
                      </span>
                      {/* Uzunluk tam öğrenci sayısıdır: bütün hücreler aynı ölçek. */}
                      <span aria-hidden className="mt-2 block h-1 rounded-full bg-[color-mix(in_srgb,var(--line)_55%,transparent)]">
                        <span
                          className="ml-auto block h-full rounded-full bg-[var(--teal)]"
                          style={{ width: max > 0 ? `${(value / max) * 100}%` : 0 }}
                        />
                      </span>
                    </>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyScores({ phone }: { phone: string | null }) {
  return (
    <div className="pt-3 pb-4">
      <p className="font-display text-lg font-bold text-[var(--ink)]">
        Bu okul için kayıtlı puan ve kontenjan yok.
      </p>
      <p className="mt-1.5 max-w-[60ch] text-[var(--ink-soft)]">
        Başvuru ve kayıt koşullarını okulun kendisinden öğrenebilirsiniz
        {phone ? (
          <>
            :{" "}
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className={`rounded-sm font-semibold whitespace-nowrap text-[var(--teal)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--teal)] ${FOCUS}`}
            >
              {formatPhone(phone)}
            </a>
          </>
        ) : (
          "."
        )}
      </p>
    </div>
  );
}

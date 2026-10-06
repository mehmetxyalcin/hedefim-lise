"use client";

import { useId, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { foldTurkish } from "@/lib/vocational-atlas";
import { formatLgs, formatPercentile } from "@/lib/school-detail";
import {
  axisMax,
  axisTicks,
  districtQuotas,
  parsePercentile,
  statisticYears,
} from "@/lib/school-statistics";
import type { SchoolStatistic, SchoolType } from "@/data/mersinSchoolStatistics2026";
import { DT, FOCUS, MICRO } from "@/components/school/doc-styles";

// İstatistik bülteni, anasayfanın belge dünyasında (.landing) durur. Panelin
// kalbi bir dilim ekseni: her okul bir satır, satırda önceki yılın tabanı içi
// boş halka, son yılınki dolu teal nokta. Sol uç en seçici okullardır. Satıra
// basınca okulun yıl yıl cetveli açılır. Kenardaki künyeye kendi dilimini
// yazan öğrenci eksende vermilyon bir çizgiyle görünür.

type Props = {
  schools: SchoolStatistic[];
  source: string;
  live: boolean;
};

type TypeFilter = SchoolType | "Tümü";

const TYPE_OPTIONS: { id: TypeFilter; label: string; short?: string }[] = [
  { id: "Tümü", label: "Tümü" },
  { id: "Anadolu Lisesi", label: "Anadolu" },
  { id: "Fen Lisesi", label: "Fen" },
  { id: "Sosyal Bilimler Lisesi", label: "Sosyal Bilimler", short: "Sosyal" },
  { id: "Anadolu İmam Hatip Lisesi", label: "İmam Hatip" },
];

const CONTROL =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] py-2.5 text-base text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-faint)] focus:border-[var(--teal)] focus:bg-[var(--doc-panel)] focus:ring-4 focus:ring-[var(--teal-ring)]";

// Satır ızgarası: sıra · okul · değer; eksen ikinci satırda, okul sütunundan
// panelin sağ kenarına uzanır ki dilimler arasındaki fark okunabilsin.
const ROW_GRID =
  "grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-3 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:gap-x-4";

const numberFormat = new Intl.NumberFormat("tr-TR");
const signed = (n: number) => (n > 0 ? `+${numberFormat.format(n)}` : numberFormat.format(n));

export function StatisticsBulletin({ schools, source, live }: Props) {
  const years = useMemo(() => statisticYears(schools), [schools]);
  const { latest, previous, first } = years;

  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("Tümü");
  const [district, setDistrict] = useState("Tümü");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [mineRaw, setMineRaw] = useState("");

  const mine = parsePercentile(mineRaw);
  const mineInvalid = mineRaw.trim() !== "" && mine == null;

  const districts = useMemo(
    () => [...new Set(schools.map((s) => s.district))].sort((a, b) => a.localeCompare(b, "tr")),
    [schools],
  );

  const folded = foldTurkish(query);
  const visible = useMemo(
    () =>
      schools
        .filter((s) => type === "Tümü" || s.type === type)
        .filter((s) => district === "Tümü" || s.district === district)
        .filter(
          (s) => !folded || foldTurkish(`${s.school} ${s.district} ${s.type}`).includes(folded),
        )
        .sort(
          (a, b) =>
            (a.percentiles[latest] ?? Number.POSITIVE_INFINITY) -
              (b.percentiles[latest] ?? Number.POSITIVE_INFINITY) ||
            a.school.localeCompare(b.school, "tr"),
        ),
    [schools, type, district, folded, latest],
  );

  // Eksen listede kalan okullara göre ölçeklenir: "Fen" seçilince sol uçtaki
  // okullar birbirinden ayrışır.
  const max = useMemo(
    () => axisMax(visible.length ? visible : schools, [latest, previous]),
    [visible, schools, latest, previous],
  );
  const ticks = useMemo(() => axisTicks(max), [max]);

  const filtered = type !== "Tümü" || district !== "Tümü" || folded !== "";
  const reset = () => {
    setQuery("");
    setType("Tümü");
    setDistrict("Tümü");
  };

  const reachable =
    mine == null
      ? null
      : visible.filter((s) => (s.percentiles[latest] ?? -1) >= mine).length;

  const quotaNow = visible.reduce((sum, s) => sum + (s.quotas[years.quota] ?? 0), 0);
  const quotaBefore = visible.reduce((sum, s) => sum + (s.quotas[years.quota - 1] ?? 0), 0);
  const byDistrict = useMemo(() => districtQuotas(visible, years.quota), [visible, years.quota]);
  const districtMax = Math.max(1, ...byDistrict.map((d) => d.quota));

  const mineProps = {
    raw: mineRaw,
    onChange: setMineRaw,
    invalid: mineInvalid,
    mine,
    reachable,
    total: visible.length,
    latest,
  };

  const pos = (value: number) => `${Math.min(100, (value / max) * 100)}%`;

  return (
    <div className="container mx-auto grid max-w-6xl gap-10 px-6 pt-8 pb-16 lg:grid-cols-12 lg:gap-12 lg:pb-20">
      {/* Telefonda dilim kutusu listenin üstünde; masaüstünde künyenin başında. */}
      <div className="lg:hidden">
        <MineField {...mineProps} />
      </div>

      <section
        aria-labelledby="eksen-baslik"
        className="min-w-0 self-start rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] shadow-sm lg:col-span-8"
      >
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="okul-ara" className="sr-only">
                Okul ya da ilçe ara
              </label>
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
              />
              <input
                id="okul-ara"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder="Okul ya da ilçe ara"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                className={cn(CONTROL, "pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden")}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Aramayı temizle"
                  className={`absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ink-faint)] transition-colors hover:bg-[var(--doc-ground)] hover:text-[var(--ink)] ${FOCUS}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative sm:w-48">
              <label htmlFor="ilce" className="sr-only">
                İlçe
              </label>
              <select
                id="ilce"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className={cn(CONTROL, "cursor-pointer appearance-none pr-10 pl-3.5 font-display text-[15px] font-bold tracking-tight")}
              >
                <option value="Tümü">Bütün ilçeler</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]"
              />
            </div>
          </div>

          <div
            role="group"
            aria-label="Okul türü"
            className="hide-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          >
            <div className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] p-1">
              {TYPE_OPTIONS.map((option) => {
                const selected = option.id === type;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setType(option.id)}
                    className={cn(
                      "rounded-lg px-3.5 py-2 font-display text-sm font-bold tracking-tight whitespace-nowrap transition-colors",
                      FOCUS,
                      selected
                        ? "bg-[var(--teal)] text-white"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
                    )}
                  >
                    {option.short ? (
                      <>
                        <span className="sm:hidden">{option.short}</span>
                        <span className="hidden sm:inline">{option.label}</span>
                      </>
                    ) : (
                      option.label
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <h2 id="eksen-baslik" className="sr-only">
          Okulların {latest} taban yüzdelik dilimleri
        </h2>

        <div className="border-t border-[var(--line)] px-4 pt-3 sm:px-5">
          <div className={cn(ROW_GRID, "items-end pb-2")}>
            <p aria-live="polite" className={cn(MICRO, "col-span-2")}>
              <span className="tabular">{visible.length}</span> okul
              {filtered ? " bulundu" : ""}
              <span className="hidden sm:inline"> · {latest} dilimine göre</span>
            </p>
            {/* Eksen cetveli: telefonda satırların altındaki eksenle aynı genişlik. */}
            <div
              aria-hidden
              className="relative col-span-full col-start-2 row-start-2 mt-3 h-4"
            >
              {ticks.map((t) => (
                <span
                  key={t}
                  className={cn(
                    "absolute top-0 font-mono text-[10px] font-medium tabular text-[var(--ink-faint)]",
                    t === 0 ? "" : t === max ? "-translate-x-full" : "-translate-x-1/2",
                  )}
                  style={{ left: pos(t) }}
                >
                  %{t}
                </span>
              ))}
            </div>
            <p className={cn(MICRO, "text-right")}>Taban</p>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="border-t border-[var(--line)] px-4 py-10 sm:px-5">
            <p className="font-display text-lg font-bold text-[var(--ink)]">
              Bu filtrelerle okul yok.
            </p>
            <button
              type="button"
              onClick={reset}
              className={`mt-2 inline-flex items-center gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)] ${FOCUS}`}
            >
              Filtreleri temizle
            </button>
          </div>
        ) : (
          <ol className="divide-y divide-[color-mix(in_srgb,var(--line)_70%,transparent)] border-t border-[var(--line)] px-2 pb-2 sm:px-3">
            {visible.map((school, i) => (
              <SchoolRow
                key={school.slug}
                rank={i + 1}
                school={school}
                years={years}
                ticks={ticks}
                pos={pos}
                mine={mine}
                open={openSlug === school.slug}
                onToggle={() =>
                  setOpenSlug((current) => (current === school.slug ? null : school.slug))
                }
              />
            ))}
          </ol>
        )}
      </section>

      <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
        <div className="hidden lg:block">
          <MineField {...mineProps} />
        </div>

        <dl className="mt-6">
          <div className="border-t border-[var(--line)] py-5">
            <dt className={DT}>Nasıl okunur</dt>
            <dd className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-[var(--ink-soft)]">
              <p className="flex items-center gap-3">
                <span aria-hidden className="relative h-3 w-8 shrink-0">
                  <span className="absolute top-1/2 right-1 left-1 h-[2px] -translate-y-1/2 bg-[color-mix(in_srgb,var(--ink-faint)_45%,transparent)]" />
                  <span className="absolute top-1/2 right-0 h-[9px] w-[9px] -translate-y-1/2 rounded-full border-[1.5px] border-[var(--ink-faint)] bg-[var(--doc-ground)]" />
                  <span className="absolute top-1/2 left-0 h-[11px] w-[11px] -translate-y-1/2 rounded-full bg-[var(--teal)]" />
                </span>
                <span>
                  Halka {previous}, nokta {latest} tabanı. Nokta sola kaydıysa okula
                  girmek zorlaşmış.
                </span>
              </p>
              <p>
                <strong className="font-display font-bold text-[var(--ink)]">Yüzdelik dilim</strong>{" "}
                okula yerleşen son öğrencinin Türkiye genelindeki yeridir; sayı
                küçüldükçe okul daha seçicidir.
              </p>
            </dd>
          </div>
          <div className="border-t border-[var(--line)] py-5">
            <dt className={DT}>{years.quota} sınavlı kontenjan</dt>
            <dd className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-[2rem] leading-none font-extrabold tracking-tight tabular text-[var(--ink)]">
                {numberFormat.format(quotaNow)}
              </span>
              <span className="text-[15px] text-[var(--ink-soft)]">
                öğrenci,{" "}
                <span className="tabular">{visible.length}</span> okulda
              </span>
            </dd>
            {quotaBefore > 0 && (
              <dd className="mt-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-[var(--ink-faint)]">
                {quotaNow === quotaBefore
                  ? `${years.quota - 1} yılıyla aynı`
                  : `${years.quota - 1} yılına göre ${signed(quotaNow - quotaBefore)}`}
              </dd>
            )}
            {byDistrict.length > 1 && (
              <dd className="mt-4">
                <ul className="space-y-2" aria-label="İlçelere göre kontenjan">
                  {byDistrict.map((d) => (
                    <li
                      key={d.district}
                      className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.75rem] items-center gap-3"
                    >
                      <span className="truncate font-display text-sm font-bold text-[var(--ink)]">
                        {d.district}
                      </span>
                      <span aria-hidden className="h-1.5 rounded-full bg-[color-mix(in_srgb,var(--line)_55%,transparent)]">
                        <span
                          className="block h-full rounded-full bg-[var(--teal)]"
                          style={{ width: `${(d.quota / districtMax) * 100}%` }}
                        />
                      </span>
                      <span className="text-right font-display text-sm font-bold tabular text-[var(--ink-soft)]">
                        {numberFormat.format(d.quota)}
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            )}
          </div>
        </dl>

        <p className="border-t border-[var(--line)] pt-5 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
          {first}–2022 dilimleri: {source}. 2023 ve sonrası Hedefim Lise okul
          verisinden{live ? "" : " (son eşitlenen kopya)"}. Bağımsız bir rehberdir;
          rakamları resmi kaynaklardan teyit edin.
        </p>
      </aside>
    </div>
  );
}

function SchoolRow({
  rank,
  school,
  years,
  ticks,
  pos,
  mine,
  open,
  onToggle,
}: {
  rank: number;
  school: SchoolStatistic;
  years: ReturnType<typeof statisticYears>;
  ticks: number[];
  pos: (value: number) => string;
  mine: number | null;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const { latest, previous } = years;
  const now = school.percentiles[latest];
  const before = school.percentiles[previous];
  const lgs = school.lgsScores[latest];
  const out = mine != null && now != null && now < mine;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "group w-full rounded-lg px-2 py-3 text-left transition-colors hover:bg-[var(--doc-ground)]",
          FOCUS,
          ROW_GRID,
          open && "bg-[var(--doc-ground)]",
        )}
      >
        <span className="self-start pt-[3px] font-mono text-[11px] font-medium tabular text-[var(--ink-faint)]">
          {rank}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block font-display text-[15px] leading-snug font-bold transition-colors duration-300 group-hover:text-[var(--teal)]",
              out ? "text-[var(--ink-faint)]" : "text-[var(--ink)]",
            )}
          >
            {school.school}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--ink-faint)]">
            {school.type.replace(" Lisesi", "")} · {school.district}
            <ChevronDown
              aria-hidden
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </span>
        </span>

        <span
          aria-hidden
          className="relative col-span-full col-start-2 row-start-2 mt-2.5 block h-5"
        >
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute inset-y-0 w-px bg-[color-mix(in_srgb,var(--line)_70%,transparent)]"
              style={{ left: pos(t) }}
            />
          ))}
          {now != null && before != null && (
            <span
              className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-[color-mix(in_srgb,var(--ink-faint)_45%,transparent)]"
              style={{
                left: pos(Math.min(now, before)),
                width: `calc(${pos(Math.max(now, before))} - ${pos(Math.min(now, before))})`,
              }}
            />
          )}
          {before != null && (
            <span
              className="absolute top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--ink-faint)] bg-[var(--doc-panel)]"
              style={{ left: pos(before) }}
            />
          )}
          {now != null && (
            <span
              className={cn(
                "absolute top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--doc-panel)] transition-colors duration-300",
                out ? "bg-[color-mix(in_srgb,var(--ink-faint)_40%,transparent)]" : "bg-[var(--teal)]",
              )}
              style={{ left: pos(now) }}
            />
          )}
          {mine != null && (
            <span
              className="absolute -inset-y-1.5 w-[2px] -translate-x-1/2 bg-[var(--vermilion)]"
              style={{ left: pos(mine) } as CSSProperties}
            />
          )}
        </span>

        <span className="self-start text-right">
          <span
            className={cn(
              "block font-display text-[1.125rem] leading-none font-extrabold tracking-tight tabular transition-colors duration-300",
              out ? "text-[var(--ink-faint)]" : "text-[var(--ink)]",
            )}
          >
            {now == null ? "—" : formatPercentile(now)}
          </span>
          {lgs != null && (
            <span className="mt-1.5 block font-mono text-[11px] font-medium tabular text-[var(--ink-faint)]">
              {formatLgs(lgs)}
            </span>
          )}
        </span>
      </button>

      <div id={panelId} hidden={!open}>
        {open && <YearLedger school={school} years={years} />}
      </div>
    </li>
  );
}

function YearLedger({
  school,
  years,
}: {
  school: SchoolStatistic;
  years: ReturnType<typeof statisticYears>;
}) {
  // En yeni yıl üstte: tercih yapan önce son tabanı arar.
  const all = Object.keys({ ...school.percentiles, ...school.lgsScores, ...school.quotas })
    .map(Number)
    .filter((y) => y <= Math.max(years.latest, years.quota))
    .sort((a, b) => b - a);
  const cell = (value: number | undefined, format: (v: number) => string, strong: boolean) => (
    <td
      className={cn(
        "py-2 pl-3 text-right font-display text-[14px] whitespace-nowrap tabular",
        value == null
          ? "text-[var(--ink-faint)]/60"
          : strong
            ? "font-extrabold text-[var(--ink)]"
            : "font-semibold text-[var(--ink-soft)]",
      )}
    >
      {value == null ? "—" : format(value)}
    </td>
  );

  return (
    <div className="mx-2 mb-3 rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-4 pt-3 pb-3 sm:ml-[2.5rem]">
      <table className="w-full border-collapse">
        <caption className="sr-only">{school.school}, yıllara göre</caption>
        <thead>
          <tr className="font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--ink-faint)] uppercase">
            <th scope="col" className="pb-1.5 text-left font-medium">Yıl</th>
            <th scope="col" className="pb-1.5 pl-3 text-right font-medium">Dilim</th>
            <th scope="col" className="pb-1.5 pl-3 text-right font-medium">LGS puanı</th>
            <th scope="col" className="pb-1.5 pl-3 text-right font-medium">
              <span className="sm:hidden">Kont.</span>
              <span className="hidden sm:inline">Kontenjan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {all.map((y, i) => (
            <tr key={y} className="border-t border-[var(--line)]">
              <th
                scope="row"
                className={cn(
                  "py-2 text-left font-mono text-[11px] font-medium tracking-[0.1em] tabular",
                  i === 0 ? "font-bold text-[var(--ink)]" : "text-[var(--ink-faint)]",
                )}
              >
                {y}
              </th>
              {cell(school.percentiles[y], formatPercentile, i === 0)}
              {cell(school.lgsScores[y], formatLgs, i === 0)}
              {cell(school.quotas[y], (v) => numberFormat.format(v), i === 0)}
            </tr>
          ))}
        </tbody>
      </table>
      <Link
        href={`/okullar/${school.slug}`}
        className={`mt-2 inline-flex items-center gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)] ${FOCUS}`}
      >
        Okulun sayfası <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </div>
  );
}

function MineField({
  raw,
  onChange,
  invalid,
  mine,
  reachable,
  total,
  latest,
}: {
  raw: string;
  onChange: (value: string) => void;
  invalid: boolean;
  mine: number | null;
  reachable: number | null;
  total: number;
  latest: number;
}) {
  const id = useId();
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--doc-panel)] p-5 shadow-sm">
      <label htmlFor={`${id}-dilim`} className="font-display text-lg font-extrabold tracking-tight text-[var(--ink)]">
        Senin dilimin
      </label>
      <p className="mt-1 text-[15px] leading-relaxed text-[var(--ink-soft)]">
        Yaz, eksende yerini gör.
      </p>
      <div className="relative mt-3">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-display text-base font-bold text-[var(--ink-faint)]"
        >
          %
        </span>
        <input
          id={`${id}-dilim`}
          inputMode="decimal"
          autoComplete="off"
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          placeholder="örneğin 4,5"
          aria-invalid={invalid}
          aria-describedby={`${id}-sonuc`}
          className={cn(
            CONTROL,
            "pr-10 pl-8 font-display font-bold tabular",
            invalid && "border-[var(--vermilion-deep)]",
          )}
        />
        {raw && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Dilimi temizle"
            className={`absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--ink-faint)] transition-colors hover:bg-[var(--doc-ground)] hover:text-[var(--ink)] ${FOCUS}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div id={`${id}-sonuc`} aria-live="polite" className="mt-3">
        {invalid ? (
          <p className="font-mono text-[11px] font-semibold text-[var(--vermilion-deep)]">
            0 ile 100 arasında bir dilim yazın; örneğin 4,5.
          </p>
        ) : mine != null && reachable != null ? (
          <>
            <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
              <span className="mr-1.5 inline-block h-3 w-[2px] translate-y-[1px] bg-[var(--vermilion)]" aria-hidden />
              {reachable === 0 ? (
                <>
                  Listedeki okulların hiçbirinin {latest} tabanı bu dilimi
                  kapsamıyor.
                </>
              ) : (
                <>
                  Listedeki {total} okuldan{" "}
                  <strong className="font-display font-bold text-[var(--ink)]">
                    {reachable === total ? "hepsinin" : `${reachable} tanesinin`}
                  </strong>{" "}
                  {latest} tabanı bu dilimi kapsıyor.
                </>
              )}
            </p>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
              Geçen yılların tabanı bu yılın garantisi değildir.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

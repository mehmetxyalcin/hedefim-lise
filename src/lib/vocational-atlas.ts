// Meslek atlası dizini: ham alan kayıtlarından okunabilir bir dizin kurar.
//
// "(SINAVLI)" kayıtları ayrı bir alan değil, aynı alanın öğrencisini LGS
// puanıyla alan programıdır; dizinde ana alanın altına bağlanır. Ana alanı
// olmayan sınavlı kayıt kendi satırında kalır. Okul sayısı yalnız görünür ve
// aktif okulları sayar (alan detay sayfasındaki listeyle aynı kural).
// Bağlı okulu olmayan kayıtlar dizinden çıkar, ayrı bir dipnot listesine
// düşer: öğrenci için eyleme dönüşmezler ama kaybolmamaları gerekir.

type SchoolLink = {
  school_id: number;
  schools?: { is_active?: boolean | null } | null;
};

export type AtlasRowInput = {
  id: number;
  slug: string;
  title: string;
  branches?: unknown;
  school_vocational_fields?: SchoolLink[] | null;
};

export type AtlasProgram = {
  id: number;
  slug: string;
  title: string;
  schoolCount: number;
};

export type AtlasEntry = AtlasProgram & {
  branches: string[];
  // Dizin harfi: başlığın Türkçe büyük harfle ilk harfi ("İnşaat" → "İ").
  letter: string;
  sinavli: AtlasProgram | null;
  // Arama için katlanmış metin: başlık, dallar, sınavlı programı varsa "sinavli".
  searchText: string;
};

export type Atlas = {
  entries: AtlasEntry[];
  empty: AtlasProgram[];
  fieldCount: number;
  schoolCount: number;
  sinavliCount: number;
  // Çizgi şeridinin ortak ölçeği: dizindeki en büyük okul sayısı.
  maxCount: number;
};

const SINAVLI = /\s*\(\s*s[ıi]navl[ıi]\s*\)\s*$/iu;

// Türkçe büyük/küçük harf ve aksan duyarsız karşılaştırma anahtarı:
// "BİLİŞİM", "bilişim" ve "bilisim" aynı anahtara iner.
export function foldTurkish(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSinavli(title: string): boolean {
  return SINAVLI.test(title);
}

export function baseTitle(title: string): string {
  return title.replace(SINAVLI, "").trim();
}

/**
 * Alanın eşi: sınavsız alanın sınavlı programı ya da tersi. Eşleşme
 * dizindekiyle aynıdır (Türkçe katlanmış taban başlık).
 */
export function findSibling<T extends { id: number; title: string }>(
  field: { id: number; title: string },
  all: T[],
): T | null {
  const key = foldTurkish(baseTitle(field.title));
  const wantSinavli = !isSinavli(field.title);
  return (
    all.find(
      (other) =>
        other.id !== field.id &&
        isSinavli(other.title) === wantSinavli &&
        foldTurkish(baseTitle(other.title)) === key,
    ) ?? null
  );
}

function activeSchoolIds(row: AtlasRowInput): number[] {
  return (row.school_vocational_fields ?? [])
    .filter((link) => link.schools != null && link.schools.is_active !== false)
    .map((link) => link.school_id);
}

function normalizeBranches(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

const byTitle = (a: { title: string }, b: { title: string }) =>
  a.title.localeCompare(b.title, "tr");

export function buildAtlas(rows: AtlasRowInput[]): Atlas {
  const allSchools = new Set<number>();

  const programs = rows.map((row) => {
    const ids = new Set(activeSchoolIds(row));
    ids.forEach((id) => allSchools.add(id));
    return {
      row,
      program: {
        id: row.id,
        slug: row.slug,
        title: row.title.trim(),
        schoolCount: ids.size,
      } satisfies AtlasProgram,
      key: foldTurkish(baseTitle(row.title)),
      sinavli: isSinavli(row.title),
    };
  });

  const entries: AtlasEntry[] = [];
  const byKey = new Map<string, AtlasEntry>();
  const toEntry = (p: (typeof programs)[number]): AtlasEntry => ({
    ...p.program,
    branches: normalizeBranches(p.row.branches),
    letter: p.program.title.charAt(0).toLocaleUpperCase("tr"),
    sinavli: null,
    searchText: "",
  });

  for (const p of programs) {
    if (p.sinavli) continue;
    const entry = toEntry(p);
    entries.push(entry);
    if (!byKey.has(p.key)) byKey.set(p.key, entry);
  }
  for (const p of programs) {
    if (!p.sinavli) continue;
    const base = byKey.get(p.key);
    if (base && !base.sinavli) base.sinavli = p.program;
    else entries.push(toEntry(p));
  }

  const empty: AtlasProgram[] = [];
  const visible: AtlasEntry[] = [];
  for (const entry of entries) {
    const sinavli = entry.sinavli;
    if (sinavli && sinavli.schoolCount === 0) {
      empty.push(sinavli);
      entry.sinavli = null;
    }
    if (entry.schoolCount === 0 && !entry.sinavli) {
      const { id, slug, title, schoolCount } = entry;
      empty.push({ id, slug, title, schoolCount });
      continue;
    }
    entry.searchText = foldTurkish(
      [entry.title, ...entry.branches, entry.sinavli ? "sınavlı" : ""].join(" "),
    );
    visible.push(entry);
  }

  visible.sort(byTitle);
  empty.sort(byTitle);

  return {
    entries: visible,
    empty,
    fieldCount: visible.length,
    schoolCount: allSchools.size,
    sinavliCount: visible.filter((entry) => entry.sinavli).length,
    maxCount: Math.max(
      1,
      ...visible.map((entry) =>
        Math.max(entry.schoolCount, entry.sinavli?.schoolCount ?? 0),
      ),
    ),
  };
}

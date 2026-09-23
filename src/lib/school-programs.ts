// Çok programlı Anadolu liseleri (ÇPAL) Anadolu Lisesi ve Meslek programlarıyla
// öğrenci alabilir. Program kümesi, tür eşlemesi ve etiketlerin tek sahibi.
// Saf fonksiyonlar; Supabase veya React içermez.

export const SCHOOL_PROGRAMS = ["anadolu_lisesi", "meslek"] as const;
export type SchoolProgram = (typeof SCHOOL_PROGRAMS)[number];

export const MULTI_PROGRAM_TYPE = "Çok Programlı Anadolu Lisesi";

/** Liste kartı ve yönetim etiketleri. */
export const PROGRAM_LABELS: Record<SchoolProgram, string> = {
  anadolu_lisesi: "Anadolu Lisesi",
  meslek: "Meslek Programı",
};

/** Detay puan tablosundaki satır etiketleri. */
export const PROGRAM_ROW_LABELS: Record<SchoolProgram, string> = {
  anadolu_lisesi: "Anadolu Lisesi Programı",
  meslek: "Meslek Programı",
};

const TYPE_PROGRAMS: Record<string, SchoolProgram> = {
  "Anadolu Lisesi": "anadolu_lisesi",
  "Anadolu Meslek Programı": "meslek",
};

export function isSchoolProgram(value: unknown): value is SchoolProgram {
  return typeof value === "string" && (SCHOOL_PROGRAMS as readonly string[]).includes(value);
}

export function programForType(type: string): SchoolProgram | null {
  return Object.hasOwn(TYPE_PROGRAMS, type) ? TYPE_PROGRAMS[type] : null;
}

/** PostgREST `or` ifadesi: türün kendisi veya o programı olan ÇPAL. Eşleme yoksa null. */
export function typeFilterExpression(type: string): string | null {
  const program = programForType(type);
  if (!program) return null;
  return `type.eq."${type}",and(type.eq."${MULTI_PROGRAM_TYPE}",programs.cs.{${program}})`;
}

/** Excel "Program" hücresi: boş → null (okul geneli), bilinmeyen → undefined. */
export function parseProgramLabel(raw: string): SchoolProgram | null | undefined {
  const value = raw.trim().toLocaleLowerCase("tr-TR");
  if (!value) return null;
  if (value === "anadolu lisesi") return "anadolu_lisesi";
  if (value === "meslek programı" || value === "anadolu meslek programı") return "meslek";
  return undefined;
}

/** Okul formundan gelen seçimler; ÇPAL dışındaki türlerde her zaman boş. */
export function programsForSave(type: string, raw: unknown[]): SchoolProgram[] {
  if (type !== MULTI_PROGRAM_TYPE) return [];
  return SCHOOL_PROGRAMS.filter((program) => raw.includes(program));
}

/** Puan satırının kapsamı: okul geneli, meslek alanı veya program. */
export type ScoreScope = { fieldId: number | null; program: SchoolProgram | null };

export function parseScoreScope(raw: string): ScoreScope | null {
  if (raw === "") return { fieldId: null, program: null };
  const field = /^field:(\d+)$/.exec(raw);
  if (field) return { fieldId: Number(field[1]), program: null };
  const program = /^program:(.+)$/.exec(raw);
  if (program && isSchoolProgram(program[1])) return { fieldId: null, program: program[1] };
  return null;
}

export function scoreScopeValue(fieldId: number | null, program: SchoolProgram | null): string {
  if (program) return `program:${program}`;
  return fieldId != null ? `field:${fieldId}` : "";
}

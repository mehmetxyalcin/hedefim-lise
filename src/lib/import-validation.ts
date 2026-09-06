// One invalid row excludes the entire school, so skipping errors cannot
// replace a school's relations with only the valid part of its spreadsheet.
export function excludeInvalidSchools<T extends { institution_code: string }>(
  rows: T[],
  invalid: (row: T) => boolean,
): T[] {
  const blocked = new Set(rows.filter(invalid).map((row) => row.institution_code));
  return rows.filter((row) => !blocked.has(row.institution_code));
}

export function parseImportNumber(
  value: unknown,
  maximum: number,
  integer = false,
): number | null | undefined {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return undefined;
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 && number <= maximum &&
    (!integer || Number.isInteger(number)) ? number : null;
}

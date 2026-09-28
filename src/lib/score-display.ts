// Liste satırının puan sütunu: hangi değerin hangi etiketle yazılacağının tek
// kuralı. /okullar listesi ve meslek alanı sayfası aynı sonucu gösterir.

import { PROGRAM_LABELS } from "./school-programs";
import type { Placement, PlacementValues, ProgramOBPs } from "./school-scores";

export const formatScore = (v: number) =>
  v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type ScoreRow = { label: string; value: string };

/** Tek değer büyük yazılır; iki değer (merkezi+yerel ya da ÇPAL programları) iki satır olur. */
export function scoreRows(
  values: PlacementValues | undefined,
  programs: ProgramOBPs | undefined,
  placement: Placement | null,
): { single: ScoreRow | null; rows: ScoreRow[] | null } {
  const merkezi = values?.merkezi ?? null;
  const yerel = values?.yerel ?? null;
  const al = programs?.anadolu_lisesi ?? null;
  const mp = programs?.meslek ?? null;
  // İki programlı ÇPAL: tür filtresi yoksa ve merkezi gösterilmiyorsa iki OBP satırı.
  const programRows =
    al != null && mp != null && placement !== "merkezi" && (placement === "yerel" || merkezi == null)
      ? [
          { label: PROGRAM_LABELS.anadolu_lisesi, value: formatScore(al) },
          { label: PROGRAM_LABELS.meslek, value: formatScore(mp) },
        ]
      : null;
  const single = programRows ? null
    : placement === "merkezi" ? (merkezi != null ? { label: "Yüzdelik dilim", value: `%${formatScore(merkezi)}` } : null)
    : placement === "yerel" ? (yerel != null ? { label: "OBP puanı", value: formatScore(yerel) } : null)
    : merkezi != null && yerel == null ? { label: "Yüzdelik dilim", value: `%${formatScore(merkezi)}` }
    : yerel != null && merkezi == null ? { label: "OBP puanı", value: formatScore(yerel) }
    : null;
  const rows = programRows ?? (placement === null && merkezi != null && yerel != null
    ? [
        { label: "Merkezi", value: `%${formatScore(merkezi)}` },
        { label: "Yerel OBP", value: formatScore(yerel) },
      ]
    : null);
  return { single, rows };
}

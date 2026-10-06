import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { DT, FOCUS } from "@/components/school/doc-styles";
import { QA_ASK } from "./qa-format";

// Soru-cevap künyesinin ortak satırları: soru sorma çağrısı ve kaynak notu.

export const PRIMARY_BUTTON = `inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)] ${FOCUS}`;

export function AskPrompt({
  title = "Aradığını bulamadın mı?",
  rule = "line",
  className,
}: {
  title?: string;
  /** Künyenin ilk satırıysa üst çizgi mürekkep. */
  rule?: "ink" | "line";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t py-5",
        rule === "ink" ? "border-[var(--ink)]" : "border-[var(--line)]",
        className,
      )}
    >
      <h2 className={DT}>{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-soft)]">
        Sorunu yaz, yanıtı sana özel bir bağlantıdan oku.
      </p>
      <Link href={QA_ASK} className={cn(PRIMARY_BUTTON, "mt-4 w-full")}>
        Soru sor
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function SourceNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "border-t border-[var(--line)] pt-5 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]",
        className,
      )}
    >
      Yanıtları rehber öğretmen ve psikolojik danışmanlar hazırlıyor. Kurallar
      yıldan yıla değişebilir; tercih yapmadan önce güncel MEB ve e-Okul
      duyurularını da kontrol et. Hedefim Lise bağımsız bir rehberdir; MEB adına
      işlem yapmaz.
    </p>
  );
}

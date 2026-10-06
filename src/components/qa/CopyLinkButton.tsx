"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { FOCUS } from "@/components/school/doc-styles";

type Props = {
  /** Site içi yol (ör. /soru-cevap/tercih-islemleri#kac-okul). */
  path: string;
  label?: string;
  /** text: teal metin eylemi; primary: dolu teal düğme (takip bağlantısı). */
  variant?: "text" | "primary";
  className?: string;
};

const VARIANT = {
  text: "gap-1.5 rounded-md font-display text-sm font-bold text-[var(--teal)] transition-colors hover:text-[var(--teal-deep)]",
  primary:
    "justify-center gap-2 rounded-xl bg-[var(--teal)] px-5 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-[var(--teal-deep)]",
};

// Tam adresi tıklama anında kurar: sunucuda alan adı bilinmez, tarayıcıdaki
// adres her zaman doğrudur. Pano izni yoksa adres seçilebilir bir pencerede çıkar.
export function CopyLinkButton({ path, label = "Bağlantıyı kopyala", variant = "text", className }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    const url = new URL(path, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Bağlantıyı kopyalayın:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center",
        VARIANT[variant],
        FOCUS,
        className,
      )}
    >
      {copied ? (
        <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
      ) : (
        <Link2 aria-hidden="true" className="h-4 w-4" />
      )}
      <span aria-live="polite">{copied ? "Kopyalandı" : label}</span>
    </button>
  );
}

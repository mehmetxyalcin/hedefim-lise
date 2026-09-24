"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonClass =
  "inline-flex h-10 items-center gap-2 rounded-[4px] border border-blog-ink/15 bg-white px-3.5 font-blog-display text-[0.875rem] font-semibold text-blog-ink transition-colors duration-150 hover:border-blog-ink hover:bg-blog-sheet";

const noopSubscribe = () => () => {};

// WhatsApp, bağlantı kopyalama ve (destekleyen cihazda) sistemin paylaş menüsü.
export function ShareActions({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  // Sunucuda yok sayılır; paylaş düğmesi hidrasyondan sonra, destek varsa görünür.
  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Bağlantıyı kopyalayın:", url);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Kullanıcı paylaşımı kapattı; yapılacak bir şey yok.
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        WhatsApp
        <span className="sr-only"> ile paylaş (yeni sekmede açılır)</span>
      </a>
      <button type="button" onClick={copy} className={buttonClass} aria-live="polite">
        {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Link2 aria-hidden="true" className="h-4 w-4" />}
        {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
      </button>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={buttonClass}>
          <Share2 aria-hidden="true" className="h-4 w-4" />
          Paylaş
        </button>
      )}
    </div>
  );
}

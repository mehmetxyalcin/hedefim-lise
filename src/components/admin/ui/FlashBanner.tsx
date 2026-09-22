"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { adminFocus } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";

// ?success= / ?error= mesajları. Kapatınca yalnız bu görünümde gizlenir.
export function FlashBanner({ success, error }: { success?: string; error?: string }) {
  const [hidden, setHidden] = useState<string | null>(null);
  const message = error ?? success;
  if (!message || hidden === message) return null;
  const isError = Boolean(error);

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
        isError
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      {isError ? (
        <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CircleCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={() => setHidden(message)}
        aria-label="Bildirimi kapat"
        className={cn("-m-1 rounded p-1 opacity-70 hover:opacity-100", adminFocus)}
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

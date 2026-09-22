"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { signOutAdmin } from "@/app/admin/login/actions";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

function initials(email: string) {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toLocaleUpperCase("tr-TR") || "?";
}

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Hesap menüsü: ${email}`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-admin-tint text-xs font-bold text-admin-tint-ink",
          adminFocus,
        )}
      >
        {initials(email)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-admin-line bg-white p-1 shadow-lg"
        >
          <p className="truncate px-3 py-2 text-xs text-admin-muted">{email}</p>
          <form action={signOutAdmin}>
            <button
              type="submit"
              role="menuitem"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-admin-body hover:bg-rose-50 hover:text-rose-700",
                adminFocus,
              )}
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Çıkış yap
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import { ExternalLink, Menu } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminButton } from "@/components/admin/ui/Button";
import { adminFocus } from "@/components/admin/ui/styles";
import { SchoolQuickSearch, type QuickSearchSchool } from "@/components/admin/shell/SchoolQuickSearch";
import { UserMenu } from "@/components/admin/shell/UserMenu";

export function AdminTopbar({
  email,
  schools,
  onOpenMenu,
}: {
  email: string;
  schools: QuickSearchSchool[];
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-admin-line bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Menüyü aç"
        className={cn(
          "-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-admin-body hover:bg-admin-line-soft lg:hidden",
          adminFocus,
        )}
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>
      <SchoolQuickSearch schools={schools} />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Görünürlük sarmalayıcıda: düğme sınıfındaki inline-flex ile hidden çakışmasın. */}
        <span className="hidden sm:block">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={adminButton({ variant: "ghost", size: "sm" })}
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            Siteyi aç
          </a>
        </span>
        <UserMenu email={email} />
      </div>
    </header>
  );
}

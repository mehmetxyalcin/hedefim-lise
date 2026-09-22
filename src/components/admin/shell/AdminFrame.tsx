"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";
import { AdminSidebar } from "@/components/admin/shell/AdminSidebar";
import { AdminTopbar } from "@/components/admin/shell/AdminTopbar";
import { ADMIN_SIDEBAR_COOKIE } from "@/components/admin/shell/nav";
import type { QuickSearchSchool } from "@/components/admin/shell/SchoolQuickSearch";

type Props = {
  collapsed: boolean;
  email: string;
  unreadCount: number;
  schoolCount: number;
  schools: QuickSearchSchool[];
  children: React.ReactNode;
};

export function AdminFrame({
  collapsed: initialCollapsed,
  email,
  unreadCount,
  schoolCount,
  schools,
  children,
}: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${ADMIN_SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/admin; max-age=31536000; samesite=lax`;
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a[aria-current], a")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const counts = { unreadCount, schoolCount };

  return (
    <div className="admin flex min-h-screen w-full flex-1">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        İçeriğe geç
      </a>

      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-admin-line bg-white transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <AdminSidebar variant="rail" collapsed={collapsed} onToggleCollapsed={toggleCollapsed} {...counts} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Yönetim menüsü">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Menüyü kapat"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-admin-ink/40"
          />
          <div ref={drawerRef} className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Menüyü kapat"
              className={cn(
                "absolute top-3.5 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-admin-body hover:bg-admin-line-soft",
                adminFocus,
              )}
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <AdminSidebar
              variant="drawer"
              collapsed={false}
              onNavigate={() => setDrawerOpen(false)}
              {...counts}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar email={email} schools={schools} onOpenMenu={() => setDrawerOpen(true)} />
        <main id="admin-main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

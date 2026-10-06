"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";
import { ADMIN_NAV } from "@/components/admin/shell/nav";

type Props = {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  unreadCount: number;
  questionCount: number;
  schoolCount: number;
  variant: "rail" | "drawer";
};

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  unreadCount,
  questionCount,
  schoolCount,
  variant,
}: Props) {
  const pathname = usePathname() ?? "";
  const compact = variant === "rail" && collapsed;

  return (
    <nav aria-label="Yönetim menüsü" className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-admin-line",
          compact ? "justify-center px-2" : "px-5",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-accent text-[13px] font-bold text-white">
          HL
        </span>
        {!compact && (
          <span className="leading-tight">
            <span className="block text-sm font-bold text-admin-ink">Hedefim Lise</span>
            <span className="block text-xs text-admin-muted">Yönetim</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.group} className="mb-5 last:mb-0">
            {compact ? (
              <div className="mx-auto mb-2 h-px w-6 bg-admin-line" aria-hidden="true" />
            ) : (
              <p className="px-2.5 pb-1.5 text-xs font-semibold text-admin-faint">{group.group}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.isActive(pathname);
                const count =
                  item.count === "unread"
                    ? unreadCount
                    : item.count === "questions"
                      ? questionCount
                      : item.count === "schools"
                        ? schoolCount
                        : 0;
                // Bekleyen iş sayaçları (okunmamış mesaj, yeni soru) vurgulu rozet; okul sayısı sade.
                const isAlert = item.count === "unread" || item.count === "questions";
                const alertLabel = item.count === "questions" ? "yeni soru" : "okunmamış";
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      title={compact ? item.label : undefined}
                      className={cn(
                        "relative flex h-9 items-center gap-2.5 rounded-lg text-sm transition-colors duration-150",
                        compact ? "justify-center px-0" : "px-2.5",
                        active
                          ? "bg-admin-tint font-semibold text-admin-tint-ink"
                          : "text-admin-body hover:bg-admin-line-soft hover:text-admin-ink",
                        adminFocus,
                      )}
                    >
                      <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                      {compact ? (
                        <span className="sr-only">{item.label}</span>
                      ) : (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!compact && count > 0 && (
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            isAlert
                              ? "rounded-full bg-admin-accent px-1.5 py-px font-semibold text-white"
                              : "text-admin-muted",
                          )}
                        >
                          {count}
                          {isAlert && <span className="sr-only"> {alertLabel}</span>}
                        </span>
                      )}
                      {compact && isAlert && count > 0 && (
                        <>
                          <span aria-hidden="true" className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-admin-accent ring-2 ring-white" />
                          <span className="sr-only">{count} {alertLabel}</span>
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {variant === "rail" && onToggleCollapsed && (
        <div className="shrink-0 border-t border-admin-line p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-lg text-sm text-admin-muted hover:bg-admin-line-soft hover:text-admin-ink",
              compact ? "justify-center" : "px-2.5",
              adminFocus,
            )}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose aria-hidden="true" className="h-[18px] w-[18px]" />
            )}
            {compact ? <span className="sr-only">Menüyü genişlet</span> : "Daralt"}
          </button>
        </div>
      )}
    </nav>
  );
}

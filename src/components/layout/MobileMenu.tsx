"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { isActiveLink, linkRel, type HeaderLink } from "./nav-links";

export function MobileMenu({ links }: { links: HeaderLink[] }) {
  const pathname = usePathname();
  // Menü açıldığı sayfaya bağlı: rota değişince kendiliğinden kapanır.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = openedAt !== null && openedAt === pathname;
  const close = () => setOpenedAt(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedAt(null);
    };
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={isOpen}
        aria-controls="site-mobile-menu"
        onClick={() => setOpenedAt(isOpen ? null : pathname)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Header'daki backdrop-filter fixed konumu header'a bağlar; panel bu
          yüzden header'ın altına mutlak konumlanıp ekranın kalanını doldurur. */}
      {isOpen && (
        <div
          id="site-mobile-menu"
          className="site-menu-panel absolute inset-x-0 top-full z-40 overflow-y-auto overscroll-contain bg-white lg:hidden"
          style={{
            height: "calc(100dvh - 4rem - 1px - env(safe-area-inset-top))",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
          <nav aria-label="Ana menü" className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
            <ul className="flex flex-col">
              {links.map((link) => {
                const active = isActiveLink(link.href, pathname);
                return (
                  <li key={link.key} className="border-b border-slate-100 last:border-b-0">
                    <Link
                      href={link.href}
                      target={link.target}
                      rel={linkRel(link.target)}
                      aria-current={active ? "page" : undefined}
                      onClick={close}
                      className="group -mx-2 my-1 flex items-center justify-between rounded-xl px-3 py-3 text-base font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-800"
                    >
                      {link.label}
                      <ChevronRight
                        aria-hidden
                        className="h-4 w-4 text-slate-300 transition-transform duration-150 group-hover:translate-x-0.5 group-aria-[current=page]:text-blue-400"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

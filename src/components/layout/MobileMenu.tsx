"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { NavigationItem } from "@/lib/site-settings";
import { FavoritesNavIcon } from "./FavoritesNavIcon";

type Props = {
  navItems: NavigationItem[];
};

export function MobileMenu({ navItems }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-lg p-2 text-slate-300 transition-all hover:bg-white/5 hover:text-white md:hidden"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-20 z-40 border-b border-white/10 bg-[#0a0f1c]/95 px-6 py-4 backdrop-blur-lg md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.target}
                rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/soru-cevap"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
            >
              Soru-Cevap
            </Link>
            <Link
              href="/iletisim"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
            >
              İletişim
            </Link>
            <div className="px-4 py-1">
              <FavoritesNavIcon />
            </div>
            <div className="my-2 h-px bg-white/10" />
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-white/5 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveLink, linkRel, type HeaderLink } from "./nav-links";

export function DesktopNav({ links }: { links: HeaderLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Ana menü" className="hidden self-stretch lg:flex">
      <ul className="flex items-stretch gap-0.5 xl:gap-1">
        {links.map((link) => {
          const active = isActiveLink(link.href, pathname);
          return (
            <li key={link.key} className="relative flex items-center">
              <Link
                href={link.href}
                target={link.target}
                rel={linkRel(link.target)}
                aria-current={active ? "page" : undefined}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-[current=page]:text-slate-900 xl:px-3"
              >
                {link.label}
              </Link>
              {active && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-blue-600 xl:inset-x-3"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

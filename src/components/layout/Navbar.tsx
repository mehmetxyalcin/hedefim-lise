import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { getSiteSettings, getNavigationItems } from "@/lib/site-settings";
import { DesktopNav } from "./DesktopNav";
import { FavoritesNavIcon } from "./FavoritesNavIcon";
import { MobileMenu } from "./MobileMenu";
import { NavigationProgress } from "./NavigationProgress";
import type { HeaderLink } from "./nav-links";

export async function Navbar() {
  const [settings, navItems] = await Promise.all([
    getSiteSettings(),
    getNavigationItems(),
  ]);

  const links: HeaderLink[] = [
    ...navItems.map((item) => ({
      key: item.id,
      label: item.label,
      href: item.href,
      target: item.target,
    })),
    { key: "iletisim", label: "İletişim", href: "/iletisim" },
  ];

  return (
    <header
      className="site-header sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl backdrop-saturate-150"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div
        className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <Link
          href="/"
          aria-label={`${settings.site_title} ana sayfa`}
          className="-ml-1 flex shrink-0 items-center gap-2.5 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {settings.logo_url ? (
            <span className="relative block h-9 w-9 shrink-0">
              <Image
                src={settings.logo_url}
                alt=""
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            </span>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <BookOpen aria-hidden className="h-[18px] w-[18px]" />
            </span>
          )}
          <span className="text-[17px] leading-none font-bold tracking-[-0.02em] text-slate-900">
            {settings.site_title}
          </span>
        </Link>

        <DesktopNav links={links} />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <FavoritesNavIcon />
          <MobileMenu links={links} />
        </div>
      </div>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
    </header>
  );
}

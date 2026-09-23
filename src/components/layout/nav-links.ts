export type HeaderLink = {
  key: string;
  label: string;
  href: string;
  target?: string;
};

// "/" yalnızca ana sayfada aktif; diğerleri alt sayfalarında da aktif kalır
// (ör. /okullar/abc → Tercih Robotu).
export function isActiveLink(href: string, pathname: string | null): boolean {
  if (!pathname || !href.startsWith("/")) return false;
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function linkRel(target?: string) {
  return target === "_blank" ? "noopener noreferrer" : undefined;
}

// Sayfa geçişi başladı sinyali. <Link> tıklamalarını NavigationProgress
// kendisi yakalar; router.push çağıranlar (form gönderimleri, filtreler)
// push'tan hemen önce beginNavigation çağırır ki başlık çubuğu dolmaya başlasın.
export const NAV_START_EVENT = "hedefim:navstart";

// Aynı sayfaya (ya da yalnız #çapaya) giden adres yeni sayfa açmaz;
// orada çubuk başlarsa bitiş sinyali hiç gelmez.
export function leadsToNewPage(url: URL): boolean {
  const here = window.location;
  return (
    url.origin === here.origin &&
    (url.pathname !== here.pathname || url.search !== here.search)
  );
}

export function beginNavigation(href: string) {
  if (typeof window === "undefined") return;
  if (!leadsToNewPage(new URL(href, window.location.href))) return;
  window.dispatchEvent(new Event(NAV_START_EVENT));
}

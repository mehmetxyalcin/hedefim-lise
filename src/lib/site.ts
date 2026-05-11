const localhostUrl = "http://localhost:3000";

function normalizeSiteUrl(value: string) {
  const normalized = value.trim().replace(/\/+$/, "");

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return `https://${normalized}`;
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  return normalizeSiteUrl(configuredUrl ?? localhostUrl);
}

export function getSiteUrlWithPath(path: string) {
  return new URL(path, getSiteUrl()).toString();
}

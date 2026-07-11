import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

export type SiteSettings = {
  id: string;
  logo_url: string | null;
  logo_alt: string;
  site_title: string;
  updated_at: string;
};

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  order_index: number;
  is_visible: boolean;
  target: string;
};

export type FooterSettings = {
  id: string;
  about_text: string | null;
  partners_title: string;
  copyright_text: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  updated_at: string;
};

export type FooterLink = {
  id: string;
  section: string;
  label: string;
  href: string;
  order_index: number;
  is_visible: boolean;
};

export type FooterSocialLink = {
  id: string;
  platform: string;
  url: string;
  order_index: number;
  is_visible: boolean;
};

export const SITE_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
export const FOOTER_SETTINGS_ID = "00000000-0000-0000-0000-000000000002";

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  return createClient(url, key);
}

const defaultSiteSettings: SiteSettings = {
  id: SITE_SETTINGS_ID,
  logo_url: null,
  logo_alt: "Hedefim Lise",
  site_title: "Hedefim Lise",
  updated_at: new Date().toISOString(),
};

const defaultFooterSettings: FooterSettings = {
  id: FOOTER_SETTINGS_ID,
  about_text:
    "Öğrencilerin doğru lise tercihleri yapabilmesi amacıyla Akdeniz Rehberlik ve Araştırma Merkezi koordinatörlüğünde yürütülen sosyal sorumluluk projesidir.",
  partners_title: "Proje Paydaşları",
  copyright_text: "© 2026 Hedefim Lise, Yolum Bilinçli Tercih Projesi.",
  contact_email: "akdenizram33@gmail.com",
  contact_phone: "0 (324) 336 11 84",
  address: "Akdeniz Rehberlik ve Araştırma Merkezi, Akdeniz, Mersin",
  updated_at: new Date().toISOString(),
};

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    return (data as SiteSettings | null) ?? defaultSiteSettings;
  },
  ["site-settings"],
  { tags: ["site-settings"], revalidate: 60 },
);

export const getNavigationItems = unstable_cache(
  async (): Promise<NavigationItem[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("navigation_items")
      .select("*")
      .eq("is_visible", true)
      .order("order_index");
    const items = (data as NavigationItem[] | null) ?? [];
    return items.filter(
      (item, index) => items.findIndex((other) => other.href === item.href) === index,
    );
  },
  ["navigation-items"],
  { tags: ["navigation-items"], revalidate: 60 },
);

export const getFooterSettings = unstable_cache(
  async (): Promise<FooterSettings> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("footer_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    return (data as FooterSettings | null) ?? defaultFooterSettings;
  },
  ["footer-settings"],
  { tags: ["footer-settings"], revalidate: 60 },
);

export const getFooterLinks = unstable_cache(
  async (): Promise<Record<string, FooterLink[]>> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("footer_links")
      .select("*")
      .eq("is_visible", true)
      .order("order_index");

    const links = (data as FooterLink[] | null) ?? [];
    const grouped: Record<string, FooterLink[]> = {};
    for (const link of links) {
      if (!grouped[link.section]) grouped[link.section] = [];
      grouped[link.section].push(link);
    }
    return grouped;
  },
  ["footer-links"],
  { tags: ["footer-links"], revalidate: 60 },
);

export const getSocialLinks = unstable_cache(
  async (): Promise<FooterSocialLink[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("footer_social_links")
      .select("*")
      .eq("is_visible", true)
      .order("order_index");
    return (data as FooterSocialLink[] | null) ?? [];
  },
  ["social-links"],
  { tags: ["social-links"], revalidate: 60 },
);

// Admin sayfalarında auth gerektiren sorgular için — cache'siz, doğrudan.
// supabase parametresi kasıtlı olarak any: requireAdmin()'den gelen
// SSR client ile createPublicClient()'ın generic parametreleri farklı.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAdminNavigationItems(supabase: any): Promise<NavigationItem[]> {
  const { data } = await supabase
    .from("navigation_items")
    .select("*")
    .order("order_index");
  return (data as NavigationItem[] | null) ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAdminFooterLinks(supabase: any): Promise<FooterLink[]> {
  const { data } = await supabase
    .from("footer_links")
    .select("*")
    .order("section")
    .order("order_index");
  return (data as FooterLink[] | null) ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAdminSocialLinks(supabase: any): Promise<FooterSocialLink[]> {
  const { data } = await supabase
    .from("footer_social_links")
    .select("*")
    .order("order_index");
  return (data as FooterSocialLink[] | null) ?? [];
}

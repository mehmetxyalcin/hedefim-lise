import Link from "next/link";
import Image from "next/image";
import { BookOpen, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import {
  getSiteSettings,
  getFooterSettings,
  getFooterLinks,
  getSocialLinks,
} from "@/lib/site-settings";
import type { FooterSocialLink } from "@/lib/site-settings";

function SocialIcon() {
  return <ExternalLink className="h-5 w-5" />;
}

function SocialLinkButton({ link }: { link: FooterSocialLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.platform}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
    >
      <SocialIcon />
    </a>
  );
}

export async function Footer() {
  const [siteSettings, footerSettings, footerLinks, socialLinks] =
    await Promise.all([
      getSiteSettings(),
      getFooterSettings(),
      getFooterLinks(),
      getSocialLinks(),
    ]);

  // Footer linklerini section bazında ayır: "paydaşlar" ayrı sütun,
  // diğer section'lar varsa ikinci sütunda göster
  const partnerLinks = footerLinks["paydaşlar"] ?? [];
  const legalLinks = footerLinks["hukuki"] ?? [];
  const otherSections = Object.entries(footerLinks).filter(
    ([s]) => s !== "paydaşlar" && s !== "hukuki",
  );

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-[#0a0f1c] pt-20 pb-10">
      <div className="absolute top-0 left-1/2 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-12">

          {/* Sütun 1: Logo + hakkında */}
          <div className="md:col-span-5">
            <div className="mb-6 flex items-center space-x-3">
              {siteSettings.logo_url ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden">
                  <Image
                    src={siteSettings.logo_url}
                    alt={siteSettings.logo_alt}
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-lg shadow-blue-600/20">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <span className="block text-xl font-bold tracking-tight text-white">
                  {siteSettings.site_title}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-blue-300/80">
                  Yolum Bilinçli Tercih
                </span>
              </div>
            </div>

            {footerSettings.about_text && (
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-400">
                {footerSettings.about_text}
              </p>
            )}

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <SocialLinkButton key={link.id} link={link} />
                ))}
              </div>
            )}
          </div>

          {/* Sütun 2: Proje paydaşları (footer_links section='paydaşlar') */}
          {partnerLinks.length > 0 && (
            <div className="md:col-span-3">
              <h4 className="mb-6 font-semibold tracking-tight text-white">
                Proje Paydaşları
              </h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {partnerLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="flex cursor-pointer items-center gap-2 transition-colors hover:text-blue-400"
                    >
                      <div className="h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sütun 3: Diğer section'lar (varsa) */}
          {otherSections.length > 0 && (
            <div className="md:col-span-2">
              {otherSections.map(([section, links]) => (
                <div key={section} className="mb-6">
                  <h4 className="mb-4 font-semibold capitalize tracking-tight text-white">
                    {section}
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-400">
                    {links.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={link.href}
                          className="transition-colors hover:text-blue-400"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Sütun son: İletişim */}
          <div className="md:col-span-4">
            <h4 className="mb-6 font-semibold tracking-tight text-white">
              İletişim &amp; Destek
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              {footerSettings.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <span>{footerSettings.address}</span>
                </li>
              )}
              {footerSettings.contact_phone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-blue-500" />
                  <span>{footerSettings.contact_phone}</span>
                </li>
              )}
              {footerSettings.contact_email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-blue-500" />
                  <a
                    href={`mailto:${footerSettings.contact_email}`}
                    className="transition-colors hover:text-blue-400"
                  >
                    {footerSettings.contact_email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Alt bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">
            {footerSettings.copyright_text}
          </p>
          {legalLinks.length > 0 && (
            <div className="flex flex-wrap gap-6 text-xs text-slate-500">
              {legalLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

import {
  BriefcaseBusiness,
  CircleHelp,
  FileSpreadsheet,
  Mail,
  PanelBottom,
  PanelTop,
  School,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const ADMIN_SIDEBAR_COOKIE = "admin_sidebar";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: "schools" | "unread";
  isActive: (pathname: string) => boolean;
};

export const ADMIN_NAV: { group: string; items: AdminNavItem[] }[] = [
  {
    group: "İçerik",
    items: [
      {
        href: "/admin",
        label: "Okullar",
        icon: School,
        count: "schools",
        isActive: (p) =>
          p === "/admin" ||
          (p.startsWith("/admin/okullar/") && !p.startsWith("/admin/okullar/toplu-yukle")),
      },
      {
        href: "/admin/okullar/toplu-yukle",
        label: "Toplu yükleme",
        icon: FileSpreadsheet,
        isActive: (p) => p.startsWith("/admin/okullar/toplu-yukle"),
      },
      {
        href: "/admin/meslek-alanlari",
        label: "Meslek alanları",
        icon: BriefcaseBusiness,
        isActive: (p) => p.startsWith("/admin/meslek-alanlari"),
      },
    ],
  },
  {
    group: "Ziyaretçiler",
    items: [
      {
        href: "/admin/mesajlar",
        label: "Mesajlar",
        icon: Mail,
        count: "unread",
        isActive: (p) => p.startsWith("/admin/mesajlar"),
      },
      {
        href: "/admin/soru-cevap",
        label: "Soru-cevap",
        icon: CircleHelp,
        isActive: (p) => p.startsWith("/admin/soru-cevap"),
      },
    ],
  },
  {
    group: "Site",
    items: [
      {
        href: "/admin/site-settings",
        label: "Genel ayarlar",
        icon: Settings,
        isActive: (p) => p === "/admin/site-settings",
      },
      {
        href: "/admin/site-settings/navigation",
        label: "Menü",
        icon: PanelTop,
        isActive: (p) => p.startsWith("/admin/site-settings/navigation"),
      },
      {
        href: "/admin/site-settings/footer",
        label: "Alt bilgi",
        icon: PanelBottom,
        isActive: (p) => p.startsWith("/admin/site-settings/footer"),
      },
    ],
  },
];

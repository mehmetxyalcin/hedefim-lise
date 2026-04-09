import type { School } from "@/types/school";

export const SCHOOLS: School[] = [
  {
    id: 1,
    name: "Mersin Fen Lisesi",
    slug: "mersin-fen-lisesi",
    type: "Fen Lisesi",
    district: "Yenisehir",
    percentile: "0.85",
    logo: "MF",
    color: "bg-gradient-to-br from-blue-500 to-blue-700",
    features: [
      "Pansiyon",
      "Kapali Spor Salonu",
      "Z-Kutuphane",
      "Fen Laboratuvari",
    ],
    projects: ["TUBITAK 4006", "Erasmus+", "TEKNOFEST Finalisti"],
    languages: ["Ingilizce", "Almanca"],
    description:
      "Akademik basarisi yuksek, proje odakli yapisiyla one cikan ve bilim insani yetistiren bolgesel guc.",
    images: [
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    id: 2,
    name: "Icel Anadolu Lisesi",
    slug: "icel-anadolu-lisesi",
    type: "Anadolu Lisesi",
    district: "Mezitli",
    percentile: "2.10",
    logo: "IAL",
    color: "bg-gradient-to-br from-slate-700 to-slate-900",
    features: ["Kapali Spor Salonu", "Konferans Salonu", "Sanat Atolyesi"],
    projects: [
      "MUN Konferansi",
      "eTwinning",
      "Sosyal Sorumluluk Projeleri",
    ],
    languages: ["Ingilizce", "Fransizca"],
    description:
      "Sosyal, kulturel ve akademik denge sunan, cok yonlu gelisimi destekleyen koklu bir egitim yuvasi.",
    images: [
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    id: 3,
    name: "Mersin Mesleki ve Teknik Anadolu Lisesi",
    slug: "mersin-mesleki-ve-teknik-anadolu-lisesi",
    type: "Mesleki ve Teknik Anadolu Lisesi",
    district: "Akdeniz",
    percentile: "12.50",
    logo: "MTAL",
    color: "bg-gradient-to-br from-orange-500 to-orange-700",
    features: ["Teknoloji Atolyeleri", "Doner Sermaye", "Staj Imkani"],
    projects: [
      "Meslek Lisesi Memleket Meselesi",
      "Patent/Faydali Model Yarismalari",
    ],
    languages: ["Ingilizce"],
    description:
      "Sanayi ve inovasyon sektorune dogrudan nitelikli uzman yetistiren, atolye imkanlari genis teknik merkez.",
    images: [
      "https://images.unsplash.com/photo-1581092921461-eab62e97a783?auto=format&fit=crop&q=80&w=1000",
    ],
    vocationalFields: [1, 2],
  },
  {
    id: 4,
    name: "Yahya Gunsur Anadolu Lisesi",
    slug: "yahya-gunsur-anadolu-lisesi",
    type: "Anadolu Lisesi",
    district: "Yenisehir",
    percentile: "4.30",
    logo: "YGAL",
    color: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    features: ["Spor Salonu", "Muzik Odasi", "Genis Bahce"],
    projects: ["Beyaz Bayrak", "Beslenme Dostu Okul"],
    languages: ["Ingilizce", "Almanca"],
    description:
      "Merkezi konumu ve ogrenci odakli modern egitim anlayisiyla one cikan guvenilir tercih.",
    images: [
      "https://images.unsplash.com/photo-1590012314607-6da64f93413b?auto=format&fit=crop&q=80&w=1000",
    ],
  },
  {
    id: 5,
    name: "Ibni Sina MTAL",
    slug: "ibni-sina-mtal",
    type: "Mesleki ve Teknik Anadolu Lisesi",
    district: "Toroslar",
    percentile: "18.00",
    logo: "ISM",
    color: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    features: ["Uygulama Laboratuvari", "Revir Simulasyonu"],
    projects: ["Saglikli Nesiller", "Ilk Yardim Egitimi"],
    languages: ["Ingilizce"],
    description:
      "Saglik sektorunde uzmanlasmak isteyenler icin simulasyon ve pratik egitim veren tematik lise.",
    images: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000",
    ],
    vocationalFields: [1, 3],
  },
];

export function getSchoolBySlug(slug: string) {
  return SCHOOLS.find((school) => school.slug === slug);
}

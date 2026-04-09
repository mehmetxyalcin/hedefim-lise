import type { VocationalField } from "@/types/vocationalField";

export const VOCATIONAL_FIELDS: VocationalField[] = [
  {
    id: 1,
    title: "Bilisim Teknolojileri",
    slug: "bilisim-teknolojileri",
    description:
      "Yazilim, ag sistemleri ve siber guvenlik alaninda uzmanlar yetistirir.",
    skills: "Mantiksal dusunme, problem cozme, surekli ogrenme istegi.",
    branches: ["Yazilim Gelistirme", "Ag Isletmenligi ve Siber Guvenlik"],
    career: "Yazilim Muhendisi, Veri Analisti, Sistem Yoneticisi.",
    schools: [3, 5],
  },
  {
    id: 2,
    title: "Elektrik-Elektronik Teknolojisi",
    slug: "elektrik-elektronik-teknolojisi",
    description:
      "Endustriyel bakim, otomasyon ve elektrik tesisatlari uzerine egitim verir.",
    skills: "El-goz koordinasyonu, teknik cizim, dikkat.",
    branches: [
      "Endustriyel Bakim Onarim",
      "Elektrik Tesisatlari ve Dagitimi",
      "Goruntu ve Ses Sistemleri",
    ],
    career: "Elektrik Muhendisi, Bakim Teknisyeni, Otomasyon Uzmmani.",
    schools: [3],
  },
  {
    id: 3,
    title: "Saglik Hizmetleri",
    slug: "saglik-hizmetleri",
    description: "Saglik sektorune yardimci personel yetistirir.",
    skills: "Iletisim becerisi, yardimseverlik, sogukkanlilik.",
    branches: [
      "Ebe Yardimciligi",
      "Hemsire Yardimciligi",
      "Saglik Bakim Teknisyenligi",
    ],
    career: "Hemsire, Acil Tip Teknisyeni (ATT).",
    schools: [5],
  },
];

export function getFieldBySlug(slug: string) {
  return VOCATIONAL_FIELDS.find((field) => field.slug === slug);
}

export function getFieldById(id: number) {
  return VOCATIONAL_FIELDS.find((field) => field.id === id);
}

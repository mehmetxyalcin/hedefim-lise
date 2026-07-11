export type SchoolType =
  | "Anadolu Lisesi"
  | "Fen Lisesi"
  | "Sosyal Bilimler Lisesi";

export type SchoolStatistic = {
  id: string;
  district: string;
  school: string;
  type: SchoolType;
  percentiles: Partial<Record<number, number>>;
  quotas: Partial<Record<number, number>>;
};

export const STATISTICS_SOURCE = "Mersin_Lise_Tablo_2026.xlsx";

export const mersinSchoolStatistics2026: SchoolStatistic[] = [
  {
    id: "icel-anadolu",
    district: "Mezitli",
    school: "İçel Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2020: 3.33, 2021: 3.14, 2022: 3.67, 2023: 3.97, 2024: 3.58, 2025: 4.13 },
    quotas: { 2020: 288, 2021: 240, 2022: 240, 2023: 240, 2024: 240, 2025: 240, 2026: 240 },
  },
  {
    id: "mersin-yusuf-kalkavan-anadolu",
    district: "Mezitli",
    school: "Mersin Yusuf Kalkavan Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2020: 6.08, 2021: 5.57, 2022: 6.62, 2023: 6.84, 2024: 6.64, 2025: 7.23 },
    quotas: { 2020: 408, 2021: 240, 2022: 300, 2023: 240, 2024: 240, 2025: 240, 2026: 210 },
  },
  {
    id: "mersin-ticaret-sanayi-odasi-anadolu",
    district: "Toroslar",
    school: "Mersin Ticaret ve Sanayi Odası Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2020: 8.7, 2021: 7.67, 2022: 9.15, 2023: 9.28, 2024: 9, 2025: 8.47 },
    quotas: { 2020: 380, 2021: 180, 2022: 240, 2023: 240, 2024: 240, 2025: 120, 2026: 120 },
  },
  {
    id: "tarsus-borsa-istanbul-sehit-umut-sami-sensoy-anadolu",
    district: "Tarsus",
    school: "Tarsus Borsa İstanbul Şehit Umut Sami Şensoy Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2023: 10.51, 2024: 10.02, 2025: 10.12 },
    quotas: { 2023: 180, 2024: 120, 2025: 150, 2026: 150 },
  },
  {
    id: "tevfik-sirri-gur-anadolu",
    district: "Akdeniz",
    school: "Tevfik Sırrı Gür Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2021: 9.76, 2022: 11.41, 2023: 12.51, 2024: 11.33, 2025: 10.95 },
    quotas: { 2021: 120, 2022: 120, 2023: 240, 2024: 210, 2025: 180, 2026: 180 },
  },
  {
    id: "silifke-anadolu",
    district: "Silifke",
    school: "Silifke Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2021: 12.47, 2022: 12.18, 2023: 13.17, 2024: 13.84, 2025: 13.19 },
    quotas: { 2021: 90, 2022: 90, 2023: 120, 2024: 120, 2025: 120, 2026: 90 },
  },
  {
    id: "erdemli-anadolu",
    district: "Erdemli",
    school: "Erdemli Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2021: 15.73, 2022: 14.79, 2023: 14.92, 2024: 16.29, 2025: 16.38 },
    quotas: { 2021: 150, 2022: 150, 2023: 150, 2024: 150, 2025: 150, 2026: 150 },
  },
  {
    id: "anamur-anadolu",
    district: "Anamur",
    school: "Anamur Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2023: 15.23, 2024: 16.58, 2025: 16.39 },
    quotas: { 2023: 120, 2024: 120, 2025: 120, 2026: 120 },
  },
  {
    id: "mut-osman-nuri-yalman-anadolu",
    district: "Mut",
    school: "Mut Osman Nuri Yalman Anadolu L.",
    type: "Anadolu Lisesi",
    percentiles: { 2020: 19.46, 2021: 21.63, 2022: 20.61, 2023: 19.38, 2024: 17.47, 2025: 21.81 },
    quotas: { 2020: 170, 2021: 120, 2022: 120, 2023: 120, 2024: 90, 2025: 90, 2026: 90 },
  },
  {
    id: "eyup-aygar-fen",
    district: "Yenişehir",
    school: "Eyüp Aygar Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2020: 0.6, 2021: 0.62, 2022: 0.6, 2023: 0.68, 2024: 0.72, 2025: 0.94 },
    quotas: { 2020: 180, 2021: 120, 2022: 120, 2023: 120, 2024: 120, 2025: 120, 2026: 120 },
  },
  {
    id: "yahya-akel-fen",
    district: "Yenişehir",
    school: "Yahya Akel Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2020: 1.21, 2021: 1.21, 2022: 1.29, 2023: 1.37, 2024: 1.42, 2025: 1.76 },
    quotas: { 2020: 180, 2021: 120, 2022: 120, 2023: 120, 2024: 120, 2025: 120, 2026: 120 },
  },
  {
    id: "sesim-sarpkaya-fen",
    district: "Tarsus",
    school: "Sesim Sarpkaya Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2020: 1.77, 2021: 2.4, 2022: 2.38, 2023: 2.52, 2024: 2.43, 2025: 3.08 },
    quotas: { 2020: 136, 2021: 150, 2022: 150, 2023: 150, 2024: 120, 2025: 150, 2026: 150 },
  },
  {
    id: "75-yil-fen",
    district: "Akdeniz",
    school: "75.Yıl Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2020: 3.83, 2021: 4.26, 2022: 4.77, 2023: 5.37, 2024: 6.09, 2025: 5.64 },
    quotas: { 2020: 238, 2021: 150, 2022: 150, 2023: 180, 2024: 180, 2025: 150, 2026: 120 },
  },
  {
    id: "tarsus-sehit-halil-ozdemir-fen",
    district: "Tarsus",
    school: "Tarsus Şehit Halil Özdemir Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2020: 5.21, 2021: 5.12, 2022: 5.68, 2023: 5.91, 2024: 6.24, 2025: 6.07 },
    quotas: { 2020: 238, 2021: 150, 2022: 150, 2023: 150, 2024: 180, 2025: 150, 2026: 150 },
  },
  {
    id: "silifke-fen",
    district: "Silifke",
    school: "Silifke Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2020: 6.38, 2021: 7.25, 2022: 7.85, 2023: 7.52, 2024: 7.4, 2025: 7.81 },
    quotas: { 2020: 136, 2021: 120, 2022: 120, 2023: 120, 2024: 120, 2025: 120, 2026: 120 },
  },
  {
    id: "sehit-ibrahim-armut-fen",
    district: "Anamur",
    school: "Şehit İbrahim Armut Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2020: 6.82, 2021: 8.65, 2022: 9.62, 2023: 8, 2024: 8.69, 2025: 8.87 },
    quotas: { 2020: 120, 2021: 120, 2022: 120, 2023: 90, 2024: 90, 2025: 90, 2026: 90 },
  },
  {
    id: "erdemli-borsa-istanbul-fen",
    district: "Erdemli",
    school: "Erdemli Borsa İstanbul Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2020: 6.14, 2021: 6.74, 2022: 7.87, 2023: 8.47, 2024: 9.74, 2025: 9.51 },
    quotas: { 2020: 170, 2021: 150, 2022: 150, 2023: 150, 2024: 150, 2025: 150, 2026: 150 },
  },
  {
    id: "sehit-ali-gumus-fen",
    district: "Mut",
    school: "Şehit Ali Gümüş Fen L.",
    type: "Fen Lisesi",
    percentiles: { 2025: 15.9 },
    quotas: { 2025: 90, 2026: 90 },
  },
  {
    id: "mehmet-akif-ersoy-sosyal-bilimler",
    district: "Yenişehir",
    school: "Mehmet Akif Ersoy Sosyal Bilimler L.",
    type: "Sosyal Bilimler Lisesi",
    percentiles: { 2020: 12.47, 2021: 11.26, 2022: 12.36, 2023: 14.91, 2024: 14.43, 2025: 15.04 },
    quotas: { 2020: 216, 2021: 120, 2022: 120, 2023: 180, 2024: 180, 2025: 180, 2026: 180 },
  },
];

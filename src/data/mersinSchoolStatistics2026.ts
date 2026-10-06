export type SchoolType =
  | "Anadolu Lisesi"
  | "Fen Lisesi"
  | "Sosyal Bilimler Lisesi"
  | "Anadolu İmam Hatip Lisesi";

export type SchoolStatistic = {
  /** Okulun veritabanındaki slug'ı: canlı puanlar ve okul sayfası bağlantısı bununla eşleşir. */
  slug: string;
  district: string;
  school: string;
  type: SchoolType;
  /** Taban yüzdelik dilim (merkezi yerleştirme). */
  percentiles: Partial<Record<number, number>>;
  /** Taban LGS puanı (500 üzerinden). */
  lgsScores: Partial<Record<number, number>>;
  /** Sınavlı kontenjan. */
  quotas: Partial<Record<number, number>>;
};

export const STATISTICS_SOURCE = "Salim Ünsal";

// Sayfanın yedek kopyası. Sayfa açılırken 2023 ve sonrasının puanları,
// yüzdelikleri ve kontenjanları veritabanından okunup bunların üstüne yazılır
// (src/lib/school-statistics.ts); 2020–2022 yalnız burada durur. Değerler
// 2026-10-06'da veritabanıyla eşitlendi. Anadolu imam hatip liselerinden
// yalnız merkezi yerleştirmeyle (LGS ile) öğrenci alanlar buradadır.
export const mersinSchoolStatistics2026: SchoolStatistic[] = [
  {
    slug: "icel-anadolu-lisesi-967897",
    district: "Mezitli",
    school: "İçel Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2020: 3.33, 2021: 3.14, 2022: 3.67, 2023: 3.97, 2024: 3.58, 2025: 4.13, 2026: 3.87 },
    lgsScores: { 2023: 464.323, 2024: 456.102, 2025: 446.1256, 2026: 442.6785 },
    quotas: { 2020: 288, 2021: 240, 2022: 240, 2023: 240, 2024: 240, 2025: 240, 2026: 240 },
  },
  {
    slug: "mersin-yusuf-kalkavan-anadolu-lisesi-967917",
    district: "Mezitli",
    school: "Mersin Yusuf Kalkavan Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2020: 6.08, 2021: 5.57, 2022: 6.62, 2023: 6.84, 2024: 6.64, 2025: 7.23, 2026: 5.64 },
    lgsScores: { 2023: 448.284, 2024: 436.225, 2025: 422.6622, 2026: 428.5008 },
    quotas: { 2020: 408, 2021: 240, 2022: 300, 2023: 240, 2024: 240, 2025: 240, 2026: 210 },
  },
  {
    slug: "mersin-ticaret-ve-sanayi-odasi-anadolu-lisesi-967905",
    district: "Toroslar",
    school: "Mersin Ticaret ve Sanayi Odası Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2020: 8.7, 2021: 7.67, 2022: 9.15, 2023: 9.28, 2024: 9, 2025: 8.47, 2026: 6.84 },
    lgsScores: { 2023: 434.531, 2024: 422.434, 2025: 414.2864, 2026: 419.9532 },
    quotas: { 2020: 380, 2021: 180, 2022: 240, 2023: 240, 2024: 240, 2025: 120, 2026: 120 },
  },
  {
    slug: "tarsus-borsa-istanbul-sehit-umut-sami-sensoy-anadolu-lisesi-972952",
    district: "Tarsus",
    school: "Tarsus Borsa İstanbul Şehit Umut Sami Şensoy Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2023: 10.51, 2024: 10.02, 2025: 10.12, 2026: 10.05 },
    lgsScores: { 2023: 427.318, 2024: 416.811, 2025: 403.7595, 2026: 400.14 },
    quotas: { 2023: 180, 2024: 120, 2025: 150, 2026: 150 },
  },
  {
    slug: "tevfik-sirri-gur-anadolu-lisesi-967922",
    district: "Akdeniz",
    school: "Tevfik Sırrı Gür Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2021: 9.76, 2022: 11.41, 2023: 12.51, 2024: 11.33, 2025: 10.95, 2026: 9.34 },
    lgsScores: { 2023: 415.846, 2024: 409.735, 2025: 398.7603, 2026: 404.2137 },
    quotas: { 2021: 120, 2022: 120, 2023: 240, 2024: 210, 2025: 180, 2026: 180 },
  },
  {
    slug: "silifke-anadolu-lisesi-280185",
    district: "Silifke",
    school: "Silifke Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2021: 12.47, 2022: 12.18, 2023: 13.17, 2024: 13.84, 2025: 13.19, 2026: 11.3 },
    lgsScores: { 2023: 411.998, 2024: 396.864, 2025: 385.491, 2026: 393.1326 },
    quotas: { 2021: 90, 2022: 90, 2023: 120, 2024: 120, 2025: 120, 2026: 90 },
  },
  {
    slug: "erdemli-anadolu-lisesi-300387",
    district: "Erdemli",
    school: "Erdemli Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2021: 15.73, 2022: 14.79, 2023: 14.92, 2024: 16.29, 2025: 16.38, 2026: 15.59 },
    lgsScores: { 2023: 402.162, 2024: 385.034, 2025: 367.9203, 2026: 371.6359 },
    quotas: { 2021: 150, 2022: 150, 2023: 150, 2024: 150, 2025: 150, 2026: 150 },
  },
  {
    slug: "anamur-anadolu-lisesi-264499",
    district: "Anamur",
    school: "Anamur Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2023: 15.23, 2024: 16.58, 2025: 16.39, 2026: 16.57 },
    lgsScores: { 2023: 400.439, 2024: 383.651, 2025: 367.876, 2026: 367.1478 },
    quotas: { 2023: 120, 2024: 120, 2025: 120, 2026: 120 },
  },
  {
    slug: "mut-osman-nuri-yalman-anadolu-lisesi-758037",
    district: "Mut",
    school: "Mut Osman Nuri Yalman Anadolu Lisesi",
    type: "Anadolu Lisesi",
    percentiles: { 2020: 19.46, 2021: 21.63, 2022: 20.61, 2023: 19.38, 2024: 17.47, 2025: 21.81, 2026: 20.58 },
    lgsScores: { 2023: 378.848, 2024: 379.503, 2025: 340.8601, 2026: 350.2048 },
    quotas: { 2020: 170, 2021: 120, 2022: 120, 2023: 120, 2024: 90, 2025: 90, 2026: 90 },
  },
  {
    slug: "eyup-aygar-fen-lisesi-749842",
    district: "Yenişehir",
    school: "Eyüp Aygar Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2020: 0.6, 2021: 0.62, 2022: 0.6, 2023: 0.68, 2024: 0.72, 2025: 0.94, 2026: 0.7 },
    lgsScores: { 2023: 486.181, 2024: 482.062, 2025: 479.1515, 2026: 479.0134 },
    quotas: { 2020: 180, 2021: 120, 2022: 120, 2023: 120, 2024: 120, 2025: 120, 2026: 120 },
  },
  {
    slug: "yahya-akel-fen-lisesi-970969",
    district: "Yenişehir",
    school: "Yahya Akel Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2020: 1.21, 2021: 1.21, 2022: 1.29, 2023: 1.37, 2024: 1.42, 2025: 1.76, 2026: 1.3 },
    lgsScores: { 2023: 480.374, 2024: 473.587, 2025: 468.8433, 2026: 469.6898 },
    quotas: { 2020: 180, 2021: 120, 2022: 120, 2023: 120, 2024: 120, 2025: 120, 2026: 120 },
  },
  {
    slug: "sesim-sarpkaya-fen-lisesi-974019",
    district: "Tarsus",
    school: "Sesim Sarpkaya Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2020: 1.77, 2021: 2.4, 2022: 2.38, 2023: 2.52, 2024: 2.43, 2025: 3.08, 2026: 2.89 },
    lgsScores: { 2023: 472.212, 2024: 464.696, 2025: 455.4501, 2026: 451.5932 },
    quotas: { 2020: 136, 2021: 150, 2022: 150, 2023: 150, 2024: 120, 2025: 150, 2026: 150 },
  },
  {
    slug: "75-yil-fen-lisesi-758310",
    district: "Akdeniz",
    school: "75. Yıl Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2020: 3.83, 2021: 4.26, 2022: 4.77, 2023: 5.37, 2024: 6.09, 2025: 5.64, 2026: 3.96 },
    lgsScores: { 2023: 456.488, 2024: 439.532, 2025: 434.1847, 2026: 441.4495 },
    quotas: { 2020: 238, 2021: 150, 2022: 150, 2023: 180, 2024: 180, 2025: 150, 2026: 120 },
  },
  {
    slug: "tarsus-sehit-halil-ozdemir-fen-lisesi-758041",
    district: "Tarsus",
    school: "Tarsus Şehit Halil Özdemir Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2020: 5.21, 2021: 5.12, 2022: 5.68, 2023: 5.91, 2024: 6.24, 2025: 6.07, 2026: 6.14 },
    lgsScores: { 2023: 453.596, 2024: 438.593, 2025: 430.9711, 2026: 424.8734 },
    quotas: { 2020: 238, 2021: 150, 2022: 150, 2023: 150, 2024: 180, 2025: 150, 2026: 150 },
  },
  {
    slug: "silifke-fen-lisesi-761632",
    district: "Silifke",
    school: "Silifke Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2020: 6.38, 2021: 7.25, 2022: 7.85, 2023: 7.52, 2024: 7.4, 2025: 7.81, 2026: 6.8 },
    lgsScores: { 2023: 444.333, 2024: 431.619, 2025: 418.6494, 2026: 420.2525 },
    quotas: { 2020: 136, 2021: 120, 2022: 120, 2023: 120, 2024: 120, 2025: 120, 2026: 120 },
  },
  {
    slug: "sehit-ibrahim-armut-fen-lisesi-758234",
    district: "Anamur",
    school: "Şehit İbrahim Armut Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2020: 6.82, 2021: 8.65, 2022: 9.62, 2023: 8, 2024: 8.69, 2025: 8.87, 2026: 8.28 },
    lgsScores: { 2023: 441.642, 2024: 424.235, 2025: 411.6955, 2026: 410.7543 },
    quotas: { 2020: 120, 2021: 120, 2022: 120, 2023: 90, 2024: 90, 2025: 90, 2026: 90 },
  },
  {
    slug: "erdemli-borsa-istanbul-fen-lisesi-758040",
    district: "Erdemli",
    school: "Erdemli Borsa İstanbul Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2020: 6.14, 2021: 6.74, 2022: 7.87, 2023: 8.47, 2024: 9.74, 2025: 9.51, 2026: 8.56 },
    lgsScores: { 2023: 439.058, 2024: 418.285, 2025: 407.5117, 2026: 409.0859 },
    quotas: { 2020: 170, 2021: 150, 2022: 150, 2023: 150, 2024: 150, 2025: 150, 2026: 150 },
  },
  {
    slug: "sehit-ali-gumus-fen-lisesi-775949",
    district: "Mut",
    school: "Şehit Ali Gümüş Fen Lisesi",
    type: "Fen Lisesi",
    percentiles: { 2025: 15.9, 2026: 14.62 },
    lgsScores: { 2025: 370.4788, 2026: 376.2414 },
    quotas: { 2025: 90, 2026: 90 },
  },
  {
    slug: "mehmet-akif-ersoy-sosyal-bilimler-lisesi-973428",
    district: "Yenişehir",
    school: "Mehmet Akif Ersoy Sosyal Bilimler Lisesi",
    type: "Sosyal Bilimler Lisesi",
    percentiles: { 2020: 12.47, 2021: 11.26, 2022: 12.36, 2023: 14.91, 2024: 14.43, 2025: 15.04, 2026: 13.18 },
    lgsScores: { 2023: 402.189, 2024: 393.982, 2025: 375.1298, 2026: 383.2677 },
    quotas: { 2020: 216, 2021: 120, 2022: 120, 2023: 180, 2024: 180, 2025: 180, 2026: 180 },
  },
  {
    slug: "yenisehir-anadolu-imam-hatip-lisesi-761173",
    district: "Yenişehir",
    school: "Yenişehir Anadolu İmam Hatip Lisesi",
    type: "Anadolu İmam Hatip Lisesi",
    percentiles: { 2023: 8.56, 2024: 9.49, 2025: 9.22, 2026: 8.36 },
    lgsScores: { 2023: 438.535, 2024: 419.737, 2025: 409.4076, 2026: 410.2727 },
    quotas: { 2025: 120, 2026: 120 },
  },
  {
    slug: "sehit-kubra-doganay-kiz-anadolu-imam-hatip-lisesi-762176",
    district: "Yenişehir",
    school: "Şehit Kübra Doğanay Kız Anadolu İmam Hatip Lisesi",
    type: "Anadolu İmam Hatip Lisesi",
    percentiles: { 2023: 23.7, 2024: 21.98, 2025: 20.93, 2026: 18.34 },
    lgsScores: { 2023: 358.589, 2024: 359.571, 2025: 345.0139, 2026: 359.4068 },
    quotas: { 2025: 90, 2026: 90 },
  },
  {
    slug: "mersin-anadolu-imam-hatip-lisesi-967568",
    district: "Akdeniz",
    school: "Mersin Anadolu İmam Hatip Lisesi",
    type: "Anadolu İmam Hatip Lisesi",
    percentiles: { 2023: 30.96, 2024: 31.98, 2025: 27.44, 2026: 23.42 },
    lgsScores: { 2023: 329.312, 2024: 321.327, 2025: 316.1306, 2026: 339.2997 },
    quotas: { 2025: 90, 2026: 90 },
  },
  {
    slug: "uluslararasi-ashabi-kehf-anadolu-imam-hatip-lisesi-766950",
    district: "Tarsus",
    school: "Uluslararası Ashabı Kehf Anadolu İmam Hatip Lisesi",
    type: "Anadolu İmam Hatip Lisesi",
    percentiles: { 2023: 61.61, 2024: 47.75, 2025: 45.967, 2026: 34.88 },
    lgsScores: { 2023: 245.705, 2024: 275.114, 2025: 253.8117, 2026: 301.0039 },
    quotas: { 2025: 60, 2026: 60 },
  },
];

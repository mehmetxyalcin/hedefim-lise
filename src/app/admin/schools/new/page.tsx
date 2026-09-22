import { permanentRedirect } from "next/navigation";

// Eski tek formlu yol; yeni okul sekmeli ekrandan eklenir.
export default function LegacyNewSchoolPage() {
  permanentRedirect("/admin/okullar/yeni");
}

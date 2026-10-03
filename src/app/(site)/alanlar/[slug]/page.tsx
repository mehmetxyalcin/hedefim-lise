import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  extractSchoolsFromVocationalField,
  mapVocationalField,
} from "@/lib/supabase/public";
import { createVisitorClient } from "@/lib/supabase/visitor";
import { MULTI_PROGRAM_TYPE } from "@/lib/school-programs";
import { placementValues, programOBPs } from "@/lib/school-scores";
import { scoreRows } from "@/lib/score-display";
import { findSibling } from "@/lib/vocational-atlas";
import {
  VocationalDetail,
  type DetailSchool,
} from "@/components/vocational/VocationalDetail";

type AlanDetayPageProps = {
  params: Promise<{ slug: string }>;
};

function truncateDescription(value: string, maxLength = 155) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function getFieldDescription(data: {
  career: string | null;
  description: string | null;
  title: string;
}) {
  const description = data.description?.trim();
  const career = data.career?.trim();

  if (description) {
    return description;
  }

  if (career) {
    return career;
  }

  return `${data.title} meslek alanını, temel becerileri, kariyer seçeneklerini ve bu alanla ilişkili okulları inceleyin.`;
}

export async function generateMetadata({
  params,
}: AlanDetayPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createVisitorClient();
  const { data } = await supabase
    .from("vocational_fields")
    .select("slug, title, description, career")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return {
      title: "Alan bulunamadı",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = truncateDescription(getFieldDescription(data));
  const path = `/alanlar/${data.slug}`;

  return {
    title: data.title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${data.title} | Hedefim Lise`,
      description,
      url: path,
      type: "article",
    },
  };
}

export default async function AlanDetayPage({
  params,
}: AlanDetayPageProps) {
  const { slug } = await params;
  const supabase = await createVisitorClient();

  const [fieldResult, yearResult, allFieldsResult] = await Promise.all([
    supabase
      .from("vocational_fields")
      .select(
        "*, school_vocational_fields(school_id, schools(*, school_scores(id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id, program)))",
      )
      .eq("slug", slug)
      .maybeSingle(),
    // /okullar ile aynı yıl: veri kümesinin son yılı (kural: lib/school-scores).
    supabase
      .from("school_scores")
      .select("year")
      .order("year", { ascending: false })
      .limit(1),
    supabase.from("vocational_fields").select("id, slug, title"),
  ]);

  const data = fieldResult.data;
  if (fieldResult.error || !data) notFound();

  const field = mapVocationalField(data);
  const scoreYear = (yearResult.data?.[0]?.year as number | undefined) ?? null;

  // Satır puanı /okullar?alan= listesindekiyle aynıdır: alanın yüzdeliği,
  // okulun OBP'si, ÇPAL'da program OBP'leri.
  const schools: DetailSchool[] = extractSchoolsFromVocationalField(data).map(
    (school) => {
      const scores = school.scores ?? [];
      return {
        id: school.id,
        slug: school.slug,
        name: school.name,
        type: school.type,
        district: school.district,
        score: scoreRows(
          placementValues(scores, scoreYear, field.id),
          school.type === MULTI_PROGRAM_TYPE
            ? programOBPs(scores, scoreYear)
            : undefined,
          null,
        ),
      };
    },
  );

  return (
    <VocationalDetail
      field={field}
      schools={schools}
      scoreYear={scoreYear}
      sibling={findSibling(field, allFieldsResult.data ?? [])}
    />
  );
}

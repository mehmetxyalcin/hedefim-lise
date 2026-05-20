import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  extractSchoolsFromVocationalField,
  mapVocationalField,
} from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { VocationalDetail } from "@/components/vocational/VocationalDetail";

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
  const supabase = await createClient();
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
  const supabase = await createClient();

  // Try with school_scores including vocational_field_id (requires migration).
  // Falls back to scores without vocational_field_id if the column doesn't exist yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;

  const { data: detailed, error: detailedErr } = await supabase
    .from("vocational_fields")
    .select(
      "*, school_vocational_fields(school_id, schools(*, school_scores(id, school_id, year, obp_score, lgs_score, percentile, vocational_field_id)))",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!detailedErr) {
    data = detailed;
  } else {
    const { data: basic, error: basicErr } = await supabase
      .from("vocational_fields")
      .select(
        "*, school_vocational_fields(school_id, schools(*, school_scores(id, school_id, year, obp_score, lgs_score, percentile)))",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (basicErr || !basic) notFound();
    data = basic;
  }

  if (!data) notFound();

  return (
    <VocationalDetail
      field={mapVocationalField(data)}
      relatedSchools={extractSchoolsFromVocationalField(data)}
      fieldId={data.id as number}
    />
  );
}

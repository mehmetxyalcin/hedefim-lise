import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSchoolWithDetails } from "@/lib/supabase/schoolDetail";
import { createClient } from "@/lib/supabase/server";
import { SchoolDetail } from "@/components/schools/SchoolDetail";
import { getSiteUrlWithPath } from "@/lib/site";

type OkulDetayPageProps = {
  params: Promise<{ slug: string }>;
};

function truncateDescription(value: string, maxLength = 155) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

export async function generateMetadata({ params }: OkulDetayPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select("name, slug, type, district, description, images, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) {
    return { title: "Okul bulunamadı", robots: { index: false, follow: false } };
  }

  const desc = data.description?.trim()
    ? data.description
    : `${data.name}, ${data.district} ilçesinde yer alan ${data.type} türünde bir okuldur.`;

  const description = truncateDescription(desc);
  const path = `/okullar/${data.slug}`;
  const image = Array.isArray(data.images) ? data.images[0] : undefined;
  const absoluteImage = image ? getSiteUrlWithPath(image) : undefined;

  return {
    title: data.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${data.name} | Hedefim Lise`,
      description,
      type: "article",
      url: path,
      images: absoluteImage ? [{ url: absoluteImage, alt: data.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: data.name,
      description,
      images: absoluteImage ? [absoluteImage] : undefined,
    },
  };
}

export default async function OkulDetayPage({ params }: OkulDetayPageProps) {
  const { slug } = await params;
  const school = await getSchoolWithDetails(slug);

  if (!school) notFound();

  return <SchoolDetail school={school} />;
}

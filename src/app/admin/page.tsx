import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { mapSchool } from "@/lib/supabase/public";
import { HEALTH_CHECKS, countMissing, evaluateSchoolHealth, latestYear } from "@/lib/school-health";
import type { LedgerRow } from "@/lib/admin-ledger";
import {
  bulkUpdateSchoolStatus,
  deleteSchool,
  toggleSchoolStatus,
} from "@/app/admin/okullar/actions";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { FlashBanner } from "@/components/admin/ui/FlashBanner";
import { adminButton } from "@/components/admin/ui/Button";
import { LedgerSummary } from "@/components/admin/ledger/LedgerSummary";
import { SchoolLedger } from "@/components/admin/ledger/SchoolLedger";

export const metadata: Metadata = {
  title: "Okullar | Yönetim",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

type SchoolRow = Parameters<typeof mapSchool>[0];

type LedgerSourceRow = Omit<SchoolRow, "school_scores"> & {
  school_facilities?: { facility_id: string }[] | null;
  school_scores?: { year: number }[] | null;
  school_quotas?: { year: number }[] | null;
};

export default async function AdminSchoolsPage({ searchParams }: AdminPageProps) {
  const { supabase } = await requireAdmin();
  const params = searchParams ? await searchParams : undefined;

  // İlişkiler gömülü okunur: üst düzey sorgular 1000 satırla sınırlı, tesis ilişkisi bunu aşıyor.
  const [schoolsResult, unreadResult] = await Promise.all([
    supabase
      .from("schools")
      .select(
        "*, school_vocational_fields(vocational_field_id), school_facilities(facility_id), school_scores(year), school_quotas(year)",
      )
      .order("name"),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread"),
  ]);

  if (schoolsResult.error) {
    return (
      <AdminPage>
        <PageHeader title="Okullar" />
        <FlashBanner error={`Okullar yüklenemedi: ${schoolsResult.error.message}`} />
      </AdminPage>
    );
  }

  const source = (schoolsResult.data ?? []) as LedgerSourceRow[];
  const years = {
    scoreYear: latestYear(source.flatMap((row) => (row.school_scores ?? []).map((s) => s.year))),
    quotaYear: latestYear(source.flatMap((row) => (row.school_quotas ?? []).map((q) => q.year))),
  };

  const rows: LedgerRow[] = source.map((raw) => {
    const school = mapSchool({ ...raw, school_scores: [] } as SchoolRow);
    return {
      id: school.id,
      name: school.name,
      slug: school.slug,
      district: school.district,
      type: school.type,
      isActive: school.isActive !== false,
      updatedAt: school.updatedAt ?? school.createdAt ?? null,
      createdAt: school.createdAt ?? null,
      health: evaluateSchoolHealth(
        {
          type: school.type,
          description: school.description,
          images: school.images,
          languages: school.languages,
          phone: school.phone,
          vocationalFieldCount: school.vocationalFields?.length ?? 0,
          facilityCount: raw.school_facilities?.length ?? 0,
          scoreYears: (raw.school_scores ?? []).map((s) => s.year),
          quotaYears: (raw.school_quotas ?? []).map((q) => q.year),
        },
        years,
      ),
    };
  });

  const active = rows.filter((row) => row.isActive).length;
  const healths = rows.map((row) => row.health);
  const gaps = HEALTH_CHECKS.map((check) => ({
    id: check.id,
    label: check.label,
    count: countMissing(healths, check.id),
  })).sort((first, second) => second.count - first.count);
  const topGap = gaps[0] && gaps[0].count > 0 ? gaps[0] : null;

  return (
    <AdminPage>
      <PageHeader
        title="Okullar"
        description="Kayıtların veri sağlığı, yayın durumu ve düzenleme."
        actions={
          <Link href="/admin/okullar/yeni" className={adminButton({ variant: "primary" })}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Yeni okul
          </Link>
        }
      />
      <FlashBanner success={params?.success} error={params?.error} />
      <LedgerSummary
        data={{
          active,
          passive: rows.length - active,
          incomplete: rows.filter((row) => !row.health.complete).length,
          total: rows.length,
          topGap,
          unread: unreadResult.count ?? 0,
        }}
      />
      <SchoolLedger
        rows={rows}
        nowIso={new Date().toISOString()}
        bulkStatusAction={bulkUpdateSchoolStatus}
        toggleStatusAction={toggleSchoolStatus}
        deleteAction={deleteSchool}
      />
    </AdminPage>
  );
}

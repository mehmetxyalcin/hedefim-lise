"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";

const maxImageSize = 5 * 1024 * 1024;

function toArray(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumberArray(values: FormDataEntryValue[]) {
  return [...new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  )];
}

function toNullableString(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed === "" ? null : parsed;
}

function toBoolean(value: FormDataEntryValue | null) {
  return value === "on";
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizePercentile(value: string, redirectPath: string) {
  const normalized = value.trim().replace(",", ".");

  if (!/^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/.test(normalized)) {
    redirect(
      `${redirectPath}?error=${encodeURIComponent("Yüzdelik 0-100 arasında sayısal bir değer olmalıdır.")}`,
    );
  }

  const numericValue = Number(normalized);

  if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
    redirect(
      `${redirectPath}?error=${encodeURIComponent("Yüzdelik 0 ile 100 arasında olmalıdır.")}`,
    );
  }

  return normalized;
}

function getNormalizedSlug(formData: FormData, redirectPath: string) {
  const slug = normalizeSlug(getRequiredString(formData, "slug", "Slug", redirectPath));

  if (!slug) {
    redirect(
      `${redirectPath}?error=${encodeURIComponent("Slug küçük harf, rakam veya tire içermelidir.")}`,
    );
  }

  return slug;
}


function getActionErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "23505" || error.message.toLowerCase().includes("slug")) {
    return "Bu slug zaten baska bir okul tarafindan kullaniliyor.";
  }

  return error.message;
}

function getUploadErrorMessage(error: Error) {
  const message = error.message.toLowerCase();

  if (message.includes("bucket") || message.includes("not found")) {
    return "Görsel yükleme alanı bulunamadı. Supabase storage ayarlarını kontrol edin.";
  }

  if (message.includes("payload") || message.includes("too large")) {
    return "Görsel dosyası çok büyük. Daha küçük bir dosya yükleyin.";
  }

  return error.message;
}

function redirectToAdminWithSuccess(message: string) {
  redirect(`/admin?success=${encodeURIComponent(message)}`);
}

function getRequiredString(
  formData: FormData,
  key: string,
  label: string,
  redirectPath: string,
) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    redirect(`${redirectPath}?error=${encodeURIComponent(`${label} zorunludur.`)}`);
  }

  return value;
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  slug: string,
  redirectPath: string,
  currentSchoolId?: number,
) {
  const { data, error } = await supabase
    .from("schools")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    redirect(`${redirectPath}?error=${encodeURIComponent(error.message)}`);
  }

  if (data && data.id !== currentSchoolId) {
    redirect(
      `${redirectPath}?error=${encodeURIComponent("Bu slug zaten baska bir okul tarafindan kullaniliyor.")}`,
    );
  }
}

async function uploadSchoolImage(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  slug: string,
  file: File | null,
) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Yuklenen dosya bir gorsel olmali.");
  }

  if (file.size > maxImageSize) {
    throw new Error("Görsel dosyası en fazla 5 MB olabilir.");
  }

  const fileExt = file.name.includes(".")
    ? file.name.split(".").pop()
    : "jpg";
  const fileName = `${slug}-${Date.now()}-${sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""))}.${fileExt}`;
  const filePath = `schools/${fileName}`;
  const fileBuffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("school-images")
    .upload(filePath, fileBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("school-images").getPublicUrl(filePath);
  return data.publicUrl;
}

async function syncSchoolVocationalFields(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  schoolId: number,
  vocationalFieldIds: number[],
) {
  const normalizedFieldIds = [...new Set(vocationalFieldIds)];
  const { data: existingRelations, error: existingRelationsError } = await supabase
    .from("school_vocational_fields")
    .select("vocational_field_id")
    .eq("school_id", schoolId);

  if (existingRelationsError) {
    throw new Error(existingRelationsError.message);
  }

  if (normalizedFieldIds.length > 0) {
    const { data: validFields, error: validFieldsError } = await supabase
      .from("vocational_fields")
      .select("id")
      .in("id", normalizedFieldIds);

    if (validFieldsError) {
      throw new Error(validFieldsError.message);
    }

    if ((validFields ?? []).length !== normalizedFieldIds.length) {
      throw new Error("Seçilen meslek alanlarindan biri geçersiz.");
    }
  }

  const { error: deleteError } = await supabase
    .from("school_vocational_fields")
    .delete()
    .eq("school_id", schoolId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (normalizedFieldIds.length === 0) {
    return;
  }

  const relations = normalizedFieldIds.map((vocationalFieldId) => ({
    school_id: schoolId,
    vocational_field_id: vocationalFieldId,
  }));

  const { error: insertError } = await supabase
    .from("school_vocational_fields")
    .insert(relations);

  if (insertError) {
    const previousRelations = (existingRelations ?? []).map((relation) => ({
      school_id: schoolId,
      vocational_field_id: relation.vocational_field_id,
    }));

    if (previousRelations.length > 0) {
      await supabase.from("school_vocational_fields").insert(previousRelations);
    }

    throw new Error(insertError.message);
  }
}

export async function createSchool(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  if (!profile) {
    redirect("/admin");
  }

  const redirectPath = "/admin/schools/new";
  const name = getRequiredString(formData, "name", "Okul adi", redirectPath);
  const slug = getNormalizedSlug(formData, redirectPath);
  const type = getRequiredString(formData, "type", "Tur", redirectPath);
  const district = getRequiredString(formData, "district", "İlçe", redirectPath);
  const logo = getRequiredString(formData, "logo", "Logo", redirectPath);
  const color = getRequiredString(formData, "color", "Renk sinifi", redirectPath);
  const description = getRequiredString(
    formData,
    "description",
    "Açıklama",
    redirectPath,
  );
  const vocationalFieldIds = toNumberArray(
    formData.getAll("vocational_field_ids"),
  );
  let uploadedImage: string | null = null;

  await ensureUniqueSlug(supabase, slug, redirectPath);

  try {
    uploadedImage = await uploadSchoolImage(
      supabase,
      slug,
      formData.get("image_file") as File | null,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? getUploadErrorMessage(error)
        : "Görsel yükleme başarısız oldu.";
    redirect(`${redirectPath}?error=${encodeURIComponent(message)}`);
  }

  const payload = {
    name,
    slug,
    type,
    district,
    percentile: "0",
    logo,
    color,
    description,
    address: toNullableString(formData.get("address")),
    phone: toNullableString(formData.get("phone")),
    website: toNullableString(formData.get("website")),
    images: uploadedImage ? [uploadedImage] : [],
    features: toArray(formData.get("features")),
    projects: toArray(formData.get("projects")),
    languages: toArray(formData.get("languages")),
    is_active: toBoolean(formData.get("is_active")),
    placement_type: String(formData.get("placement_type") ?? "yerel"),
    education_type: String(formData.get("education_type") ?? "normal"),
    boarding_type: String(formData.get("boarding_type") ?? "yok"),
    transportation_info: toNullableString(formData.get("transportation_info")),
    school_hours_start: toNullableString(formData.get("school_hours_start")),
    school_hours_end: toNullableString(formData.get("school_hours_end")),
    school_hours_note: toNullableString(formData.get("school_hours_note")),
    other_info: toNullableString(formData.get("other_info")),
    institution_code: toNullableString(formData.get("institution_code")),
  };

  const { data, error } = await supabase
    .from("schools")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    redirect(
      `${redirectPath}?error=${encodeURIComponent(getActionErrorMessage(error))}`,
    );
  }

  try {
    await syncSchoolVocationalFields(supabase, data.id, vocationalFieldIds);
  } catch (error) {
    await supabase.from("schools").delete().eq("id", data.id);
    const message =
      error instanceof Error ? error.message : "Meslek alanlari kaydedilemedi.";
    redirect(`${redirectPath}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/okullar");
  revalidatePath("/alanlar");
  redirectToAdminWithSuccess("Okul başarıyla eklendi.");
}

export async function updateSchool(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  if (!profile) {
    redirect("/admin");
  }

  const id = Number(formData.get("id"));
  const redirectPath = `/admin/schools/${id}/edit`;
  if (!Number.isInteger(id) || id <= 0) {
    redirect(`/admin?error=${encodeURIComponent("Geçersiz okul kaydi.")}`);
  }

  const name = getRequiredString(formData, "name", "Okul adi", redirectPath);
  const slug = getNormalizedSlug(formData, redirectPath);
  const type = getRequiredString(formData, "type", "Tur", redirectPath);
  const district = getRequiredString(formData, "district", "İlçe", redirectPath);
  const logo = getRequiredString(formData, "logo", "Logo", redirectPath);
  const color = getRequiredString(formData, "color", "Renk sinifi", redirectPath);
  const description = getRequiredString(
    formData,
    "description",
    "Açıklama",
    redirectPath,
  );
  const currentImage = String(formData.get("current_image") ?? "").trim();
  const removeImage = formData.get("remove_image") === "on";
  let uploadedImage: string | null = null;

  await ensureUniqueSlug(supabase, slug, redirectPath, id);

  try {
    uploadedImage = await uploadSchoolImage(
      supabase,
      slug,
      formData.get("image_file") as File | null,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? getUploadErrorMessage(error)
        : "Görsel yükleme başarısız oldu.";
    redirect(`${redirectPath}?error=${encodeURIComponent(message)}`);
  }

  const payload = {
    name,
    slug,
    type,
    district,
    logo,
    color,
    description,
    images: uploadedImage
      ? [uploadedImage]
      : removeImage
        ? []
        : currentImage
          ? [currentImage]
          : [],
    features: toArray(formData.get("features")),
    languages: toArray(formData.get("languages")),
    is_active: toBoolean(formData.get("is_active")),
    placement_type: String(formData.get("placement_type") ?? "yerel"),
    education_type: String(formData.get("education_type") ?? "normal"),
    boarding_type: String(formData.get("boarding_type") ?? "yok"),
    school_hours_start: toNullableString(formData.get("school_hours_start")),
    school_hours_end: toNullableString(formData.get("school_hours_end")),
    school_hours_note: toNullableString(formData.get("school_hours_note")),
    institution_code: toNullableString(formData.get("institution_code")),
  };

  const { error } = await supabase.from("schools").update(payload).eq("id", id);

  if (error) {
    redirect(
      `${redirectPath}?error=${encodeURIComponent(getActionErrorMessage(error))}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/okullar");
  revalidatePath("/alanlar");
  revalidatePath(`/okullar/${payload.slug}`);
  redirectToTab(payload.slug, "temel", "Temel bilgiler kaydedildi.");
}

export async function deleteSchool(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  if (!profile) {
    redirect("/admin");
  }

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    redirect(`/admin?error=${encodeURIComponent("Geçersiz okul kaydi.")}`);
  }

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, slug, school_vocational_fields(vocational_field_id)")
    .eq("id", id)
    .maybeSingle();

  if (schoolError || !school) {
    redirect(`/admin?error=${encodeURIComponent("Okul bulunamadı.")}`);
  }

  const { error: relationError } = await supabase
    .from("school_vocational_fields")
    .delete()
    .eq("school_id", id);

  if (relationError) {
    redirect(`/admin?error=${encodeURIComponent(relationError.message)}`);
  }

  const { error: deleteError } = await supabase.from("schools").delete().eq("id", id);

  if (deleteError) {
    const previousRelations =
      school.school_vocational_fields?.map((relation) => ({
        school_id: id,
        vocational_field_id: relation.vocational_field_id,
      })) ?? [];

    if (previousRelations.length > 0) {
      await supabase.from("school_vocational_fields").insert(previousRelations);
    }

    redirect(`/admin?error=${encodeURIComponent(deleteError.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/okullar");
  revalidatePath("/alanlar");
  revalidatePath(`/okullar/${school.slug}`);
  redirectToAdminWithSuccess("Okul başarıyla silindi.");
}

export async function toggleSchoolStatus(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  if (!profile) {
    redirect("/admin");
  }

  const id = Number(formData.get("id"));
  const nextStatus = formData.get("is_active") === "true";

  if (!Number.isInteger(id) || id <= 0) {
    redirect(`/admin?error=${encodeURIComponent("Geçersiz okul kaydi.")}`);
  }

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();

  if (schoolError || !school) {
    redirect(`/admin?error=${encodeURIComponent("Okul bulunamadı.")}`);
  }

  const { error } = await supabase
    .from("schools")
    .update({ is_active: nextStatus })
    .eq("id", id);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/okullar");
  revalidatePath("/alanlar");
  revalidatePath(`/okullar/${school.slug}`);
  redirectToAdminWithSuccess(
    nextStatus ? "Okul aktif hale getirildi." : "Okul pasif hale getirildi.",
  );
}

export async function bulkUpdateSchoolStatus(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  if (!profile) {
    redirect("/admin");
  }

  const ids = toNumberArray(formData.getAll("ids"));
  const nextStatus = formData.get("is_active") === "true";

  if (ids.length === 0) {
    redirect(`/admin?error=${encodeURIComponent("İşlem için okul seçin.")}`);
  }

  const { data: schools, error: schoolsError } = await supabase
    .from("schools")
    .select("id, slug")
    .in("id", ids);

  if (schoolsError) {
    redirect(`/admin?error=${encodeURIComponent(schoolsError.message)}`);
  }

  if ((schools ?? []).length === 0) {
    redirect(`/admin?error=${encodeURIComponent("Seçilen okullar bulunamadı.")}`);
  }

  const validIds = (schools ?? []).map((school) => school.id);

  if (validIds.length !== ids.length) {
    redirect(
      `/admin?error=${encodeURIComponent("Seçilen okullardan bazıları bulunamadı. Listeyi yenileyip tekrar deneyin.")}`,
    );
  }

  const { error } = await supabase
    .from("schools")
    .update({ is_active: nextStatus })
    .in("id", validIds);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/okullar");
  revalidatePath("/alanlar");
  for (const school of schools ?? []) {
    revalidatePath(`/okullar/${school.slug}`);
  }

  redirectToAdminWithSuccess(
    `${validIds.length} okul ${nextStatus ? "aktif" : "pasif"} hale getirildi.`,
  );
}

// ─────────────────────────────────────────────────────────────────
// Yardımcı: okul slug'ını ID'den çek
// ─────────────────────────────────────────────────────────────────

async function getSchoolSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  schoolId: number,
): Promise<string> {
  const { data } = await supabase
    .from("schools")
    .select("slug")
    .eq("id", schoolId)
    .maybeSingle();
  return data?.slug ?? "";
}

function redirectToTab(slug: string, tab: string, success?: string) {
  const base = `/admin/okullar/${slug}/duzenle?tab=${tab}`;
  if (success) {
    return redirect(`${base}&success=${encodeURIComponent(success)}`);
  }
  return redirect(base);
}

// ─────────────────────────────────────────────────────────────────
// İletişim (Tab 2) — kısmi güncelleme
// ─────────────────────────────────────────────────────────────────

export async function updateSchoolContact(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = Number(formData.get("school_id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin");

  const { error } = await supabase
    .from("schools")
    .update({
      address: toNullableString(formData.get("address")),
      phone: toNullableString(formData.get("phone")),
      website: toNullableString(formData.get("website")),
      transportation_info: toNullableString(formData.get("transportation_info")),
    })
    .eq("id", id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, id);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "iletisim", "İletişim bilgileri kaydedildi.");
}

// ─────────────────────────────────────────────────────────────────
// Diğer Bilgiler (Tab 8) — kısmi güncelleme
// ─────────────────────────────────────────────────────────────────

export async function updateSchoolOtherInfo(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = Number(formData.get("school_id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin");

  const { error } = await supabase
    .from("schools")
    .update({ other_info: toNullableString(formData.get("other_info")) })
    .eq("id", id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, id);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "diger", "Bilgiler kaydedildi.");
}

// ─────────────────────────────────────────────────────────────────
// Puanlar — Tab 3
// ─────────────────────────────────────────────────────────────────

export async function upsertSchoolScore(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const schoolId = Number(formData.get("school_id"));
  const year = Number(formData.get("year"));
  if (!schoolId || !year) redirect("/admin");

  const id = String(formData.get("id") ?? "").trim() || null;
  const rawFieldId = String(formData.get("vocational_field_id") ?? "").trim();
  const vocationalFieldId = rawFieldId ? Number(rawFieldId) : null;

  const toOptionalNumeric = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim().replace(",", ".");
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  };

  const payload = {
    school_id: schoolId,
    year,
    vocational_field_id: vocationalFieldId,
    obp_score: toOptionalNumeric("obp_score"),
    lgs_score: toOptionalNumeric("lgs_score"),
    percentile: toOptionalNumeric("percentile"),
  };

  let error;
  if (id) {
    ({ error } = await supabase.from("school_scores").update(payload).eq("id", id));
  } else {
    ({ error } = await supabase.from("school_scores").insert(payload));
  }

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "puanlar", `${year} puanları kaydedildi.`);
}

export async function deleteSchoolScore(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const schoolId = Number(formData.get("school_id"));

  const { error } = await supabase.from("school_scores").delete().eq("id", id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "puanlar", "Puan kaydı silindi.");
}

// ─────────────────────────────────────────────────────────────────
// Kontenjan — Tab 3
// ─────────────────────────────────────────────────────────────────

export async function upsertSchoolQuota(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const schoolId = Number(formData.get("school_id"));
  const year = Number(formData.get("year"));
  if (!schoolId || !year) redirect("/admin");

  const toOptionalInt = (key: string) => {
    const n = parseInt(String(formData.get(key) ?? ""), 10);
    return isNaN(n) ? null : n;
  };

  const { error } = await supabase.from("school_quotas").upsert(
    {
      school_id: schoolId,
      year,
      sinavli_count: toOptionalInt("sinavli_count"),
      sinavsiz_count: toOptionalInt("sinavsiz_count"),
    },
    { onConflict: "school_id,year" },
  );

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "puanlar", `${year} kontenjanı kaydedildi.`);
}

export async function deleteSchoolQuota(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const schoolId = Number(formData.get("school_id"));

  const { error } = await supabase.from("school_quotas").delete().eq("id", id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "puanlar", "Kontenjan kaydı silindi.");
}

// ─────────────────────────────────────────────────────────────────
// Tesisler — Tab 4
// ─────────────────────────────────────────────────────────────────

export async function syncSchoolFacilities(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const schoolId = Number(formData.get("school_id"));
  if (!schoolId) redirect("/admin");

  const facilityIds = formData.getAll("facility_ids").map(String).filter(Boolean);

  await supabase.from("school_facilities").delete().eq("school_id", schoolId);

  if (facilityIds.length > 0) {
    const rows = facilityIds.map((fid) => ({ school_id: schoolId, facility_id: fid }));
    const { error } = await supabase.from("school_facilities").insert(rows);
    if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "tesisler", "Tesisler kaydedildi.");
}

export async function addSchoolFacility(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const name = toNullableString(formData.get("name"));
  if (!name) redirect("/admin");

  const { error } = await supabase.from("facilities").insert({ name });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  redirect(`/admin/okullar`);
}

// ─────────────────────────────────────────────────────────────────
// Meslek Alanları & Dallar — Tab 5
// ─────────────────────────────────────────────────────────────────

export async function syncSchoolVocationalFull(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const schoolId = Number(formData.get("school_id"));
  if (!schoolId) redirect("/admin");

  const fieldIds = toNumberArray(formData.getAll("vocational_field_ids"));
  const branchIds = formData.getAll("branch_ids").map(String).filter(Boolean);

  // Mevcut meslek alanı ilişkilerini güncelle
  await syncSchoolVocationalFields(supabase, schoolId, fieldIds);

  // Dal junction'ını güncelle
  await supabase.from("school_vocational_branches").delete().eq("school_id", schoolId);
  if (branchIds.length > 0) {
    const rows = branchIds.map((bid) => ({ school_id: schoolId, branch_id: bid }));
    const { error } = await supabase.from("school_vocational_branches").insert(rows);
    if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "meslekler", "Meslek alanları ve dallar kaydedildi.");
}

export async function addVocationalBranch(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const fieldId = Number(formData.get("vocational_field_id"));
  const name = toNullableString(formData.get("name"));
  if (!fieldId || !name) redirect("/admin");

  const { error } = await supabase
    .from("vocational_branches")
    .insert({ vocational_field_id: fieldId, name });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect(`?tab=meslekler`);
}

// ─────────────────────────────────────────────────────────────────
// Burslar — Tab 6
// ─────────────────────────────────────────────────────────────────

export async function addSchoolScholarship(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const schoolId = Number(formData.get("school_id"));
  const title = toNullableString(formData.get("title"));
  if (!schoolId || !title) redirect("/admin");

  const { data: existing } = await supabase
    .from("school_scholarships")
    .select("order_index")
    .eq("school_id", schoolId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (existing?.order_index ?? -1) + 1;

  const { error } = await supabase.from("school_scholarships").insert({
    school_id: schoolId,
    title,
    description: toNullableString(formData.get("description")),
    amount_info: toNullableString(formData.get("amount_info")),
    order_index: nextOrder,
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "burslar", "Burs eklendi.");
}

export async function updateSchoolScholarship(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const schoolId = Number(formData.get("school_id"));
  const title = toNullableString(formData.get("title"));
  if (!title) redirect(`/admin`);

  const { error } = await supabase
    .from("school_scholarships")
    .update({
      title,
      description: toNullableString(formData.get("description")),
      amount_info: toNullableString(formData.get("amount_info")),
    })
    .eq("id", id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "burslar", "Burs güncellendi.");
}

export async function deleteSchoolScholarship(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const schoolId = Number(formData.get("school_id"));

  const { error } = await supabase.from("school_scholarships").delete().eq("id", id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "burslar", "Burs silindi.");
}

export async function reorderSchoolScholarship(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const schoolId = Number(formData.get("school_id"));
  const direction = String(formData.get("direction") ?? "");

  const { data: items } = await supabase
    .from("school_scholarships")
    .select("id, order_index")
    .eq("school_id", schoolId)
    .order("order_index");

  if (!items) redirect(`/admin/okullar`);

  const idx = items.findIndex((i) => i.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) redirect(`?tab=burslar`);

  const a = items[idx];
  const b = items[swapIdx];

  await supabase.from("school_scholarships").update({ order_index: b.order_index }).eq("id", a.id);
  await supabase.from("school_scholarships").update({ order_index: a.order_index }).eq("id", b.id);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirect(`/admin/okullar/${slug}/duzenle?tab=burslar`);
}

// ─────────────────────────────────────────────────────────────────
// Projeler — Tab 7
// ─────────────────────────────────────────────────────────────────

async function uploadProjectImage(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  schoolSlug: string,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("Görsel dosyası gerekli.");
  if (file.size > maxImageSize) throw new Error("Görsel en fazla 5 MB olabilir.");

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `projects/${schoolSlug}-${Date.now()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("school-images")
    .upload(fileName, buffer, { contentType: file.type, upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("school-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function addSchoolProject(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const schoolId = Number(formData.get("school_id"));
  const title = toNullableString(formData.get("title"));
  if (!schoolId || !title) redirect("/admin");

  const slug = await getSchoolSlug(supabase, schoolId);

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadProjectImage(supabase, slug, formData.get("image_file") as File | null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Görsel yüklenemedi.";
    redirect(`/admin?error=${encodeURIComponent(msg)}`);
  }

  const { data: existing } = await supabase
    .from("school_projects")
    .select("order_index")
    .eq("school_id", schoolId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("school_projects").insert({
    school_id: schoolId,
    title,
    description: toNullableString(formData.get("description")),
    link_url: toNullableString(formData.get("link_url")),
    image_url: imageUrl,
    order_index: (existing?.order_index ?? -1) + 1,
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "projeler", "Proje eklendi.");
}

export async function updateSchoolProject(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const schoolId = Number(formData.get("school_id"));
  const title = toNullableString(formData.get("title"));
  if (!title) redirect("/admin");

  const slug = await getSchoolSlug(supabase, schoolId);

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadProjectImage(supabase, slug, formData.get("image_file") as File | null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Görsel yüklenemedi.";
    redirect(`/admin?error=${encodeURIComponent(msg)}`);
  }

  const updateData: Record<string, unknown> = {
    title,
    description: toNullableString(formData.get("description")),
    link_url: toNullableString(formData.get("link_url")),
  };
  if (imageUrl) updateData.image_url = imageUrl;

  const { error } = await supabase.from("school_projects").update(updateData).eq("id", id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "projeler", "Proje güncellendi.");
}

export async function deleteSchoolProject(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const schoolId = Number(formData.get("school_id"));

  const { error } = await supabase.from("school_projects").delete().eq("id", id);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirectToTab(slug, "projeler", "Proje silindi.");
}

export async function reorderSchoolProject(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const schoolId = Number(formData.get("school_id"));
  const direction = String(formData.get("direction") ?? "");

  const { data: items } = await supabase
    .from("school_projects")
    .select("id, order_index")
    .eq("school_id", schoolId)
    .order("order_index");

  if (!items) redirect(`?tab=projeler`);

  const idx = items.findIndex((i) => i.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) redirect(`?tab=projeler`);

  const a = items[idx];
  const b = items[swapIdx];

  await supabase.from("school_projects").update({ order_index: b.order_index }).eq("id", a.id);
  await supabase.from("school_projects").update({ order_index: a.order_index }).eq("id", b.id);

  const slug = await getSchoolSlug(supabase, schoolId);
  revalidatePath(`/okullar/${slug}`);
  redirect(`/admin/okullar/${slug}/duzenle?tab=projeler`);
}

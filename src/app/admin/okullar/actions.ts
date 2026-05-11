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
  const percentile = normalizePercentile(
    getRequiredString(formData, "percentile", "Yüzdelik", redirectPath),
    redirectPath,
  );
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
    percentile,
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
  const percentile = normalizePercentile(
    getRequiredString(formData, "percentile", "Yüzdelik", redirectPath),
    redirectPath,
  );
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
  const vocationalFieldIds = toNumberArray(
    formData.getAll("vocational_field_ids"),
  );
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
    percentile,
    logo,
    color,
    description,
    address: toNullableString(formData.get("address")),
    phone: toNullableString(formData.get("phone")),
    website: toNullableString(formData.get("website")),
    images: uploadedImage
      ? [uploadedImage]
      : removeImage
        ? []
        : currentImage
          ? [currentImage]
          : [],
    features: toArray(formData.get("features")),
    projects: toArray(formData.get("projects")),
    languages: toArray(formData.get("languages")),
    is_active: toBoolean(formData.get("is_active")),
  };

  const { error } = await supabase.from("schools").update(payload).eq("id", id);

  if (error) {
    redirect(
      `${redirectPath}?error=${encodeURIComponent(getActionErrorMessage(error))}`,
    );
  }

  try {
    await syncSchoolVocationalFields(supabase, id, vocationalFieldIds);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meslek alanlari kaydedilemedi.";
    redirect(`${redirectPath}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/okullar");
  revalidatePath("/alanlar");
  revalidatePath(`/okullar/${payload.slug}`);
  redirectToAdminWithSuccess("Okul başarıyla güncellendi.");
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

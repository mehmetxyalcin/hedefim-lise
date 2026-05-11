"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { SITE_SETTINGS_ID, FOOTER_SETTINGS_ID } from "@/lib/site-settings";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
];

function revalidateSiteLayout() {
  revalidateTag("site-settings", {});
  revalidateTag("navigation-items", {});
  revalidateTag("footer-settings", {});
  revalidateTag("footer-links", {});
  revalidateTag("social-links", {});
  revalidatePath("/", "layout");
}

function toNullableString(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

function getRequired(
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

// ─────────────────────────────────────────────────────────────
// Site Settings
// ─────────────────────────────────────────────────────────────

async function uploadLogoFile(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    throw new Error("Logo dosyası PNG, JPG, SVG veya WebP formatında olmalıdır.");
  }

  if (file.size > MAX_LOGO_SIZE) {
    throw new Error("Logo dosyası en fazla 2 MB olabilir.");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const fileName = `logo-${Date.now()}.${ext}`;
  const filePath = `logos/${fileName}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("site-assets").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function updateSiteSettings(formData: FormData) {
  const { supabase, user, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const redirectPath = "/admin/site-settings";
  const site_title = getRequired(formData, "site_title", "Site başlığı", redirectPath);
  const logo_alt = getRequired(formData, "logo_alt", "Logo alt metni", redirectPath);
  const current_logo_url = toNullableString(formData.get("current_logo_url"));

  let logo_url: string | null = current_logo_url;

  try {
    const uploaded = await uploadLogoFile(
      supabase,
      formData.get("logo_file") as File | null,
    );
    if (uploaded) logo_url = uploaded;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Logo yüklenemedi.";
    redirect(`${redirectPath}?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("site_settings").upsert(
    {
      id: SITE_SETTINGS_ID,
      site_title,
      logo_alt,
      logo_url,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "id" },
  );

  if (error) {
    redirect(`${redirectPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("site-settings", {});
  revalidatePath("/", "layout");
  revalidatePath(redirectPath);
  redirect(`${redirectPath}?success=${encodeURIComponent("Site ayarları kaydedildi.")}`);
}

// ─────────────────────────────────────────────────────────────
// Navigation Items
// ─────────────────────────────────────────────────────────────

const NAV_REDIRECT = "/admin/site-settings/navigation";

export async function createNavigationItem(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const label = getRequired(formData, "label", "Etiket", NAV_REDIRECT);
  const href = getRequired(formData, "href", "Bağlantı", NAV_REDIRECT);
  const target = String(formData.get("target") ?? "_self");

  const { data: last } = await supabase
    .from("navigation_items")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const order_index = (last?.order_index ?? -1) + 1;

  const { error } = await supabase.from("navigation_items").insert({
    label,
    href,
    target,
    order_index,
    is_visible: true,
  });

  if (error) {
    redirect(`${NAV_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("navigation-items", {});
  revalidatePath("/", "layout");
  revalidatePath(NAV_REDIRECT);
  redirect(`${NAV_REDIRECT}?success=${encodeURIComponent("Menü öğesi eklendi.")}`);
}

export async function updateNavigationItem(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(`${NAV_REDIRECT}?error=${encodeURIComponent("Geçersiz kayıt.")}`);

  const label = getRequired(formData, "label", "Etiket", NAV_REDIRECT);
  const href = getRequired(formData, "href", "Bağlantı", NAV_REDIRECT);
  const target = String(formData.get("target") ?? "_self");
  const is_visible = formData.get("is_visible") === "on";

  const { error } = await supabase
    .from("navigation_items")
    .update({ label, href, target, is_visible, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`${NAV_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("navigation-items", {});
  revalidatePath("/", "layout");
  revalidatePath(NAV_REDIRECT);
  redirect(`${NAV_REDIRECT}?success=${encodeURIComponent("Menü öğesi güncellendi.")}`);
}

export async function deleteNavigationItem(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(`${NAV_REDIRECT}?error=${encodeURIComponent("Geçersiz kayıt.")}`);

  const { error } = await supabase
    .from("navigation_items")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`${NAV_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("navigation-items", {});
  revalidatePath("/", "layout");
  revalidatePath(NAV_REDIRECT);
  redirect(`${NAV_REDIRECT}?success=${encodeURIComponent("Menü öğesi silindi.")}`);
}

export async function moveNavigationItem(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "");

  if (!id || (direction !== "up" && direction !== "down")) {
    redirect(NAV_REDIRECT);
  }

  const { data: items } = await supabase
    .from("navigation_items")
    .select("id, order_index")
    .order("order_index");

  if (!items || items.length < 2) redirect(NAV_REDIRECT);

  const currentPos = items.findIndex((item) => item.id === id);
  if (currentPos === -1) redirect(NAV_REDIRECT);

  const swapPos = direction === "up" ? currentPos - 1 : currentPos + 1;
  if (swapPos < 0 || swapPos >= items.length) redirect(NAV_REDIRECT);

  const current = items[currentPos];
  const swap = items[swapPos];

  // order_index değerlerini karşılıklı değiştir
  const { error: err1 } = await supabase
    .from("navigation_items")
    .update({ order_index: swap.order_index })
    .eq("id", current.id);

  const { error: err2 } = await supabase
    .from("navigation_items")
    .update({ order_index: current.order_index })
    .eq("id", swap.id);

  if (err1 || err2) {
    redirect(`${NAV_REDIRECT}?error=${encodeURIComponent("Sıralama güncellenemedi.")}`);
  }

  revalidateTag("navigation-items", {});
  revalidatePath("/", "layout");
  revalidatePath(NAV_REDIRECT);
  redirect(NAV_REDIRECT);
}

export async function toggleNavigationItemVisibility(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "").trim();
  const is_visible = formData.get("is_visible") === "true";

  if (!id) redirect(NAV_REDIRECT);

  const { error } = await supabase
    .from("navigation_items")
    .update({ is_visible, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`${NAV_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("navigation-items", {});
  revalidatePath("/", "layout");
  revalidatePath(NAV_REDIRECT);
  redirect(NAV_REDIRECT);
}

// ─────────────────────────────────────────────────────────────
// Footer Settings
// ─────────────────────────────────────────────────────────────

const FOOTER_REDIRECT = "/admin/site-settings/footer";

export async function updateFooterSettings(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const copyright_text = getRequired(
    formData,
    "copyright_text",
    "Telif hakkı metni",
    FOOTER_REDIRECT,
  );

  const { error } = await supabase.from("footer_settings").upsert(
    {
      id: FOOTER_SETTINGS_ID,
      about_text: toNullableString(formData.get("about_text")),
      copyright_text,
      contact_email: toNullableString(formData.get("contact_email")),
      contact_phone: toNullableString(formData.get("contact_phone")),
      address: toNullableString(formData.get("address")),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    redirect(`${FOOTER_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("footer-settings", {});
  revalidatePath("/", "layout");
  revalidatePath(FOOTER_REDIRECT);
  redirect(`${FOOTER_REDIRECT}?success=${encodeURIComponent("Footer ayarları kaydedildi.")}`);
}

export async function createFooterLink(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const section = getRequired(formData, "section", "Bölüm", FOOTER_REDIRECT);
  const label = getRequired(formData, "label", "Etiket", FOOTER_REDIRECT);
  const href = getRequired(formData, "href", "Bağlantı", FOOTER_REDIRECT);

  const { data: last } = await supabase
    .from("footer_links")
    .select("order_index")
    .eq("section", section)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("footer_links").insert({
    section,
    label,
    href,
    order_index: (last?.order_index ?? -1) + 1,
    is_visible: true,
  });

  if (error) {
    redirect(`${FOOTER_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("footer-links", {});
  revalidatePath("/", "layout");
  revalidatePath(FOOTER_REDIRECT);
  redirect(`${FOOTER_REDIRECT}?success=${encodeURIComponent("Link eklendi.")}`);
}

export async function deleteFooterLink(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(FOOTER_REDIRECT);

  const { error } = await supabase.from("footer_links").delete().eq("id", id);

  if (error) {
    redirect(`${FOOTER_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("footer-links", {});
  revalidatePath("/", "layout");
  revalidatePath(FOOTER_REDIRECT);
  redirect(`${FOOTER_REDIRECT}?success=${encodeURIComponent("Link silindi.")}`);
}

export async function createSocialLink(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const platform = getRequired(formData, "platform", "Platform", FOOTER_REDIRECT);
  const url = getRequired(formData, "url", "URL", FOOTER_REDIRECT);

  const { data: last } = await supabase
    .from("footer_social_links")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("footer_social_links").insert({
    platform,
    url,
    order_index: (last?.order_index ?? -1) + 1,
    is_visible: true,
  });

  if (error) {
    redirect(`${FOOTER_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("social-links", {});
  revalidatePath("/", "layout");
  revalidatePath(FOOTER_REDIRECT);
  redirect(`${FOOTER_REDIRECT}?success=${encodeURIComponent("Sosyal medya linki eklendi.")}`);
}

export async function deleteSocialLink(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(FOOTER_REDIRECT);

  const { error } = await supabase
    .from("footer_social_links")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(`${FOOTER_REDIRECT}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateTag("social-links", {});
  revalidatePath("/", "layout");
  revalidatePath(FOOTER_REDIRECT);
  redirect(`${FOOTER_REDIRECT}?success=${encodeURIComponent("Sosyal medya linki silindi.")}`);
}

// revalidateSiteLayout aşağıda kullanılabilir; şimdilik yalnızca yukarıdaki
// aksiyon içlerinde inline çağrılıyor
void revalidateSiteLayout;

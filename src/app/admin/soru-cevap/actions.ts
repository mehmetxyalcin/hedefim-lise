"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";

const REDIRECT_PATH = "/admin/soru-cevap";
const DEFAULT_SOURCE =
  "2026 Yılı Ortaöğretime Geçiş Tercih ve Yerleştirme Kılavuzu";

function requiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    redirect(
      `${REDIRECT_PATH}?error=${encodeURIComponent(`${label} zorunludur.`)}`,
    );
  }
  return value;
}

function optionalInteger(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

function refreshFaqs() {
  revalidateTag("faqs", {});
  revalidatePath("/soru-cevap");
  revalidatePath(REDIRECT_PATH);
}

export async function createFaq(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const question = requiredText(formData, "question", "Soru");
  const answer = requiredText(formData, "answer", "Yanıt");
  const category = requiredText(formData, "category", "Kategori");
  const sortOrder = optionalInteger(formData, "sort_order") ?? 0;
  const sourcePage = optionalInteger(formData, "source_page");

  const { error } = await supabase.from("faqs").insert({
    question,
    answer,
    category,
    sort_order: sortOrder,
    is_published: formData.get("is_published") === "on",
    source_title: DEFAULT_SOURCE,
    source_page: sourcePage,
  });

  if (error) {
    redirect(`${REDIRECT_PATH}?error=${encodeURIComponent(error.message)}`);
  }

  refreshFaqs();
  redirect(
    `${REDIRECT_PATH}?success=${encodeURIComponent("Soru-cevap eklendi.")}`,
  );
}

export async function updateFaq(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = requiredText(formData, "id", "Kayıt");
  const question = requiredText(formData, "question", "Soru");
  const answer = requiredText(formData, "answer", "Yanıt");
  const category = requiredText(formData, "category", "Kategori");
  const sortOrder = optionalInteger(formData, "sort_order") ?? 0;
  const sourcePage = optionalInteger(formData, "source_page");

  const { error } = await supabase
    .from("faqs")
    .update({
      question,
      answer,
      category,
      sort_order: sortOrder,
      is_published: formData.get("is_published") === "on",
      source_title: DEFAULT_SOURCE,
      source_page: sourcePage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`${REDIRECT_PATH}?error=${encodeURIComponent(error.message)}`);
  }

  refreshFaqs();
  redirect(
    `${REDIRECT_PATH}?success=${encodeURIComponent("Soru-cevap güncellendi.")}`,
  );
}

export async function deleteFaq(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  if (!profile) redirect("/admin");

  const id = requiredText(formData, "id", "Kayıt");
  const { error } = await supabase.from("faqs").delete().eq("id", id);

  if (error) {
    redirect(`${REDIRECT_PATH}?error=${encodeURIComponent(error.message)}`);
  }

  refreshFaqs();
  redirect(
    `${REDIRECT_PATH}?success=${encodeURIComponent("Soru-cevap silindi.")}`,
  );
}

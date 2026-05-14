"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";

function slugify(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export async function addVocationalField(name: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Meslek alanı adı zorunludur.");

  const { error } = await supabase
    .from("vocational_fields")
    .insert({ title: trimmed, slug: slugify(trimmed) });

  if (error) {
    if (error.code === "23505") throw new Error("Bu isimde bir meslek alanı zaten mevcut.");
    throw new Error(error.message);
  }
  revalidatePath("/admin/meslek-alanlari");
}

export async function updateVocationalField(id: string, name: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Meslek alanı adı zorunludur.");

  const { error } = await supabase
    .from("vocational_fields")
    .update({ title: trimmed, slug: slugify(trimmed) })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") throw new Error("Bu isimde bir meslek alanı zaten mevcut.");
    throw new Error(error.message);
  }
  revalidatePath("/admin/meslek-alanlari");
}

export async function deleteVocationalField(id: string): Promise<void> {
  const { supabase } = await requireAdmin();

  // Bu alana ait dal ID'lerini çek
  const { data: branches } = await supabase
    .from("vocational_branches")
    .select("id")
    .eq("vocational_field_id", id);

  const branchIds = (branches ?? []).map((b) => b.id as string);

  // 1. Okullardaki dal bağlantılarını sil
  if (branchIds.length > 0) {
    await supabase.from("school_vocational_branches").delete().in("branch_id", branchIds);
  }
  // 2. Okullardaki alan bağlantılarını sil
  await supabase.from("school_vocational_fields").delete().eq("vocational_field_id", id);
  // 3. Dalları sil
  await supabase.from("vocational_branches").delete().eq("vocational_field_id", id);
  // 4. Alanı sil
  const { error } = await supabase.from("vocational_fields").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/meslek-alanlari");
}

export async function addBranch(vocationalFieldId: string, name: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Dal adı zorunludur.");

  const { error } = await supabase
    .from("vocational_branches")
    .insert({ name: trimmed, vocational_field_id: vocationalFieldId });

  if (error) {
    if (error.code === "23505") throw new Error("Bu isimde bir dal zaten mevcut.");
    throw new Error(error.message);
  }
  revalidatePath("/admin/meslek-alanlari");
}

export async function updateBranch(id: string, name: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Dal adı zorunludur.");

  const { error } = await supabase
    .from("vocational_branches")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") throw new Error("Bu isimde bir dal zaten mevcut.");
    throw new Error(error.message);
  }
  revalidatePath("/admin/meslek-alanlari");
}

export async function deleteBranch(id: string): Promise<void> {
  const { supabase } = await requireAdmin();

  // 1. Okullardaki dal bağlantısını sil
  await supabase.from("school_vocational_branches").delete().eq("branch_id", id);
  // 2. Dalı sil
  const { error } = await supabase.from("vocational_branches").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/meslek-alanlari");
}

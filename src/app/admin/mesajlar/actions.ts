"use server";

import { revalidatePath } from "next/cache";
import { validateAdminValues, managementRules } from "@/lib/admin-form-validation";
import { requireAdmin } from "@/lib/admin-auth";

export async function markMessageStatus(
  id: string,
  status: "read" | "replied",
): Promise<void> {
  const { supabase } = await requireAdmin();
  const validationError = validateAdminValues({ id, status }, managementRules.message);
  if (validationError) throw new Error(validationError);

  const { error } = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id).select("id").single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/mesajlar");
}

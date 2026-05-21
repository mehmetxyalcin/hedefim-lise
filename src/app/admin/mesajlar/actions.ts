"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";

export async function markMessageStatus(
  id: string,
  status: "read" | "replied",
): Promise<void> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/mesajlar");
}

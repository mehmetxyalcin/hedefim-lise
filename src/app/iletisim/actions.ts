"use server";

import { createClient } from "@/lib/supabase/server";

export type ContactFormPayload = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  schoolId: number | null;
  schoolNameText: string;
  message: string;
};

export type ContactResult = { success: true } | { success: false; error: string };

export async function sendContactMessage(payload: ContactFormPayload): Promise<ContactResult> {
  const { name, email, subject, message } = payload;

  if (!name.trim()) return { success: false, error: "Ad Soyad zorunludur." };
  if (!email.trim()) return { success: false, error: "E-posta adresi zorunludur." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return { success: false, error: "Geçerli bir e-posta adresi girin." };
  if (!subject.trim()) return { success: false, error: "Konu seçimi zorunludur." };
  if (!message.trim()) return { success: false, error: "Mesaj alanı zorunludur." };
  if (message.trim().length < 20)
    return { success: false, error: "Mesajınız en az 20 karakter olmalıdır." };

  const supabase = await createClient();

  const { error } = await supabase.from("contact_messages").insert({
    name: name.trim(),
    email: email.trim(),
    phone: payload.phone.trim() || null,
    subject: subject.trim(),
    school_id: payload.schoolId,
    school_name_text: payload.schoolNameText.trim() || null,
    message: message.trim(),
    status: "unread",
  });

  if (error) {
    return { success: false, error: "Mesajınız gönderilemedi. Lütfen tekrar deneyin." };
  }

  return { success: true };
}

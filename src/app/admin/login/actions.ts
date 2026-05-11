"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("wrong password")
  ) {
    return "E-posta adresi veya şifre hatalı.";
  }

  if (lower.includes("email not confirmed")) {
    return "E-posta adresiniz henüz doğrulanmamış.";
  }

  if (
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "Çok fazla başarısız giriş denemesi. Lütfen birkaç dakika bekleyip tekrar deneyin.";
  }

  if (lower.includes("user not found") || lower.includes("no user")) {
    return "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.";
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }

  return "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.";
}

function getSafeNext(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/admin") ||
    value.startsWith("//") ||
    value.startsWith("/admin/login")
  ) {
    return "/admin";
  }
  return value;
}

export async function signInAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = getSafeNext(String(formData.get("next") ?? ""));

  const loginRedirect = (msg: string) =>
    redirect(`/admin/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`);

  if (!email || !password) {
    loginRedirect("E-posta ve şifre zorunludur.");
  }

  if (password.length < 8) {
    loginRedirect("Şifre en az 8 karakter olmalıdır.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    loginRedirect(
      error ? getAuthErrorMessage(error.message) : "Giriş yapılamadı. Lütfen tekrar deneyin.",
    );
  }

  // Admin rol kontrolü
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user!.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    await supabase.auth.signOut();
    loginRedirect(
      "Bu hesabın yönetici yetkisi bulunmuyor. Farklı bir hesapla giriş yapın.",
    );
  }

  redirect(next);
}

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

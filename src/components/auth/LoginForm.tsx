"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrlWithPath } from "@/lib/site";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const supabase = createClient();
    const callbackPath = "/auth/callback?next=/admin";
    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL
        ? getSiteUrlWithPath(callbackPath)
        : `${window.location.origin}${callbackPath}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus("Giris baglantisi gonderilemedi. E-posta adresinizi ve Supabase redirect ayarlarinizi kontrol edin.");
      setIsSubmitting(false);
      return;
    }

    setStatus("Giris baglantisi e-posta adresinize gonderildi.");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          E-posta
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ornek@site.com"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Gonderiliyor..." : "E-posta ile Giris Yap"}
      </button>

      {status && (
        <p className="text-sm text-slate-600" role="status">
          {status}
        </p>
      )}
    </form>
  );
}

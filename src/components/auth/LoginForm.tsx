"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type LoginFormProps = {
  nextPath?: string;
};

function getSafeNextPath(nextPath?: string) {
  if (
    !nextPath ||
    !nextPath.startsWith("/admin") ||
    nextPath.startsWith("//") ||
    nextPath.startsWith("/admin/login")
  ) {
    return "/admin";
  }

  return nextPath;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const supabase = createClient();
    const callbackPath = `/auth/callback?next=${encodeURIComponent(
      getSafeNextPath(nextPath),
    )}`;
    const redirectTo = new URL(callbackPath, window.location.origin).toString();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus(
        `Giriş bağlantısı gönderilemedi: ${error.message}`,
      );
      setIsSubmitting(false);
      return;
    }

    setStatus("Giriş bağlantısı e-posta adresinize gönderildi.");
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

      <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Gönderiliyor..." : "E-posta ile Giriş Yap"}
      </Button>

      {status && (
        <p className="text-sm text-slate-600" role="status">
          {status}
        </p>
      )}
    </form>
  );
}

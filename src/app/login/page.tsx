import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Admin Girişi",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900">
          Admin Girişi
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          Devam etmek için e-posta adresinizle giriş bağlantısı isteyin.
        </p>
        {params?.error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {params.error}
          </div>
        )}
        <LoginForm nextPath={params?.next} />
      </div>
    </div>
  );
}

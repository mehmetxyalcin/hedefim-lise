import { headers } from "next/headers";
import { signOutAdmin } from "./login/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login";

  return (
    <>
      {!isLoginPage && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-2">
          <span className="text-xs font-medium text-slate-400">
            Yönetim Paneli
          </span>
          <form action={signOutAdmin}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-rose-700"
            >
              Çıkış Yap
            </button>
          </form>
        </div>
      )}
      {children}
    </>
  );
}

import { cookies, headers } from "next/headers";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminFrame } from "@/components/admin/shell/AdminFrame";
import { ADMIN_SIDEBAR_COOKIE } from "@/components/admin/shell/nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <div className="admin flex min-h-screen w-full flex-1">{children}</div>;
  }

  // Yalnız kabuk verisi içindir; her sayfa kendi requireAdmin() kontrolünü yapar.
  const { supabase, user, profile } = await requireAdmin();
  const [cookieStore, schoolsResult, unreadResult, questionsResult] = await Promise.all([
    cookies(),
    supabase.from("schools").select("id, name, slug, district").order("name"),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread"),
    // Tablo henüz yoksa (migration 021 uygulanmadıysa) sorgu hata verir; sayaç 0 kalır.
    supabase
      .from("question_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);
  const schools = schoolsResult.data ?? [];

  return (
    <AdminFrame
      collapsed={cookieStore.get(ADMIN_SIDEBAR_COOKIE)?.value === "collapsed"}
      email={profile.email ?? user.email ?? ""}
      unreadCount={unreadResult.count ?? 0}
      questionCount={questionsResult.count ?? 0}
      schoolCount={schools.length}
      schools={schools}
    >
      {children}
    </AdminFrame>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPage } from "@/components/admin/ui/AdminPage";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { AuthorForm } from "@/components/admin/blog/AuthorForm";
import { saveBlogAuthor } from "../actions";

export const metadata: Metadata = {
  title: "Yeni yazar | Yönetim",
  robots: { index: false, follow: false },
};

export default async function AdminNewBlogAuthorPage() {
  await requireAdmin();
  return (
    <AdminPage width="form">
      <PageHeader
        trail={[
          { label: "Blog", href: "/admin/blog" },
          { label: "Yazarlar", href: "/admin/blog/yazarlar" },
        ]}
        title="Yeni yazar"
      />
      <AuthorForm author={null} action={saveBlogAuthor} />
    </AdminPage>
  );
}

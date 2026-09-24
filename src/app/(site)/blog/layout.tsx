import { BlogFrame } from "@/components/blog/BlogFrame";

// Blog, sitenin ortak üst menüsü ile alt bilgisi arasında kendi görsel
// dünyasında (.blog) durur.
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <BlogFrame>{children}</BlogFrame>;
}

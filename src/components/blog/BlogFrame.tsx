import { cn } from "@/lib/cn";
import { literata, schibsted } from "./fonts";

// Blogun görsel dünyası (.blog) yalnız bu sarmalayıcının içinde geçerlidir.
export function BlogFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("blog", schibsted.variable, literata.variable, "min-h-full", className)}>
      {children}
    </div>
  );
}

import { cn } from "@/lib/cn";

const widths = {
  wide: "max-w-[1440px]",
  form: "max-w-[1160px]",
  narrow: "max-w-[860px]",
} as const;

export function AdminPage({
  children,
  width = "wide",
}: {
  children: React.ReactNode;
  width?: keyof typeof widths;
}) {
  return (
    // Sola hizalı: sayfalar arasında geçerken başlık aynı x konumunda kalır.
    <div className={cn("w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8", widths[width])}>
      {children}
    </div>
  );
}

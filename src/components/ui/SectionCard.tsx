import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

// Okul detay yüzeyindeki tekrar eden kart: ikon + başlık + içerik.
// DESIGN.md: canvas dolgu, hairline slate kenarlık, dinlenirken shadow-sm.
type Props = {
  icon: LucideIcon;
  title: React.ReactNode;
  /** Başlığın sağına hizalanan yardımcı içerik (ör. sayaç). */
  action?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
};

export function SectionCard({
  icon: Icon,
  title,
  action,
  className,
  headerClassName,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <div className={cn("mb-4 flex items-center gap-2", headerClassName)}>
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {action != null && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </div>
  );
}

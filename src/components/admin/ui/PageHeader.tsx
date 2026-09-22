import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

type Crumb = { label: string; href: string };

type Props = {
  /** Yalnız alt sayfalarda: üst sayfalara giden gerçek bağlantılar. */
  trail?: Crumb[];
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({ trail, title, description, actions }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {trail && trail.length > 0 && (
          <nav aria-label="Konum" className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1 text-[13px] text-admin-muted">
              {trail.map((crumb) => (
                <li key={crumb.href} className="flex items-center gap-1">
                  <Link href={crumb.href} className={cn("rounded hover:text-admin-ink hover:underline", adminFocus)}>
                    {crumb.label}
                  </Link>
                  <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-xl font-bold tracking-tight text-admin-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-admin-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

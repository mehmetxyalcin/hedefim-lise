import { cn } from "@/lib/cn";
import { adminCard } from "@/components/admin/ui/styles";

type Props = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Card({ title, description, actions, children, className, bodyClassName }: Props) {
  return (
    <section className={cn(adminCard, className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-admin-line px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-bold text-admin-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-admin-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

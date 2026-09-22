export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-admin-faint">{icon}</div>}
      <p className="text-sm font-semibold text-admin-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-admin-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

import { Phone } from "lucide-react";
import { HEALTH_CHECKS, type HealthCheckId, type HealthItem } from "@/lib/school-health";
import { cn } from "@/lib/cn";

const STATUS_TEXT = { ok: "tamam", missing: "eksik", na: "gerekmez" } as const;

function Pip({ status, size }: { status: HealthItem["status"]; size: "sm" | "md" }) {
  const box = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  if (status === "na") {
    return (
      <span className={cn("flex items-center justify-center", box)}>
        <span className="h-0.5 w-full rounded bg-admin-line-strong" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "block rounded-[3px]",
        box,
        status === "ok" ? "bg-emerald-600" : "border-[1.5px] border-admin-missing bg-white",
      )}
    />
  );
}

// Sekiz kontrol her zaman aynı sırada, aynı yerde; satır kırılmaz.
export function HealthPips({ items, size = "sm" }: { items: HealthItem[]; size?: "sm" | "md" }) {
  const missing = items.filter((item) => item.status === "missing");
  return (
    <span className="inline-flex items-center whitespace-nowrap">
      <span aria-hidden="true" className="inline-flex items-center gap-1">
        {items.map((item) => (
          <span key={item.id} title={`${item.label}: ${STATUS_TEXT[item.status]}`}>
            <Pip status={item.status} size={size} />
          </span>
        ))}
      </span>
      <span className="sr-only">
        {missing.length === 0 ? "Eksik yok" : `Eksik: ${missing.map((item) => item.label).join(", ")}`}
      </span>
    </span>
  );
}

// Tablo başlığında piplerin üstüne gelen kısa kodlar; telefon için ikon.
export function HealthCodes({ id }: { id: HealthCheckId }) {
  const check = HEALTH_CHECKS.find((c) => c.id === id)!;
  return id === "telefon" ? <Phone aria-hidden="true" className="h-2.5 w-2.5" /> : <>{check.short}</>;
}

export function HealthLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-admin-muted">
      <span className="inline-flex items-center gap-1.5">
        <Pip status="ok" size="sm" />
        tamam
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Pip status="missing" size="sm" />
        eksik
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Pip status="na" size="sm" />
        gerekmez
      </span>
      {HEALTH_CHECKS.map((check) => (
        <span key={check.id} className="inline-flex items-center gap-1">
          <span className="inline-flex w-3 justify-center font-semibold text-admin-body">
            <HealthCodes id={check.id} />
          </span>
          {check.label.toLocaleLowerCase("tr-TR")}
        </span>
      ))}
    </p>
  );
}

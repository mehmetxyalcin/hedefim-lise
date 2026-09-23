import Link from "next/link";
import { cn } from "@/lib/cn";
import { adminFocus } from "@/components/admin/ui/styles";

export type LedgerSummaryData = {
  active: number;
  passive: number;
  incomplete: number;
  total: number;
  // En çok okulda eksik olan kontrol; hiç eksik yoksa null.
  topGap: { id: string; label: string; count: number } | null;
  unread: number;
};

function Stat({
  href,
  label,
  value,
  suffix,
  title,
  attention = false,
  className,
}: {
  href: string;
  label: string;
  value: number;
  suffix?: string;
  title?: string;
  attention?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={cn(
        "group flex flex-col gap-0.5 bg-white px-4 py-3 transition-colors hover:bg-admin-ground",
        adminFocus,
        className,
      )}
    >
      <span className="text-xs text-admin-muted group-hover:text-admin-body">{label}</span>
      <span
        className={cn(
          "text-xl font-bold tabular-nums",
          value === 0 ? "text-admin-faint" : attention ? "text-admin-missing" : "text-admin-ink",
        )}
      >
        {value}
        {suffix && <span className="ml-1 text-xs font-medium text-admin-muted">{suffix}</span>}
      </span>
    </Link>
  );
}

// Sayaçlar bağlantıdır: tıklayınca defteri o soruya göre süzer.
export function LedgerSummary({ data }: { data: LedgerSummaryData }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-admin-line bg-admin-line shadow-admin-card sm:grid-cols-3 lg:grid-cols-5">
      <Stat href="/admin?durum=aktif" label="Yayında" value={data.active} />
      <Stat href="/admin?durum=pasif" label="Pasif" value={data.passive} />
      <Stat
        href="/admin?eksik=herhangi"
        label="Eksik kayıt"
        value={data.incomplete}
        suffix={`/ ${data.total}`}
        attention
      />
      {data.topGap && (
        <Stat
          href={`/admin?eksik=${data.topGap.id}`}
          label="En büyük eksik"
          value={data.topGap.count}
          suffix={`okul · ${data.topGap.label.toLocaleLowerCase("tr-TR")}`}
          attention
        />
      )}
      <Stat
        href="/admin/mesajlar?durum=okunmamis"
        label="Okunmamış mesaj"
        value={data.unread}
        // Beş sayaç 2 ve 3 sütunlu ızgarada boş hücre bırakmasın.
        className={data.topGap ? "col-span-2 lg:col-span-1" : undefined}
      />
    </div>
  );
}

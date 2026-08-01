import { Globe, MapPin, Phone } from "lucide-react";

type Props = {
  address: string | null;
  phone: string | null;
  website: string | null;
};

export function SchoolContact({ address, phone, website }: Props) {
  if (!address && !phone && !website) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Phone className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">İletişim</h2>
      </div>

      <div className="space-y-3">
        {address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span className="text-sm text-slate-700 transition-colors group-hover:text-blue-600">
              {address}
            </span>
          </a>
        )}

        {phone && (
          <a
            href={`tel:${phone}`}
            className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
          >
            <Phone className="h-4 w-4 shrink-0 text-green-500" />
            <span className="text-sm text-slate-700 transition-colors group-hover:text-blue-600">
              {phone}
            </span>
          </a>
        )}

        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
          >
            <Globe className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="truncate text-sm text-slate-700 transition-colors group-hover:text-blue-600">
              {website.replace(/^https?:\/\//, "")}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}

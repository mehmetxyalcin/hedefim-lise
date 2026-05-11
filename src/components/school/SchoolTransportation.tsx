import { Bus } from "lucide-react";

type Props = { transportation_info: string | null };

export function SchoolTransportation({ transportation_info }: Props) {
  if (!transportation_info) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Bus className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Ulaşım</h2>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {transportation_info}
      </p>
    </div>
  );
}

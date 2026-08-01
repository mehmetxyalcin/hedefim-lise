import { Info } from "lucide-react";

type Props = { other_info: string | null };

export function SchoolOtherInfo({ other_info }: Props) {
  if (!other_info) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">Diğer Bilgiler</h2>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {other_info}
      </p>
    </div>
  );
}

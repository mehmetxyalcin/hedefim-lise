import { Building2, CheckCircle2 } from "lucide-react";

type Props = {
  facilities: { id: string; name: string; icon: string | null }[];
};

export function SchoolFacilities({ facilities }: Props) {
  if (!facilities || facilities.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">Tesis ve İmkanlar</h2>
        <span className="ml-auto text-sm text-slate-400">{facilities.length} tesis</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="flex items-center gap-2 rounded-xl border border-transparent bg-slate-50 p-3 transition-colors duration-150 hover:border-blue-100 hover:bg-blue-50"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            <span className="text-sm leading-tight text-slate-700">{facility.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

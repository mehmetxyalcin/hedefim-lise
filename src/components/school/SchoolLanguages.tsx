import { Languages } from "lucide-react";

type Props = { languages: string[] };

export function SchoolLanguages({ languages }: Props) {
  if (!languages || languages.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
      <div className="mb-5 flex items-center gap-2">
        <Languages className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">Yabancı Diller</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <span
            key={lang}
            className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700"
          >
            {lang}
          </span>
        ))}
      </div>
    </div>
  );
}

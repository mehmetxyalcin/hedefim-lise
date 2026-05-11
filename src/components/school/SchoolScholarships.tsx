import { Award, GraduationCap } from "lucide-react";

type Scholarship = {
  id: string;
  title: string;
  description: string | null;
  amount_info: string | null;
};

type Props = { scholarships: Scholarship[] };

export function SchoolScholarships({ scholarships }: Props) {
  if (!scholarships || scholarships.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Award className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Burs İmkanları</h2>
      </div>

      <div className="space-y-3">
        {scholarships.map((s) => (
          <div
            key={s.id}
            className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4"
          >
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-gray-800">{s.title}</p>
              {s.description && (
                <p className="mt-0.5 text-sm text-gray-600">{s.description}</p>
              )}
              {s.amount_info && (
                <p className="mt-1 text-sm font-medium text-green-600">{s.amount_info}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

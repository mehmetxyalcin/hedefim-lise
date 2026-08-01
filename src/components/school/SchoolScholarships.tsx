import { Award, GraduationCap } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

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
    <SectionCard icon={Award} title="Burs İmkanları">
      <div className="space-y-3">
        {scholarships.map((s) => (
          <div
            key={s.id}
            className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4"
          >
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{s.title}</p>
              {s.description && (
                <p className="mt-0.5 text-sm text-slate-600">{s.description}</p>
              )}
              {s.amount_info && (
                <p className="mt-1 text-sm font-medium text-emerald-600">{s.amount_info}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

import { Languages } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

type Props = { languages: string[] };

export function SchoolLanguages({ languages }: Props) {
  if (!languages || languages.length === 0) return null;

  return (
    <SectionCard icon={Languages} title="Yabancı Diller">
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
    </SectionCard>
  );
}

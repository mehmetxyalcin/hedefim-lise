import { BookOpen } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

type Props = { description: string | null };

export function SchoolAbout({ description }: Props) {
  if (!description) return null;

  return (
    <SectionCard icon={BookOpen} title="Okul Hakkında">
      <p className="text-sm leading-relaxed text-slate-700">{description}</p>
    </SectionCard>
  );
}

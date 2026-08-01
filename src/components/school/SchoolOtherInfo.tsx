import { Info } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

type Props = { other_info: string | null };

export function SchoolOtherInfo({ other_info }: Props) {
  if (!other_info) return null;

  return (
    <SectionCard icon={Info} title="Diğer Bilgiler">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {other_info}
      </p>
    </SectionCard>
  );
}

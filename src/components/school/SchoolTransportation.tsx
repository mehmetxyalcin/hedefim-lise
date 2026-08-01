import { Bus } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

type Props = { transportation_info: string | null };

export function SchoolTransportation({ transportation_info }: Props) {
  if (!transportation_info) return null;

  return (
    <SectionCard icon={Bus} title="Ulaşım">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {transportation_info}
      </p>
    </SectionCard>
  );
}

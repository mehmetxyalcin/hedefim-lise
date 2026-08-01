"use client";

import { useState } from "react";
import { Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

type Branch = { id: string; name: string };
type VocationalField = {
  id: string;
  name: string;
  branches: Branch[];
};

type Props = { fields: VocationalField[] };

export function VocationalAccordion({ fields }: Props) {
  const [openIds, setOpenIds] = useState<string[]>([fields[0]?.id]);

  const toggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  if (!fields || fields.length === 0) return null;

  return (
    <SectionCard icon={Briefcase} title="Meslek Alanları ve Dallar">
      <div className="space-y-2">
        {fields.map((field) => {
          const isOpen = openIds.includes(field.id);

          return (
            <div
              key={field.id}
              className="overflow-hidden rounded-xl border border-slate-200"
            >
              <button
                type="button"
                onClick={() => toggle(field.id)}
                className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition-colors duration-150 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-slate-800">
                    {field.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({field.branches.length} dal)
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="bg-white px-4 py-3">
                  {field.branches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {field.branches.map((branch) => (
                        <span
                          key={branch.id}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                          {branch.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      Bu alan için dal bilgisi eklenmemiş.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

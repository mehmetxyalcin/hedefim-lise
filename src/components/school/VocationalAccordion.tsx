"use client";

import { useState } from "react";
import { Briefcase, ChevronDown, ChevronUp } from "lucide-react";

type Branch = { id: string; name: string };
type VocationalField = {
  id: string;
  name: string;
  branches: Branch[];
};

type Props = { fields: VocationalField[] };

const badgeColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-yellow-100 text-yellow-700",
];

export function VocationalAccordion({ fields }: Props) {
  const [openIds, setOpenIds] = useState<string[]>([fields[0]?.id]);

  const toggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  if (!fields || fields.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">
          Meslek Alanları ve Dallar
        </h2>
      </div>

      <div className="space-y-2">
        {fields.map((field, fieldIndex) => {
          const isOpen = openIds.includes(field.id);
          const color = badgeColors[fieldIndex % badgeColors.length];
          const dotColor = color.split(" ")[0];

          return (
            <div
              key={field.id}
              className="overflow-hidden rounded-xl border border-gray-200"
            >
              <button
                type="button"
                onClick={() => toggle(field.id)}
                className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                  <span className="text-sm font-medium text-gray-800">
                    {field.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({field.branches.length} dal)
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {isOpen && (
                <div className="bg-white px-4 py-3">
                  {field.branches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {field.branches.map((branch) => (
                        <span
                          key={branch.id}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}
                        >
                          {branch.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm italic text-gray-400">
                      Bu alan için dal bilgisi eklenmemiş.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

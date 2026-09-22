"use client";

import { useState } from "react";
import { MIN_DESCRIPTION_LENGTH } from "@/lib/school-health";
import { adminInput, adminLabel } from "@/components/admin/ui/styles";
import { cn } from "@/lib/cn";

// Açıklama alanı + veri sağlığı kuralının 80 karakter eşiğine canlı sayaç.
export function DescriptionField({ defaultValue }: { defaultValue: string }) {
  const [length, setLength] = useState(defaultValue.trim().length);
  const short = length < MIN_DESCRIPTION_LENGTH;

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-3">
        <span className={cn(adminLabel, "mb-0")}>Açıklama</span>
        <span className={cn("text-xs tabular-nums", short ? "text-admin-missing" : "text-admin-muted")}>
          {length}/{MIN_DESCRIPTION_LENGTH}
          {short && " · kısa"}
        </span>
      </span>
      <textarea
        name="description"
        defaultValue={defaultValue}
        required
        rows={5}
        onChange={(event) => setLength(event.target.value.trim().length)}
        className={adminInput}
      />
    </label>
  );
}

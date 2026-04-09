import { createElement } from "react";
import { Cpu, HeartPulse, PenTool, type LucideIcon } from "lucide-react";

const fieldIconMap: Record<string, LucideIcon> = {
  "bilisim-teknolojileri": Cpu,
  "elektrik-elektronik-teknolojisi": PenTool,
  "saglik-hizmetleri": HeartPulse,
};

export function getVocationalFieldIcon(slug: string) {
  return fieldIconMap[slug] ?? Cpu;
}

type VocationalFieldIconProps = {
  slug: string;
  className?: string;
};

export function VocationalFieldIcon({
  slug,
  className,
}: VocationalFieldIconProps) {
  const Icon = getVocationalFieldIcon(slug);

  return createElement(Icon, { className });
}

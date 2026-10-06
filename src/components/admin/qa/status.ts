import type { BadgeTone } from "@/components/admin/ui/Badge";
import type { SubmissionStatus } from "@/types/faq";

export const SUBMISSION_STATUS: Record<SubmissionStatus, { label: string; tone: BadgeTone }> = {
  new: { label: "Yeni", tone: "accent" },
  answered: { label: "Yanıtlandı", tone: "success" },
  rejected: { label: "Reddedildi", tone: "neutral" },
};

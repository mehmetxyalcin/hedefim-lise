import { BookOpen } from "lucide-react";

type Props = { description: string | null };

export function SchoolAbout({ description }: Props) {
  if (!description) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Okul Hakkında</h2>
      </div>
      <p className="text-sm leading-relaxed text-gray-700">{description}</p>
    </div>
  );
}

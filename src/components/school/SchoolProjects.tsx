import Image from "next/image";
import { ExternalLink, FolderOpen } from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
};

type Props = { projects: Project[] };

export function SchoolProjects({ projects }: Props) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-800">Projeler</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <div
            key={p.id}
            className="overflow-hidden rounded-xl border border-slate-100 transition-shadow hover:shadow-md"
          >
            {p.image_url ? (
              <div className="relative aspect-video">
                <Image
                  src={p.image_url}
                  alt={p.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                <FolderOpen className="h-10 w-10 text-blue-300" />
              </div>
            )}

            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-800">{p.title}</h3>
              {p.description && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {p.description}
                </p>
              )}
              {p.link_url && (
                <a
                  href={p.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Detayları Gör
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

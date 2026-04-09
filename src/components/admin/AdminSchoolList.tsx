"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeleteSchoolButton } from "@/components/admin/DeleteSchoolButton";
import type { School } from "@/types/school";

type AdminSchoolListProps = {
  deleteAction: (formData: FormData) => void | Promise<void>;
  schools: School[];
};

export function AdminSchoolList({
  deleteAction,
  schools,
}: AdminSchoolListProps) {
  const [query, setQuery] = useState("");

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    if (!normalizedQuery) {
      return schools;
    }

    return schools.filter((school) =>
      [school.name, school.district, school.type, school.slug]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery),
    );
  }, [query, schools]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Okul, ilce, tür veya slug ile ara"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 md:max-w-sm"
        />
        <p className="text-sm text-slate-500">
          {filteredSchools.length} / {schools.length} okul gösteriliyor
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Okul</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">İlçe</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Tur</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">Durum</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-700">işlem</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.length === 0 ? (
              <tr className="border-t border-slate-200">
                <td colSpan={5} className="px-4 py-6 text-sm text-slate-500">
                  Aramanıza uygun okul bulunamadı.
                </td>
              </tr>
            ) : (
              filteredSchools.map((school) => (
                <tr key={school.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-sm text-slate-800">{school.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{school.district}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{school.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {school.isActive ? "Aktif" : "Pasif"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/admin/schools/${school.id}/edit`}
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Düzenle
                      </Link>
                      <DeleteSchoolButton
                        action={deleteAction}
                        schoolId={school.id}
                        schoolName={school.name}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

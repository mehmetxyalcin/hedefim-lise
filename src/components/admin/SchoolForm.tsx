import Image from "next/image";
import type { School } from "@/types/school";
import type { VocationalField } from "@/types/vocationalField";

type SchoolFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  school?: School;
  submitLabel: string;
  vocationalFields: Pick<VocationalField, "id" | "title">[];
};

function joinLines(values?: string[]) {
  return values?.join("\n") ?? "";
}

export function SchoolForm({
  action,
  school,
  submitLabel,
  vocationalFields,
}: SchoolFormProps) {
  return (
    <form action={action} className="space-y-6">
      {school && <input type="hidden" name="id" value={school.id} />}
      <input
        type="hidden"
        name="current_image"
        value={school?.images?.[0] ?? ""}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Okul Adı</span>
          <input
            name="name"
            defaultValue={school?.name ?? ""}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Slug</span>
          <input
            name="slug"
            defaultValue={school?.slug ?? ""}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Tur</span>
          <input
            name="type"
            defaultValue={school?.type ?? ""}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">İlçe</span>
          <input
            name="district"
            defaultValue={school?.district ?? ""}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Yüzdelik</span>
          <input
            name="percentile"
            defaultValue={school?.percentile ?? ""}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Logo</span>
          <input
            name="logo"
            defaultValue={school?.logo ?? ""}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Renk Sınıfı</span>
          <input
            name="color"
            defaultValue={school?.color ?? "bg-gradient-to-br from-slate-700 to-slate-900"}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Açıklama</span>
        <textarea
          name="description"
          defaultValue={school?.description ?? ""}
          required
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Okul Görseli</span>
        <input
          type="file"
          name="image_file"
          accept="image/*"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 focus:border-blue-500"
        />
        {school?.images?.[0] && (
          <div className="mt-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Mevcut Görsel
            </span>
            <Image
              src={school.images[0]}
              alt={school.name}
              width={800}
              height={320}
              className="h-40 w-full rounded-2xl object-cover border border-slate-200"
            />
          </div>
        )}
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Adres</span>
          <input
            name="address"
            defaultValue={school?.address ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Telefon</span>
          <input
            name="phone"
            defaultValue={school?.phone ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Website</span>
          <input
            name="website"
            defaultValue={school?.website ?? ""}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Özellikler</span>
          <textarea
            name="features"
            defaultValue={joinLines(school?.features)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
          <span className="mt-2 block text-xs text-slate-500">
            Her satıra bir madde yazabilir veya virgül ile ayırabilirsiniz.
          </span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Projeler</span>
          <textarea
            name="projects"
            defaultValue={joinLines(school?.projects)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
          <span className="mt-2 block text-xs text-slate-500">
            Her satıra bir proje yazabilir veya virgül ile ayırabilirsiniz.
          </span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Diller</span>
          <textarea
            name="languages"
            defaultValue={joinLines(school?.languages)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
          />
          <span className="mt-2 block text-xs text-slate-500">
            Her satıra bir dil yazabilir veya virgül ile ayırabilirsiniz.
          </span>
        </label>
      </div>

      <fieldset className="rounded-2xl border border-slate-200 p-5">
        <legend className="px-2 text-sm font-semibold text-slate-700">
          Meslek Alanları
        </legend>
        {vocationalFields.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz meslek alani bulunmuyor.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {vocationalFields.map((field) => (
              <label
                key={field.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <input
                  type="checkbox"
                  name="vocational_field_ids"
                  value={field.id}
                  defaultChecked={school?.vocationalFields?.includes(field.id)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">{field.title}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={school ? school.isActive !== false : true}
          className="h-4 w-4"
        />
        <span className="text-sm font-semibold text-slate-700">Yayında / aktif</span>
      </label>

      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}

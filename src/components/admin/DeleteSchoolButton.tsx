"use client";

type DeleteSchoolButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  schoolId: number;
  schoolName: string;
};

export function DeleteSchoolButton({
  action,
  schoolId,
  schoolName,
}: DeleteSchoolButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `"${schoolName}" okulunu silmek istediğinize emin misiniz? Bu işlem geri alınmaz.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={schoolId} />
      <button
        type="submit"
        className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
      >
        Sil
      </button>
    </form>
  );
}

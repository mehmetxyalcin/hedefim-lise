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
          `"${schoolName}" okulunu silmek istediginize emin misiniz? Bu islem geri alinmaz.`,
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
        className="font-semibold text-rose-600 hover:text-rose-800"
      >
        Sil
      </button>
    </form>
  );
}

"use client";

// Sunucu bileşenlerindeki yıkıcı formlar için: gönderimden önce onay ister.
export function ConfirmButton({
  message,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

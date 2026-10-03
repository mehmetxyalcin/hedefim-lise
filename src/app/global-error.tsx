"use client";

import { PageError } from "@/components/layout/PageError";
import "./globals.css";

// Kök düzende (üst bar, alt bilgi) oluşan hata için: kök düzenin yerine geçer,
// bu yüzden kendi html/body'sini kurar.
export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="tr">
      <body className="min-h-full bg-white font-sans antialiased">
        <title>Sayfa açılamadı | Hedefim Lise</title>
        <PageError {...props} />
      </body>
    </html>
  );
}

"use client";

import { useEffect, useSyncExternalStore } from "react";

const RELOAD_KEY = "hedefim:auto-reload-at";
const RELOAD_WINDOW_MS = 30_000;

// Yeni sürüm yayına girdiğinde açık kalan sekme, artık sunucuda olmayan eski
// bir kod parçasını isteyebilir. Bunu bir sayfa yenilemesi düzeltir.
const LOAD_ERROR =
  /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Importing a module script failed/i;

function isLoadError(error: Error) {
  return error.name === "ChunkLoadError" || LOAD_ERROR.test(error.message ?? "");
}

// Yükleme hatasında sayfa bir kez kendiliğinden yenilenir; kullanıcının elle
// yaptığı şeyi yapar. Aynı sekmede 30 sn içinde tekrarlanırsa döngüye girmez,
// hata ekranı görünür. Sunucuda karar verilmez: ekran önce hata olarak çizilir.
function reloadAllowed() {
  try {
    return Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) ?? 0) >= RELOAD_WINDOW_MS;
  } catch {
    return false;
  }
}
const noSubscribe = () => () => {};

type Props = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Sitenin hata ekranı: (site)/error.tsx ve global-error.tsx ortak kullanır.
// Hata kodu sunucu hatasında Next'in digest'i (Hostinger kayıtlarında aynı
// kodla bulunur), tarayıcı hatasında hatanın türüdür.
export function PageError({ error, retry }: Props) {
  const loadError = isLoadError(error);
  const autoReload = useSyncExternalStore(noSubscribe, reloadAllowed, () => false) && loadError;
  const code = error.digest ?? error.name;

  useEffect(() => {
    console.error(error);
    if (!autoReload) return;
    try {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {}
    window.location.reload();
  }, [error, autoReload]);

  if (autoReload) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-slate-500" role="status">
          Sayfa yenileniyor…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Bu sayfa şu an açılamadı
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Bağlantıda kısa süreli bir aksaklık olmuş olabilir. Tekrar denemek çoğu
          zaman yeter.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => (loadError ? window.location.reload() : retry())}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Tekrar dene
          </button>
          {/* Hata kök düzende de olabilir; tam sayfa yüklemesi temiz başlar. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Ana sayfaya dön
          </a>
        </div>
        {code ? (
          <p className="mt-8 text-xs text-slate-500">
            Sorun sürerse bize bu kodu iletebilirsin:{" "}
            <span className="font-mono font-semibold text-slate-700 select-all">{code}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

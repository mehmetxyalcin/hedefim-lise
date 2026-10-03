"use client";

import { PageError } from "@/components/layout/PageError";

// Sayfa hatası üst bar ve alt bilgiyle birlikte sitenin içinde gösterilir;
// Next'in İngilizce varsayılan ekranı ("This page couldn't load") yerine.
export default function SiteError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <PageError {...props} />;
}

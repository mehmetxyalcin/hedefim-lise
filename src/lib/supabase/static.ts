import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cookie'siz, oturumsuz public client. Landing gibi ISR/statik üretilen
// sayfalarda yalnızca kamuya açık veriyi okumak için kullanılır: cookies()
// çağırmadığından route dinamik olmaya zorlanmaz (revalidate uygulanabilir).
export function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  return createSupabaseClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import { createClient } from "@supabase/supabase-js";

/** Cliente con service role — solo servidor; bypass RLS para inserts admin. */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan variables de entorno de Supabase (URL o SERVICE_ROLE_KEY).",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

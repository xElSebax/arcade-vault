import { createClient } from "@/lib/supabase/server";
export interface SupabaseHealthSuccess {
  ok: true;
}
export interface SupabaseHealthError {
  ok: false;
  error: string;
}
export type SupabaseHealthResponse =
  SupabaseHealthSuccess | SupabaseHealthError;
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    const response: SupabaseHealthError = {
      ok: false,
      error:
        "Faltan variables de entorno de Supabase (URL o clave publicable).",
    };
    return Response.json(response, { status: 503 });
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    if (error) {
      const response: SupabaseHealthError = {
        ok: false,
        error: "No se pudo contactar a Supabase.",
      };
      return Response.json(response, { status: 502 });
    }
    const response: SupabaseHealthSuccess = { ok: true };
    return Response.json(response);
  } catch {
    const response: SupabaseHealthError = {
      ok: false,
      error: "No se pudo contactar a Supabase.",
    };
    return Response.json(response, { status: 502 });
  }
}

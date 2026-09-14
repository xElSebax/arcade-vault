import type { SupabaseClient } from "@supabase/supabase-js";

import type { DbProfile } from "@/lib/supabase/types";

const PROFILE_SELECT = "id, display_name, created_at, updated_at";

export type ProfileRow = DbProfile;

export async function getProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getProfileByUserId]", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as ProfileRow;
}

export async function getDisplayNameByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const profile = await getProfileByUserId(supabase, userId);
  return profile?.display_name ?? null;
}

/** Server Actions, RSC y rutas — usa el cliente con cookies de sesión. */
export async function getServerProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  return getProfileByUserId(supabase, userId);
}

export async function getServerDisplayNameByUserId(
  userId: string,
): Promise<string | null> {
  const profile = await getServerProfileByUserId(userId);
  return profile?.display_name ?? null;
}

/** Componentes cliente (`AuthProvider`, etc.). */
export async function getBrowserProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  return getProfileByUserId(supabase, userId);
}

export async function getBrowserDisplayNameByUserId(
  userId: string,
): Promise<string | null> {
  const profile = await getBrowserProfileByUserId(userId);
  return profile?.display_name ?? null;
}

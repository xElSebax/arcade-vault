import "server-only";

import {
  getDisplayNameByUserId,
  getProfileByUserId,
  type ProfileRow,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export type { ProfileRow };

export async function getServerProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const supabase = await createClient();
  return getProfileByUserId(supabase, userId);
}

export async function getServerDisplayNameByUserId(
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  return getDisplayNameByUserId(supabase, userId);
}

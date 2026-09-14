"use client";

import {
  getDisplayNameByUserId,
  getProfileByUserId,
  type ProfileRow,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";

export type { ProfileRow };

export async function getBrowserProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const supabase = createClient();
  return getProfileByUserId(supabase, userId);
}

export async function getBrowserDisplayNameByUserId(
  userId: string,
): Promise<string | null> {
  const supabase = createClient();
  return getDisplayNameByUserId(supabase, userId);
}

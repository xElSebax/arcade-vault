/** Origen público para redirects de Supabase Auth (OAuth, confirmación, reset). */
export function getBrowserSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function buildAuthCallbackUrl(next = "/games"): string {
  const origin = getBrowserSiteOrigin();
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/games";
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_NEXT = "/games";

function sanitizeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return DEFAULT_NEXT;
  }
  return raw;
}

function redirectTo(request: Request, path: string): NextResponse {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const isLocal = process.env.NODE_ENV === "development";

  if (isLocal) {
    return NextResponse.redirect(`${origin}${path}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${path}`);
  }
  return NextResponse.redirect(`${origin}${path}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (!code) {
    return redirectTo(request, "/auth?error=missing_code");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback]", error.message);
    return redirectTo(request, "/auth?error=auth_callback");
  }

  return redirectTo(request, next);
}

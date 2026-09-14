/** Prefijos que exigen sesión Supabase (opt-in). */
export const PROTECTED_PATH_PREFIXES: string[] = [
  // Área privada futura; permite verificar redirect SPEC 13 sin login obligatorio en /play.
  "/cuenta",
];

/** Rutas siempre accesibles sin sesión (documentación + guards en proxy). */
export const PUBLIC_PATH_PREFIXES = [
  "/",
  "/games",
  "/play",
  "/hall-of-fame",
  "/about",
  "/auth",
  "/api/health",
  "/api/contact",
];

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") {
    return pathname === "/";
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) =>
    matchesPathPrefix(pathname, prefix),
  );
}

export function isProtectedPath(pathname: string): boolean {
  if (isPublicPath(pathname)) {
    return false;
  }
  return PROTECTED_PATH_PREFIXES.some((prefix) =>
    matchesPathPrefix(pathname, prefix),
  );
}

/** Pantalla de login; no incluye OAuth/email callback. */
export function isAuthLoginPath(pathname: string): boolean {
  return pathname === "/auth";
}

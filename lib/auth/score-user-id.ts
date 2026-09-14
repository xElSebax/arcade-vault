export function isAuthEmailVerified(user: {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
}): boolean {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at);
}

/** `user_id` en scores: solo usuario autenticado con email verificado. */
export function scoreUserIdFromAuthUser(
  user: {
    id: string;
    email_confirmed_at?: string | null;
    confirmed_at?: string | null;
  } | null,
): string | null {
  if (!user || !isAuthEmailVerified(user)) {
    return null;
  }
  return user.id;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export interface ContactSuccessResponse {
  ok: true;
}

export interface ContactErrorResponse {
  ok: false;
  error: string;
}

export type ContactResponse = ContactSuccessResponse | ContactErrorResponse;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CONTACT_FROM_EMAIL = "onboarding@resend.dev";

export function isValidContactEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function validateContactPayload(
  body: unknown,
): { ok: true; data: ContactPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos del formulario inválidos." };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const website = typeof raw.website === "string" ? raw.website.trim() : "";

  if (!name) {
    return { ok: false, error: "El nombre es obligatorio." };
  }

  if (name.length > 80) {
    return { ok: false, error: "El nombre no puede superar 80 caracteres." };
  }

  if (!email) {
    return { ok: false, error: "El correo electrónico es obligatorio." };
  }

  if (!isValidContactEmail(email)) {
    return { ok: false, error: "El correo electrónico no es válido." };
  }

  if (!message) {
    return { ok: false, error: "El mensaje es obligatorio." };
  }

  if (message.length > 2000) {
    return {
      ok: false,
      error: "El mensaje no puede superar 2000 caracteres.",
    };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      message,
      website: website || undefined,
    },
  };
}

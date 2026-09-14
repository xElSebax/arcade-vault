export const PASSWORD_MIN_LENGTH = 8;

/** Alineado con Supabase: minúscula, mayúscula, dígito y símbolo (no alfanumérico). */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.";

export function isPasswordValid(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && PASSWORD_REGEX.test(password);
}

import { Resend } from "resend";
import {
  CONTACT_FROM_EMAIL,
  type ContactErrorResponse,
  type ContactSuccessResponse,
  validateContactPayload,
} from "@/lib/contact";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const response: ContactErrorResponse = {
      ok: false,
      error: "El cuerpo de la solicitud no es JSON válido.",
    };
    return Response.json(response, { status: 400 });
  }

  const validated = validateContactPayload(body);

  if (!validated.ok) {
    const response: ContactErrorResponse = {
      ok: false,
      error: validated.error,
    };
    return Response.json(response, { status: 400 });
  }

  const { name, email, message, website } = validated.data;

  if (website) {
    const response: ContactSuccessResponse = { ok: true };
    return Response.json(response);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !toEmail) {
    const response: ContactErrorResponse = {
      ok: false,
      error:
        "El servicio de correo no está configurado. Contacta al administrador.",
    };
    return Response.json(response, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: CONTACT_FROM_EMAIL,
    to: toEmail,
    replyTo: email,
    subject: `Contacto Arcade Vault — ${name}`,
    text: [
      "Nuevo mensaje desde el formulario de contacto:",
      "",
      `Nombre: ${name}`,
      `Correo: ${email}`,
      "",
      "Mensaje:",
      message,
    ].join("\n"),
  });

  if (error) {
    const response: ContactErrorResponse = {
      ok: false,
      error: error.message || "No se pudo enviar el correo.",
    };
    return Response.json(response, { status: 502 });
  }

  const response: ContactSuccessResponse = { ok: true };
  return Response.json(response);
}

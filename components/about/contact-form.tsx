"use client";

import { useState, type FormEvent } from "react";
import { Btn } from "@/components/btn";

type ContactFormStatus = "idle" | "submitting" | "success" | "error";

interface ContactSuccessResponse {
  ok: true;
}

interface ContactErrorResponse {
  ok: false;
  error: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readFormValues(form: HTMLFormElement) {
  const data = new FormData(form);

  return {
    name: String(data.get("name") ?? "").trim(),
    email: String(data.get("email") ?? "").trim(),
    message: String(data.get("message") ?? "").trim(),
    website: String(data.get("website") ?? "").trim(),
  };
}

function isFormComplete(values: ReturnType<typeof readFormValues>): boolean {
  return (
    values.name.length > 0 &&
    values.email.length > 0 &&
    isValidEmail(values.email) &&
    values.message.length > 0
  );
}

export function ContactForm() {
  const [formKey, setFormKey] = useState(0);
  const [status, setStatus] = useState<ContactFormStatus>("idle");
  const [sentName, setSentName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const resetForm = () => {
    setFormKey((current) => current + 1);
    setStatus("idle");
    setSentName(null);
    setErrorMessage(null);
    setShake(false);
  };

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = readFormValues(event.currentTarget);

    if (!isFormComplete(values)) {
      triggerShake();
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as
        | ContactSuccessResponse
        | ContactErrorResponse;

      if (!response.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(
          data.ok === false
            ? data.error
            : "No se pudo enviar el mensaje. Intenta de nuevo.",
        );
        return;
      }

      setSentName(values.name);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Error de conexión. Verifica tu red e intenta de nuevo.");
    }
  };

  return (
    <form
      key={formKey}
      className={`contact-form${shake ? " shake" : ""}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {status === "success" && sentName ? (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message
              --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              {`> MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, ${sentName.toUpperCase()}.`}
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <Btn variant="ghost" type="button" onClick={resetForm}>
                ENVIAR OTRO MENSAJE
              </Btn>
            </div>
          </div>
        </div>
      ) : status === "error" ? (
        <div className="terminal-error">
          <div className="term-bar">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message
              --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line error">
              [ERROR] {errorMessage ?? "No se pudo enviar el mensaje."}
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <Btn variant="ghost" type="button" onClick={resetForm}>
                INTENTAR DE NUEVO
              </Btn>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              defaultValue=""
              placeholder="px_kai"
              maxLength={80}
              disabled={status === "submitting"}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              defaultValue=""
              placeholder="jugador@vault.gg"
              disabled={status === "submitting"}
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">MENSAJE</label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              defaultValue=""
              placeholder="Cuéntanos qué tienes en mente…"
              maxLength={2000}
              disabled={status === "submitting"}
            />
          </div>
          <input
            className="contact-honeypot"
            type="text"
            name="website"
            defaultValue=""
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <Btn
            type="submit"
            size="xl"
            className="press"
            style={{ width: "100%" }}
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </Btn>
        </>
      )}
    </form>
  );
}

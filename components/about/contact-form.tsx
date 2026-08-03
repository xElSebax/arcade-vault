"use client";

import { useState, type FormEvent } from "react";
import { Btn } from "@/components/btn";

type ContactFormStatus = "idle" | "submitting" | "success" | "error";

interface ContactFormState {
  name: string;
  email: string;
  message: string;
  website: string;
}

interface ContactSuccessResponse {
  ok: true;
}

interface ContactErrorResponse {
  ok: false;
  error: string;
}

const EMPTY_FORM: ContactFormState = {
  name: "",
  email: "",
  message: "",
  website: "",
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isFormComplete(form: ContactFormState): boolean {
  return (
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    isValidEmail(form.email.trim()) &&
    form.message.trim().length > 0
  );
}

export function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [status, setStatus] = useState<ContactFormStatus>("idle");
  const [sentName, setSentName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const resetForm = () => {
    setForm(EMPTY_FORM);
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

    if (!isFormComplete(form)) {
      triggerShake();
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          website: form.website,
        }),
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

      setSentName(form.name.trim());
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Error de conexión. Verifica tu red e intenta de nuevo.");
    }
  };

  return (
    <form
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
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
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
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
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
              value={form.message}
              onChange={(event) =>
                setForm({ ...form, message: event.target.value })
              }
              placeholder="Cuéntanos qué tienes en mente…"
              maxLength={2000}
              disabled={status === "submitting"}
            />
          </div>
          <input
            className="contact-honeypot"
            type="text"
            name="website"
            value={form.website}
            onChange={(event) =>
              setForm({ ...form, website: event.target.value })
            }
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

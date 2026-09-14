"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { Btn } from "@/components/btn";
import { useAuth } from "@/components/providers/auth-provider";
import { buildAuthCallbackUrl } from "@/lib/auth/callback-url";
import { normalizePlayerName } from "@/lib/player-name";
import { createClient } from "@/lib/supabase/client";

type AuthTab = "in" | "up";

type Feedback = {
  kind: "error" | "success" | "info";
  message: string;
};

const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback: "No se pudo completar el acceso. Inténtalo de nuevo.",
  missing_code: "Enlace de acceso inválido o expirado.",
};

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.";
  }
  if (lower.includes("user already registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  return message;
}

function isEmailConfirmed(
  user: { email_confirmed_at?: string | null; confirmed_at?: string | null },
): boolean {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at);
}

function callbackFeedbackFromParams(errorKey: string | null): Feedback | null {
  if (!errorKey) return null;
  return {
    kind: "error",
    message: CALLBACK_ERRORS[errorKey] ?? "No se pudo completar el acceso.",
  };
}

function AuthPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<AuthTab>("in");
  const [forgotMode, setForgotMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"google" | "github" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(() =>
    callbackFeedbackFromParams(callbackError),
  );

  useEffect(() => {
    if (callbackError) {
      router.replace("/auth", { scroll: false });
    }
  }, [callbackError, router]);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/games");
    }
  }, [authLoading, user, router]);

  const clearFeedback = () => setFeedback(null);

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setForgotMode(false);
    clearFeedback();
  };

  const playAsGuest = () => {
    router.push("/games");
  };

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearFeedback();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFeedback({ kind: "error", message: "Introduce correo y contraseña." });
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setFeedback({ kind: "error", message: mapAuthError(error.message) });
        return;
      }

      if (data.user && !isEmailConfirmed(data.user)) {
        await supabase.auth.signOut();
        setFeedback({
          kind: "info",
          message:
            "Tu cuenta aún no está verificada. Revisa tu correo y confirma el enlace antes de entrar.",
        });
        return;
      }

      router.push("/games");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearFeedback();

    const trimmedEmail = email.trim();
    const normalizedName = normalizePlayerName(displayName);
    if (!trimmedEmail || !password) {
      setFeedback({
        kind: "error",
        message: "Introduce correo y contraseña.",
      });
      return;
    }
    if (password.length < 6) {
      setFeedback({
        kind: "error",
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }
    if (!displayName.trim()) {
      setFeedback({
        kind: "error",
        message: "El nombre visible debe tener entre 1 y 10 caracteres.",
      });
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl("/games"),
          data: {
            display_name: normalizedName,
          },
        },
      });

      if (error) {
        setFeedback({ kind: "error", message: mapAuthError(error.message) });
        return;
      }

      if (data.session && data.user && isEmailConfirmed(data.user)) {
        router.push("/games");
        router.refresh();
        return;
      }

      setFeedback({
        kind: "success",
        message:
          "Cuenta creada. Revisa tu correo y confirma el enlace para activar el acceso al vault.",
      });
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearFeedback();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFeedback({ kind: "error", message: "Introduce tu correo electrónico." });
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: buildAuthCallbackUrl("/auth"),
      });

      if (error) {
        setFeedback({ kind: "error", message: mapAuthError(error.message) });
        return;
      }

      setFeedback({
        kind: "success",
        message:
          "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    clearFeedback();
    setOauthBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: buildAuthCallbackUrl("/games"),
        },
      });
      if (error) {
        setFeedback({ kind: "error", message: mapAuthError(error.message) });
        setOauthBusy(null);
      }
    } catch {
      setFeedback({
        kind: "error",
        message: "No se pudo iniciar el acceso social.",
      });
      setOauthBusy(null);
    }
  };

  const formDisabled = busy || oauthBusy !== null;

  if (authLoading || user) {
    return (
      <div className="av-auth-wrap fade-in">
        <div className="auth-card" aria-busy="true" aria-label="Redirigiendo…" />
      </div>
    );
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={tab === "in" && !forgotMode ? "on" : ""}
            onClick={() => switchTab("in")}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            className={tab === "up" ? "on" : ""}
            onClick={() => switchTab("up")}
          >
            CREAR CUENTA
          </button>
        </div>

        {feedback ? (
          <div
            className={`auth-feedback auth-feedback--${feedback.kind}`}
            role="status"
          >
            {feedback.message}
          </div>
        ) : null}

        {forgotMode && tab === "in" ? (
          <form onSubmit={handleForgotPassword}>
            <div className="field">
              <label htmlFor="auth-forgot-email">Correo electrónico</label>
              <input
                id="auth-forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jugador@vault.gg"
                disabled={formDisabled}
              />
            </div>
            <Btn
              type="submit"
              size="lg"
              style={{ width: "100%", marginTop: 8 }}
              disabled={formDisabled}
            >
              {busy ? "ENVIANDO…" : "ENVIAR ENLACE DE RESET"}
            </Btn>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setForgotMode(false);
                clearFeedback();
              }}
            >
              Volver a iniciar sesión
            </button>
          </form>
        ) : (
          <form onSubmit={tab === "in" ? handleSignIn : handleSignUp}>
            {tab === "up" ? (
              <div className="field">
                <label htmlFor="auth-display-name">Nombre visible</label>
                <input
                  id="auth-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="PX_KAI"
                  maxLength={10}
                  autoComplete="nickname"
                  disabled={formDisabled}
                />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="auth-email">Correo electrónico</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jugador@vault.gg"
                disabled={formDisabled}
              />
            </div>
            <div className="field">
              <label htmlFor="auth-password">Contraseña</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={
                  tab === "in" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={formDisabled}
              />
            </div>

            {tab === "in" ? (
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setForgotMode(true);
                  clearFeedback();
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            ) : null}

            <Btn
              type="submit"
              size="lg"
              style={{ width: "100%", marginTop: 8 }}
              disabled={formDisabled}
            >
              {busy
                ? "PROCESANDO…"
                : tab === "in"
                  ? "ENTRAR AL VAULT"
                  : "CREAR Y JUGAR"}
            </Btn>
          </form>
        )}

        {!forgotMode ? (
          <>
            <Btn
              variant="ghost"
              style={{ width: "100%", marginTop: 10 }}
              onClick={playAsGuest}
              disabled={formDisabled}
            >
              JUGAR COMO INVITADO
            </Btn>

            <div className="auth-divider">O CONTINÚA CON</div>
            <div className="social">
              <Btn
                variant="ghost"
                type="button"
                disabled={formDisabled}
                onClick={() => void handleOAuth("google")}
              >
                {oauthBusy === "google" ? "…" : "◆ GOOGLE"}
              </Btn>
              <Btn
                variant="ghost"
                type="button"
                disabled={formDisabled}
                onClick={() => void handleOAuth("github")}
              >
                {oauthBusy === "github" ? "…" : "▣ GITHUB"}
              </Btn>
            </div>
          </>
        ) : null}

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="av-auth-wrap fade-in">
          <div className="auth-card" aria-busy="true" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

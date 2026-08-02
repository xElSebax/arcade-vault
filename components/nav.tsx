"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Btn } from "@/components/btn";
import { useAuth } from "@/components/providers/auth-provider";

function bibliotecaActive(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/games/") ||
    pathname.startsWith("/play/")
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const bibActive = bibliotecaActive(pathname);
  const salonActive = pathname === "/hall-of-fame";
  const authActive = pathname === "/auth";

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        <div className="links">
          <Link
            href="/"
            className={bibActive ? "active" : ""}
            onClick={close}
          >
            Biblioteca
          </Link>
          <Link
            href="/hall-of-fame"
            className={salonActive ? "active" : ""}
            onClick={close}
          >
            Salón de la Fama
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <Btn className="auth-btn" variant="ghost" onClick={logout}>
            {user.name} ▾
          </Btn>
        ) : (
          <Btn
            className="auth-btn"
            onClick={() => {
              close();
              router.push("/auth");
            }}
          >
            Iniciar Sesión
          </Btn>
        )}

        <Btn
          className="hamburger"
          variant="ghost"
          aria-label="Menú"
          onClick={() => setOpen(true)}
        >
          ≡
        </Btn>
      </nav>

      <div
        className={`av-mobile-backdrop${open ? " open" : ""}`}
        onClick={close}
        aria-hidden={!open}
      />

      <aside className={`av-mobile-panel${open ? " open" : ""}`}>
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link
          href="/"
          className={bibActive ? "active" : ""}
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          href="/hall-of-fame"
          className={salonActive ? "active" : ""}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/auth"
          className={authActive ? "active" : ""}
          onClick={close}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: "0.16em",
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}

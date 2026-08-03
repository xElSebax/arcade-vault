"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Btn } from "@/components/btn";
import { useAuth } from "@/components/providers/auth-provider";
import { getNavActiveState } from "@/lib/navigation";

interface NavLinkProps {
  href: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function NavLink({ href, active, onClick, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={active ? "active" : ""}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const { inicio: inicioActive, biblioteca: bibActive, salon: salonActive, auth: authActive } =
    getNavActiveState(pathname);

  const authBtnClass = `auth-btn${authActive ? " route-active" : ""}`;

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
          <NavLink href="/" active={inicioActive} onClick={close}>
            Inicio
          </NavLink>
          <NavLink href="/games" active={bibActive} onClick={close}>
            Biblioteca
          </NavLink>
          <NavLink href="/hall-of-fame" active={salonActive} onClick={close}>
            Salón de la Fama
          </NavLink>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <Btn
            className={authBtnClass}
            variant="ghost"
            onClick={logout}
            aria-current={authActive ? "page" : undefined}
          >
            {user.name} ▾
          </Btn>
        ) : (
          <Btn
            className={authBtnClass}
            aria-current={authActive ? "page" : undefined}
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
        <NavLink href="/" active={inicioActive} onClick={close}>
          Inicio
        </NavLink>
        <NavLink href="/games" active={bibActive} onClick={close}>
          Biblioteca
        </NavLink>
        <NavLink href="/hall-of-fame" active={salonActive} onClick={close}>
          Salón de la Fama
        </NavLink>
        <NavLink href="/auth" active={authActive} onClick={close}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </NavLink>
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

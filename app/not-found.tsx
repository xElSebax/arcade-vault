import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in" style={{ textAlign: "center", padding: "80px 32px" }}>
      <h1 className="pixel neon-magenta" style={{ fontSize: 18, marginBottom: 16 }}>
        404
      </h1>
      <p className="mono" style={{ color: "var(--ink-dim)", marginBottom: 24 }}>
        Este juego no existe en el vault.
      </p>
      <Link href="/" className="btn lg">
        VOLVER AL VAULT
      </Link>
    </div>
  );
}

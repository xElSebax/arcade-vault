"use client";

import Link from "next/link";
import {
  HOME_FEATURES,
  HOME_PRICING_FAQ,
  HOME_STATS,
  HOME_TICKER,
  HOME_TOP_PLAYERS,
  getHomePreviewGames,
} from "@/app/data";
import { FeatureIcon } from "@/components/home/feature-icon";
import { FloatingSilhouettes } from "@/components/home/floating-silhouettes";
import { MiniCard } from "@/components/home/mini-card";
import { useReveal } from "@/components/home/use-reveal";

const PRICING_BENEFITS = [
  "Acceso a todos los juegos",
  "Ranking global y salón de la fama",
  "Sin anuncios entre partidas",
  "Guarda tus puntuaciones",
  "Nuevos juegos cada mes",
  "Funciona en cualquier navegador",
] as const;

function topRowClass(index: number): string {
  if (index === 0) return "top-row top1";
  if (index === 1) return "top-row top2";
  if (index === 2) return "top-row top3";
  return "top-row";
}

export default function HomePage() {
  useReveal();
  const previewGames = getHomePreviewGames();

  return (
    <div className="home fade-in">
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <Link href="/games" className="btn xl pulse">
              ▶ EXPLORAR JUEGOS
            </Link>
            <Link href="/auth" className="btn xl magenta">
              ✦ CREAR CUENTA
            </Link>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <span>DESLIZA</span>
          <span className="arrow">▼</span>
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">{"// 01"}</div>
          <h2 className="section-title">¿POR QUÉ ARCADE VAULT?</h2>
          <div className="section-rule" />
        </div>
        <div className="feature-grid">
          {HOME_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`feature-card ${feature.color}`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <FeatureIcon kind={feature.icon} />
              <div className="ft-title pixel">{feature.title}</div>
              <div className="ft-desc">{feature.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">{"// 02"}</div>
          <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
          <div className="section-rule" />
        </div>
        <div className="mini-rail">
          {previewGames.map((game) => (
            <MiniCard key={game.id} game={game} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/games" className="btn lg">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </section>

      <section className="home-stats reveal">
        <div className="stats-inner">
          {HOME_STATS.map((stat, index) => (
            <div
              key={stat.unit}
              className="stat-block"
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div className="stat-n neon-yellow">{stat.number}</div>
              <div className="stat-u pixel">{stat.unit}</div>
              <div className="stat-s">{stat.subtitle}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-yellow">{"// 03"}</div>
          <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
          <div className="section-rule" />
        </div>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className="ticker">
              {HOME_TICKER.map((row, index) => (
                <div
                  key={`${row.player}-${row.game}`}
                  className="tick-row"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <span className={`tk-p neon-${row.color}`}>{row.player}</span>
                  <span className="tk-mid">▸ {row.game}</span>
                  <span className="tk-s">
                    +{row.score.toLocaleString("es-ES")}
                  </span>
                  <span className="tk-t">{row.timeAgo}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">
                ▸ TOP JUGADORES · HOY
              </div>
              <Link href="/hall-of-fame" className="lb-link">
                VER SALÓN →
              </Link>
            </div>
            <div className="top-list">
              {HOME_TOP_PLAYERS.map((player, index) => (
                <div key={player.rank} className={topRowClass(index)}>
                  <span className="tp-rk">
                    #{String(player.rank).padStart(2, "0")}
                  </span>
                  <span className="tp-bar">
                    <span
                      className="tp-fill"
                      style={{ width: `${100 - index * 16}%` }}
                    />
                  </span>
                  <span className="tp-p">{player.player}</span>
                  <span className="tp-s">
                    {player.score.toLocaleString("es-ES")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-green">{"// 04"}</div>
          <h2 className="section-title">PRECIOS</h2>
          <div className="section-rule" />
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <div className="pc-name pixel">JUGADOR VAULT</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              {PRICING_BENEFITS.map((benefit) => (
                <li key={benefit}>✔ {benefit}</li>
              ))}
            </ul>
            <Link href="/auth" className="btn xl pulse" style={{ width: "100%" }}>
              EMPEZAR GRATIS →
            </Link>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel">
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className="pricing-faq">
            {HOME_PRICING_FAQ.map((item) => (
              <div key={item.question} className="faq-item">
                <div className="faq-q pixel">{item.question}</div>
                <div className="faq-a">{item.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-final reveal">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <Link href="/games" className="btn xl pulse final-cta">
          INSERTAR MONEDA →
        </Link>
        <div className="final-tag">
          Gratis. Sin registro obligatorio. Empieza en segundos.
        </div>
      </section>
    </div>
  );
}

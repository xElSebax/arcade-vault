"use client";

import { ABOUT_HIGHLIGHTS, ABOUT_MISSION } from "@/app/data";
import { ContactForm } from "@/components/about/contact-form";
import { HighlightIcon } from "@/components/about/highlight-icon";
import { useReveal } from "@/components/home/use-reveal";

const DIVIDER_PIXELS = Array.from({ length: 24 }, (_, index) => index);

export default function AboutPage() {
  useReveal();

  return (
    <div className="about fade-in">
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">{ABOUT_MISSION}</p>

        <div className="highlight-row">
          {ABOUT_HIGHLIGHTS.map((highlight, index) => (
            <div
              key={highlight.icon}
              className={`highlight ${highlight.color}`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <HighlightIcon kind={highlight.icon} />
              <div className="hl-text pixel">{highlight.title}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar" />
        <div className="div-pixels">
          {DIVIDER_PIXELS.map((index) => (
            <span
              key={index}
              style={{ animationDelay: `${index * 80}ms` }}
            />
          ))}
        </div>
        <div className="div-bar" />
      </div>

      <section className="about-contact reveal">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente
              quieres saludar? Escríbenos.
            </p>
            <div className="contact-tips">
              <div className="tip">
                <span className="tip-led" />
                RESPUESTA EN 24-48H
              </div>
              <div className="tip">
                <span className="tip-led y" />
                SUGERENCIAS BIENVENIDAS
              </div>
              <div className="tip">
                <span className="tip-led m" />
                SIN SPAM, JAMÁS
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { Game } from "@/app/data";
import { Btn } from "@/components/btn";

interface GameCardProps {
  game: Game;
  href: string;
}

type BtnVariant = "default" | "magenta" | "yellow";

function btnVariant(color: Game["color"]): BtnVariant {
  if (color === "magenta") return "magenta";
  if (color === "yellow") return "yellow";
  return "default";
}

export function GameCard({ game, href }: GameCardProps) {
  const router = useRouter();
  const tiltRef = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = "";
  };

  const go = () => router.push(href);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  };

  return (
    <div
      ref={tiltRef}
      className="card"
      role="link"
      tabIndex={0}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={go}
      onKeyDown={onKeyDown}
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <Btn
            variant={btnVariant(game.color)}
            onClick={(e) => {
              e.stopPropagation();
              go();
            }}
          >
            JUGAR
          </Btn>
        </div>
      </div>
    </div>
  );
}

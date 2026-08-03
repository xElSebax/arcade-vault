import Link from "next/link";
import type { Game } from "@/app/data";

interface MiniCardProps {
  game: Game;
}

export function MiniCard({ game }: MiniCardProps) {
  return (
    <Link href={`/games/${game.id}`} className="mini-card">
      <div className="mini-cover">
        <div className={`cover-bg ${game.cover}`} />
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </Link>
  );
}

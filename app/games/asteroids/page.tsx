import { notFound } from "next/navigation";
import { getGameById } from "@/app/data";
import { GameDetailView } from "@/components/game-detail-view";

export default function AsteroidsDetailPage() {
  const game = getGameById("asteroids");

  if (!game) {
    notFound();
  }

  return <GameDetailView game={game} />;
}

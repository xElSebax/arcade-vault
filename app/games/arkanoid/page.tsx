import { notFound } from "next/navigation";
import { getGameById } from "@/app/data";
import { GameDetailView } from "@/components/game-detail-view";

export default function ArkanoidDetailPage() {
  const game = getGameById("arkanoid");

  if (!game) {
    notFound();
  }

  return <GameDetailView game={game} />;
}

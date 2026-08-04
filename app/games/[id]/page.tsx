import { notFound } from "next/navigation";
import { GAMES, getGameById } from "@/app/data";
import { hasStaticGameRoute } from "@/app/data/static-game-routes";
import { GameDetailView } from "@/components/game-detail-view";

interface GameDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return GAMES.filter((game) => !hasStaticGameRoute(game.id)).map((game) => ({
    id: game.id,
  }));
}

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { id } = await params;
  const game = getGameById(id);

  if (!game) {
    notFound();
  }

  return <GameDetailView game={game} />;
}

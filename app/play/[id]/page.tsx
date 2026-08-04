import { notFound } from "next/navigation";
import { GAMES, getGameById } from "@/app/data";
import { hasStaticGameRoute } from "@/app/data/static-game-routes";
import { GamePlayer } from "@/components/game-player";

interface PlayPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return GAMES.filter((game) => !hasStaticGameRoute(game.id)).map((game) => ({
    id: game.id,
  }));
}

export default async function PlayPage({ params }: PlayPageProps) {
  const { id } = await params;
  const game = getGameById(id);

  if (!game) {
    notFound();
  }

  return <GamePlayer game={game} />;
}

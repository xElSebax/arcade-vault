import { notFound } from "next/navigation";
import { getGameById } from "@/app/data";
import { AsteroidsPlayer } from "@/components/games/asteroids-player";

export default function PlayAsteroidsPage() {
  const game = getGameById("asteroids");

  if (!game) {
    notFound();
  }

  return <AsteroidsPlayer game={game} />;
}

import { notFound } from "next/navigation";
import { getGameById } from "@/app/data";
import { SnakePlayer } from "@/components/games/snake-player";

export default function PlaySnakePage() {
  const game = getGameById("snake");

  if (!game) {
    notFound();
  }

  return <SnakePlayer game={game} />;
}

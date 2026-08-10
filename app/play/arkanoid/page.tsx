import { notFound } from "next/navigation";
import { getGameById } from "@/app/data";
import { ArkanoidPlayer } from "@/components/games/arkanoid-player";

export default function PlayArkanoidPage() {
  const game = getGameById("arkanoid");

  if (!game) {
    notFound();
  }

  return <ArkanoidPlayer game={game} />;
}

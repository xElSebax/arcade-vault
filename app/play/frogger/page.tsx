import { notFound } from "next/navigation";
import { getGameById } from "@/app/data";
import { FroggerPlayer } from "@/components/games/frogger-player";

export default function PlayFroggerPage() {
  const game = getGameById("frogger");

  if (!game) {
    notFound();
  }

  return <FroggerPlayer game={game} />;
}

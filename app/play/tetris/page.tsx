import { notFound } from "next/navigation";
import { getGameById } from "@/app/data";
import { TetrisPlayer } from "@/components/games/tetris-player";

export default function PlayTetrisPage() {
  const game = getGameById("tetris");

  if (!game) {
    notFound();
  }

  return <TetrisPlayer game={game} />;
}

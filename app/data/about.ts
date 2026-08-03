export interface AboutHighlight {
  icon: "HEART" | "BROWSER" | "PLANT";
  title: string;
  color: "magenta" | "cyan" | "green";
}

export const ABOUT_MISSION =
  "ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar " +
  "los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar " +
  "y sin costo.";

export const ABOUT_HIGHLIGHTS: AboutHighlight[] = [
  {
    icon: "HEART",
    title: "HECHO CON ❤️ PARA JUGADORES",
    color: "magenta",
  },
  {
    icon: "BROWSER",
    title: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",
    color: "cyan",
  },
  {
    icon: "PLANT",
    title: "PROYECTO EN CONSTANTE CRECIMIENTO",
    color: "green",
  },
];

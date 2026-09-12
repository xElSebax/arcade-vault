export type VirtualButton = "up" | "down" | "left" | "right" | "a" | "b";

/** Estado de botones mantenidos pulsados (equivalente a keys[key] === true) */
export type VirtualInputState = Record<VirtualButton, boolean>;

/** Acciones semánticas que un engine puede consumir */
export type TouchAction =
  | "move_up"
  | "move_down"
  | "move_left"
  | "move_right"
  | "thrust"
  | "rotate_left"
  | "rotate_right"
  | "fire"
  | "rotate"
  | "soft_drop"
  | "hard_drop";

/** null = botón visible pero atenuado (sin acción) */
export type GameTouchMap = Record<VirtualButton, TouchAction | null>;

export const EMPTY_VIRTUAL_INPUT: VirtualInputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
};

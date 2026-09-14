/** Deja pasar teclas al DOM (p. ej. input de iniciales en game over con WASD). */
export function shouldYieldKeyboardToDom(e: KeyboardEvent): boolean {
  const target = e.target;
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

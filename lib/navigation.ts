export interface NavActiveState {
  biblioteca: boolean;
  salon: boolean;
  auth: boolean;
}

export function getNavActiveState(pathname: string): NavActiveState {
  return {
    biblioteca:
      pathname === "/" ||
      pathname.startsWith("/games/") ||
      pathname.startsWith("/play/"),
    salon: pathname === "/hall-of-fame",
    auth: pathname === "/auth",
  };
}

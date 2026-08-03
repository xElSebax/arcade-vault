export interface NavActiveState {
  inicio: boolean;
  biblioteca: boolean;
  salon: boolean;
  auth: boolean;
}

export function getNavActiveState(pathname: string): NavActiveState {
  return {
    inicio: pathname === "/",
    biblioteca:
      pathname === "/games" ||
      pathname.startsWith("/games/") ||
      pathname.startsWith("/play/"),
    salon: pathname === "/hall-of-fame",
    auth: pathname === "/auth",
  };
}

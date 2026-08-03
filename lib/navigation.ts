export interface NavActiveState {
  inicio: boolean;
  biblioteca: boolean;
  salon: boolean;
  about: boolean;
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
    about: pathname === "/about",
    auth: pathname === "/auth",
  };
}

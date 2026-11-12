/** Presentation-only entry routing; not an authentication or authorization guard. */
export function signInPath(mobile: boolean): "/login" | "/m/login" {
  return mobile ? "/m/login" : "/login";
}

export function initialSignInPath(width: number) {
  return signInPath(width < 768);
}
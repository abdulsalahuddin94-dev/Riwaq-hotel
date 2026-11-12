/**
 * Thmanyah from a git-ignored local folder (public/fonts/thmanyah/).
 *
 * The Thmanyah licence forbids uploading/sharing the font files, so they are
 * never committed. Each teammate downloads the font from https://font.thmanyah.com
 * and drops the .woff2 files into public/fonts/thmanyah/ (see the README there).
 * This only runs on a local dev server, so no font request ever leaves a
 * teammate's own machine, and the shared preview never asks for missing files.
 */
const DIR = "/fonts/thmanyah";

const faces: Array<[family: string, file: string, weight: string]> = [
  ["Riwaq Arabic Files", "thmanyahsans-Light", "300"],
  ["Riwaq Arabic Files", "thmanyahsans-Regular", "400"],
  ["Riwaq Arabic Files", "thmanyahsans-Medium", "500"],
  ["Riwaq Arabic Files", "thmanyahsans-Bold", "600 700"],
  ["Riwaq Arabic Files", "thmanyahsans-Black", "800 900"],
  ["Riwaq Arabic Display Files", "thmanyahserifdisplay-Regular", "400"],
  ["Riwaq Arabic Display Files", "thmanyahserifdisplay-Medium", "500"],
  ["Riwaq Arabic Display Files", "thmanyahserifdisplay-Bold", "600 900"],
];

function isLocalHost(host: string) {
  return (
    host === "localhost" ||
    host === "[::1]" ||
    /^127\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host)
  );
}

export function loadLocalThmanyah() {
  if (!import.meta.env.DEV || typeof document === "undefined") return;
  if (!isLocalHost(window.location.hostname)) return;
  if (document.getElementById("riwaq-local-thmanyah")) return;
  const style = document.createElement("style");
  style.id = "riwaq-local-thmanyah";
  style.textContent = faces
    .map(
      ([family, file, weight]) =>
        `@font-face{font-family:"${family}";src:url("${DIR}/${file}.woff2") format("woff2");font-weight:${weight};font-display:swap}`,
    )
    .join("\n");
  document.head.appendChild(style);
}

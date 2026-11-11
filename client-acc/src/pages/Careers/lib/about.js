// Whether the student closed the "About these openings" banner (P5-T7). localStorage may be missing
// or blocked; then the banner simply shows again.
const KEY = "careers.aboutDismissed";

export function aboutBannerDismissed() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissAboutBanner() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // Not remembered in this browser; harmless.
  }
}

// Where a popup menu goes next to its button (B-39): below if it fits, else above when there is more
// room there; always kept inside the window, so it never pushes the page sideways on a phone.
const MENU_WIDTH = 240; // w-60
const GAP = 6;
const EDGE = 8; // keep the menu this far inside the window

// r = the button's rect, h = the menu's height, win = { width, height }.
export function menuPosition(r, h, win) {
  const below = win.height - r.bottom - GAP - EDGE;
  const above = r.top - GAP - EDGE;
  const up = below < h && above > below;
  const maxHeight = Math.max(160, up ? above : below);
  const left = Math.max(EDGE, Math.min(r.left, win.width - MENU_WIDTH - EDGE));
  return up ? { left, bottom: win.height - r.top + GAP, maxHeight } : { left, top: r.bottom + GAP, maxHeight };
}

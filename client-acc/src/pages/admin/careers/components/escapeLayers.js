// Escape closes only the top-most dialog (B-41). Every open dialog or drawer registers a layer; one
// window listener calls the newest one, so a dialog opened from another (Merge into… from a company,
// Delete… from the posting editor) closes first and the one under it stays open.
// A picker that handles Escape itself stops the event in the capture phase, so it never reaches here.
import { useEffect, useRef } from "react";

const layers = [];
let listening = false;

function onKey(e) {
  if (e.key !== "Escape" || e.defaultPrevented || !layers.length) return;
  layers[layers.length - 1].current();
}

export function useEscapeLayer(onClose) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const layer = close;
    layers.push(layer);
    if (!listening) {
      window.addEventListener("keydown", onKey);
      listening = true;
    }
    return () => {
      const i = layers.lastIndexOf(layer);
      if (i >= 0) layers.splice(i, 1);
    };
  }, []);
}

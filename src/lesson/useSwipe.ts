import { useRef } from "preact/hooks";

const MIN_DISTANCE = 60; // pixels sideways before it counts as a swipe
const MAX_SLANT = 40; // pixels up or down allowed, so scrolling the page is not a swipe

/** Touch handlers that call onLeft or onRight for a clear sideways swipe. Swipes that start on code are ignored, so code can scroll. */
export function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    const startedOnCode = (event.target as Element | null)?.closest("pre");
    start.current = touch && !startedOnCode ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!start.current || !touch) return;
    const dx = touch.clientX - start.current.x;
    const dy = touch.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dy) > MAX_SLANT) return;
    if (dx < 0) onLeft();
    else onRight();
  };

  return { onTouchStart, onTouchEnd };
}

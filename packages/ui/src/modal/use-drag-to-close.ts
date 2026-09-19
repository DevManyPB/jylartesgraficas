"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const CLOSE_DISTANCE_PX = 120;
const CLOSE_VELOCITY_PX_MS = 0.5;

/**
 * Arrastrar hacia abajo para cerrar la hoja móvil — SPEC.md §5.3.
 * Los handlers se aplican solo a la barra de agarre, no al contenido
 * completo, para no interferir con scroll/clics normales.
 */
export function useDragToClose(onClose: () => void) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const startY = useRef(0);
  const startTime = useRef(0);
  const dragging = useRef(false);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    dragging.current = true;
    startY.current = event.clientY;
    startTime.current = event.timeStamp;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!dragging.current) return;
    const delta = event.clientY - startY.current;
    if (delta > 0) setDragOffset(delta);
  }, []);

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragging.current) return;
      dragging.current = false;
      const delta = event.clientY - startY.current;
      const elapsed = Math.max(1, event.timeStamp - startTime.current);
      const velocity = delta / elapsed;
      if (delta > CLOSE_DISTANCE_PX || velocity > CLOSE_VELOCITY_PX_MS) {
        onClose();
      }
      setDragOffset(null);
    },
    [onClose],
  );

  return {
    dragOffset,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}

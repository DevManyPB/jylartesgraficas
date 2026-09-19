"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

interface ModalContextValue {
  requestOpen: (id: string) => boolean;
  release: (id: string) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * SPEC.md §5.3: un solo modal a la vez, nunca uno sobre otro.
 * Se coloca una vez por app, en layout.tsx.
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const activeId = useRef<string | null>(null);

  const requestOpen = useCallback((id: string) => {
    if (activeId.current && activeId.current !== id) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[ModalProvider] Se intentó abrir el modal "${id}" mientras "${activeId.current}" seguía abierto. Ciérralo antes de abrir otro (SPEC.md §5.3).`,
        );
      }
      return false;
    }
    activeId.current = id;
    return true;
  }, []);

  const release = useCallback((id: string) => {
    if (activeId.current === id) {
      activeId.current = null;
    }
  }, []);

  return <ModalContext.Provider value={{ requestOpen, release }}>{children}</ModalContext.Provider>;
}

export function useModalGuard() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModalGuard debe usarse dentro de <ModalProvider>.");
  }
  return ctx;
}

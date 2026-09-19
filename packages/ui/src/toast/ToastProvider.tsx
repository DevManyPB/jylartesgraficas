"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Toast, type ToastVariant } from "./Toast";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * SPEC.md §5.1: lo que no requiere decisión (guardado correcto, copiado,
 * error de red recuperable) va en toast, no en modal. Auto-cierre a los 4s.
 * Se coloca una vez por app, en layout.tsx.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, ...options }]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider duration={4000} swipeDirection="right">
        {children}
        {items.map((item) => (
          <Toast
            key={item.id}
            title={item.title}
            description={item.description}
            variant={item.variant}
            onOpenChange={(open) => {
              if (!open) remove(item.id);
            }}
          />
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[60] flex w-full max-w-sm flex-col gap-2 p-4 outline-none sm:bottom-4 sm:right-4" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  }
  return ctx;
}

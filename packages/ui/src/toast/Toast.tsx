"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "../lib/cn";

export type ToastVariant = "default" | "success" | "error";

export interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  onOpenChange: (open: boolean) => void;
}

const variantClasses: Record<ToastVariant, string> = {
  default: "border-border bg-canvas-dark text-ink-inverted",
  success: "border-success bg-success text-ink-inverted",
  error: "border-danger bg-danger text-ink-inverted",
};

export function Toast({ title, description, variant = "default", onOpenChange }: ToastProps) {
  return (
    <ToastPrimitive.Root
      onOpenChange={onOpenChange}
      className={cn(
        "rounded-xl border px-4 py-3 shadow-lg",
        "data-[state=open]:motion-safe:animate-toast-in",
        "data-[state=closed]:motion-safe:animate-toast-out",
        "data-[swipe=end]:motion-safe:animate-toast-out",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        variantClasses[variant],
      )}
    >
      <ToastPrimitive.Title className="text-sm font-medium">{title}</ToastPrimitive.Title>
      {description && (
        <ToastPrimitive.Description className="mt-1 text-sm opacity-90">
          {description}
        </ToastPrimitive.Description>
      )}
    </ToastPrimitive.Root>
  );
}

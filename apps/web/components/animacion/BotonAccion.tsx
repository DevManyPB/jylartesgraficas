"use client";

import { cn } from "@jyl/ui";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useIman } from "./use-iman";

/**
 * La acción principal de cada pantalla: pide, escribe, entra.
 *
 * Tres cosas a la vez y cada una donde le toca — el color y el relleno que
 * barre de izquierda a derecha son CSS, que no cuesta nada; el tirón hacia el
 * cursor es anime.js (`useIman`), que es lo que el CSS no sabe hacer.
 *
 * El `transform` lo escribe anime.js directamente en el estilo del elemento,
 * así que aquí no se ponen clases de `transition-transform`: se pelearían.
 */

type Variante = "acento" | "contorno" | "claro";

const BASE =
  "group/boton relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const TAMANOS = {
  normal: "px-5 py-2.5 text-sm",
  grande: "px-6 py-3 text-base",
} as const;

const VARIANTES: Record<Variante, { caja: string; barrido: string; texto: string }> = {
  // Relleno de acento; al pasar por encima entra un velo más oscuro.
  acento: {
    caja: "bg-accent text-ink-inverted focus-visible:outline-accent",
    barrido: "bg-accent-hover",
    texto: "",
  },
  // Sobre fondo claro: contorno que se rellena de tinta.
  contorno: {
    caja: "border border-border-strong text-ink focus-visible:outline-ink",
    barrido: "bg-ink",
    texto: "group-hover/boton:text-ink-inverted",
  },
  // Sobre el héroe oscuro: contorno claro que se rellena de claro.
  claro: {
    caja: "border border-ink-inverted/30 text-ink-inverted focus-visible:outline-current",
    barrido: "bg-ink-inverted",
    texto: "group-hover/boton:text-ink",
  },
};

interface BotonAccionProps {
  children: ReactNode;
  href?: string;
  variante?: Variante;
  tamano?: keyof typeof TAMANOS;
  className?: string;
  /** Para enlaces que salen del sitio, como WhatsApp. */
  externo?: boolean;
  type?: ComponentProps<"button">["type"];
  onClick?: () => void;
}

export function BotonAccion({
  children,
  href,
  variante = "acento",
  tamano = "normal",
  className,
  externo,
  type = "button",
  onClick,
}: BotonAccionProps) {
  const estilo = VARIANTES[variante];
  const iman = useIman<HTMLAnchorElement & HTMLButtonElement>();

  const clases = cn(BASE, TAMANOS[tamano], estilo.caja, className);

  const interior = (
    <>
      {/* El barrido: una capa que entra desde la izquierda. `duration-500` y
          una curva que frena al final, para que se lea como un gesto. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -translate-x-full transition-transform duration-500 ease-entrada",
          "group-hover/boton:translate-x-0 group-focus-visible/boton:translate-x-0",
          "motion-reduce:transition-none",
          estilo.barrido,
        )}
      />
      <span className={cn("relative transition-colors duration-300", estilo.texto)}>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link
        ref={iman}
        href={href}
        className={clases}
        {...(externo ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {interior}
      </Link>
    );
  }

  return (
    <button ref={iman} type={type} onClick={onClick} className={clases}>
      {interior}
    </button>
  );
}

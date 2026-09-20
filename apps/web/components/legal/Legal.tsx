import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Piezas de las páginas legales — SPEC.md §11. Lo que se escribe aquí
 * describe cómo funciona el sitio de verdad (que un pedido es una solicitud,
 * qué datos se piden, dónde se guardan). Lo que es una decisión del negocio
 * —plazos, garantías, condiciones de pago— no se inventa: queda marcado como
 * pendiente para que el estudio lo complete y lo revise un abogado.
 */
export function PaginaLegal({
  titulo,
  actualizado,
  children,
}: {
  titulo: string;
  /** Fecha en que el estudio dio por buena esta versión. */
  actualizado?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink">{titulo}</h1>
      {actualizado && <p className="mt-2 text-sm text-ink-subtle">Última actualización: {actualizado}</p>}

      <div role="note" className="mt-6 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-ink">
        <p className="font-medium">Texto en preparación</p>
        <p className="mt-1 text-ink-muted">
          Estamos terminando de redactar esta página con nuestro asesor legal. Lo que sigue describe cómo trabajamos
          hoy. Si tienes una duda concreta,{" "}
          <Link href="/contacto" className="font-medium text-accent underline underline-offset-4">
            escríbenos
          </Link>{" "}
          y te respondemos.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-10">{children}</div>
    </main>
  );
}

export function Apartado({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl text-ink">{titulo}</h2>
      <div className="mt-3 flex flex-col gap-3 text-base leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

/** Un punto que el estudio todavía tiene que definir. Se ve, no se esconde. */
export function PorDefinir({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border-strong bg-canvas-sunken px-4 py-3 text-sm text-ink-muted">
      <span className="font-medium text-ink">Pendiente: </span>
      {children}
    </p>
  );
}

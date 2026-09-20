import { cn } from "@jyl/ui";
import Link from "next/link";

interface TarjetaProps {
  titulo: string;
  /** La cifra, ya formateada: "12" o "$ 240.000". */
  valor: string;
  /** Una línea de contexto: contra qué se compara, o qué significa. */
  pie?: string;
  /** A dónde lleva: la lista ya filtrada de lo que cuenta la tarjeta. */
  href: string;
  /** Llama la atención cuando hay algo que atender. */
  tono?: "normal" | "aviso";
}

/**
 * Una cifra del tablero — SPEC.md §6.2: "si un número aparece, se puede
 * hacer clic en él", y cada tarjeta lleva a su lista filtrada.
 */
export function Tarjeta({ titulo, valor, pie, href, tono = "normal" }: TarjetaProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col rounded-lg border p-4 transition-colors",
        tono === "aviso"
          ? "border-accent/40 bg-accent-soft hover:border-accent"
          : "border-border hover:border-border-strong hover:bg-canvas-sunken",
      )}
    >
      <span className="text-[13px] text-ink-muted">{titulo}</span>
      <span className={cn("mt-1 font-display text-3xl tabular-nums", tono === "aviso" ? "text-accent" : "text-ink")}>
        {valor}
      </span>
      {pie && <span className="mt-1 text-xs text-ink-subtle">{pie}</span>}
    </Link>
  );
}

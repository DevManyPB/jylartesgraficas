import Link from "next/link";

interface ConfirmacionProps {
  numero: string;
  archivosIncompletos: boolean;
  /** Enlace de WhatsApp con el número del pedido ya escrito; null si no hay número configurado. */
  whatsapp: string | null;
}

/** SPEC.md §4.5: número de pedido, resumen y salida. */
export function Confirmacion({ numero, archivosIncompletos, whatsapp }: ConfirmacionProps) {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Recibimos tu pedido</h1>
      <p className="mt-3 text-base text-ink-muted">
        Guarda este número: es con el que vamos a identificar tu trabajo.
      </p>

      <p className="mt-6 rounded-xl border border-border bg-canvas-sunken px-5 py-4 font-display text-2xl text-ink">
        {numero}
      </p>

      {archivosIncompletos && (
        <p className="mt-4 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm text-ink">
          Algunas referencias no se subieron bien. El pedido quedó registrado igual; te
          escribiremos para pedirte los archivos que falten.
        </p>
      )}

      <p className="mt-6 text-sm text-ink-muted">
        Te escribiremos para revisar los detalles y pasarte la cotización.
      </p>

      {/* Dos salidas, como pide SPEC.md §4.5. */}
      <div className="mt-8 flex flex-wrap gap-3">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-accent px-5 py-3 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            Escribir por WhatsApp sobre este pedido
          </a>
        )}
        <Link
          href="/"
          className={
            whatsapp
              ? "inline-flex rounded-full border border-border-strong px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunken"
              : "inline-flex rounded-full bg-accent px-5 py-3 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover"
          }
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

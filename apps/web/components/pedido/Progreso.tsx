const PASOS = ["Qué necesitas", "Detalles", "Referencias", "Tus datos"] as const;

export const TOTAL_PASOS = PASOS.length;

/** Progreso visible — SPEC.md §4.5. */
export function Progreso({ actual }: { actual: number }) {
  return (
    <div>
      <p className="text-sm text-ink-muted">
        Paso {actual + 1} de {TOTAL_PASOS} · {PASOS[actual]}
      </p>
      <ol className="mt-3 flex gap-2" aria-label="Progreso del pedido">
        {PASOS.map((nombre, indice) => {
          const completado = indice < actual;
          const enCurso = indice === actual;
          return (
            <li
              key={nombre}
              aria-current={enCurso ? "step" : undefined}
              className={`h-1 flex-1 rounded-full ${
                completado || enCurso ? "bg-accent" : "bg-border"
              }`}
            >
              <span className="sr-only">
                {nombre}
                {completado ? " (completado)" : enCurso ? " (en curso)" : ""}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

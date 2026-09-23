import Link from "next/link";

/**
 * La marca del header y del menú móvil — SPEC.md §4.2: elemento tipográfico
 * en dos líneas, «JYL» en el peso fuerte de titulares y «artes gráficas»
 * debajo, pequeño.
 *
 * Al pasar el ratón (o llegar con el teclado), las tres letras suben una tras
 * otra y vuelven: responde a quien la toca y no se mueve sola (SPEC.md §9).
 * El nombre accesible va en el enlace, para que el lector de pantalla no lea
 * «J, Y, L» letra por letra.
 */
export function Marca({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="JYL artes gráficas, ir al inicio"
      className="group/marca flex flex-col items-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
    >
      <span aria-hidden className="flex font-display text-2xl font-bold leading-none tracking-tight">
        {["J", "Y", "L"].map((letra, i) => (
          <span
            key={letra}
            style={{ transitionDelay: `${i * 30}ms` }}
            className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-entrada motion-safe:group-hover/marca:-translate-y-0.5 motion-safe:group-focus-visible/marca:-translate-y-0.5"
          >
            {letra}
          </span>
        ))}
      </span>
      <span aria-hidden className="mt-1 text-xs leading-none opacity-70">
        artes gráficas
      </span>
    </Link>
  );
}

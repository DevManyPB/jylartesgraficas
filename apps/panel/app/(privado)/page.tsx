import { entregasProximas, leerResumen } from "@jyl/core/server";
import Link from "next/link";
import { ActualizarResumen } from "@/components/tablero/ActualizarResumen";
import { Tarjeta } from "@/components/tablero/Tarjeta";
import { formatearDia, pesos } from "@/components/pedidos/formato";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "un 20 % más que el mes pasado", o null si no hay con qué comparar. */
function comparacion(mes: number, anterior: number): string {
  if (anterior === 0) return mes === 0 ? "Sin facturar todavía" : "Primer mes con facturación";
  const cambio = Math.round(((mes - anterior) / anterior) * 100);
  if (cambio === 0) return "Igual que el mes pasado";
  return `${cambio > 0 ? "+" : ""}${cambio} % frente al mes pasado (${pesos.format(anterior)})`;
}

/**
 * Tablero — SPEC.md §6.2: en una pantalla, sin scroll en escritorio, y cada
 * número lleva a su lista filtrada. Las cifras salen de `stats/resumen`, que
 * se recalcula con agregaciones cuando se queda viejo.
 *
 * El operador no ve finanzas (SPEC.md §6.1): sus tarjetas son las de trabajo.
 */
export default async function Tablero() {
  const sesion = await paginaSoloPara(["admin", "operador"]);
  const esAdmin = sesion.rol === "admin";
  const [resumen, entregas] = await Promise.all([leerResumen(), entregasProximas()]);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Tablero</h1>
        <ActualizarResumen actualizadoEn={resumen.actualizadoEn} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta
          titulo="Pedidos sin atender"
          valor={String(resumen.pedidosNuevos)}
          pie={resumen.pedidosNuevos > 0 ? "Llegaron y nadie los ha tocado" : "Todo atendido"}
          href="/pedidos?estado=recibido"
          tono={resumen.pedidosNuevos > 0 ? "aviso" : "normal"}
        />
        <Tarjeta
          titulo="En producción"
          valor={String(resumen.pedidosEnProduccion)}
          pie="Trabajos en curso"
          href="/pedidos?estado=en_produccion"
        />
        <Tarjeta
          titulo="Variantes bajo mínimo"
          valor={String(resumen.variantesBajoMinimo)}
          pie={resumen.variantesBajoMinimo > 0 ? "Hay que reponer" : "Inventario al día"}
          href="/inventario"
          tono={resumen.variantesBajoMinimo > 0 ? "aviso" : "normal"}
        />
        {esAdmin ? (
          <Tarjeta
            titulo="Por cobrar"
            valor={pesos.format(resumen.porCobrar)}
            pie="Facturas emitidas sin pagar del todo"
            href="/facturas?estado=emitida"
            tono={resumen.porCobrar > 0 ? "aviso" : "normal"}
          />
        ) : (
          <Tarjeta titulo="Pedidos listos" valor="Ver" pie="Los que esperan entrega" href="/pedidos?estado=listo" />
        )}
        {esAdmin && (
          <Tarjeta
            titulo="Facturado este mes"
            valor={pesos.format(resumen.ingresosMes)}
            pie={comparacion(resumen.ingresosMes, resumen.ingresosMesAnterior)}
            href="/facturas"
          />
        )}
      </div>

      <section aria-labelledby="entregas" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="entregas" className="font-display text-lg text-ink">
            Entregas próximas
          </h2>
          <Link href="/pedidos?estado=en_produccion" className="text-sm text-accent underline-offset-2 hover:underline">
            Ver todo lo que está en producción
          </Link>
        </div>

        {entregas.length > 0 ? (
          <ul className="mt-3 divide-y divide-border border-y border-border text-sm">
            {entregas.map((pedido) => (
              <li key={pedido.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    className="font-medium tabular-nums text-ink underline-offset-2 hover:underline"
                  >
                    {pedido.numero}
                  </Link>
                  <span className="text-ink">{pedido.contacto.nombre || pedido.contacto.email || "Sin nombre"}</span>
                  <span className="text-ink-muted">{pedido.servicio ?? "Productos de la tienda"}</span>
                </span>
                <span className="tabular-nums text-ink-muted">Para el {formatearDia(pedido.fechaDeseada!)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 border-y border-border py-6 text-sm text-ink-muted">
            Ningún pedido en producción tiene fecha de entrega.
          </p>
        )}
      </section>
    </main>
  );
}

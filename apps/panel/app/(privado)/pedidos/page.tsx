import { ESTADOS_PEDIDO, NOMBRE_ESTADO, estadoPedidoSchema, type EstadoPedido } from "@jyl/core";
import { buscarPedidos, listarPedidos } from "@jyl/core/server";
import { cn } from "@jyl/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { AvisoPedidosNuevos } from "@/components/pedidos/AvisoPedidosNuevos";
import { TablaPedidos } from "@/components/pedidos/TablaPedidos";
import { claseEntrada } from "@/components/formularios/Campo";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pedidos — Panel JYL" };

const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

function hrefCon(parametros: { estado?: EstadoPedido; desde?: string }): string {
  const busqueda = new URLSearchParams();
  if (parametros.estado) busqueda.set("estado", parametros.estado);
  if (parametros.desde) busqueda.set("desde", parametros.desde);
  const texto = busqueda.toString();
  return texto ? `/pedidos?${texto}` : "/pedidos";
}

/** Pedidos — SPEC.md §6.3. Admin y operador. */
export default async function Pedidos({ searchParams }: PageProps<"/pedidos">) {
  const sesion = await paginaSoloPara(["admin", "operador"]);
  const parametros = await searchParams;

  const estadoPedido = estadoPedidoSchema.safeParse(uno(parametros.estado));
  const estado = estadoPedido.success ? estadoPedido.data : undefined;
  const desde = uno(parametros.desde);
  const busqueda = uno(parametros.q)?.trim() ?? "";

  const pagina = busqueda
    ? { filas: await buscarPedidos(busqueda), siguiente: null }
    : await listarPedidos({ estado, despuesDe: desde });

  const filtros: { estado?: EstadoPedido; nombre: string }[] = [
    { nombre: "Todos" },
    ...ESTADOS_PEDIDO.map((e) => ({ estado: e, nombre: NOMBRE_ESTADO[e] })),
  ];

  // Los pedidos nuevos entran como "Recibido": solo en esas vistas y en la
  // primera página tiene sentido que la lista se actualice sola.
  const vistaDeLoMasReciente = !busqueda && !desde && (!estado || estado === "recibido");

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl text-ink">Pedidos</h1>
          <Link href="/pedidos/tablero" className="text-sm text-accent underline-offset-2 hover:underline">
            Ver tablero
          </Link>
        </div>
        <form action="/pedidos" role="search" className="flex items-center gap-2">
          <label htmlFor="buscar-pedido" className="sr-only">
            Buscar por número, nombre o teléfono
          </label>
          <input
            id="buscar-pedido"
            name="q"
            defaultValue={busqueda}
            placeholder="Número, nombre o teléfono"
            inputMode="search"
            autoComplete="off"
            className={cn(claseEntrada, "w-44")}
          />
          <button
            type="submit"
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-ink transition-colors hover:bg-canvas-sunken"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="mt-4">
        <AvisoPedidosNuevos uid={sesion.uid} refrescarSola={vistaDeLoMasReciente} />
      </div>

      {!busqueda && (
        <nav aria-label="Filtrar por estado" className="-mx-4 mt-4 overflow-x-auto px-4">
          <ul className="flex gap-1 whitespace-nowrap">
            {filtros.map((filtro) => {
              const activo = filtro.estado === estado;
              return (
                <li key={filtro.nombre}>
                  <Link
                    href={hrefCon({ estado: filtro.estado })}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2.5 py-1 text-sm transition-colors",
                      activo ? "bg-ink text-ink-inverted" : "text-ink-muted hover:bg-canvas-sunken hover:text-ink",
                    )}
                  >
                    {filtro.nombre}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <div className="mt-4">
        {busqueda && (
          <p className="mb-3 text-sm text-ink-muted">
            {pagina.filas.length === 0 ? `Ningún pedido coincide con "${busqueda}".` : `${pagina.filas.length === 1 ? "1 pedido" : `${pagina.filas.length} pedidos`} para "${busqueda}".`}{" "}
            <Link href="/pedidos" className="text-accent underline-offset-2 hover:underline">
              Ver todos
            </Link>
          </p>
        )}

        {pagina.filas.length > 0 ? (
          <TablaPedidos filas={pagina.filas} />
        ) : (
          !busqueda && (
            <p className="border-y border-border py-8 text-center text-sm text-ink-muted">
              {estado ? `No hay pedidos en "${NOMBRE_ESTADO[estado]}".` : "Todavía no ha llegado ningún pedido."}
            </p>
          )
        )}

        <div className="mt-4 flex gap-4 text-sm">
          {desde && (
            <Link href={hrefCon({ estado })} className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
              Volver a los más recientes
            </Link>
          )}
          {pagina.siguiente && (
            <Link
              href={hrefCon({ estado, desde: pagina.siguiente })}
              className="text-accent underline-offset-2 hover:underline"
            >
              Ver pedidos más antiguos
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

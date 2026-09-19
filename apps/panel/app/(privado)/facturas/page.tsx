import { ESTADOS_FACTURA, type EstadoFactura } from "@jyl/core";
import { listarFacturas } from "@jyl/core/server";
import { cn } from "@jyl/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { TablaFacturas } from "@/components/facturas/TablaFacturas";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Facturas — Panel JYL" };

const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

function hrefCon(parametros: { estado?: EstadoFactura; desde?: string }): string {
  const busqueda = new URLSearchParams();
  if (parametros.estado) busqueda.set("estado", parametros.estado);
  if (parametros.desde) busqueda.set("desde", parametros.desde);
  const texto = busqueda.toString();
  return texto ? `/facturas?${texto}` : "/facturas";
}

const NOMBRE_FILTRO: Record<EstadoFactura, string> = {
  borrador: "Borradores",
  emitida: "Por cobrar",
  pagada: "Pagadas",
  anulada: "Anuladas",
};

/** Facturas — SPEC.md §6.5. Solo admin: el operador no ve finanzas (§6.1). */
export default async function Facturas({ searchParams }: PageProps<"/facturas">) {
  await paginaSoloPara(["admin"]);
  const parametros = await searchParams;
  const estadoEnUrl = uno(parametros.estado) ?? "";
  const estado = (ESTADOS_FACTURA as readonly string[]).includes(estadoEnUrl) ? (estadoEnUrl as EstadoFactura) : undefined;
  const desde = uno(parametros.desde);

  const pagina = await listarFacturas({ estado, despuesDe: desde });
  const filtros: { estado?: EstadoFactura; nombre: string }[] = [
    { nombre: "Todas" },
    ...ESTADOS_FACTURA.map((e) => ({ estado: e, nombre: NOMBRE_FILTRO[e] })),
  ];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Facturas</h1>
        <Link
          href="/facturas/nueva"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-ink-inverted hover:bg-accent-hover"
        >
          Nueva factura
        </Link>
      </div>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        Lo normal es crearla desde el pedido, con «Crear factura»: así llega con los datos del cliente.
      </p>

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

      <div className="mt-4">
        {pagina.filas.length > 0 ? (
          <TablaFacturas filas={pagina.filas} />
        ) : (
          <p className="border-y border-border py-8 text-center text-sm text-ink-muted">
            {estado ? `No hay facturas en "${NOMBRE_FILTRO[estado]}".` : "Todavía no hay facturas."}
          </p>
        )}

        <div className="mt-4 flex gap-4 text-sm">
          {desde && (
            <Link href={hrefCon({ estado })} className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
              Volver a las más recientes
            </Link>
          )}
          {pagina.siguiente && (
            <Link href={hrefCon({ estado, desde: pagina.siguiente })} className="text-accent underline-offset-2 hover:underline">
              Ver facturas más antiguas
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

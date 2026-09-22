import { estadoDeStock } from "@jyl/core";
import { leerInsumo, movimientosDeInsumo } from "@jyl/core/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Volver } from "@/components/navegacion/Volver";
import { BotonMovimiento } from "@/components/inventario/BotonMovimiento";
import { BotonEditarInsumo } from "@/components/inventario/InsumoEnModal";
import { HistorialMovimientos } from "@/components/inventario/HistorialMovimientos";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Insumo — Panel JYL" };

export default async function DetalleInsumo({ params }: PageProps<"/inventario/insumos/[id]">) {
  const sesion = await paginaSoloPara(["admin", "operador"]);
  const { id } = await params;
  const [insumo, movimientos] = await Promise.all([leerInsumo(id), movimientosDeInsumo(id)]);
  if (!insumo) notFound();
  const estado = estadoDeStock(insumo.stock, insumo.stockMinimo);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Volver href="/inventario/insumos">
        Insumos
      </Volver>
      <h1 className="mt-1 font-display text-2xl text-ink">{insumo.nombre}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className="text-sm">
          <span className="font-display text-2xl tabular-nums text-ink">{insumo.stock}</span>{" "}
          <span className="text-ink-muted">{insumo.unidad}</span>
          {estado !== "ok" && (
            <span className={estado === "agotado" ? "ml-2 text-danger" : "ml-2 text-warning"}>
              {estado === "agotado" ? "agotado" : `bajo el mínimo de ${insumo.stockMinimo}`}
            </span>
          )}
        </p>
        <BotonMovimiento
          titulo={insumo.nombre}
          stockActual={insumo.stock}
          unidad={insumo.unidad}
          endpoint={`/api/insumos/${insumo.id}/movimientos`}
        />
        {/* Antes el formulario entero vivía al final de la página, debajo del
            historial: para cambiar el proveedor había que bajar hasta allí.
            Ahora es un botón junto a las otras acciones, y abre un modal. */}
        {sesion.rol === "admin" && (
          <BotonEditarInsumo
            id={insumo.id}
            inicial={{
              nombre: insumo.nombre,
              sku: insumo.sku,
              unidad: insumo.unidad,
              stockMinimo: insumo.stockMinimo,
              costoUnitario: insumo.costoUnitario,
              proveedor: insumo.proveedor,
            }}
          />
        )}
      </div>

      <div className="mt-8 flex max-w-4xl flex-col gap-10">
        <section aria-labelledby="titulo-historial">
          <h2 id="titulo-historial" className="font-display text-base text-ink">Últimos movimientos</h2>
          <div className="mt-3">
            <HistorialMovimientos movimientos={movimientos} mostrarDe={false} />
          </div>
        </section>
      </div>
    </main>
  );
}

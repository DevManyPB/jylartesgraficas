import { Vacio } from "@jyl/ui";
import type { Metadata } from "next";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { Filtros } from "@/components/filtros/Filtros";
import { IconoImagen } from "@/components/iconos/Iconos";
import { GaleriaPortafolio } from "@/components/portafolio/GaleriaPortafolio";
import { proyectosPublicos } from "@/datos/cache";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Portafolio",
  description: "Trabajos hechos en el estudio: publicidad, diseño gráfico y web.",
};

/** Portafolio — SPEC.md §4.3, con filtro por categoría. */
export default async function Portafolio({ searchParams }: PageProps<"/portafolio">) {
  const proyectos = await proyectosPublicos();
  const pedida = (await searchParams).categoria;
  const categorias = [...new Set(proyectos.map((p) => p.categoria).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  // Una categoría que ya no existe no deja la página vacía sin explicación.
  const categoria = typeof pedida === "string" && categorias.includes(pedida) ? pedida : null;
  const visibles = categoria ? proyectos.filter((p) => p.categoria === categoria) : proyectos;

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Portafolio</h1>
      <p className="mt-4 max-w-prose text-base text-ink-muted">
        Trabajos que han salido del estudio. Toca una pieza para verla completa.
      </p>

      {categorias.length > 1 && (
        <Filtros
          etiqueta="Filtrar por categoría"
          filtros={[
            { href: "/portafolio", nombre: "Todo", activo: categoria === null },
            ...categorias.map((c) => ({
              href: `/portafolio?categoria=${encodeURIComponent(c)}`,
              nombre: c,
              activo: c === categoria,
            })),
          ]}
        />
      )}

      {visibles.length > 0 ? (
        <GaleriaPortafolio proyectos={visibles} />
      ) : (
        <Vacio
          icono={<IconoImagen className="h-6 w-6" />}
          titulo={proyectos.length === 0 ? "Estamos montando el portafolio" : "Nada en esta categoría"}
          accion={
            proyectos.length === 0 ? (
              <BotonAccion href="/pedido">Pedir un trabajo</BotonAccion>
            ) : (
              <BotonAccion href="/portafolio" variante="contorno">
                Ver todas las piezas
              </BotonAccion>
            )
          }
        >
          {proyectos.length === 0
            ? "Pronto verás aquí trabajos salidos del estudio."
            : "Todavía no hemos publicado nada de este tipo."}
        </Vacio>
      )}
    </main>
  );
}

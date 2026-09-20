import "server-only";

import {
  leerConfiguracion,
  leerProductoPublico,
  leerProductosPublicos,
  leerProyectosPublicos,
  leerServiciosActivos,
} from "@jyl/core/server";
import { unstable_cache } from "next/cache";

/**
 * Lecturas del sitio público, cacheadas — SPEC.md §2.7: un visitante no
 * genera lecturas de Firestore. Cada una lleva la etiqueta con la que el
 * panel avisa de un cambio (ETIQUETAS_CACHE en @jyl/core), así que lo que se
 * guarda en el panel se ve en la siguiente visita. La hora de caducidad es
 * solo la red de seguridad por si ese aviso no llega.
 */
const UNA_HORA = 3600;

export const serviciosPublicos = unstable_cache(leerServiciosActivos, ["servicios-activos"], {
  revalidate: UNA_HORA,
  tags: ["servicios"],
});

export const configuracionPublica = unstable_cache(leerConfiguracion, ["configuracion-general"], {
  revalidate: UNA_HORA,
  tags: ["configuracion"],
});

export const productosPublicos = unstable_cache(leerProductosPublicos, ["productos-activos"], {
  revalidate: UNA_HORA,
  tags: ["productos"],
});

export const proyectosPublicos = unstable_cache(leerProyectosPublicos, ["portafolio-publicado"], {
  revalidate: UNA_HORA,
  tags: ["portafolio"],
});

/**
 * Un producto con sus variantes. Cada uno se cachea aparte, con su slug en la
 * clave; todos comparten la etiqueta "productos", así que un movimiento de
 * stock o un cambio en el panel los invalida a la vez.
 */
export function productoPublico(slug: string) {
  return unstable_cache(() => leerProductoPublico(slug), ["producto", slug], {
    revalidate: UNA_HORA,
    tags: ["productos"],
  })();
}

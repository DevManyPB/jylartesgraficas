import "server-only";

import { leerConfiguracion, leerServiciosActivos } from "@jyl/core/server";
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

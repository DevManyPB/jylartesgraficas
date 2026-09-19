// Sin `server-only`: el formulario necesita estos tipos en el navegador.
// La lectura de Firestore vive aparte, en leer-servicios.ts.

export const CATEGORIAS_SERVICIO = ["publicidad", "web", "tecnico"] as const;
export type CategoriaServicio = (typeof CATEGORIAS_SERVICIO)[number];

/** Los tres grupos de SPEC.md §3.1. */
export const NOMBRE_CATEGORIA: Record<CategoriaServicio, string> = {
  publicidad: "Publicidad y diseño gráfico",
  web: "Desarrollo web",
  tecnico: "Servicios técnicos",
};

export interface Servicio {
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  descripcion: string;
  requiereMedidas: boolean;
  /** Si el paso de referencias las pide o solo las ofrece. */
  requiereReferencias: boolean;
}

export function esCategoriaServicio(valor: unknown): valor is CategoriaServicio {
  return (CATEGORIAS_SERVICIO as readonly unknown[]).includes(valor);
}

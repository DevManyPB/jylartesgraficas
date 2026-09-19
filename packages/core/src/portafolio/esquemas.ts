import { z } from "zod";
import { imagenEntranteSchema } from "../inventario/esquemas";
import type { ImagenGuardada } from "../catalogo/tipos";

/** Portafolio — SPEC.md §6.7 y §7 `portfolio/{projectId}`. */

export const MAX_IMAGENES_PROYECTO = 12;

const texto = (max: number) => z.string().trim().max(max).default("");

export const proyectoEditableSchema = z
  .object({
    titulo: z.string().trim().min(3, "El título necesita al menos 3 letras.").max(100),
    categoria: z.string().trim().min(2, "Escribe la categoría, p. ej. Identidad de marca.").max(40),
    /** Para quién se hizo. Opcional: no todos los clientes quieren salir. */
    cliente: texto(80),
    descripcion: texto(1500),
    /** Los destacados van primero en el inicio (SPEC.md §4.3). */
    destacado: z.boolean().default(false),
    publicado: z.boolean().default(false),
    imagenes: z
      .array(imagenEntranteSchema)
      .max(MAX_IMAGENES_PROYECTO, `Hasta ${MAX_IMAGENES_PROYECTO} imágenes por proyecto.`)
      .default([]),
  })
  // El portafolio es el trabajo que se ve (SPEC.md §1): publicar un proyecto
  // sin ninguna foto dejaría un hueco en la página pública.
  .refine((p) => !p.publicado || p.imagenes.length > 0, {
    message: "Para publicarlo necesita al menos una foto.",
    path: ["publicado"],
  });

export type ProyectoEditable = z.output<typeof proyectoEditableSchema>;

export interface ProyectoDelPanel {
  id: string;
  titulo: string;
  categoria: string;
  cliente: string;
  descripcion: string;
  destacado: boolean;
  publicado: boolean;
  orden: number;
  imagenes: ImagenGuardada[];
}

import { z } from "zod";
import { CATEGORIAS_SERVICIO } from "../pedidos/servicios";

/**
 * Lo que el panel puede editar de un servicio — SPEC.md §6.8 y §7.
 *
 * No incluye `slug`: lo pone el servidor al crear y no cambia después, porque
 * es el identificador del documento y los pedidos lo guardan en `serviceId`.
 */
export const servicioEditableSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre necesita al menos 3 letras.")
    .max(80, "El nombre es demasiado largo: máximo 80 caracteres."),
  categoria: z.enum(CATEGORIAS_SERVICIO, {
    errorMap: () => ({ message: "Elige una categoría." }),
  }),
  descripcion: z.string().trim().max(600, "La descripción admite hasta 600 caracteres.").default(""),
  /** Precio de referencia en pesos. Nulo: "se cotiza", sin cifra pública. */
  precioBase: z
    .number({ invalid_type_error: "El precio tiene que ser un número." })
    .int("Escribe el precio en pesos, sin decimales.")
    .nonnegative("El precio no puede ser negativo.")
    .nullable()
    .default(null),
  activo: z.boolean().default(true),
  requiereMedidas: z.boolean().default(false),
  requiereReferencias: z.boolean().default(true),
});

export type ServicioEditable = z.output<typeof servicioEditableSchema>;
export type ServicioEditableEntrante = z.input<typeof servicioEditableSchema>;

/** Nuevo orden del catálogo: la lista completa de ids, en el orden deseado. */
export const ordenServiciosSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

/** Un servicio tal como lo ve el panel, con todo lo que tiene. */
export interface ServicioDelPanel extends ServicioEditable {
  id: string;
  orden: number;
}

import { z } from "zod";

/** La lista de ids en el orden nuevo, tal como quedó en pantalla. */
export const ordenDelCatalogoSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export type OrdenDelCatalogo = z.output<typeof ordenDelCatalogoSchema>;

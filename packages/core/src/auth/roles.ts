import { z } from "zod";

/** SPEC.md §6.1. Vive como custom claim de Firebase Auth; `users/{uid}.role`
 *  es solo un reflejo para poder mostrarlo, nunca la fuente de verdad. */
export const rolSchema = z.enum(["admin", "operador", "cliente"]);

export type Rol = z.infer<typeof rolSchema>;

export type RolDelPersonal = Extract<Rol, "admin" | "operador">;

/** Quién puede entrar al panel. Estrecha el tipo para quien lo llama. */
export function esPersonal(rol: Rol | null | undefined): rol is RolDelPersonal {
  return rol === "admin" || rol === "operador";
}

export function esAdmin(rol: Rol | null | undefined): rol is "admin" {
  return rol === "admin";
}

/** Lee el rol de los claims de un token ya verificado. Cualquier valor que no
 *  sea un rol conocido se trata como ausencia de rol. */
export function rolDesdeClaims(claims: Record<string, unknown> | undefined): Rol | null {
  const resultado = rolSchema.safeParse(claims?.role);
  return resultado.success ? resultado.data : null;
}

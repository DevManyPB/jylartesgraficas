/**
 * Dónde vive el panel del estudio, para ofrecérselo desde el menú de cuenta
 * del sitio a quien tiene rol del personal.
 *
 * El panel es otra aplicación en otro dominio, así que el enlace es un `<a>`
 * normal y no un `Link` de Next.
 *
 * En desarrollo, el panel es el vecino de al lado: `pnpm --filter panel dev`
 * toma el 3000 y la web el 3001. Se usa ese valor por defecto para que el
 * enlace funcione recién clonado el repositorio, sin configurar nada. En
 * producción hay que poner `PANEL_URL` de verdad; el dominio que queda aquí
 * es solo una suposición razonable, no una decisión de despliegue tomada.
 *
 * Solo servidor: no es `NEXT_PUBLIC_`. Al navegador solo llega si el rol de
 * la sesión da acceso; a un cliente no se le enseña ni la dirección.
 */
const PORDEFECTO =
  process.env.NODE_ENV === "production" ? "https://panel.jylartesgraficos.com" : "http://localhost:3000";

export const PANEL_URL = (process.env.PANEL_URL ?? PORDEFECTO).replace(/\/$/, "");

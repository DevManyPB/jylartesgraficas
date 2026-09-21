/**
 * Dónde vive el sitio público. El panel ya la tenía en el entorno para
 * avisarle de los cambios, pero nunca se enseñaba a quien lo usa: desde el
 * panel no había forma de volver a ver la web.
 *
 * Solo servidor: `SITIO_URL` no es `NEXT_PUBLIC_`, así que quien la necesite
 * en el navegador la recibe como prop desde un componente de servidor.
 */
export const SITIO_URL = (process.env.SITIO_URL ?? "https://jylartesgraficos.com").replace(/\/$/, "");

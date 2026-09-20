import { normalizarWhatsapp, type Horario } from "@jyl/core";

/**
 * Formatos del sitio público.
 *
 * Node y el navegador escriben distinto el espacio de "$ 80.000" y de
 * "p. m."; en un componente de cliente esa diferencia rompe la hidratación,
 * así que aquí se normaliza a un espacio corriente.
 */
const mismoEspacio = (texto: string) => texto.replace(/[  ]/g, " ");

const moneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const pesos = { format: (valor: number) => mismoEspacio(moneda.format(valor)) };

/** Enlace de WhatsApp con un mensaje ya escrito, si el número está configurado. */
export function enlaceWhatsapp(whatsapp: string, mensaje?: string): string | null {
  const numero = normalizarWhatsapp(whatsapp);
  if (!/^\d{11,15}$/.test(numero)) return null;
  return mensaje ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : `https://wa.me/${numero}`;
}

/** "8:00 a. m." a partir de "08:00". Devuelve lo mismo si no es una hora. */
export function formatearHora(hora: string): string {
  const partes = /^(\d{1,2}):(\d{2})$/.exec(hora);
  if (!partes) return hora;
  const h = Number(partes[1]);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const doce = h % 12 === 0 ? 12 : h % 12;
  return `${doce}:${partes[2]} ${sufijo}`;
}

/** "8:00 a. m. – 6:00 p. m.", "Cerrado", o null si no se ha configurado. */
export function franjaDelDia(horario: Horario): string | null {
  if (horario.cerrado) return "Cerrado";
  if (!horario.abre || !horario.cierra) return null;
  return `${formatearHora(horario.abre)} – ${formatearHora(horario.cierra)}`;
}

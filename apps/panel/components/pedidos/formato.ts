import { normalizarWhatsapp } from "@jyl/core";

/**
 * Formatos de fecha y cantidades del panel. Siempre en hora de Colombia: el
 * servidor puede correr en otra zona, y un pedido de las 11 p. m. no debe
 * aparecer con la fecha del día siguiente.
 */

const ZONA = "America/Bogota";

/**
 * Node y el navegador no ponen el mismo espacio dentro de "p. m." ni entre
 * "$" y la cifra: uno usa espacio duro y el otro uno normal. En un componente
 * de cliente eso hace que React rechace la hidratación, así que aquí se
 * normalizan a un espacio corriente y las dos partes escriben lo mismo.
 */
const mismoEspacio = (texto: string) => texto.replace(/[  ]/g, " ");

const fechaCorta = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: ZONA,
});

const fechaLarga = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: ZONA,
});

const soloFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" });

export function formatearFechaCorta(iso: string | null): string {
  return iso ? mismoEspacio(fechaCorta.format(new Date(iso))) : "—";
}

export function formatearFechaLarga(iso: string | null): string {
  return iso ? mismoEspacio(fechaLarga.format(new Date(iso))) : "—";
}

/** Una fecha sin hora ("2026-10-02"), tal como la eligió el cliente. */
export function formatearDia(dia: string): string {
  // Se interpreta en UTC a propósito: es un día del calendario, no un instante.
  return mismoEspacio(soloFecha.format(new Date(`${dia}T00:00:00Z`)));
}

const moneda = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Se usa como `pesos.format(1000)`; devuelve "$ 1.000" con espacio normal. */
export const pesos = { format: (valor: number) => mismoEspacio(moneda.format(valor)) };

export function pesoDeArchivo(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Enlace de WhatsApp para un teléfono tal como lo escribió el cliente, con la
 * misma regla que el WhatsApp del estudio en Configuración. Si no parece un
 * número completo no se adivina: no hay enlace.
 */
export function enlaceWhatsapp(telefono: string): string | null {
  const numero = normalizarWhatsapp(telefono);
  return /^\d{11,15}$/.test(numero) ? `https://wa.me/${numero}` : null;
}

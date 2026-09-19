/**
 * Búsqueda de pedidos por nombre — SPEC.md §6.3.
 *
 * Firestore no busca texto dentro de un campo, así que cada pedido guarda al
 * crearse una lista `busqueda[]` con los prefijos de cada palabra, en
 * minúsculas y sin tildes: "Laura Méndez" guarda "la", "lau", …, "mendez".
 * Buscar es entonces un `array-contains`, que sí tiene índice. El costo es
 * espacio (unas decenas de entradas por pedido) y ninguna lectura extra.
 */

const LARGO_MINIMO = 2;
const LARGO_MAXIMO = 20;

/** "Méndez" → "mendez". Sin tildes ni mayúsculas, que no cuentan al buscar. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9@.\s-]/g, " ");
}

function palabras(texto: string): string[] {
  return normalizarTexto(texto)
    .split(/[\s.@-]+/)
    .filter((p) => p.length >= LARGO_MINIMO);
}

function prefijos(palabra: string): string[] {
  const corta = palabra.slice(0, LARGO_MAXIMO);
  return Array.from({ length: corta.length - LARGO_MINIMO + 1 }, (_, i) => corta.slice(0, LARGO_MINIMO + i));
}

export interface DatosBuscables {
  numero: string;
  nombre: string;
  email: string;
  telefono: string;
}

/** Lo que se guarda en `orders/{id}.busqueda`. */
export function tokensDeBusqueda(datos: DatosBuscables): string[] {
  const tokens = new Set<string>();

  for (const palabra of palabras(datos.nombre)) prefijos(palabra).forEach((p) => tokens.add(p));
  // Del correo solo la parte antes de la arroba: "laura.mendez@gmail.com"
  // encuentra a Laura, pero "gmail" no debe traer media base de datos.
  for (const palabra of palabras(datos.email.split("@")[0] ?? "")) prefijos(palabra).forEach((p) => tokens.add(p));

  const telefono = datos.telefono.replace(/\D/g, "");
  if (telefono.length >= 7) {
    tokens.add(telefono);
    tokens.add(telefono.slice(-4)); // Lo que se suele recordar de un número.
  }

  tokens.add(normalizarTexto(datos.numero));
  return [...tokens];
}

/**
 * Qué buscar con `array-contains` y qué exigir después: Firestore admite un
 * solo `array-contains` por consulta, así que la palabra más larga va a la
 * consulta (la más selectiva) y el resto se comprueba sobre lo que vuelve.
 */
export function planDeBusqueda(texto: string): { consulta: string; resto: string[] } | null {
  // Sin letras es un teléfono o parte de él, escrito como sea: "301 222 3344".
  const digitos = texto.replace(/\D/g, "");
  if (!/[a-zA-ZÀ-ÿ]/.test(texto)) return digitos.length >= 4 ? { consulta: digitos, resto: [] } : null;

  const partes = palabras(texto).map((p) => p.slice(0, LARGO_MAXIMO));
  if (partes.length === 0) return null;

  const ordenadas = [...partes].sort((a, b) => b.length - a.length);
  return { consulta: ordenadas[0]!, resto: ordenadas.slice(1) };
}

import { NOMBRE_METODO_PAGO, NOMBRE_ESTADO_FACTURA, totalDeLinea, type FacturaDelPanel } from "@jyl/core";
import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import { formatearDia, pesos } from "@/components/pedidos/formato";

/**
 * PDF de la factura, generado en el navegador con pdf-lib — SPEC.md §6.5:
 * sin servicio externo. Tamaño carta, que es el que se imprime en Colombia.
 *
 * Usa Helvetica, que viene dentro de todo lector de PDF y no hay que
 * incrustar; cubre las tildes y la ñ. Lo que no pueda escribir (un emoji en
 * un nombre, p. ej.) se cambia por "?" en vez de romper la descarga.
 */

const ANCHO = 612;
const ALTO = 792;
const MARGEN = 48;
const UTIL = ANCHO - MARGEN * 2;

const soloFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" });

export async function generarPdfFactura(factura: FacturaDelPanel): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const TINTA = rgb(0x14 / 255, 0x12 / 255, 0x0f / 255);
  const SUAVE = rgb(0x5c / 255, 0x58 / 255, 0x50 / 255);
  const ACENTO = rgb(0xd6 / 255, 0x12 / 255, 0x7a / 255);
  const FONDO = rgb(0.96, 0.955, 0.945);
  const LINEA = rgb(0.86, 0.85, 0.83);

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Factura ${factura.numero ?? ""}`.trim());
  pdf.setAuthor(factura.emisor?.razonSocial || "JYL Artes Gráficos");
  pdf.setCreator("Panel JYL");

  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);

  const seguro = (fuente: PDFFont, texto: string) =>
    [...texto.replace(/−/g, "-")]
      .map((c) => {
        try {
          fuente.encodeText(c);
          return c;
        } catch {
          return "?";
        }
      })
      .join("");

  let pagina = pdf.addPage([ANCHO, ALTO]);
  let y = ALTO - MARGEN;

  function escribir(
    texto: string,
    x: number,
    opciones: { tam?: number; fuente?: PDFFont; color?: RGB; alinear?: "izq" | "der"; en?: PDFPage; y?: number } = {},
  ) {
    const fuente = opciones.fuente ?? normal;
    const tam = opciones.tam ?? 9;
    const limpio = seguro(fuente, texto);
    const ancho = fuente.widthOfTextAtSize(limpio, tam);
    (opciones.en ?? pagina).drawText(limpio, {
      x: opciones.alinear === "der" ? x - ancho : x,
      y: opciones.y ?? y,
      size: tam,
      font: fuente,
      color: opciones.color ?? TINTA,
    });
  }

  /** Parte un texto en renglones que caben en `ancho`. */
  function renglones(texto: string, ancho: number, tam = 9, fuente = normal): string[] {
    const palabras = seguro(fuente, texto).split(/\s+/).filter(Boolean);
    const lineas: string[] = [];
    let actual = "";
    for (const palabra of palabras) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tam) <= ancho || !actual) actual = prueba;
      else {
        lineas.push(actual);
        actual = palabra;
      }
    }
    if (actual) lineas.push(actual);
    return lineas.length ? lineas : [""];
  }

  // --- Encabezado ----------------------------------------------------------
  pagina.drawRectangle({ x: 0, y: ALTO - 8, width: ANCHO, height: 8, color: ACENTO });

  const emisor = factura.emisor;
  escribir(emisor?.razonSocial || "JYL Artes Gráficos", MARGEN, { tam: 16, fuente: negrita });
  let yEmisor = y - 16;
  for (const dato of [
    emisor?.nit ? `NIT ${emisor.nit}` : "",
    emisor?.direccion ?? "",
    emisor?.telefono ? `Tel. ${emisor.telefono}` : "",
    emisor?.email ?? "",
  ].filter(Boolean)) {
    escribir(dato, MARGEN, { color: SUAVE, y: yEmisor });
    yEmisor -= 12;
  }

  const derecha = ANCHO - MARGEN;
  escribir("FACTURA", derecha, { tam: 9, fuente: negrita, color: ACENTO, alinear: "der" });
  escribir(factura.numero ?? "Borrador", derecha, { tam: 18, fuente: negrita, alinear: "der", y: y - 20 });
  let yFechas = y - 36;
  if (factura.emitidaEn) {
    escribir(`Emitida el ${soloFecha.format(new Date(factura.emitidaEn))}`, derecha, { color: SUAVE, alinear: "der", y: yFechas });
    yFechas -= 12;
  }
  if (factura.vencimientoEn) {
    escribir(`Vence el ${formatearDia(factura.vencimientoEn)}`, derecha, { color: SUAVE, alinear: "der", y: yFechas });
    yFechas -= 12;
  }
  if (factura.estado === "anulada" || factura.estado === "pagada") {
    escribir(NOMBRE_ESTADO_FACTURA[factura.estado].toUpperCase(), derecha, {
      tam: 11,
      fuente: negrita,
      color: factura.estado === "anulada" ? rgb(0.75, 0.1, 0.1) : rgb(0.1, 0.5, 0.25),
      alinear: "der",
      y: yFechas - 4,
    });
    yFechas -= 16;
  }

  y = Math.min(yEmisor, yFechas) - 20;

  // --- Cliente -------------------------------------------------------------
  const c = factura.clienteDatos;
  escribir("FACTURAR A", MARGEN, { tam: 8, fuente: negrita, color: SUAVE });
  y -= 14;
  escribir(c.nombre, MARGEN, { tam: 11, fuente: negrita });
  y -= 13;
  for (const dato of [
    c.documento ? `C.C./NIT ${c.documento}` : "",
    [c.direccion, c.ciudad].filter(Boolean).join(", "),
    [c.telefono, c.email].filter(Boolean).join(" · "),
  ].filter(Boolean)) {
    escribir(dato, MARGEN, { color: SUAVE });
    y -= 12;
  }
  y -= 16;

  // --- Líneas --------------------------------------------------------------
  const col = {
    descripcion: MARGEN + 6,
    cantidad: MARGEN + UTIL * 0.58,
    precio: MARGEN + UTIL * 0.74,
    descuento: MARGEN + UTIL * 0.87,
    total: derecha - 6,
  };
  const anchoDescripcion = UTIL * 0.5;

  function cabeceraDeTabla() {
    pagina.drawRectangle({ x: MARGEN, y: y - 6, width: UTIL, height: 20, color: FONDO });
    const op = { tam: 8, fuente: negrita, color: SUAVE } as const;
    escribir("DESCRIPCIÓN", col.descripcion, op);
    escribir("CANT.", col.cantidad, { ...op, alinear: "der" });
    escribir("PRECIO UNIT.", col.precio, { ...op, alinear: "der" });
    escribir("DESCUENTO", col.descuento, { ...op, alinear: "der" });
    escribir("TOTAL", col.total, { ...op, alinear: "der" });
    y -= 24;
  }

  function paginaNueva() {
    pagina = pdf.addPage([ANCHO, ALTO]);
    y = ALTO - MARGEN;
    escribir(`${factura.numero ?? "Borrador"} (continuación)`, MARGEN, { color: SUAVE });
    y -= 24;
    cabeceraDeTabla();
  }

  cabeceraDeTabla();
  for (const linea of factura.lineas) {
    const partes = renglones(linea.descripcion, anchoDescripcion);
    const alto = partes.length * 12 + 8;
    if (y - alto < MARGEN + 40) paginaNueva();

    partes.forEach((parte, i) => escribir(parte, col.descripcion, { y: y - i * 12 }));
    escribir(String(linea.cantidad), col.cantidad, { alinear: "der" });
    escribir(pesos.format(linea.precioUnitario), col.precio, { alinear: "der" });
    escribir(linea.descuento ? `-${pesos.format(linea.descuento)}` : "—", col.descuento, { alinear: "der", color: SUAVE });
    escribir(pesos.format(totalDeLinea(linea)), col.total, { alinear: "der" });
    y -= alto;
    pagina.drawLine({ start: { x: MARGEN, y: y + 6 }, end: { x: derecha, y: y + 6 }, thickness: 0.5, color: LINEA });
  }

  // --- Totales -------------------------------------------------------------
  const filasTotales: [string, string][] = [
    ["Subtotal", pesos.format(factura.subtotal)],
    ["Descuentos", factura.descuento ? `-${pesos.format(factura.descuento)}` : pesos.format(0)],
    [`Impuesto${factura.impuestoPorcentaje !== null ? ` (${factura.impuestoPorcentaje} %)` : ""}`, pesos.format(factura.impuesto)],
  ];
  const pagado = factura.pagos.reduce((s, p) => s + p.monto, 0);
  const altoTotales = filasTotales.length * 14 + 30 + (factura.pagos.length ? factura.pagos.length * 12 + 40 : 0);
  if (y - altoTotales < MARGEN + 30) {
    pagina = pdf.addPage([ANCHO, ALTO]);
    y = ALTO - MARGEN;
  }
  y -= 10;
  const etiquetaX = derecha - 190;
  for (const [etiqueta, valor] of filasTotales) {
    escribir(etiqueta, etiquetaX, { color: SUAVE });
    escribir(valor, derecha, { alinear: "der" });
    y -= 14;
  }
  pagina.drawLine({ start: { x: etiquetaX, y: y + 8 }, end: { x: derecha, y: y + 8 }, thickness: 1, color: TINTA });
  y -= 8;
  escribir("Total", etiquetaX, { tam: 12, fuente: negrita });
  escribir(pesos.format(factura.total), derecha, { tam: 12, fuente: negrita, alinear: "der" });
  y -= 24;

  // --- Pagos ---------------------------------------------------------------
  if (factura.pagos.length > 0) {
    escribir("PAGOS RECIBIDOS", MARGEN, { tam: 8, fuente: negrita, color: SUAVE });
    y -= 14;
    for (const p of factura.pagos) {
      escribir(`${formatearDia(p.fecha)} · ${NOMBRE_METODO_PAGO[p.metodo]}`, MARGEN, { color: SUAVE });
      escribir(pesos.format(p.monto), MARGEN + 260, { alinear: "der" });
      y -= 12;
    }
    y -= 4;
    if (factura.estado !== "anulada") {
      escribir("Saldo pendiente", MARGEN, { fuente: negrita });
      escribir(pesos.format(Math.max(0, factura.total - pagado)), MARGEN + 260, { fuente: negrita, alinear: "der" });
    }
  }

  // --- Pie en todas las páginas --------------------------------------------
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    escribir(`Página ${i + 1} de ${paginas.length}`, derecha, { en: p, y: MARGEN / 2, tam: 8, color: SUAVE, alinear: "der" });
    if (factura.anulacion) {
      escribir(`Anulada: ${factura.anulacion.motivo}`, MARGEN, { en: p, y: MARGEN / 2, tam: 8, color: SUAVE });
    }
  });

  return pdf.save();
}

/** Descarga el PDF con el número como nombre de archivo. */
export async function descargarPdfFactura(factura: FacturaDelPanel): Promise<void> {
  const bytes = await generarPdfFactura(factura);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${factura.numero ?? "factura-borrador"}.pdf`;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  // Dar tiempo a que el navegador empiece la descarga antes de soltar la URL.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

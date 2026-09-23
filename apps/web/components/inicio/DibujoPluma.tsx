"use client";

import { useEffect, useRef } from "react";

/**
 * Un diseño haciéndose en el héroe — SPEC.md §4.3.
 *
 * Como en un programa de diseño: la herramienta pluma traza una forma
 * vectorial con sus anclas y tiradores en cian, la cierra, la rellena en una
 * de las tintas (sólido, trama de puntos o solo contorno), aparece el cuadro
 * de selección y se borra para empezar otra. **Cada forma es nueva**: se
 * genera al azar —manchas, estrellas, polígonos, hojas, olas, espirales—
 * con su tamaño, posición y giro, así que nunca se repite la misma.
 *
 * Es movimiento continuo, que SPEC.md §9 reserva al héroe: se detiene fuera
 * de pantalla y con la pestaña oculta, y con `prefers-reduced-motion` deja
 * una sola forma terminada y quieta.
 *
 * Todo se escribe directo en el SVG en cada fotograma, sin estado de React:
 * el dibujo no re-renderiza nada. Las formas se generan solo en el navegador,
 * después de montar, para que el azar no rompa la hidratación.
 */

type Punto = { x: number; y: number };
type Ancla = { p: Punto; entrada: Punto; salida: Punto };
type Tinta = "cian" | "magenta" | "amarillo";
type Relleno = "solido" | "trama" | "contorno";

interface Forma {
  anclas: Ancla[];
  cerrada: boolean;
  relleno: Relleno;
  tinta: Tinta;
  centro: Punto;
  giro: number;
}

/** Clases enteras, para que Tailwind las encuentre en este archivo. */
const RELLENO_TINTA: Record<Tinta, string> = {
  cian: "fill-tinta-cian",
  magenta: "fill-accent",
  amarillo: "fill-tinta-amarillo",
};
const TRAZO_TINTA: Record<Tinta, string> = {
  cian: "stroke-tinta-cian",
  magenta: "stroke-accent",
  amarillo: "stroke-tinta-amarillo",
};

const ANCHO = 400;
const ALTO = 260;
const SVG_NS = "http://www.w3.org/2000/svg";

/** Cuánto dura cada fase, en milisegundos. */
const FASES = { relleno: 550, pausa: 1700, salida: 600, espera: 350 } as const;

const azar = (min: number, max: number) => min + Math.random() * (max - min);
const entero = (min: number, max: number) => Math.floor(azar(min, max + 1));
function elegir<T>(opciones: readonly T[]): T {
  return opciones[Math.floor(Math.random() * opciones.length)]!;
}

const esquina = (p: Punto): Ancla => ({ p, entrada: p, salida: p });

/** Tiradores suaves (Catmull-Rom): cada ancla mira hacia sus vecinas. */
function suavizar(puntos: Punto[], cerrada: boolean, tension: number): Ancla[] {
  return puntos.map((p, i) => {
    const previo = puntos[(i - 1 + puntos.length) % puntos.length]!;
    const siguiente = puntos[(i + 1) % puntos.length]!;
    if (!cerrada && (i === 0 || i === puntos.length - 1)) return esquina(p);
    const dx = (siguiente.x - previo.x) * tension;
    const dy = (siguiente.y - previo.y) * tension;
    return { p, entrada: { x: p.x - dx, y: p.y - dy }, salida: { x: p.x + dx, y: p.y + dy } };
  });
}

// ── Generadores: cada uno devuelve anclas alrededor de (0, 0) ──────────────

function mancha(s: number): Omit<Forma, "relleno" | "tinta" | "centro" | "giro"> {
  const n = entero(4, 7);
  const puntos = Array.from({ length: n }, (_, i) => {
    const angulo = (i / n) * Math.PI * 2 + azar(-0.3, 0.3);
    const r = s * azar(0.6, 1);
    return { x: Math.cos(angulo) * r, y: Math.sin(angulo) * r };
  });
  return { anclas: suavizar(puntos, true, azar(0.18, 0.3)), cerrada: true };
}

function estrella(s: number): Omit<Forma, "relleno" | "tinta" | "centro" | "giro"> {
  const picos = entero(5, 8);
  const interior = s * azar(0.38, 0.6);
  const puntos = Array.from({ length: picos * 2 }, (_, i) => {
    const r = i % 2 === 0 ? s : interior;
    const angulo = (i / (picos * 2)) * Math.PI * 2 - Math.PI / 2;
    return esquina({ x: Math.cos(angulo) * r, y: Math.sin(angulo) * r });
  });
  return { anclas: puntos, cerrada: true };
}

function poligono(s: number): Omit<Forma, "relleno" | "tinta" | "centro" | "giro"> {
  const lados = entero(3, 6);
  const anclas = Array.from({ length: lados }, (_, i) => {
    const angulo = (i / lados) * Math.PI * 2 - Math.PI / 2;
    return esquina({ x: Math.cos(angulo) * s, y: Math.sin(angulo) * s });
  });
  return { anclas, cerrada: true };
}

function hoja(s: number): Omit<Forma, "relleno" | "tinta" | "centro" | "giro"> {
  const ancho = s * azar(0.7, 1.1);
  const panza = s * azar(0.1, 0.55);
  return {
    anclas: [
      { p: { x: 0, y: -s }, entrada: { x: -ancho, y: -panza }, salida: { x: ancho, y: -panza } },
      { p: { x: 0, y: s }, entrada: { x: ancho, y: panza }, salida: { x: -ancho, y: panza } },
    ],
    cerrada: true,
  };
}

function ola(s: number): Omit<Forma, "relleno" | "tinta" | "centro" | "giro"> {
  const n = entero(4, 6);
  const ancho = s * 2.8;
  const paso = ancho / (n - 1);
  const alto = s * azar(0.3, 0.7);
  const anclas = Array.from({ length: n }, (_, i) => {
    const x = -ancho / 2 + i * paso;
    const y = (i % 2 === 0 ? -1 : 1) * alto * azar(0.6, 1);
    const d = paso * 0.45;
    return { p: { x, y }, entrada: { x: x - d, y }, salida: { x: x + d, y } };
  });
  return { anclas, cerrada: false };
}

function espiral(s: number): Omit<Forma, "relleno" | "tinta" | "centro" | "giro"> {
  const cuartos = entero(6, 10);
  const inicio = azar(0, Math.PI * 2);
  const anclas = Array.from({ length: cuartos }, (_, k) => {
    const r = s * (0.12 + (0.88 * k) / (cuartos - 1));
    const angulo = inicio + (k * Math.PI) / 2;
    const p = { x: Math.cos(angulo) * r, y: Math.sin(angulo) * r };
    // Tangente de la circunferencia y el tirador de un cuarto de vuelta.
    const tx = -Math.sin(angulo);
    const ty = Math.cos(angulo);
    const h = r * 0.5523;
    return { p, entrada: { x: p.x - tx * h, y: p.y - ty * h }, salida: { x: p.x + tx * h, y: p.y + ty * h } };
  });
  return { anclas, cerrada: false };
}

const GENERADORES = [mancha, mancha, estrella, poligono, hoja, ola, espiral] as const;

function nuevaForma(tintaAnterior: Tinta | null): Forma {
  const s = azar(68, 100);
  const base = elegir(GENERADORES)(s);
  const tintas = (["cian", "magenta", "amarillo"] as const).filter((t) => t !== tintaAnterior);
  return {
    ...base,
    relleno: base.cerrada ? elegir(["solido", "solido", "trama", "contorno"] as const) : "contorno",
    tinta: elegir(tintas),
    centro: { x: azar(140, ANCHO - 140), y: azar(105, ALTO - 105) },
    giro: azar(-40, 40),
  };
}

/** El `d` de la forma entera, o de sus primeros `tramos` tramos. */
function trazado(forma: Forma, tramos?: number): string {
  const { anclas, cerrada } = forma;
  const total = cerrada ? anclas.length : anclas.length - 1;
  const hasta = tramos ?? total;
  let d = `M${anclas[0]!.p.x} ${anclas[0]!.p.y}`;
  for (let i = 0; i < hasta; i += 1) {
    const a = anclas[i]!;
    const b = anclas[(i + 1) % anclas.length]!;
    d += ` C${a.salida.x} ${a.salida.y} ${b.entrada.x} ${b.entrada.y} ${b.p.x} ${b.p.y}`;
  }
  return cerrada && hasta === total ? `${d} Z` : d;
}

function elemento<K extends keyof SVGElementTagNameMap>(
  etiqueta: K,
  atributos: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const nodo = document.createElementNS(SVG_NS, etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) nodo.setAttribute(clave, String(valor));
  return nodo;
}

const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function DibujoPluma({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const grupoRef = useRef<SVGGElement>(null);
  const formaRef = useRef<SVGGElement>(null);
  const rellenoRef = useRef<SVGPathElement>(null);
  const trazoRef = useRef<SVGPathElement>(null);
  const anclasRef = useRef<SVGGElement>(null);
  const cajaRef = useRef<SVGGElement>(null);
  const plumaRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const grupo = grupoRef.current;
    const capaForma = formaRef.current;
    const relleno = rellenoRef.current;
    const trazo = trazoRef.current;
    const capaAnclas = anclasRef.current;
    const caja = cajaRef.current;
    const pluma = plumaRef.current;
    if (!svg || !grupo || !capaForma || !relleno || !trazo || !capaAnclas || !caja || !pluma) return;

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let forma = nuevaForma(null);
    let largo = 0;
    let cortes: number[] = []; // largo acumulado hasta cada ancla
    let nodosAnclas: SVGGElement[] = [];

    /** Prepara el SVG para dibujar `forma` desde cero. */
    function montar() {
      capaForma!.setAttribute("transform", `translate(${forma.centro.x} ${forma.centro.y}) rotate(${forma.giro})`);

      // Largo hasta cada ancla: se mide trazando la forma por tramos.
      const tramos = forma.cerrada ? forma.anclas.length : forma.anclas.length - 1;
      cortes = [0];
      for (let i = 1; i <= tramos; i += 1) {
        trazo!.setAttribute("d", trazado(forma, i));
        cortes.push(trazo!.getTotalLength());
      }
      trazo!.setAttribute("d", trazado(forma));
      largo = trazo!.getTotalLength();
      trazo!.style.strokeDasharray = `${largo}`;
      trazo!.style.strokeDashoffset = `${largo}`;
      trazo!.setAttribute("class", "stroke-ink-inverted");
      trazo!.style.strokeWidth = "1.5";

      relleno!.setAttribute("d", trazado(forma));
      relleno!.style.fillOpacity = "0";
      if (forma.relleno === "solido") relleno!.setAttribute("class", RELLENO_TINTA[forma.tinta]);
      else if (forma.relleno === "trama") {
        relleno!.removeAttribute("class");
        relleno!.setAttribute("fill", `url(#dibujo-trama-${forma.tinta})`);
      } else relleno!.setAttribute("class", "fill-transparent");
      if (forma.relleno === "solido" || forma.relleno === "contorno") relleno!.removeAttribute("fill");

      // Anclas con sus tiradores, ocultas hasta que la pluma pasa por ellas.
      capaAnclas!.replaceChildren();
      nodosAnclas = forma.anclas.map((a) => {
        const g = elemento("g", { opacity: 0 });
        const curva = a.entrada.x !== a.p.x || a.entrada.y !== a.p.y || a.salida.x !== a.p.x || a.salida.y !== a.p.y;
        if (curva) {
          g.append(
            elemento("path", {
              d: `M${a.entrada.x} ${a.entrada.y} L${a.p.x} ${a.p.y} L${a.salida.x} ${a.salida.y}`,
              class: "stroke-tinta-cian",
              fill: "none",
              "stroke-width": 0.8,
            }),
            elemento("circle", { cx: a.entrada.x, cy: a.entrada.y, r: 2.4, class: "fill-canvas-dark stroke-tinta-cian", "stroke-width": 1 }),
            elemento("circle", { cx: a.salida.x, cy: a.salida.y, r: 2.4, class: "fill-canvas-dark stroke-tinta-cian", "stroke-width": 1 }),
          );
        }
        g.append(
          elemento("rect", { x: a.p.x - 3, y: a.p.y - 3, width: 6, height: 6, class: "fill-canvas-dark stroke-tinta-cian", "stroke-width": 1.2 }),
        );
        capaAnclas!.append(g);
        return g;
      });
      capaAnclas!.style.opacity = "1";

      caja!.style.opacity = "0";
      pluma!.style.opacity = quieto ? "0" : "1";
      grupo!.style.opacity = "1";
    }

    /** Coloca el cuadro de selección alrededor de la forma terminada. */
    function enmarcar() {
      const b = trazo!.getBBox();
      const m = 6;
      caja!.replaceChildren(
        elemento("rect", {
          x: b.x - m,
          y: b.y - m,
          width: b.width + m * 2,
          height: b.height + m * 2,
          fill: "none",
          class: "stroke-tinta-cian",
          "stroke-width": 1,
        }),
        ...[
          [b.x - m, b.y - m],
          [b.x + b.width + m, b.y - m],
          [b.x - m, b.y + b.height + m],
          [b.x + b.width + m, b.y + b.height + m],
        ].map(([x, y]) =>
          elemento("rect", { x: x! - 3, y: y! - 3, width: 6, height: 6, class: "fill-ink-inverted stroke-tinta-cian", "stroke-width": 1 }),
        ),
      );
    }

    /** Pinta la forma terminada: el relleno y, si es contorno, el trazo en su tinta. */
    function terminar(t: number) {
      const final = forma.relleno === "trama" ? 1 : 0.9;
      relleno!.style.fillOpacity = String(final * t);
      if (forma.relleno === "contorno") {
        trazo!.setAttribute("class", TRAZO_TINTA[forma.tinta]);
        trazo!.style.strokeWidth = String(1.5 + 2.5 * t);
      }
      capaAnclas!.style.opacity = String(1 - t);
      pluma!.style.opacity = String(1 - t);
    }

    montar();

    // Sin movimiento: una forma terminada, quieta, y nada más.
    if (quieto) {
      trazo.style.strokeDashoffset = "0";
      terminar(1);
      return;
    }

    let fase: "dibujo" | "relleno" | "pausa" | "salida" | "espera" = "dibujo";
    let transcurrido = 0;
    let duracionDibujo = 0;
    const ajustarDibujo = () => {
      // Más anclas, más tiempo: la pluma va a un ritmo parecido siempre.
      duracionDibujo = 900 + forma.anclas.length * 260;
    };
    ajustarDibujo();

    let visible = true;
    let anterior = performance.now();
    let frame = 0;

    function paso(ahora: number) {
      const dt = Math.min(ahora - anterior, 64);
      anterior = ahora;
      if (visible && !document.hidden) {
        transcurrido += dt;
        avanzar();
      }
      frame = requestAnimationFrame(paso);
    }

    function avanzar() {
      if (fase === "dibujo") {
        const t = suave(Math.min(transcurrido / duracionDibujo, 1));
        const hecho = largo * t;
        trazo!.style.strokeDashoffset = String(largo - hecho);
        const punto = trazo!.getPointAtLength(hecho);
        pluma!.setAttribute("transform", `translate(${punto.x} ${punto.y})`);
        nodosAnclas.forEach((nodo, i) => {
          if ((cortes[i] ?? Infinity) <= hecho + 0.5) nodo.setAttribute("opacity", "1");
        });
        if (transcurrido >= duracionDibujo) siguiente("relleno");
      } else if (fase === "relleno") {
        terminar(suave(Math.min(transcurrido / FASES.relleno, 1)));
        if (transcurrido >= FASES.relleno) {
          enmarcar();
          siguiente("pausa");
        }
      } else if (fase === "pausa") {
        caja!.style.opacity = String(Math.min(transcurrido / 200, 1));
        if (transcurrido >= FASES.pausa) siguiente("salida");
      } else if (fase === "salida") {
        grupo!.style.opacity = String(1 - suave(Math.min(transcurrido / FASES.salida, 1)));
        if (transcurrido >= FASES.salida) siguiente("espera");
      } else if (transcurrido >= FASES.espera) {
        forma = nuevaForma(forma.tinta);
        montar();
        ajustarDibujo();
        siguiente("dibujo");
      }
    }

    function siguiente(nueva: typeof fase) {
      fase = nueva;
      transcurrido = 0;
    }

    const observador = new IntersectionObserver(([entrada]) => {
      visible = entrada?.isIntersecting ?? true;
    });
    observador.observe(svg);
    frame = requestAnimationFrame(paso);

    return () => {
      cancelAnimationFrame(frame);
      observador.disconnect();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <defs>
        {(["cian", "magenta", "amarillo"] as const).map((tinta) => (
          <pattern key={tinta} id={`dibujo-trama-${tinta}`} width="6" height="12" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.6" className={RELLENO_TINTA[tinta]} />
            <circle cx="0" cy="9" r="1.6" className={RELLENO_TINTA[tinta]} />
            <circle cx="6" cy="9" r="1.6" className={RELLENO_TINTA[tinta]} />
          </pattern>
        ))}
      </defs>
      <g ref={grupoRef} style={{ opacity: 0 }}>
        <g ref={formaRef}>
          <path ref={rellenoRef} />
          <path ref={trazoRef} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <g ref={anclasRef} />
          <g ref={cajaRef} />
          <g ref={plumaRef}>
            {/* La plumilla: la punta toca el trazo que va dibujando. */}
            <path d="M0 0 L-5 -13 L0 -19 L5 -13 Z" className="fill-ink-inverted" />
            <circle cx="0" cy="-12" r="1.6" className="fill-canvas-dark" />
          </g>
        </g>
      </g>
    </svg>
  );
}

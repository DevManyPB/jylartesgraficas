"use client";

import { useEffect, useRef, useState } from "react";

interface Particula {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  baseAlpha: number;
  phase: number;
}

const PALABRAS = ["DISEÑO", "WEB", "PRINT", "CÓDIGO"] as const;

/**
 * Hero interactivo con morfismo de partículas tipográficas — SPEC.md §9 / AGENTS.md §8.
 *
 * Alterna de forma fluida y orgánica entre los 4 pilares del estudio:
 * "DISEÑO" ➔ "WEB" ➔ "PRINT" ➔ "CÓDIGO".
 *
 * Las partículas estallan y se recomponen hacia cada nueva palabra, y reaccionan
 * a la proximidad del cursor con física de resortes en tiempo real.
 */
export function ParticulasJYL() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [palabraActiva, setPalabraActiva] = useState(0);

  // Referencia a función para cambiar palabra desde fuera del useEffect
  const cambiarPalabraRef = useRef<((nuevoIndice: number) => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number | null = null;
    let timerPalabra: NodeJS.Timeout | null = null;
    let isVisible = true;
    const particulas: Particula[] = [];
    let limites = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    let ultimoMovimiento = 0;
    let indiceActual = 0;

    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
      radius: 85,
    };

    const mediaQueryMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = mediaQueryMotion.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    mediaQueryMotion.addEventListener("change", handleMotionChange);

    const mediaQueryPointer = window.matchMedia("(pointer: fine)");
    let isFinePointer = mediaQueryPointer.matches;
    const handlePointerChange = (e: MediaQueryListEvent) => {
      isFinePointer = e.matches;
    };
    mediaQueryPointer.addEventListener("change", handlePointerChange);

    const paleta = [
      "rgba(214, 18, 122,",   // accent principal #D6127A
      "rgba(238, 45, 142,",   // acento vibrante
      "rgba(255, 130, 195,",  // brillo suave
      "rgba(188, 12, 102,",   // acento profundo
    ];

    // Muestreo tipográfico para calcular coordenadas de cualquier palabra
    function obtenerPuntosDePalabra(palabra: string, ancho: number, alto: number): Array<{ x: number; y: number }> {
      if (ancho <= 0 || alto <= 0) return [];

      const offscreen = document.createElement("canvas");
      offscreen.width = ancho;
      offscreen.height = alto;
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return [];

      const len = palabra.length;
      // Escala tipográfica adaptativa según la longitud de la palabra
      const sizeFactor = len <= 3 ? 0.38 : len <= 5 ? 0.27 : 0.21;
      const fontSize = Math.floor(Math.min(ancho * sizeFactor, alto * 0.52, 145));

      offCtx.font = `bold ${fontSize}px "Space Grotesk", system-ui, -apple-system, sans-serif`;
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      offCtx.fillStyle = "#ffffff";
      offCtx.fillText(palabra, ancho / 2, alto / 2);

      const imgData = offCtx.getImageData(0, 0, ancho, alto);
      const data = imgData.data;
      const step = Math.max(3, Math.floor(ancho / 95));
      const puntos: Array<{ x: number; y: number }> = [];

      for (let y = 0; y < alto; y += step) {
        for (let x = 0; x < ancho; x += step) {
          const idx = (y * ancho + x) * 4;
          if (data[idx + 3]! > 120) {
            puntos.push({ x, y });
          }
        }
      }
      return puntos;
    }

    let dpr = 1;
    let rectWidth = 0;
    let rectHeight = 0;

    function cambiarPalabra(nuevoIndice: number, dispersar = true) {
      indiceActual = nuevoIndice;
      setPalabraActiva(nuevoIndice);

      const palabra = PALABRAS[nuevoIndice]!;
      const nuevosPuntos = obtenerPuntosDePalabra(palabra, rectWidth, rectHeight);
      if (nuevosPuntos.length === 0) return;

      // La caja de la palabra: por dónde pasea el pincel fantasma.
      limites = nuevosPuntos.reduce(
        (caja, punto) => ({
          minX: Math.min(caja.minX, punto.x),
          maxX: Math.max(caja.maxX, punto.x),
          minY: Math.min(caja.minY, punto.y),
          maxY: Math.max(caja.maxY, punto.y),
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
      );

      // Ajustar cantidad de partículas exactamente a la cantidad de puntos
      if (particulas.length > nuevosPuntos.length) {
        particulas.length = nuevosPuntos.length;
      } else {
        while (particulas.length < nuevosPuntos.length) {
          const pRef = nuevosPuntos[particulas.length]!;
          particulas.push({
            x: pRef.x + (Math.random() - 0.5) * 40,
            y: pRef.y + (Math.random() - 0.5) * 40,
            originX: pRef.x,
            originY: pRef.y,
            vx: 0,
            vy: 0,
            size: 1.4 + Math.random() * 1.4,
            color: paleta[Math.floor(Math.random() * paleta.length)]!,
            baseAlpha: 0.55 + Math.random() * 0.4,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }

      // Asignar nuevos orígenes precisos 1:1
      for (let i = 0; i < particulas.length; i++) {
        const p = particulas[i]!;
        const target = nuevosPuntos[i]!;

        p.originX = target.x;
        p.originY = target.y;

        if (dispersar && !reducedMotion) {
          const angulo = Math.random() * Math.PI * 2;
          const impulso = 2.5 + Math.random() * 3.5;
          p.vx += Math.cos(angulo) * impulso;
          p.vy += Math.sin(angulo) * impulso;
        }
      }
    }

    cambiarPalabraRef.current = (idx: number) => {
      cambiarPalabra(idx, true);
      reiniciarCiclo();
    };

    function siguientePalabra() {
      const prox = (indiceActual + 1) % PALABRAS.length;
      cambiarPalabra(prox, true);
    }

    function reiniciarCiclo() {
      if (timerPalabra) clearInterval(timerPalabra);
      timerPalabra = setInterval(siguientePalabra, 3800);
    }

    function ajustarTamano() {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      rectWidth = Math.floor(rect.width);
      rectHeight = Math.floor(rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rectWidth * dpr;
      canvas.height = rectHeight * dpr;
      canvas.style.width = `${rectWidth}px`;
      canvas.style.height = `${rectHeight}px`;

      cambiarPalabra(indiceActual, false);
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        ajustarTamano();
        reiniciarCiclo();
      });
    } else {
      ajustarTamano();
      reiniciarCiclo();
    }

    const resizeObserver = new ResizeObserver(() => {
      ajustarTamano();
    });
    resizeObserver.observe(container);

    // Eventos del ratón/puntero
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
      ultimoMovimiento = performance.now();
    };

    const onPointerLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("mouseleave", onPointerLeave);

    // Bucle de física
    let tiempo = 0;
    const K = 0.055;       // Constante elástica
    const FRICCION = 0.86; // Amortiguación
    const FUERZA = 5.2;    // Fuerza de repulsión

    /*
      Pincel fantasma: cuando nadie mueve el ratón sobre las partículas (o
      en pantallas táctiles), un pincel invisible recorre la palabra en una
      curva de Lissajous y las aparta a su paso, más suave que el cursor.
      Así la palabra nunca se ve quieta y, de paso, enseña que reacciona.
      Se retira en cuanto el cursor real se acerca.
    */
    const ESPERA_PINCEL = 1500; // ms sin mover el ratón cerca antes de que entre
    const RADIO_PINCEL = 55;
    const FUERZA_PINCEL = 2.2;

    function animar() {
      if (!ctx || !isVisible) return;
      tiempo += 0.02;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rectWidth, rectHeight);

      // ¿Está el cursor real cerca de la palabra y moviéndose?
      const cursorCerca =
        mouse.active &&
        isFinePointer &&
        performance.now() - ultimoMovimiento < ESPERA_PINCEL &&
        mouse.x > -mouse.radius &&
        mouse.x < rectWidth + mouse.radius &&
        mouse.y > -mouse.radius &&
        mouse.y < rectHeight + mouse.radius;

      let pincelX = -9999;
      let pincelY = -9999;
      if (!cursorCerca && limites.maxX > limites.minX) {
        const centroX = (limites.minX + limites.maxX) / 2;
        const centroY = (limites.minY + limites.maxY) / 2;
        pincelX = centroX + ((limites.maxX - limites.minX) / 2) * 1.05 * Math.sin(tiempo * 0.55);
        pincelY = centroY + ((limites.maxY - limites.minY) / 2) * 0.9 * Math.sin(tiempo * 1.3 + 1);
      }

      const total = particulas.length;
      for (let i = 0; i < total; i++) {
        const p = particulas[i]!;

        if (reducedMotion) {
          ctx.beginPath();
          ctx.arc(p.originX, p.originY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.baseAlpha})`;
          ctx.fill();
          continue;
        }

        // Repulsión con el cursor
        if (mouse.active && isFinePointer) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const factor = (mouse.radius - dist) / mouse.radius;
            const angulo = Math.atan2(dy, dx);
            p.vx += Math.cos(angulo) * factor * FUERZA;
            p.vy += Math.sin(angulo) * factor * FUERZA;
          }
        }

        // El pincel fantasma, si le toca.
        if (pincelX > -9999) {
          const dx = p.x - pincelX;
          const dy = p.y - pincelY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < RADIO_PINCEL && dist > 0) {
            const factor = (RADIO_PINCEL - dist) / RADIO_PINCEL;
            p.vx += (dx / dist) * factor * FUERZA_PINCEL;
            p.vy += (dy / dist) * factor * FUERZA_PINCEL;
          }
        }

        // Una onda lenta que atraviesa la palabra, más la respiración propia
        // de cada partícula: la tinta nunca está del todo quieta.
        const ambienteX = Math.sin(tiempo * 1.1 + p.originY * 0.045) * 1.6 + Math.sin(tiempo + p.phase) * 0.4;
        const ambienteY = Math.cos(tiempo * 0.9 + p.originX * 0.035) * 1.6 + Math.cos(tiempo * 0.85 + p.phase) * 0.4;

        // Física hacia el origen
        const targetX = p.originX + ambienteX;
        const targetY = p.originY + ambienteY;
        const fHomeX = (targetX - p.x) * K;
        const fHomeY = (targetY - p.y) * K;

        p.vx = (p.vx + fHomeX) * FRICCION;
        p.vy = (p.vy + fHomeY) * FRICCION;

        p.x += p.vx;
        p.y += p.vy;

        // Pulso de brillo
        const pulsacion = 0.85 + Math.sin(tiempo * 1.5 + p.phase) * 0.15;
        const alphaActual = Math.min(1, Math.max(0.15, p.baseAlpha * pulsacion));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${alphaActual})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(animar);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisible = entry.isIntersecting;
        if (isVisible) {
          if (!animId) animId = requestAnimationFrame(animar);
          reiniciarCiclo();
        } else {
          if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
          }
          if (timerPalabra) {
            clearInterval(timerPalabra);
            timerPalabra = null;
          }
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    animId = requestAnimationFrame(animar);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (timerPalabra) clearInterval(timerPalabra);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      mediaQueryMotion.removeEventListener("change", handleMotionChange);
      mediaQueryPointer.removeEventListener("change", handlePointerChange);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        aria-hidden="true"
        onClick={() => {
          cambiarPalabraRef.current?.((palabraActiva + 1) % PALABRAS.length);
        }}
        title="Haz clic para cambiar de palabra"
        className="relative flex h-[300px] w-full cursor-pointer items-center justify-center select-none sm:h-[350px] lg:h-[400px]"
      >
        {/* Resplandor ambiental de fondo */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-52 w-52 rounded-full bg-accent/20 blur-3xl sm:h-64 sm:w-64" />
        </div>

        <canvas
          ref={canvasRef}
          className="pointer-events-auto relative z-10 touch-none"
        />
      </div>
    </div>
  );
}

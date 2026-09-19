"use client";

import { MAX_BYTES_POR_ARCHIVO, miniaturaDesdeUrl, pedirPermiso, subirACloudinary } from "@jyl/core";
import { cn } from "@jyl/ui";
import { useEffect, useId, useRef, useState } from "react";
import { claseEntrada } from "@/components/formularios/Campo";

export interface ImagenEnEdicion {
  publicId: string;
  alt: string;
  /** Solo para la vista previa: la URL que devolvió Cloudinary. */
  url: string;
}

interface Subida {
  id: string;
  nombre: string;
  progreso: number;
  error: string | null;
}

const FORMATOS = ["image/jpeg", "image/png", "image/webp"];

interface EditorImagenesProps {
  destino: "productos" | "portafolio";
  imagenes: ImagenEnEdicion[];
  onChange: (imagenes: ImagenEnEdicion[]) => void;
  maximo: number;
  /** Errores por posición, p. ej. el alt vacío de la imagen 2. */
  errores?: (string | undefined)[];
}

/**
 * Fotos de un producto o de una pieza del portafolio.
 *
 * La primera es la portada. Cada foto exige su texto alternativo (SPEC.md §9,
 * piso de calidad) y conserva su proporción: la miniatura aquí es cuadrada
 * solo para que la cuadrícula se lea ordenada, la foto no se recorta.
 */
export function EditorImagenes({ destino, imagenes, onChange, maximo, errores = [] }: EditorImagenesProps) {
  const entrada = useRef<HTMLInputElement>(null);
  const id = useId();
  const [subidas, setSubidas] = useState<Subida[]>([]);
  const lleno = imagenes.length + subidas.filter((s) => !s.error).length >= maximo;

  // Se guarda la lista más reciente en una ref: las subidas terminan en
  // cualquier orden, y cada una tiene que añadirse a lo que haya en ese momento.
  const actuales = useRef(imagenes);
  useEffect(() => {
    actuales.current = imagenes;
  }, [imagenes]);

  async function subir(archivo: File) {
    const idSubida = crypto.randomUUID();
    const actualizar = (cambios: Partial<Subida>) =>
      setSubidas((previas) => previas.map((s) => (s.id === idSubida ? { ...s, ...cambios } : s)));

    if (!FORMATOS.includes(archivo.type)) {
      setSubidas((p) => [...p, { id: idSubida, nombre: archivo.name, progreso: 0, error: "Usa una foto JPG, PNG o WEBP." }]);
      return;
    }
    if (archivo.size > MAX_BYTES_POR_ARCHIVO) {
      setSubidas((p) => [...p, { id: idSubida, nombre: archivo.name, progreso: 0, error: "Pesa más de 10 MB." }]);
      return;
    }

    setSubidas((p) => [...p, { id: idSubida, nombre: archivo.name, progreso: 0, error: null }]);
    try {
      const permiso = await pedirPermiso(destino);
      const resultado = await subirACloudinary(archivo, permiso, (progreso) => actualizar({ progreso }));
      setSubidas((p) => p.filter((s) => s.id !== idSubida));
      onChange([...actuales.current, { publicId: resultado.public_id, url: resultado.secure_url, alt: "" }]);
    } catch {
      actualizar({ error: "No se pudo subir. Inténtalo de nuevo." });
    }
  }

  function mover(indice: number, direccion: -1 | 1) {
    const siguiente = [...imagenes];
    const destinoIndice = indice + direccion;
    [siguiente[indice], siguiente[destinoIndice]] = [siguiente[destinoIndice]!, siguiente[indice]!];
    onChange(siguiente);
  }

  return (
    <div className="flex flex-col gap-3">
      {imagenes.length > 0 && (
        <ol className="grid gap-3 sm:grid-cols-2">
          {imagenes.map((imagen, i) => {
            const miniatura = miniaturaDesdeUrl(imagen.url, 160) ?? imagen.url;
            const idAlt = `${id}-alt-${i}`;
            return (
              <li key={imagen.publicId} className="flex gap-3 rounded-md border border-border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={miniatura} alt="" className="h-20 w-20 shrink-0 rounded bg-canvas-sunken object-cover" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <label htmlFor={idAlt} className="text-xs text-ink-muted">
                    {i === 0 ? "Portada · " : ""}Qué se ve en la foto
                  </label>
                  <input
                    id={idAlt}
                    value={imagen.alt}
                    onChange={(e) =>
                      onChange(imagenes.map((img, j) => (j === i ? { ...img, alt: e.target.value } : img)))
                    }
                    aria-invalid={Boolean(errores[i])}
                    placeholder="Ej.: camiseta negra con logo bordado"
                    className={claseEntrada}
                  />
                  {errores[i] && (
                    <p role="alert" className="text-xs text-danger">
                      {errores[i]}
                    </p>
                  )}
                  <div className="mt-auto flex gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      aria-label={`Mover la foto ${i + 1} antes`}
                      className="rounded px-1.5 py-0.5 text-ink-muted hover:bg-canvas-sunken hover:text-ink disabled:invisible"
                    >
                      Antes
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(i, 1)}
                      disabled={i === imagenes.length - 1}
                      aria-label={`Mover la foto ${i + 1} después`}
                      className="rounded px-1.5 py-0.5 text-ink-muted hover:bg-canvas-sunken hover:text-ink disabled:invisible"
                    >
                      Después
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(imagenes.filter((_, j) => j !== i))}
                      aria-label={`Quitar la foto ${i + 1}`}
                      className="ml-auto rounded px-1.5 py-0.5 text-danger hover:bg-danger-soft"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {subidas.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {subidas.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-ink-muted">{s.nombre}</span>
              {s.error ? (
                <>
                  <span role="alert" className="text-xs text-danger">
                    {s.error}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubidas((p) => p.filter((x) => x.id !== s.id))}
                    className="text-xs text-ink-muted hover:text-ink"
                  >
                    Descartar
                  </button>
                </>
              ) : (
                <span role="progressbar" aria-valuenow={s.progreso} aria-valuemin={0} aria-valuemax={100} aria-label={`Subiendo ${s.nombre}`} className="w-24">
                  <span className="block h-1 overflow-hidden rounded-full bg-border">
                    <span className="block h-full bg-accent transition-[width]" style={{ width: `${s.progreso}%` }} />
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div>
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={lleno}
          className={cn(
            "rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-ink transition-colors hover:bg-canvas-sunken",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {imagenes.length === 0 ? "Subir fotos" : "Añadir fotos"}
        </button>
        <span className="ml-3 text-xs text-ink-subtle">
          {imagenes.length} de {maximo} · JPG, PNG o WEBP, hasta 10 MB
        </span>
        <input
          ref={entrada}
          type="file"
          accept={FORMATOS.join(",")}
          multiple
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(e) => {
            const archivos = Array.from(e.target.files ?? []).slice(0, Math.max(maximo - imagenes.length, 0));
            archivos.forEach((a) => void subir(a));
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

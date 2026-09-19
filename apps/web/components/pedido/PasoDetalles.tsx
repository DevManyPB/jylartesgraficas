"use client";

import type { Servicio } from "@jyl/core";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { PedidoEntrante } from "@jyl/core";

interface PasoDetallesProps {
  servicio: Servicio | null;
  register: UseFormRegister<PedidoEntrante>;
  errors: FieldErrors<PedidoEntrante>;
}

const claseCampo =
  "rounded-lg border border-border-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent";

/**
 * Paso 2 — SPEC.md §4.5. Los campos que se piden dependen del servicio: un
 * póster necesita medidas y material; un formateo, la marca del equipo y el
 * sistema operativo. Se decide por la categoría y por `requiereMedidas`, sin
 * montar un motor de campos dinámicos para tres casos.
 */
export function PasoDetalles({ servicio, register, errors }: PasoDetallesProps) {
  const pideMedidas = servicio?.requiereMedidas ?? false;
  const esTecnico = servicio?.categoria === "tecnico";

  return (
    <fieldset className="flex flex-col gap-5">
      <div>
        <legend className="font-display text-2xl text-ink">Cuéntanos los detalles</legend>
        {servicio && <p className="mt-2 text-sm text-ink-muted">Para: {servicio.nombre}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="detalle" className="text-sm font-medium text-ink">
          ¿Qué necesitas exactamente?
        </label>
        <textarea
          id="detalle"
          rows={5}
          {...register("detalle")}
          aria-invalid={errors.detalle ? true : undefined}
          className={claseCampo}
          placeholder={
            esTecnico
              ? "Qué le pasa al equipo, desde cuándo, y qué has intentado."
              : "Para qué es, qué debe transmitir, y cualquier referencia que tengas en mente."
          }
        />
        {errors.detalle && (
          <p role="alert" aria-live="polite" className="text-sm text-danger">
            {errors.detalle.message}
          </p>
        )}
      </div>

      {pideMedidas && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="medidas" className="text-sm font-medium text-ink">
              Medidas <span className="font-normal text-ink-subtle">(opcional)</span>
            </label>
            <input id="medidas" {...register("medidas")} className={claseCampo} placeholder="50 x 70 cm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="material" className="text-sm font-medium text-ink">
              Material <span className="font-normal text-ink-subtle">(opcional)</span>
            </label>
            <input id="material" {...register("material")} className={claseCampo} placeholder="Papel propalcote" />
          </div>
        </div>
      )}

      {esTecnico && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="equipo" className="text-sm font-medium text-ink">
              Marca del equipo <span className="font-normal text-ink-subtle">(opcional)</span>
            </label>
            <input
              id="equipo"
              {...register("camposExtra.equipo")}
              className={claseCampo}
              placeholder="Lenovo, HP, Dell…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sistemaOperativo" className="text-sm font-medium text-ink">
              Sistema operativo <span className="font-normal text-ink-subtle">(opcional)</span>
            </label>
            <input
              id="sistemaOperativo"
              {...register("camposExtra.sistemaOperativo")}
              className={claseCampo}
              placeholder="Windows 11"
            />
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fechaDeseada" className="text-sm font-medium text-ink">
            ¿Para cuándo lo necesitas? <span className="font-normal text-ink-subtle">(opcional)</span>
          </label>
          <input id="fechaDeseada" type="date" {...register("fechaDeseada")} className={claseCampo} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="presupuestoAprox" className="text-sm font-medium text-ink">
            Presupuesto aproximado <span className="font-normal text-ink-subtle">(opcional)</span>
          </label>
          <input
            id="presupuestoAprox"
            type="number"
            min={0}
            step={1000}
            {...register("presupuestoAprox", {
              setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
            })}
            className={claseCampo}
            placeholder="$"
          />
        </div>
      </div>
    </fieldset>
  );
}

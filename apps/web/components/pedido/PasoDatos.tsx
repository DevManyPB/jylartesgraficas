"use client";

import type { Invitado, PedidoEntrante } from "@jyl/core";
import Link from "next/link";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

interface PasoDatosProps {
  /** Con sesión, el contacto de la cuenta: los campos llegan rellenos. */
  identidad: Invitado | null;
  register: UseFormRegister<PedidoEntrante>;
  errors: FieldErrors<PedidoEntrante>;
}

const claseCampo =
  "rounded-lg border border-border-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent read-only:bg-canvas-sunken read-only:text-ink-muted";

interface DefinicionCampo {
  nombre: keyof Invitado;
  etiqueta: string;
  tipo: string;
  autocompletar: string;
}

const CAMPOS: DefinicionCampo[] = [
  { nombre: "nombre", etiqueta: "Nombre", tipo: "text", autocompletar: "name" },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", autocompletar: "tel" },
  { nombre: "email", etiqueta: "Correo", tipo: "email", autocompletar: "email" },
  { nombre: "ciudad", etiqueta: "Ciudad", tipo: "text", autocompletar: "address-level2" },
];

/**
 * Paso 4 — SPEC.md §4.5. Con sesión llega relleno, pero los campos siguen a
 * la vista y se pueden corregir: si se ocultaran, un cliente con cuenta sin
 * teléfono guardado haría un pedido al que nadie podría llamar. Sin sesión se
 * piden directamente: continuar como invitado no se esconde detrás de "crear
 * cuenta", es el camino por defecto.
 */
export function PasoDatos({ identidad, register, errors }: PasoDatosProps) {
  const invitado = errors.invitado;

  return (
    <fieldset className="flex flex-col gap-5">
      <div>
        <legend className="font-display text-2xl text-ink">Tus datos</legend>
        <p className="mt-2 text-sm text-ink-muted">
          {identidad
            ? "Revisa que estén al día: los guardamos en tu cuenta para la próxima vez."
            : "Solo para responderte. No hace falta crear una cuenta."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {CAMPOS.map((campo) => {
          const error = invitado?.[campo.nombre];
          // El correo de una cuenta es con el que se entra: se muestra, no se edita.
          const soloLectura = Boolean(identidad) && campo.nombre === "email";
          const idAyuda = `${campo.nombre}-ayuda`;
          return (
            <div key={campo.nombre} className="flex flex-col gap-1.5">
              <label htmlFor={campo.nombre} className="text-sm font-medium text-ink">
                {campo.etiqueta}
              </label>
              <input
                id={campo.nombre}
                type={campo.tipo}
                autoComplete={campo.autocompletar}
                readOnly={soloLectura}
                aria-describedby={soloLectura ? idAyuda : undefined}
                {...register(`invitado.${campo.nombre}`)}
                aria-invalid={error ? true : undefined}
                className={claseCampo}
              />
              {soloLectura && (
                <p id={idAyuda} className="text-xs text-ink-subtle">
                  Es el correo de tu cuenta.
                </p>
              )}
              {error && (
                <p role="alert" aria-live="polite" className="text-sm text-danger">
                  {error.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!identidad && (
        <p className="text-sm text-ink-muted">
          ¿Prefieres tener tus pedidos guardados?{" "}
          <Link href="/entrar" className="underline underline-offset-4 hover:text-ink">
            Crea una cuenta
          </Link>{" "}
          — pero no es obligatorio.
        </p>
      )}

      {/* SPEC.md §11: aceptación explícita, sin premarcar. */}
      <div className="flex items-start gap-3 border-t border-border pt-5">
        <input
          id="aceptaTerminos"
          type="checkbox"
          {...register("aceptaTerminos")}
          aria-invalid={errors.aceptaTerminos ? true : undefined}
          className="mt-1 accent-accent"
        />
        <label htmlFor="aceptaTerminos" className="text-sm text-ink-muted">
          Acepto los{" "}
          <Link href="/terminos" className="underline underline-offset-4 hover:text-ink">
            términos
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="underline underline-offset-4 hover:text-ink">
            política de tratamiento de datos
          </Link>
          .
        </label>
      </div>
      {errors.aceptaTerminos && (
        <p role="alert" aria-live="polite" className="text-sm text-danger">
          {errors.aceptaTerminos.message}
        </p>
      )}
    </fieldset>
  );
}

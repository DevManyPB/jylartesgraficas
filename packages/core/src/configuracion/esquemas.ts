import { z } from "zod";

/**
 * `settings/general` — SPEC.md §6.8 y §7.
 *
 * Casi todo es opcional a propósito: el estudio llena la configuración por
 * partes, y el sitio muestra solo lo que existe. Nada tiene un valor de
 * relleno, porque un teléfono o una dirección de ejemplo publicados por error
 * serían peores que un hueco (AGENTS.md §2: nada de contenido inventado).
 * Lo que sí se exige es que lo escrito tenga un formato válido.
 */

export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export const NOMBRE_DIA: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Texto libre opcional: se recorta y un campo vacío se guarda como "". */
const textoOpcional = (max: number) => z.string().trim().max(max).default("");

/**
 * Solo dígitos, con el indicativo de Colombia. `wa.me` exige el número
 * completo sin signos; quien lo escriba como "300 123 4567" o "+57 300…"
 * termina con lo mismo.
 */
export function normalizarWhatsapp(entrada: string): string {
  const digitos = entrada.replace(/\D/g, "");
  if (digitos.length === 10 && digitos.startsWith("3")) return `57${digitos}`;
  return digitos;
}

const whatsappSchema = z
  .string()
  .trim()
  .default("")
  .transform(normalizarWhatsapp)
  .refine((v) => v === "" || /^\d{11,15}$/.test(v), {
    message: "Escribe el número con el indicativo, por ejemplo 300 123 4567 o +57 300 123 4567.",
  });

const coordenada = (min: number, max: number, nombre: string) =>
  z
    .number({ invalid_type_error: `La ${nombre} tiene que ser un número.` })
    .min(min, `La ${nombre} va entre ${min} y ${max}.`)
    .max(max, `La ${nombre} va entre ${min} y ${max}.`)
    .nullable()
    .default(null);

export const horarioSchema = z
  .object({
    dia: z.enum(DIAS_SEMANA),
    abre: z.string().default(""),
    cierra: z.string().default(""),
    cerrado: z.boolean().default(false),
  })
  .superRefine((h, ctx) => {
    if (h.cerrado) return;
    const hayAbre = h.abre !== "";
    const hayCierra = h.cierra !== "";
    if (!hayAbre && !hayCierra) return; // Sin configurar todavía.

    if (!hayAbre || !HORA.test(h.abre)) {
      ctx.addIssue({ code: "custom", path: ["abre"], message: "Falta la hora de apertura." });
    }
    if (!hayCierra || !HORA.test(h.cierra)) {
      ctx.addIssue({ code: "custom", path: ["cierra"], message: "Falta la hora de cierre." });
    }
    if (HORA.test(h.abre) && HORA.test(h.cierra) && h.abre >= h.cierra) {
      ctx.addIssue({
        code: "custom",
        path: ["cierra"],
        message: "La hora de cierre tiene que ser después de la de apertura.",
      });
    }
  });

export type Horario = z.infer<typeof horarioSchema>;

const urlOpcional = z
  .string()
  .trim()
  .default("")
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), {
    message: "Pega el enlace completo, empezando por https://",
  });

export const configuracionSchema = z
  .object({
    whatsapp: whatsappSchema,
    telefono: textoOpcional(30),
    email: z
      .string()
      .trim()
      .default("")
      .refine((v) => v === "" || z.string().email().safeParse(v).success, {
        message: "Ese correo no tiene un formato válido.",
      }),

    direccion: z
      .object({
        linea: textoOpcional(120),
        barrio: textoOpcional(80),
        ciudad: textoOpcional(80),
        referencia: textoOpcional(160),
        lat: coordenada(-90, 90, "latitud"),
        lng: coordenada(-180, 180, "longitud"),
      })
      .default({})
      // Media coordenada no sirve para un mapa: o las dos, o ninguna.
      .refine((d) => (d.lat === null) === (d.lng === null), {
        message: "Faltan la latitud o la longitud: el mapa necesita las dos.",
        path: ["lng"],
      }),

    horarios: z
      .array(horarioSchema)
      .length(DIAS_SEMANA.length)
      .default(DIAS_SEMANA.map((dia) => ({ dia, abre: "", cierra: "", cerrado: false }))),

    redes: z
      .object({
        instagram: urlOpcional,
        facebook: urlOpcional,
        tiktok: urlOpcional,
      })
      .default({}),

    emisor: z
      .object({
        razonSocial: textoOpcional(120),
        nit: textoOpcional(30),
        direccion: textoOpcional(160),
      })
      .default({}),

    /** Nulo mientras no se configure: la facturación lo exigirá antes de emitir. */
    impuestoPorcentaje: z
      .number({ invalid_type_error: "El impuesto tiene que ser un número." })
      .min(0, "El impuesto no puede ser negativo.")
      .max(100, "El impuesto va de 0 a 100.")
      .nullable()
      .default(null),
  });

/** Lo que llega del formulario, antes de normalizar. */
export type ConfiguracionEntrante = z.input<typeof configuracionSchema>;
/** Lo que se guarda y se lee. */
export type Configuracion = z.output<typeof configuracionSchema>;

/** La configuración vacía: todo sin llenar, nada inventado. */
export const CONFIGURACION_VACIA: Configuracion = configuracionSchema.parse({});

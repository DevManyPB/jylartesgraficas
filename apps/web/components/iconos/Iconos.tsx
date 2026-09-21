import { cn } from "@jyl/ui";
import type { SVGProps } from "react";

/**
 * Los iconos del sitio, dibujados aquí mismo.
 *
 * Son de un solo trazo de 1,5 y puntas redondeadas, todos sobre la misma
 * rejilla de 24, para que se lean como un juego y no como un montón de
 * iconos de autores distintos — que es lo que se nota al tirar de un banco
 * de iconos. Heredan `currentColor`, así que funcionan sobre el héroe oscuro
 * y sobre fondo claro sin una sola clase de color.
 *
 * Van siempre acompañando a un texto, nunca solos: un icono no dice qué hace
 * un botón, solo ayuda a encontrarlo. Por eso todos son `aria-hidden` y el
 * significado lo pone la etiqueta de al lado.
 */

type IconoProps = SVGProps<SVGSVGElement>;

function Icono({ children, className, ...props }: IconoProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoFlecha(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icono>
  );
}

/** Para enlaces que salen del sitio. */
export function IconoSalida(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </Icono>
  );
}

export function IconoCheck(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icono>
  );
}

export function IconoRecibo(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M6 3v18l2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4V3l-2 1.4L14 3l-2 1.4L10 3 8 4.4Z" />
      <path d="M9.5 9h5M9.5 13h5" />
    </Icono>
  );
}

export function IconoSalir(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8 6 12l4 4" />
      <path d="M6 12h9" />
    </Icono>
  );
}

export function IconoTelefono(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2.5 2.5 0 0 1-2.8 2.5C10.6 18.2 5.8 13.4 4 6.8A2.5 2.5 0 0 1 6.5 3Z" />
    </Icono>
  );
}

export function IconoCorreo(props: IconoProps) {
  return (
    <Icono {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 7 7.1 5.3a2 2 0 0 0 2.2 0L20.2 7" />
    </Icono>
  );
}

export function IconoUbicacion(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icono>
  );
}

export function IconoReloj(props: IconoProps) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icono>
  );
}

export function IconoWhatsapp({ className, ...props }: IconoProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-5 w-5 shrink-0", className)}
      {...props}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

/** Publicidad y diseño gráfico. */
export function IconoPincel(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M14.5 3.5 20.5 9.5 10 20H4v-6Z" />
      <path d="m12.5 5.5 6 6" />
    </Icono>
  );
}

/** Desarrollo web. */
export function IconoCodigo(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="m8 8-4 4 4 4" />
      <path d="m16 8 4 4-4 4" />
      <path d="m13.5 5-3 14" />
    </Icono>
  );
}

/** Servicios técnicos. */
export function IconoLlave(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M15.5 3.5a5 5 0 0 0-4.6 7l-7.2 7.2 2.6 2.6 7.2-7.2a5 5 0 0 0 6.4-6.3l-3 3-2.7-2.7 3-3a5 5 0 0 0-1.7-.6Z" />
    </Icono>
  );
}

/** Pantallas vacías: todavía no hay nada que enseñar. */
export function IconoCajaVacia(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5Z" />
      <path d="M3.5 8.5 12 13l8.5-4.5M12 13v7" />
    </Icono>
  );
}

export function IconoImagen(props: IconoProps) {
  return (
    <Icono {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 4.5-4.5 3 3L15 11l5 5" />
    </Icono>
  );
}

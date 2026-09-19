import Link from "next/link";

interface AccountButtonProps {
  /** Nombre o correo de quien tiene la sesión abierta; null si no hay. */
  identidad: string | null;
}

/**
 * SPEC.md §4.2: con sesión iniciada, el botón de cuenta reemplaza al de login
 * y muestra la inicial. No lleva color de acento — el único acento del header
 * es «Pedir un trabajo».
 */
export function AccountButton({ identidad }: AccountButtonProps) {
  if (!identidad) {
    return (
      <Link
        href="/entrar"
        className="text-sm transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
      >
        Entrar
      </Link>
    );
  }

  const inicial = identidad.trim().charAt(0).toUpperCase();

  return (
    <Link
      href="/mi-cuenta"
      aria-label={`Mi cuenta (${identidad})`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-current text-sm font-medium transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      <span aria-hidden>{inicial}</span>
    </Link>
  );
}

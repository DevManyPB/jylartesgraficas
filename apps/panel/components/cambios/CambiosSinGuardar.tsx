"use client";

import { ConfirmDialog } from "@jyl/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

/** Lo que registra un formulario con cambios pendientes. */
interface Pendiente {
  /** Guarda y dice si salió bien; si falla, no se sale. */
  guardar: () => Promise<boolean>;
}

interface Contexto {
  registrar: (pendiente: Pendiente | null) => void;
  /** Devuelve true si interceptó la salida (hay cambios y se abrió el modal). */
  interceptar: (destino: string) => boolean;
}

const ContextoCambios = createContext<Contexto | null>(null);

/**
 * Salir con cambios sin guardar — SPEC.md §5.1: confirmación, con opción de
 * guardar.
 *
 * El App Router no tiene eventos de navegación que se puedan cancelar, así
 * que en vez de escuchar al router se interceptan los enlaces del panel
 * (`EnlaceProtegido` y la navegación lateral). Cerrar la pestaña o recargar
 * se cubre con `beforeunload`, que es el único mecanismo que existe ahí y
 * muestra el aviso del propio navegador: no se puede reemplazar por un modal.
 */
export function CambiosSinGuardarProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pendiente = useRef<Pendiente | null>(null);
  const [destino, setDestino] = useState<string | null>(null);

  const registrar = useCallback((nuevo: Pendiente | null) => {
    pendiente.current = nuevo;
  }, []);

  const interceptar = useCallback((href: string) => {
    if (!pendiente.current) return false;
    setDestino(href);
    return true;
  }, []);

  const valor = useMemo(() => ({ registrar, interceptar }), [registrar, interceptar]);

  function salir(href: string) {
    pendiente.current = null;
    router.push(href);
  }

  return (
    <ContextoCambios.Provider value={valor}>
      {children}
      <ConfirmDialog
        open={destino !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setDestino(null);
        }}
        title="¿Guardar los cambios antes de salir?"
        description="Si sales ahora sin guardar, se pierde lo que cambiaste en este formulario."
        confirmLabel="Guardar y salir"
        alternative={{
          label: "Salir sin guardar",
          onSelect: () => {
            if (destino) salir(destino);
          },
        }}
        onConfirm={async () => {
          const href = destino;
          const ok = await pendiente.current?.guardar();
          // Si no se pudo guardar, el formulario ya mostró por qué; el modal
          // se queda abierto (ConfirmDialog lo mantiene si esto lanza).
          if (!ok) throw new Error("no-guardado");
          if (href) salir(href);
        }}
      />
    </ContextoCambios.Provider>
  );
}

function useContextoCambios(): Contexto {
  const contexto = useContext(ContextoCambios);
  if (!contexto) throw new Error("Falta <CambiosSinGuardarProvider> en el layout del panel.");
  return contexto;
}

/**
 * Lo usa cada formulario: mientras `hayCambios` sea true, salir por un enlace
 * del panel pregunta, y cerrar la pestaña avisa.
 */
export function useProtegerCambios(hayCambios: boolean, guardar: () => Promise<boolean>) {
  const { registrar } = useContextoCambios();
  const guardarActual = useRef(guardar);

  useEffect(() => {
    guardarActual.current = guardar;
  }, [guardar]);

  useEffect(() => {
    if (!hayCambios) {
      registrar(null);
      return;
    }

    registrar({ guardar: () => guardarActual.current() });
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener("beforeunload", avisar);

    return () => {
      registrar(null);
      window.removeEventListener("beforeunload", avisar);
    };
  }, [hayCambios, registrar]);
}

/** Un `Link` que respeta los cambios sin guardar. */
export function EnlaceProtegido({ href, onClick, ...resto }: ComponentProps<typeof Link> & { href: string }) {
  const { interceptar } = useContextoCambios();
  return (
    <Link
      href={href}
      onClick={(evento) => {
        onClick?.(evento);
        // Con Ctrl/Cmd o clic central se abre otra pestaña: esta no se pierde.
        if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;
        if (interceptar(href)) evento.preventDefault();
      }}
      {...resto}
    />
  );
}

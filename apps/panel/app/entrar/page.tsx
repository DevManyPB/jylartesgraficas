"use client";

import { getFirebase } from "@jyl/core";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Acceso del panel. Solo correo y contraseña: las cuentas del estudio las crea
 * un admin, no se registran solas. Quien entre sin rol autorizado igual será
 * rechazado por el guard del layout privado.
 */
export default function EntrarPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const { auth } = getFirebase();
      const credencial = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credencial.user.getIdToken();

      const respuesta = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!respuesta.ok) throw new Error("sesion");

      router.push("/");
      router.refresh();
    } catch {
      setError("El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
      <p className="font-display text-xl font-bold leading-none text-ink">JYL</p>
      <p className="text-xs leading-none text-ink-muted">artes gráficas</p>

      <h1 className="mt-8 font-display text-2xl text-ink">Panel del estudio</h1>
      <p className="mt-2 text-sm text-ink-muted">Acceso solo para el equipo.</p>

      <form onSubmit={entrar} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Correo
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-lg border border-border-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="rounded-lg border border-border-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </div>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50"
        >
          {enviando ? "Un momento…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}

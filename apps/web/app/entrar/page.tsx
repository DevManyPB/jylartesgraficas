"use client";

import { getFirebase } from "@jyl/core";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Modo = "entrar" | "registrarse";

/** Mensajes en español que dicen qué pasó y qué hacer — AGENTS.md §10. */
function mensajeDeError(codigo: string): string {
  switch (codigo) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con este correo. Entra en vez de crear una nueva.";
    case "auth/weak-password":
      return "La contraseña necesita al menos 6 caracteres.";
    case "auth/invalid-email":
      return "Ese correo no tiene un formato válido.";
    case "auth/popup-closed-by-user":
      return "Cerraste la ventana de Google antes de terminar.";
    case "auth/too-many-requests":
      return "Demasiados intentos seguidos. Espera un momento antes de reintentar.";
    default:
      return "No pudimos completar el acceso. Inténtalo de nuevo en un momento.";
  }
}

export default function Entrar() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  /** Cambia el token por la cookie de sesión y entra. */
  async function abrirSesion(credencial: UserCredential, nombreVisible?: string) {
    const { db } = getFirebase();

    await setDoc(
      doc(db, "users", credencial.user.uid),
      {
        nombre: nombreVisible ?? credencial.user.displayName ?? null,
        email: credencial.user.email,
        actualizadoEn: serverTimestamp(),
      },
      { merge: true },
    );

    const idToken = await credencial.user.getIdToken();
    const respuesta = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!respuesta.ok) throw new Error("sesion");

    router.push("/mi-cuenta");
    router.refresh();
  }

  async function conGoogle() {
    setError(null);
    setEnviando(true);
    try {
      const { auth } = getFirebase();
      await abrirSesion(await signInWithPopup(auth, new GoogleAuthProvider()));
    } catch (e) {
      setError(mensajeDeError((e as { code?: string }).code ?? ""));
      setEnviando(false);
    }
  }

  async function conCorreo(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const { auth } = getFirebase();
      const credencial =
        modo === "entrar"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
      await abrirSesion(credencial, modo === "registrarse" ? nombre : undefined);
    } catch (e) {
      setError(mensajeDeError((e as { code?: string }).code ?? ""));
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm px-6 pb-24 pt-28 sm:pt-32">
      <h1 className="registro font-display text-3xl text-ink">
        {modo === "entrar" ? "Entrar a tu cuenta" : "Crear una cuenta"}
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        Para seguir tus pedidos y ver tus facturas.
      </p>

      <button
        type="button"
        onClick={conGoogle}
        disabled={enviando}
        className="mt-8 flex w-full items-center justify-center rounded-lg border border-border-strong px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunken disabled:pointer-events-none disabled:opacity-50"
      >
        Continuar con Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-subtle">
        <span className="h-px flex-1 bg-border" />o con tu correo
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={conCorreo} className="flex flex-col gap-4">
        {modo === "registrarse" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className="text-sm font-medium text-ink">
              Nombre
            </label>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoComplete="name"
              className="rounded-lg border border-border-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
        )}

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
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
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
          {enviando ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setModo(modo === "entrar" ? "registrarse" : "entrar");
          setError(null);
        }}
        className="mt-6 text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        {modo === "entrar" ? "No tengo cuenta, quiero crear una" : "Ya tengo cuenta, quiero entrar"}
      </button>
    </main>
  );
}

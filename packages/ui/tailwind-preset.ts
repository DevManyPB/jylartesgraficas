import type { Config } from "tailwindcss";

/**
 * Preset compartido entre apps/web y apps/panel — SPEC.md §9.
 * theme.colors (no theme.extend.colors): reemplaza la paleta por defecto
 * de Tailwind a propósito, para que `bg-blue-500` / `text-gray-400` no
 * existan y no puedan escribirse a mano (AGENTS.md §9).
 */
const preset: Omit<Config, "content"> = {
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      canvas: "#FFFFFF",
      "canvas-sunken": "#F6F4F1",
      "canvas-dark": "#0E0D0B",

      ink: "#14120F",
      "ink-muted": "#5C5850",
      "ink-subtle": "#948F86",
      "ink-inverted": "#F6F4F1",

      border: "#E5E2DC",
      "border-strong": "#C9C4BA",

      accent: "#D6127A",
      "accent-hover": "#B80F68",
      "accent-soft": "#FBE4F0",

      success: "#1E7B4D",
      "success-soft": "#E3F3EA",
      warning: "#B4790A",
      "warning-soft": "#FBF0DC",
      danger: "#C21F3A",
      "danger-soft": "#FBE4E7",
    },
    fontFamily: {
      display: ["var(--font-display)", "system-ui", "sans-serif"],
      sans: ["var(--font-sans)", "system-ui", "sans-serif"],
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }],
      sm: ["0.875rem", { lineHeight: "1.25rem" }],
      base: ["1rem", { lineHeight: "1.5rem" }],
      lg: ["1.125rem", { lineHeight: "1.75rem" }],
      xl: ["1.25rem", { lineHeight: "1.75rem" }],
      "2xl": ["1.5rem", { lineHeight: "2rem" }],
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
      "5xl": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      display: ["3.75rem", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
      "display-lg": ["5rem", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
    },
    extend: {
      keyframes: {
        // Modal — SPEC.md §5.3: 150-200ms de entrada, salida más rápida.
        "overlay-show": { from: { opacity: "0" }, to: { opacity: "1" } },
        "overlay-hide": { from: { opacity: "1" }, to: { opacity: "0" } },
        "content-show-center": {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "content-hide-center": {
          from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
        },
        "content-show-sheet": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "content-hide-sheet": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        // Toast — abajo a la derecha, entra deslizando, sale con fade.
        "toast-show": {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "toast-hide": { from: { opacity: "1" }, to: { opacity: "0" } },
        // Menú móvil — SPEC.md §4.2: entra a pantalla completa desde la derecha.
        "menu-show": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "menu-hide": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        // Las dos líneas del icono de menú plegándose en X.
        "menu-line-top": {
          from: { transform: "translateY(-5px) rotate(0deg)" },
          to: { transform: "translateY(0) rotate(45deg)" },
        },
        "menu-line-bottom": {
          from: { transform: "translateY(5px) rotate(0deg)" },
          to: { transform: "translateY(0) rotate(-45deg)" },
        },
      },
      maxWidth: {
        // Rejilla compartida por el header y el contenido de las páginas.
        content: "72rem",
      },
      animation: {
        "overlay-in": "overlay-show 200ms ease-out",
        "overlay-out": "overlay-hide 150ms ease-in",
        "content-in-center": "content-show-center 200ms ease-out",
        "content-out-center": "content-hide-center 150ms ease-in",
        "content-in-sheet": "content-show-sheet 200ms ease-out",
        "content-out-sheet": "content-hide-sheet 150ms ease-in",
        "toast-in": "toast-show 200ms ease-out",
        "toast-out": "toast-hide 150ms ease-in",
        "menu-in": "menu-show 250ms ease-out",
        "menu-out": "menu-hide 180ms ease-in",
        "menu-line-top": "menu-line-top 200ms ease-out",
        "menu-line-bottom": "menu-line-bottom 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default preset;

import type { Config } from "tailwindcss";

/**
 * Preset compartido entre apps/web y apps/panel.
 * Los tokens de diseño reales (color, tipografía, escala) llegan en el
 * Chunk B — SPEC.md §9. Por ahora define solo la forma del preset.
 */
const preset: Omit<Config, "content"> = {
  theme: {
    extend: {},
  },
  plugins: [],
};

export default preset;

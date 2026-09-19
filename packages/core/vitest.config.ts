import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` lanza al importarse fuera de un Server Component. Es
      // exactamente lo que queremos en la app y justo lo que impide probar
      // los módulos de servidor aquí, donde no hay navegador al que proteger.
      "server-only": new URL("./src/pruebas/server-only-vacio.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    // Las pruebas de reglas hablan todas con el mismo emulador: en paralelo se
    // pisarían los datos entre sí.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});

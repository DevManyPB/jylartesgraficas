import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

/**
 * Pruebas de firestore.rules — obligatorias cada vez que se tocan las reglas
 * (AGENTS.md §6). Necesitan los emuladores: `pnpm emulators` en otra terminal.
 */

let entorno: RulesTestEnvironment;

const UID_CLIENTE = "cliente-uno";
const UID_OTRO_CLIENTE = "cliente-dos";
const UID_OPERADOR = "operador-uno";
const UID_ADMIN = "admin-uno";

function cliente(uid: string) {
  return entorno.authenticatedContext(uid, { role: "cliente" }).firestore();
}

beforeAll(async () => {
  entorno = await initializeTestEnvironment({
    projectId: "jyl-reglas-test",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync(resolve(import.meta.dirname, "../../../../firestore.rules"), "utf8"),
    },
  });
});

afterAll(async () => {
  await entorno.cleanup();
});

beforeEach(async () => {
  await entorno.clearFirestore();

  // Datos de partida escritos saltándose las reglas, como haría el servidor.
  await entorno.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", UID_CLIENTE), { nombre: "Cliente Uno", role: "cliente" });
    await setDoc(doc(db, "users", UID_OTRO_CLIENTE), { nombre: "Cliente Dos", role: "cliente" });
    await setDoc(doc(db, "orders", "pedido-del-cliente"), {
      numero: "JYL-2026-0001",
      uid: UID_CLIENTE,
      estado: "recibido",
    });
    await setDoc(doc(db, "orders", "pedido-ajeno"), {
      numero: "JYL-2026-0002",
      uid: UID_OTRO_CLIENTE,
      estado: "recibido",
    });
    // Pedido de invitado: sin uid, no le pertenece a ninguna cuenta.
    await setDoc(doc(db, "orders", "pedido-de-invitado"), {
      numero: "JYL-2026-0003",
      uid: null,
      estado: "recibido",
    });
    await setDoc(doc(db, "products", "camiseta-publicada"), { nombre: "Camiseta", activo: true });
    await setDoc(doc(db, "products", "camiseta-borrador"), { nombre: "Borrador", activo: false });
    await setDoc(doc(db, "portfolio", "pieza-publicada"), { titulo: "Pieza", publicado: true });
    await setDoc(doc(db, "invoices", "factura-uno"), {
      numero: "FAC-2026-0001",
      clienteUid: UID_CLIENTE,
      total: 240000,
    });
    await setDoc(doc(db, "stats", "resumen"), { ingresosMes: 1000000 });
    await setDoc(doc(db, "settings", "general"), { whatsapp: "+57" });
    await setDoc(doc(db, "counters", "2026"), { orders: 2, invoices: 1 });
  });
});

describe("cuentas", () => {
  it("un anónimo no puede leer una ficha de usuario", async () => {
    const db = entorno.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users", UID_CLIENTE)));
  });

  it("un cliente lee su propia ficha", async () => {
    await assertSucceeds(getDoc(doc(cliente(UID_CLIENTE), "users", UID_CLIENTE)));
  });

  it("un cliente no lee la ficha de otro", async () => {
    await assertFails(getDoc(doc(cliente(UID_CLIENTE), "users", UID_OTRO_CLIENTE)));
  });

  it("un cliente no puede darse un rol a sí mismo", async () => {
    await assertFails(
      updateDoc(doc(cliente(UID_CLIENTE), "users", UID_CLIENTE), { role: "admin" }),
    );
  });

  it("un cliente sí puede editar el resto de su ficha", async () => {
    await assertSucceeds(
      updateDoc(doc(cliente(UID_CLIENTE), "users", UID_CLIENTE), { telefono: "3000000000" }),
    );
  });

  /**
   * Las notas del estudio sobre un cliente viven en una subcolección suya
   * (SPEC.md §6.6 y §7). Ninguna regla la abre, así que ni él ni el personal
   * las leen desde el cliente: solo el servidor, con firebase-admin.
   */
  it("un cliente no puede leer las notas que el estudio escribió sobre él", async () => {
    await assertFails(getDoc(doc(cliente(UID_CLIENTE), "users", UID_CLIENTE, "interno", "notas")));
  });

  it("ni siquiera el admin las lee desde el navegador", async () => {
    const db = entorno.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();
    await assertFails(getDoc(doc(db, "users", UID_CLIENTE, "interno", "notas")));
    await assertFails(setDoc(doc(db, "users", UID_CLIENTE, "interno", "notas"), { texto: "x" }));
  });
});

describe("pedidos", () => {
  it("un cliente lee su pedido", async () => {
    await assertSucceeds(getDoc(doc(cliente(UID_CLIENTE), "orders", "pedido-del-cliente")));
  });

  // Criterio de aceptación de SPEC.md §13.
  it("un cliente autenticado no puede leer el pedido de otro", async () => {
    await assertFails(getDoc(doc(cliente(UID_CLIENTE), "orders", "pedido-ajeno")));
  });

  it("un pedido de invitado no lo puede leer un usuario cualquiera", async () => {
    await assertFails(getDoc(doc(cliente(UID_CLIENTE), "orders", "pedido-de-invitado")));
  });

  it("el estudio sí ve los pedidos de invitados", async () => {
    const db = entorno.authenticatedContext(UID_OPERADOR, { role: "operador" }).firestore();
    await assertSucceeds(getDoc(doc(db, "orders", "pedido-de-invitado")));
  });

  it("el operador lee cualquier pedido", async () => {
    const db = entorno.authenticatedContext(UID_OPERADOR, { role: "operador" }).firestore();
    await assertSucceeds(getDoc(doc(db, "orders", "pedido-ajeno")));
  });

  it("no se crean pedidos desde el cliente: eso va por Route Handler", async () => {
    await assertFails(
      setDoc(doc(cliente(UID_CLIENTE), "orders", "inventado"), {
        numero: "JYL-2026-9999",
        uid: UID_CLIENTE,
      }),
    );
  });
});

describe("catálogo público", () => {
  it("un anónimo lee un producto activo", async () => {
    const db = entorno.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "products", "camiseta-publicada")));
  });

  it("un anónimo no lee un producto inactivo", async () => {
    const db = entorno.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "products", "camiseta-borrador")));
  });

  it("un anónimo no puede escribir en el catálogo", async () => {
    const db = entorno.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "products", "camiseta-publicada"), { nombre: "Hackeada" }));
  });

  it("el admin sí escribe en el catálogo", async () => {
    const db = entorno.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();
    await assertSucceeds(
      setDoc(doc(db, "products", "camiseta-publicada"), { nombre: "Camiseta", activo: true }),
    );
  });

  it("los datos de contacto son públicos, pero solo el admin los cambia", async () => {
    const anonimo = entorno.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(anonimo, "settings", "general")));
    await assertFails(setDoc(doc(anonimo, "settings", "general"), { whatsapp: "+1" }));
  });
});

describe("dinero e inventario", () => {
  it("el cliente ve su factura pero no la de nadie más", async () => {
    await assertSucceeds(getDoc(doc(cliente(UID_CLIENTE), "invoices", "factura-uno")));
    await assertFails(getDoc(doc(cliente(UID_OTRO_CLIENTE), "invoices", "factura-uno")));
  });

  it("nadie escribe facturas desde el cliente, ni el admin", async () => {
    const db = entorno.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();
    await assertFails(updateDoc(doc(db, "invoices", "factura-uno"), { total: 1 }));
  });

  it("nadie toca el stock de una variante desde el cliente", async () => {
    const db = entorno.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();
    await assertFails(
      setDoc(doc(db, "products", "camiseta-publicada", "variants", "negra-m"), { stock: 999 }),
    );
  });

  it("una variante no se lee sin ser del personal: lleva el costo unitario", async () => {
    const ruta = ["products", "camiseta-publicada", "variants", "negra-m"] as const;
    await assertFails(getDoc(doc(entorno.unauthenticatedContext().firestore(), ...ruta)));
    await assertFails(getDoc(doc(cliente(UID_CLIENTE), ...ruta)));
    await assertSucceeds(getDoc(doc(entorno.authenticatedContext(UID_OPERADOR, { role: "operador" }).firestore(), ...ruta)));
  });

  it("el operador no ve las cifras de ingresos", async () => {
    const db = entorno.authenticatedContext(UID_OPERADOR, { role: "operador" }).firestore();
    await assertFails(getDoc(doc(db, "stats", "resumen")));
  });

  it("los consecutivos no se leen ni se escriben desde el cliente", async () => {
    const db = entorno.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();
    await assertFails(getDoc(doc(db, "counters", "2026")));
    await assertFails(updateDoc(doc(db, "counters", "2026"), { orders: 100 }));
  });
});

describe("cierre por defecto", () => {
  it("una colección que no existe en las reglas está cerrada", async () => {
    const db = entorno.authenticatedContext(UID_ADMIN, { role: "admin" }).firestore();
    await assertFails(getDoc(doc(db, "coleccion-inventada", "x")));
    await assertFails(setDoc(doc(db, "coleccion-inventada", "x"), { a: 1 }));
  });
});

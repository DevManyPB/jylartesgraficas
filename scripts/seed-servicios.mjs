/**
 * Siembra el catálogo de servicios desde la lista acordada en SPEC.md §3.1.
 *
 * Descripciones y precios van vacíos a propósito: no están en el SPEC y
 * AGENTS.md §10 prohíbe inventarlos. Los completa el estudio desde el panel.
 *
 * Contra los emuladores (con `pnpm emulators` levantado):
 *   node --env-file=apps/web/.env.local scripts/seed-servicios.mjs
 *
 * El `--env-file` no es opcional: sin él no hay `FIREBASE_ADMIN_PROJECT_ID` y
 * la siembra cae en un proyecto de mentira dentro del propio emulador, donde
 * la app no la encuentra y parece que el catálogo está vacío. Por eso el
 * script dice al final en qué proyecto escribió.
 *
 * Contra el proyecto real, con la cuenta de servicio en las variables:
 *   node scripts/seed-servicios.mjs
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const SERVICIOS = [
  // Publicidad y diseño gráfico
  ["Afiches y pósters", "publicidad", true],
  ["Tarjetas de presentación", "publicidad", false],
  ["Volantes", "publicidad", true],
  ["Pendones y banners", "publicidad", true],
  ["Logotipos e identidad de marca", "publicidad", false],
  ["Piezas para redes sociales", "publicidad", false],
  ["Papelería corporativa", "publicidad", false],
  // Desarrollo web
  ["Sitios corporativos", "web", false],
  ["Landing pages", "web", false],
  ["Mantenimiento y rediseño", "web", false],
  // Servicios técnicos
  ["Formateo de equipos", "tecnico", false],
  ["Instalación de sistemas operativos", "tecnico", false],
  ["Instalación de software y drivers", "tecnico", false],
  ["Mantenimiento preventivo", "tecnico", false],
];

const slugDe = (nombre) =>
  nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const usandoEmuladores = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "demo-jyl";

initializeApp(
  usandoEmuladores
    ? { projectId }
    : {
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      },
);

const db = getFirestore();
// Solo crea los que faltan. Nunca reescribe uno existente: una vez que el
// estudio carga descripciones, precios u orden desde el panel, volver a
// correr la siembra no puede borrarlos.
const existentes = new Set((await db.collection("services").select().get()).docs.map((d) => d.id));
const lote = db.batch();
let creados = 0;

SERVICIOS.forEach(([nombre, categoria, requiereMedidas], indice) => {
  const slug = slugDe(nombre);
  if (existentes.has(slug)) return;
  creados += 1;
  lote.create(db.collection("services").doc(slug), {
    nombre,
    categoria,
    slug,
    orden: indice,
    activo: true,
    requiereMedidas,
    requiereReferencias: categoria !== "tecnico",
    // Pendientes del cliente: no se inventan.
    descripcion: "",
    precioBase: null,
  });
});

await lote.commit();
console.log(
  `Sembrados ${creados} servicios nuevos en ${projectId}${usandoEmuladores ? " (emulador)" : " (proyecto real)"}; ` +
    `${SERVICIOS.length - creados} ya existían y no se tocaron.`,
);
if (creados > 0) console.log("Descripciones y precios quedan vacíos: los completa el estudio.");

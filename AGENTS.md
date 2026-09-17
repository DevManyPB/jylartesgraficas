# AGENTS.md — JYL Artes Gráficos

Instrucciones para el agente de código que trabaje en este repositorio. Este proyecto se construye con **Claude Code**.
Léelo completo antes de escribir la primera línea. `SPEC.md` define **qué** se construye; este archivo define **cómo**.

---

## 1. Contexto en 30 segundos

Monorepo con dos aplicaciones Next.js que comparten Firebase:

- `apps/web` → sitio público, `jylartesgraficos.com`. Portafolio, tienda y captación de pedidos.
- `apps/panel` → SaaS privado, `sas.jylartesgraficos.com`. Pedidos, inventario, facturación.

Es un estudio de artes gráficas que además vende productos personalizados (camisetas, lapiceros, artículos publicitarios). El sitio se juzga por cómo se ve: un diseño genérico es un defecto funcional, no una cuestión de gusto.

**Tres restricciones que mandan sobre cualquier otra decisión:**

1. **Costo de infraestructura: $0.** Ver §5.
2. **Toda confirmación va en un modal propio.** Ver §7.
3. **El diseño no puede parecer una plantilla.** Ver §8.

---

## 2. Cómo trabajar en este repositorio (Claude Code)

### Antes de empezar cualquier tarea

1. Lee `SPEC.md` completo. No construyas nada que no esté ahí.
2. **Usa el modo plan primero.** Presenta el plan, espera aprobación, y solo entonces escribe código. En un proyecto de este tamaño, un plan rechazado cuesta un minuto; una implementación rechazada cuesta una tarde.
3. Si la tarea toca más de 5 archivos, divídela y propón el orden.

### Durante la tarea

- Trabaja en incrementos que compilen. No dejes el repositorio roto entre cambios.
- Después de cada bloque de trabajo ejecuta `pnpm typecheck` y `pnpm lint`. No esperes al final.
- Si un cambio no funciona a la segunda, **para y explica qué está pasando**. No acumules intentos ni dejes código muerto de experimentos.
- Cuando implementes una vista, revísala contra la lista de señales genéricas de §8 antes de darla por hecha.

### Lo que nunca haces sin preguntar

- Instalar una dependencia nueva. Propón cuál, por qué, su peso, y si es gratuita.
- Cambiar `firestore.rules`, la estructura de datos o el esquema de una colección.
- Tocar `.env`, credenciales o configuración de despliegue.
- Ejecutar cualquier comando contra el proyecto **de producción** de Firebase.
- Borrar archivos que no creaste tú en esa misma tarea.
- Agregar contenido inventado: testimonios, nombres de clientes, precios, direcciones, cifras.

### Al terminar

Reporta en tres líneas: qué cambió, qué probaste, y qué quedó pendiente. Sin resúmenes largos ni listas de archivos tocados.

---

## 3. Estructura y dónde va cada cosa

```
apps/web/           Sitio público
  app/              Rutas (App Router)
  components/       Componentes propios del sitio
apps/panel/         SaaS
  app/
  components/
packages/ui/        Componentes y tokens compartidos (incluye el sistema de modales)
packages/core/      Tipos, esquemas Zod, lógica de negocio, clientes Firebase
firestore.rules
```

- Un tipo o esquema Zod que usen las dos apps va en `packages/core`. Nunca se duplica.
- Un componente que usen las dos apps va en `packages/ui`. Si solo lo usa una, se queda en esa app.
- Toda escritura con privilegios (roles, contadores, totales, stock) va en una Route Handler del servidor con `firebase-admin`. Nunca en un componente de cliente.
- Nada de carpetas `utils/` genéricas. Los módulos se nombran por lo que hacen: `invoices/numbering.ts`, `inventory/stock.ts`, `cloudinary/upload.ts`.

---

## 4. Comandos

```bash
pnpm install
pnpm dev                 # ambas apps
pnpm dev --filter web    # solo el sitio público
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm emulators           # emuladores de Firebase (Auth, Firestore)
```

Desarrollo y pruebas van **siempre** contra los emuladores.

---

## 5. Presupuesto cero: reglas duras

Este proyecto no tiene presupuesto de infraestructura. Antes de usar cualquier servicio, verifica que su plan gratuito **no exija tarjeta** y **permita uso comercial**.

### Lo que está prohibido

| Prohibido | Por qué | Qué usar |
|---|---|---|
| **Firebase Storage** | Exige plan Blaze con tarjeta desde el 3 de febrero de 2026 | Cloudinary (plan gratuito) |
| **Cloud Functions** | Exige plan Blaze | Route Handlers de Next.js con `firebase-admin` |
| **Vercel Hobby** | Su plan gratuito prohíbe el uso comercial | Cloudflare Pages/Workers, o Netlify |
| **Google Maps JS API** | Exige cuenta de facturación | Leaflet + OpenStreetMap |
| Cualquier servicio de pago o con prueba que caduque | Rompe la restricción del proyecto | Preguntar antes |

### Cuota de Firestore: no la quemes

Hay 50.000 lecturas y 20.000 escrituras al día. Es suficiente si el código está bien hecho, y se agota en horas si no.

- **Prohibido** `onSnapshot` sobre una colección completa. Se escucha solo lo visible, con `limit()`.
- Las listas del panel se paginan de 25 en 25 con cursor. Nunca se traen todos los documentos para filtrar en el navegador.
- El sitio público lee portafolio, tienda y configuración **en el servidor** con caché e ISR. Un visitante no genera lecturas por scroll.
- Los contadores del tablero se leen de `stats/resumen`, no contando colecciones.
- **Prohibido** leer un documento dentro de un bucle. Usa `where(documentId(), 'in', [...])` en lotes de 10, o desnormaliza.
- Toda escritura que dependa del valor anterior (stock, consecutivos, agregados) va en transacción.

### Cloudinary

- Subida siempre firmada desde el servidor. **Prohibido** el preset sin firmar abierto al público: cualquiera podría llenar la cuenta.
- Límites verificados en el servidor, no solo en el navegador: 10 archivos por pedido, 10 MB por archivo, tipos permitidos.
- En Firestore se guarda `publicId`, URL y dimensiones. Nunca el binario.
- Las transformaciones se piden por URL y siempre con formato y calidad automáticos.

---

## 6. Firebase: lo que nunca se hace

1. **Nunca** una clave de Admin SDK, token o secreto en código de cliente ni en una variable `NEXT_PUBLIC_`.
2. **Nunca** se escribe `role` desde el cliente. Los roles son custom claims, asignados desde una Route Handler protegida.
3. **Nunca** se confía en un total, un precio o un consecutivo que venga del cliente. Se recalcula en el servidor.
4. **Nunca** se actualiza `stock` con una escritura directa. Se crea un movimiento y el stock se recalcula en transacción.
5. **Nunca** se genera un número de factura leyendo el último documento. Transacción sobre `counters/{año}`.
6. **Nunca** `allow read, write: if true`, ni siquiera "un momento para probar".
7. **Nunca** se despliegan reglas sin una prueba que demuestre que un usuario no autorizado sigue sin poder leer.

Cada vez que toques `firestore.rules`, actualiza `firestore.rules.test.ts` en el mismo cambio.

---

## 7. Modales: obligatorio

**Está prohibido usar `alert()`, `confirm()` y `window.prompt()`.** Si aparecen en el código, el trabajo se rechaza. Toda confirmación, aviso de decisión y acción destructiva usa el modal de `packages/ui`.

### Implementación

- Se construye sobre **Radix UI Dialog** o el `<dialog>` nativo. **Prohibido** armarlo a mano con un `div` y `position: fixed`.
- El foco entra al modal al abrir, queda atrapado dentro, y **vuelve al elemento que lo abrió al cerrar**.
- `Esc` cierra. Clic fuera cierra, salvo en modales destructivos o con formulario a medio llenar.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` al título.
- El fondo no hace scroll mientras está abierto, y la página no salta al bloquearse.
- En móvil sube desde abajo, ancho completo, con margen arriba y cierre arrastrando.
- Entrada de 150–200 ms, salida más rápida. Con `prefers-reduced-motion`, sin animación.
- Un solo modal a la vez. Nunca uno sobre otro.

### Contenido

- **El título es la pregunta, con el nombre real del elemento.** Prohibido "¿Estás seguro?".
- El cuerpo explica la consecuencia, no repite el título.
- El botón lleva el verbo de la acción: *Emitir*, *Anular*, *Eliminar*. Prohibido *Aceptar*.
- Cancelar va a la izquierda y recibe el foco al abrir.
- Destructivo: botón rojo, habilitado solo tras escribir el motivo o el nombre del elemento.
- Mientras se ejecuta la acción, el botón muestra carga y el modal no se cierra.

### Cuándo NO es modal

Guardado correcto, copiado al portapapeles, error de red recuperable: *toast* abajo a la derecha, que se va solo a los 4 segundos. Un modal para avisar que algo salió bien es una interrupción, no una confirmación.

La lista completa de qué acción lleva modal está en `SPEC.md` §5.1.

---

## 8. Diseño: cómo evitar que esto parezca una plantilla

Antes de construir una vista, escribe un plan corto: color, tipografía, estructura, y qué elemento lleva el peso visual. Revísalo contra `SPEC.md` §9. Si el plan es el que habrías hecho para cualquier otro cliente, cámbialo.

### Señales de que algo salió genérico. Si aparecen, reescribe

- Tres tarjetas idénticas en fila, mismo radio de borde y misma sombra gris suave debajo de cada una.
- Etiquetas en mayúsculas sostenidas con interletraje encima de cada título.
- Una palabra del titular resaltada en otro color o en cursiva.
- Flecha `→` pegada al texto de cada botón o enlace.
- Marcadores `01 / 02 / 03` en contenido que no es una secuencia.
- Degradados como decoración de fondo.
- Desvanecido con desplazamiento en cada sección al hacer scroll.
- Fondo crema con serif de alto contraste y acento terracota. Ese conjunto está vetado aquí.
- Negro falso (#0B0B0B, #111) en lugar de negro, y monoespaciada para etiquetas pequeñas.
- Recortar las piezas del portafolio a cuadrado. Cada pieza conserva su proporción real.

### El header

Está especificado al detalle en `SPEC.md` §4.2 y se implementa exactamente así: marca en dos líneas a la izquierda, cuatro destinos como máximo, **un solo** botón de acento, transparente sobre el héroe y sólido con desenfoque al hacer scroll, oculto al bajar y visible al subir, menú a pantalla completa en móvil con foco atrapado.

No lo simplifiques "por ahora". El header es lo primero que ve un cliente del estudio.

### Movimiento

Un momento orquestado al cargar el inicio. De ahí en adelante, el movimiento solo responde a una acción del usuario y muestra qué cambió. Siempre con `prefers-reduced-motion` respetado.

---

## 9. Reglas de código

### TypeScript
- `strict: true`. Prohibido `any`; usa `unknown` y estrecha.
- Prohibido `@ts-ignore` sin un comentario encima que explique por qué y qué haría falta para quitarlo.
- Todo dato externo (formulario, Firestore, parámetro de ruta, respuesta de Cloudinary) se valida con Zod antes de usarse. Los tipos se derivan con `z.infer`, no se escriben dos veces.

### Nombres
- Componentes `PascalCase`, hooks `useCamelCase`, el resto `camelCase`.
- Archivos de componente en `PascalCase.tsx`, el resto en `kebab-case.ts`.
- **El dominio se nombra en español**, igual que en `SPEC.md`: `pedido`, `factura`, `inventario`, `variante`, `estado`. No mezcles `order` y `pedido` en el mismo módulo. Las claves de Firestore son exactamente las del SPEC.

### React / Next
- Server Components por defecto. `'use client'` solo con estado, efectos o eventos, y lo más abajo posible en el árbol.
- Nada de `useEffect` para traer datos que puede traer el servidor.
- En el panel, datos en vivo con listeners **acotados** envueltos en TanStack Query.
- Estados de carga y de vacío diseñados, nunca una pantalla en blanco. La pantalla vacía invita a actuar.

### Estilos
- Solo Tailwind con los tokens de `packages/ui`. **Prohibido** escribir un color a mano en un componente.
- Móvil primero. Cada vista se prueba a 320 px antes de darse por hecha.

---

## 10. Redacción de la interfaz

- Español neutro, en tono de frase normal, sin mayúsculas decorativas.
- El botón dice lo que va a pasar: *Enviar pedido*, no *Enviar*. *Guardar cambios*, no *Aceptar*.
- La acción conserva el mismo nombre en todo el flujo: si el botón dice *Emitir factura*, la confirmación dice *Factura emitida*.
- Los errores explican qué pasó y qué hacer, sin disculparse y sin tecnicismos: *No pudimos subir 2 archivos porque superan los 10 MB. Quítalos o reemplázalos para continuar.*
- Las pantallas vacías invitan a actuar: *Aún no hay productos. Agrega el primero para que aparezca en la tienda.*
- Nunca se inventa contenido que parezca real. Si falta, se marca `TODO: contenido pendiente del cliente`.

---

## 11. Accesibilidad — piso obligatorio

- Contraste AA como mínimo en todo texto.
- Foco de teclado visible siempre. Nunca `outline: none` sin reemplazo.
- Todo control alcanzable con teclado. El kanban del panel necesita alternativa por teclado al arrastrar.
- Imágenes del portafolio y productos con `alt` descriptivo del contenido, no del archivo.
- Formularios con etiquetas reales asociadas, no solo `placeholder`.
- Errores anunciados con `aria-live`.
- Modales según §7, sin excepciones.

---

## 12. Pruebas

- Lógica de `packages/core` (consecutivos, totales, stock por variante): Vitest. Obligatorio.
- Reglas de seguridad: `@firebase/rules-unit-testing`. Obligatorio.
- Playwright en dos flujos: enviar un pedido con archivos, y emitir una factura desde un pedido.
- No se piden pruebas de componentes puramente visuales.

Nada está terminado sin que `pnpm typecheck`, `pnpm lint` y `pnpm test` pasen en limpio.

---

## 13. Git

- Ramas: `feat/header-scroll`, `fix/stock-transaccion`, `chore/deps`.
- Commits convencionales en español: `feat(panel): kanban de pedidos con actualización optimista`.
- Un PR resuelve una cosa. Más de 15 archivos suele ser dos PR.
- Descripción del PR: qué cambia, por qué, cómo probarlo, y captura si toca interfaz.

---

## 14. Antes de decir que algo está listo

- [ ] `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan
- [ ] Probado a 320 px, 768 px y 1440 px
- [ ] Navegado completo con teclado, con foco visible
- [ ] Sin `any`, sin `console.log`, sin `TODO` huérfanos
- [ ] **Sin `alert()`, `confirm()` ni `prompt()`**
- [ ] Sin secretos ni claves en el código
- [ ] Sin servicios de pago ni dependencias que exijan tarjeta
- [ ] Sin `onSnapshot` abierto sobre colecciones completas
- [ ] Si toca datos: reglas de seguridad actualizadas y probadas
- [ ] Si toca interfaz: revisado contra §8 y ninguna señal presente
- [ ] Si cambia el comportamiento acordado: `SPEC.md` actualizado en el mismo PR

---

## 15. Cuando haya dudas

- Si el requisito no está en `SPEC.md`, **pregunta antes de construirlo**. No inventes alcance.
- Si una decisión técnica contradice el SPEC, dilo y propón el cambio. No lo hagas en silencio.
- Si una biblioteca resuelve el problema, propón cuál, por qué, cuánto pesa y si es gratuita. No la agregues sin acordarlo.
- Si un texto legal, un precio, una dirección o un dato de contacto hace falta, márcalo como pendiente del cliente. No lo inventes.

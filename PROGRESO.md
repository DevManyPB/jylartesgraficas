# Por dónde vamos

Última actualización: 19 de septiembre de 2026. Qué construir: `SPEC.md`. Cómo: `AGENTS.md`.

## Para seguir en otra máquina

1. `git clone https://github.com/DevManyPB/jylartesgraficas.git` y `pnpm install`.
2. **Los `.env.local` no están en el repositorio** (son secretos). Hay que crear
   `apps/web/.env.local` y `apps/panel/.env.local` a partir de `.env.example`,
   copiándolos a mano desde la otra máquina (USB, gestor de contraseñas…).
   Nunca por chat ni por correo. `REVALIDACION_SECRETO` es igual en los dos;
   `SITIO_URL` y las 3 de Cloudinary también van en el panel.
3. Emuladores (necesitan Java y `firebase-tools`): `pnpm emulators`.
4. Con los emuladores arriba, datos de prueba:
   `node --env-file=apps/web/.env.local scripts/preparar-emulador.mjs`.
   Crea `admin@jyl.test` y `operador@jyl.test` (contraseña `prueba123`) y
   siembra los 14 servicios. El emulador arranca vacío cada vez.
5. `pnpm --filter panel dev` y `pnpm --filter web dev`. El que arranque
   primero toma el puerto 3000 y el otro el 3001. Usa `localhost`, no
   `127.0.0.1` (la recarga en caliente se bloquea con esa dirección).
6. Antes de dar algo por terminado: `pnpm typecheck`, `pnpm lint`,
   `pnpm test` (con emuladores arriba) y `pnpm build`.

## Hecho

- **Fase 1:** monorepo, sistema de diseño, modales, autenticación, reglas.
- **Fase 2 completa:** inicio, nosotros, servicios, portafolio con visor,
  tienda (listado y ficha con variantes), contacto con mapa de Leaflet, pie
  de página, textos legales, «Mi cuenta» con el historial real del cliente,
  y el formulario de pedido de 4 pasos, que también recibe productos de la
  tienda y ofrece escribir por WhatsApp al terminar.
  SEO de §10: sitemap, robots, Open Graph y datos estructurados.
- **Fase 3 completa:**
  1. Esqueleto del panel: navegación por rol, cambios sin guardar.
  2. Configuración y servicios.
  3. Pedidos: lista, búsqueda, detalle, estados, notas y aviso en vivo.
  4. Inventario: productos, variantes, movimientos e insumos.
  5. Portafolio.
  6. **Facturación:** borrador desde el pedido, emisión con consecutivo
     `FAC-año-NNNN` sin huecos, descuento de stock, pagos, anulación que
     devuelve el stock y PDF con pdf-lib.
  7. **Clientes y tablero:** cifras del tablero con agregaciones sobre
     `stats/resumen`, entregas próximas, y ficha de cliente con pedidos,
     facturas, total facturado y notas privadas del estudio.
  8. **Kanban de pedidos:** una columna por estado, arrastrar y soltar, y un
     selector en cada tarjeta para teclado y móvil.
  9. **Ordenar arrastrando** productos y portafolio (último commit).

## Decisiones tomadas en el bloque 7

- **"Ingresos del mes" = facturado**: facturas emitidas en el mes que no se
  anularon. Sale de una agregación, no de un contador que pueda desfasarse.
- Cada factura guarda **`saldo`**, al día al emitir, pagar y anular.
- En **Clientes** están quienes tienen cuenta; a los invitados se les busca
  desde Pedidos.
- Las **notas del cliente** viven en `users/{uid}/interno/notas`, que las
  reglas no abren a nadie salvo al servidor. Hay prueba de reglas.

## Pendiente

- **Medir Lighthouse en móvil** (SPEC §13 pide rendimiento ≥ 90 y
  accesibilidad ≥ 95). Nunca se ha medido: es la única casilla de §13 sin
  comprobar, junto con el envío de correos.
- **Correo**: el envío de la factura al cliente (SPEC §6.5) y la
  confirmación del pedido siguen esperando la cuenta de Resend.
- **Contenido del estudio, no de código:** las descripciones y los precios de
  los 14 servicios (sembrados vacíos a propósito) y los textos legales.
  En Términos y Privacidad, lo que falta está marcado como «Pendiente» en la
  propia página: plazos, revisiones, garantías, cuánto se guardan los datos y
  los datos de la empresa como responsable. Hay que completarlos y que los
  revise un abogado antes de publicar.
- **Correos** (confirmación de pedido, envío de facturas): falta la cuenta de
  Resend.
- Borrar de Cloudinary las imágenes de prueba en `jyl/productos` y
  `jyl/portafolio`.
- **Enter en los formularios en modal** (Registrar pago, Registrar
  movimiento): el formulario está bien armado, pero en el navegador de
  pruebas Enter no lo envió. Confirmarlo en un navegador normal.
- **PDF de factura:** se revisó uno de una página. Falta probar uno con muchas
  líneas (salto de página) y con caracteres raros en los nombres.
- Decidir si el PDF lleva una nota aclarando que no es factura electrónica de
  la DIAN (SPEC §1 la deja para la Fase 4).

## Tareas tuyas, fuera del código

- **Revocar la clave de la cuenta de servicio de Firebase** que se pegó en el
  chat (Google Cloud Console → IAM → Cuentas de servicio → Claves), crear una
  nueva y ponerla solo en los `.env.local`.
- Borrar las dos capturas de pantalla de la raíz: muestran el secreto de
  Cloudinary. Están en `.gitignore` y nunca se subieron.
- **Desplegar `firestore.rules` y `firestore.indexes.json`** al proyecto real
  cuando lo decidas. Solo se han probado en local, y hay índices nuevos
  (facturas por estado, búsqueda de pedidos, movimientos).
- Límite de peticiones en Cloudflare al publicar.

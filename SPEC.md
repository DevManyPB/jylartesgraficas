# SPEC.md — JYL Artes Gráficos

> Especificación funcional y técnica del sitio público y del SaaS interno.
> Este documento es la fuente de verdad del proyecto. Si algo no está aquí, no está acordado.
> **Restricción dura del proyecto: costo mensual de infraestructura = $0.** Ver §2.

---

## 1. Resumen

JYL Artes Gráficos es un estudio de artes gráficas, desarrollo web y servicios técnicos, que además vende productos personalizados (camisetas, lapiceros y otros artículos publicitarios).

El proyecto consta de dos aplicaciones que comparten la misma base de datos:

| App | Dominio | Público | Propósito |
|---|---|---|---|
| **Sitio público** | `jylartesgraficos.com` | Abierto | Portafolio, servicios, tienda, captación de pedidos |
| **SaaS / Panel** | `sas.jylartesgraficos.com` | Privado, con credenciales | Pedidos, inventario, facturación, clientes |

### Objetivos de negocio

1. Que el trabajo del estudio se vea, no que se describa. El portafolio manda.
2. Que un cliente pueda pedir un servicio o un producto en menos de 2 minutos, subiendo referencias visuales.
3. Eliminar la facturación manual: la factura sale del pedido, no de cero.
4. Controlar el inventario de productos físicos sin contar a mano.
5. Que el cliente sepa dónde queda el local y pueda llegar.
6. Transmitir confianza: términos claros, datos protegidos, contacto real.

### Qué NO es este proyecto (v1)

- No hay pago en línea. Los pedidos son solicitudes y cotizaciones; el pago se acuerda por WhatsApp o en el local.
- No es multi-empresa. Un solo estudio.
- No hay app móvil nativa. Es web responsive.
- No hay facturación electrónica oficial (DIAN) en v1. Ver Fase 4.

---

## 2. Presupuesto cero — restricción de arquitectura

Todo el sistema debe correr **sin tarjeta de crédito y sin cobro mensual**. Esto condiciona decisiones técnicas reales, no es un detalle administrativo.

### 2.1 Lo que sí es gratis en Firebase (plan Spark)

| Servicio | Límite gratuito | Uso en el proyecto |
|---|---|---|
| Authentication | ~50.000 usuarios activos/mes | Login de clientes y del panel |
| Firestore | 1 GiB almacenados · 50.000 lecturas/día · 20.000 escrituras/día · 20.000 borrados/día | Toda la base de datos |
| Hosting | 10 GB almacenados · 360 MB/día de transferencia | Solo si se usa export estático |

### 2.2 Lo que **ya no** es gratis en Firebase — leer con atención

**Cloud Storage for Firebase exige plan Blaze (tarjeta vinculada) desde el 3 de febrero de 2026.** Un proyecto en Spark no puede crear ni usar buckets; las llamadas devuelven 402 o 403. Vincular la tarjeta mantiene la factura en cero mientras se esté dentro del "Always Free" de Google Cloud, pero exige tarjeta.

**Cloud Functions exige plan Blaze.**

Consecuencias de diseño, obligatorias:

1. **No se usa Firebase Storage.** Las imágenes que suben los clientes y las del portafolio van a un servicio externo gratuito.
2. **No se usan Cloud Functions.** Toda la lógica con privilegios va en Route Handlers de Next.js ejecutadas en el servidor, usando `firebase-admin`.

### 2.3 Almacenamiento de imágenes — alternativa gratuita

**Opción elegida: Cloudinary, plan gratuito.** 25 créditos al mes, donde 1 crédito equivale a 1 GB almacenado, 1 GB de ancho de banda o 1.000 transformaciones. Incluye redimensionado, conversión a WebP/AVIF y CDN, que es justo lo que necesita un sitio de portafolio.

**Alternativa si Cloudinary queda corto: ImageKit gratuito**, con más ancho de banda mensual (≈20 GB) y menos almacenamiento (≈3 GB).

Reglas de uso:
- La subida se hace con *upload preset* firmado desde una Route Handler. Nunca con preset sin firmar abierto al público, porque cualquiera podría llenar la cuenta.
- Límites aplicados en el servidor: 10 archivos por pedido, 10 MB por archivo.
- En Firestore solo se guarda el `public_id`, la URL y las dimensiones. Los binarios nunca tocan Firestore.

### 2.4 Hosting — cuidado con la letra pequeña

**El plan Hobby de Vercel es solo para uso personal y no comercial.** Este es un negocio real, así que Vercel Hobby queda descartado.

| Opción | Uso comercial en el plan gratuito | Nota |
|---|---|---|
| **Cloudflare Pages / Workers** | Permitido | Ancho de banda sin medir para estáticos; el cómputo sí tiene límites de peticiones y CPU |
| **Netlify (plan gratuito)** | Permitido | ≈125 GB de transferencia y ≈125.000 invocaciones de función al mes |
| Vercel Hobby | **No permitido** | Requiere Pro (~US$20/mes) para uso comercial |

**Elección por defecto: Cloudflare (Pages/Workers con el adaptador de Next.js).** Suplente: Netlify. Ambos permiten dominio propio y subdominio con SSL gratis.

> **Paso obligatorio al desplegar: rate limiting en Cloudflare.** Dos endpoints son públicos por diseño, porque un invitado tiene que poder pedir sin cuenta: `POST /api/pedidos` (escribe en Firestore) y `POST /api/subidas/firma` (habilita una subida a Cloudinary). Sin un límite en el borde, cualquiera puede agotar las 20.000 escrituras diarias de Firestore o los créditos de Cloudinary. Se limita en Cloudflare y no en el código a propósito: allí el bloqueo ocurre antes de llegar a la aplicación y no consume cuota, mientras que un contador en la propia base de datos gastaría justo aquello que intenta proteger.

> Estos límites y condiciones cambian. Antes de desplegar, verificar en la documentación oficial de cada proveedor.

### 2.5 Mapa de ubicación

**No se usa Google Maps JavaScript API**, porque exige cuenta de facturación. Se usa **Leaflet + OpenStreetMap**, sin llave ni tarjeta. El botón "Cómo llegar" abre un enlace externo a la app de mapas del teléfono.

### 2.6 Resumen del stack gratuito

```
Auth + base de datos ... Firebase (Spark)
Imágenes ............... Cloudinary (gratuito)
Hosting y servidor ..... Cloudflare Pages/Workers (gratuito, uso comercial permitido)
Correo ................. Resend (plan gratuito) o Brevo
Mapa ................... Leaflet + OpenStreetMap
Analítica .............. Cloudflare Web Analytics (gratuito, sin cookies)
PDF de facturas ........ Generado en el navegador con jsPDF o pdf-lib (sin servicio externo)
Dominio ................ Único costo real del proyecto
```

### 2.7 Consumo bajo control

Con 50.000 lecturas al día hay margen de sobra, pero se rompe fácil si se programa mal. Reglas:

- El panel **no** deja listeners abiertos sobre colecciones completas. Se escucha solo lo visible y se paginan de 25 en 25.
- El sitio público lee el portafolio y los productos desde el servidor con caché e ISR. Un visitante no genera lecturas de Firestore por cada scroll.
- Los contadores del tablero se guardan agregados en `stats/resumen`, actualizados al escribir. Nunca se cuenta recorriendo la colección entera.
- Se configuran alertas de uso en la consola de Firebase.

---

## 3. Catálogo: servicios y productos

Hay dos cosas distintas que el cliente puede pedir, y el sistema las trata distinto.

### 3.1 Servicios (se cotizan)

**Publicidad y diseño gráfico:** afiches y pósters, tarjetas de presentación, volantes, pendones y banners, logotipos e identidad de marca, piezas para redes sociales, papelería corporativa.

**Desarrollo web:** sitios corporativos, landing pages, mantenimiento y rediseño.

**Servicios técnicos:** formateo de equipos, instalación de sistemas operativos, instalación de software y drivers, mantenimiento preventivo.

Un servicio no tiene stock. Se pide, se cotiza, se aprueba, se produce.

### 3.2 Productos físicos (se venden y tienen stock)

- Camisetas personalizadas
- Lapiceros personalizados
- Gorras, termos, mugs, llaveros, agendas y demás artículos publicitarios
- Cualquier artículo que el estudio tenga en existencia

Un producto tiene **variantes**, y esto es clave para el inventario:

```
Camiseta institucional
 ├── Blanca / S   → stock 12
 ├── Blanca / M   → stock  8
 ├── Negra  / M   → stock  3   ← bajo mínimo
 └── Negra  / L   → stock  0   ← agotado
```

El stock vive en la variante, no en el producto. El producto solo muestra el total.

Un producto puede pedirse **con personalización** (subir logo o diseño) o **sin ella**. Si lleva personalización, el pedido entra al flujo de cotización igual que un servicio.

---

## 4. Sitio público

### 4.1 Estructura

```
/                     Inicio
/portafolio           Galería filtrable por categoría
/portafolio/[slug]    Caso individual
/servicios            Catálogo de servicios
/tienda               Productos físicos con filtros
/tienda/[slug]        Detalle de producto con variantes
/pedido               Formulario de solicitud
/nosotros             Quiénes somos, proceso de trabajo
/contacto             Datos, mapa, horarios, WhatsApp
/terminos             Términos y condiciones
/privacidad           Política de tratamiento de datos
/mi-cuenta            Historial de pedidos del cliente (requiere login)
```

### 4.2 Header — especificación detallada

El header es lo primero que se ve y donde se decide si el sitio parece profesional. Se construye así, y no como una barra genérica con el logo a la izquierda y cinco enlaces a la derecha.

**Estructura en escritorio**

```
┌──────────────────────────────────────────────────────────────────┐
│  JYL                    Portafolio  Servicios  Tienda  Contacto  │
│  artes gráficas                          [ Pedir un trabajo ]    │
└──────────────────────────────────────────────────────────────────┘
```

- **Marca a la izquierda, en dos líneas.** "JYL" en el peso más fuerte de la tipografía de titulares, "artes gráficas" debajo, mucho más pequeño y en el color secundario. La marca es un elemento tipográfico compuesto, no un logo genérico centrado.
- **Navegación al centro-derecha**, en tamaño pequeño y espaciado generoso. Cuatro destinos como máximo. El resto vive en el pie de página.
- **Una sola acción destacada:** *Pedir un trabajo*. Es el único elemento del header con color de acento.
- Alineado a la misma rejilla que el contenido de la página, no pegado a los bordes del navegador.

**Comportamiento**

- Arranca **transparente sobre la pieza del héroe**, con el texto en blanco. Al pasar el primer pliegue, se vuelve sólido con desenfoque de fondo y una línea inferior de un píxel. La transición dura entre 200 y 300 ms.
- Al bajar se oculta, al subir reaparece. Esto devuelve pantalla al portafolio en el móvil.
- La página actual se marca con una línea corta debajo del enlace, no con negrita ni con otro color.
- Si el usuario tiene sesión iniciada, el botón de cuenta reemplaza al de login y muestra su inicial.

**En móvil**

- Marca a la izquierda, botón de menú a la derecha, y nada más. El botón de WhatsApp flota aparte.
- El menú abre a pantalla completa desde la derecha, con los enlaces en tamaño grande, cómodos para el pulgar, y al final los datos de contacto y las redes.
- El icono de menú se transforma en X con animación. Esc lo cierra. El foco queda atrapado dentro mientras está abierto. El fondo no hace scroll.
- Altura del header: 64 px en móvil, 80 px en escritorio.

**Prohibido en el header:** enlaces en mayúsculas sostenidas, una flecha pegada al texto del botón, sombra gris suave debajo de la barra, más de un botón de acento, y el logo repetido en el centro.

### 4.3 Inicio

1. Pieza destacada a pantalla completa, con el nombre del estudio y una sola acción: *Pedir un trabajo*.
2. Rejilla de portafolio reciente (6–8 piezas), con las proporciones reales de cada pieza, sin recortes cuadrados forzados.
3. Bloque de servicios, agrupado por las tres áreas.
4. Franja de productos: camisetas, lapiceros y demás, con enlace a la tienda.
5. Bloque de ubicación con el mapa y el horario.
6. Cierre con contacto directo y WhatsApp.

Si no hay testimonios reales, no se incluye el bloque de testimonios. No se inventa contenido.

### 4.4 Tienda

- Rejilla con foto, nombre, rango de precio y aviso de agotado cuando ninguna variante tiene stock.
- Filtros por categoría y por disponibilidad.
- Detalle del producto: galería, descripción, selector de talla y color con las combinaciones sin stock deshabilitadas (no ocultas), cantidad, y casilla *Quiero personalizarlo con mi diseño*.
- La acción es *Pedir este producto*, no *Agregar al carrito*. Lleva al formulario de pedido con el producto y la variante ya cargados.
- El stock que se muestra viene de Firestore leído en el servidor, con revalidación corta.

### 4.5 Flujo de pedido

Formulario de varios pasos, con progreso visible y borrador guardado en `localStorage`.

**Paso 1 — Qué necesitas.** Servicio o producto. Si viene de la tienda, ya llega seleccionado.
**Paso 2 — Detalles.** Campos condicionales: medidas y material para un póster; talla, color y cantidad para una camiseta; marca del equipo y sistema operativo para un formateo. Fecha deseada y presupuesto aproximado opcional.
**Paso 3 — Referencias.** Hasta 10 archivos de 10 MB. JPG, PNG, WEBP, PDF, AI, PSD. Vista previa, opción de quitar, barra de progreso real por archivo.
**Paso 4 — Tus datos.** Se rellenan solos si hay sesión. Si no, se ofrece crear cuenta con Google o continuar como invitado. Continuar como invitado siempre está visible.

**Confirmación.** Número de pedido (`JYL-2026-0147`), resumen, y dos salidas: *Escribir por WhatsApp sobre este pedido*, con mensaje pre-llenado, o *Volver al inicio*.

Reglas: un pedido enviado nunca se pierde; si fallan las imágenes, el pedido se guarda igual marcado como `archivos_incompletos`. El administrador recibe aviso. El cliente recibe correo con su número.

### 4.6 Ubicación y contacto

- Dirección completa, barrio y ciudad.
- Mapa con Leaflet y OpenStreetMap, con un marcador de la identidad visual del estudio. Carga diferida: no se descarga la librería del mapa hasta que la sección entra en pantalla.
- Botón *Cómo llegar* que abre la app de mapas del teléfono.
- Horario de atención por día, con indicador de abierto o cerrado calculado en el cliente.
- Teléfono y correo como enlaces pulsables.
- Punto de referencia en texto. En muchos barrios sirve más que la dirección.

Todo esto sale de `settings/general`, nunca escrito en el código.

### 4.7 WhatsApp

Botón flotante en todas las páginas, que abre `wa.me` con mensaje pre-llenado según la página de origen. El número se guarda en configuración. Respeta `prefers-reduced-motion` y no tapa contenido en móvil.

### 4.8 Cuentas de cliente

Registro con Google o correo y contraseña. El cliente ve su historial, el estado de cada pedido y sus facturas. Estados visibles: *Recibido → En revisión → Cotizado → Aprobado → En producción → Listo → Entregado*. Puede aprobar o rechazar una cotización y comentar el pedido.

---

## 5. Patrones de interacción: modales

**Toda confirmación, aviso de decisión y acción destructiva se hace con un modal propio del sistema de diseño.** Está prohibido usar `alert()`, `confirm()` y `prompt()` del navegador: son feos, no se pueden estilizar, bloquean el hilo y arruinan la impresión de profesionalismo.

### 5.1 Cuándo va un modal

| Situación | Tipo |
|---|---|
| Confirmar envío del pedido | Confirmación, con resumen de lo que se envía |
| Aprobar o rechazar una cotización (cliente) | Confirmación, con el total visible |
| Emitir una factura | Confirmación, avisando que no se podrá editar |
| Anular una factura | Destructivo, exige escribir el motivo |
| Eliminar producto, artículo o proyecto | Destructivo, con el nombre del elemento en el texto |
| Cambiar el estado de un pedido a Entregado | Confirmación |
| Registrar movimiento de inventario | Formulario en modal |
| Ver imagen del portafolio o una referencia | Visor a tamaño completo |
| Salir con cambios sin guardar | Confirmación, con opción de guardar |
| Cerrar sesión | Confirmación simple |

Para lo que **no** requiere decisión (guardado correcto, copiado al portapapeles, error de red recuperable), se usa un *toast* discreto, abajo a la derecha, que se va solo a los 4 segundos. No un modal.

### 5.2 Anatomía del modal

```
┌─────────────────────────────────────────┐
│                                      ✕  │
│  ¿Emitir la factura FAC-2026-0042?      │
│                                         │
│  Una vez emitida no se puede editar.    │
│  Si hay un error, habrá que anularla    │
│  y emitir una nueva.                    │
│                                         │
│  Total: $ 240.000                       │
│                                         │
│              [ Cancelar ]  [ Emitir ]   │
└─────────────────────────────────────────┘
```

- **El título es la pregunta**, con el nombre real del elemento. Nunca "¿Estás seguro?", que no dice nada.
- **El cuerpo explica la consecuencia**, no repite el título.
- **El botón confirma con el verbo de la acción:** *Emitir*, *Anular*, *Eliminar*. Nunca *Aceptar*.
- El botón de cancelar va a la izquierda y es el que recibe el foco al abrir.
- En acciones destructivas el botón de confirmar es rojo, y solo se habilita si el usuario escribe el motivo o el nombre del elemento.
- Mientras la acción se ejecuta, el botón muestra estado de carga y el modal no se puede cerrar.

### 5.3 Requisitos técnicos, no negociables

- Se implementan sobre una base accesible (`<dialog>` nativo o Radix UI Dialog). No se construye a mano con un `div` y `position: fixed`.
- El foco entra al modal al abrir, queda atrapado dentro, y **vuelve al elemento que lo abrió al cerrar**.
- `Esc` cierra. Clic fuera cierra, salvo en modales destructivos o con un formulario a medio llenar.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al título.
- El fondo de la página no hace scroll mientras el modal está abierto, y no salta al bloquearse.
- En móvil el modal sube desde abajo, ocupa el ancho completo, deja margen arriba y se puede cerrar arrastrando hacia abajo.
- Entrada de 150–200 ms, salida más rápida. Con `prefers-reduced-motion`, aparece sin animación.
- Un solo modal a la vez. Nunca un modal sobre otro.

---

## 6. SaaS / Panel de administración

Vive en `sas.jylartesgraficos.com`. Acceso solo con credenciales y rol autorizado.

### 6.1 Roles

| Rol | Puede |
|---|---|
| `admin` | Todo: pedidos, tienda, inventario, facturas, clientes, configuración |
| `operador` | Ver y actualizar pedidos, mover inventario. No ve finanzas ni configuración |
| `cliente` | Solo sus propios pedidos y facturas, desde el sitio público |

El rol se guarda como *custom claim* de Firebase Auth y se refleja en `users/{uid}.role`. Las reglas de seguridad leen el claim, nunca el documento del cliente. Los claims se asignan desde una Route Handler protegida con `firebase-admin`, porque no hay Cloud Functions.

### 6.2 Tablero

En una pantalla, sin scroll en escritorio: pedidos nuevos sin atender, pedidos en producción con entrega próxima, facturas por cobrar y total del mes, variantes bajo mínimo o agotadas, e ingresos del mes contra el anterior. Cada tarjeta lleva a su lista filtrada. Si un número aparece, se puede hacer clic en él.

Los números vienen de `stats/resumen`, no de contar colecciones.

### 6.3 Pedidos

- Lista con filtros por estado, tipo, cliente y fechas, y búsqueda por número o nombre.
- Tablero kanban por estado, con arrastrar y soltar, y alternativa por teclado.
- Detalle: datos del cliente, descripción, galería de referencias con visor en modal y descarga, historial de estados, notas internas y comentarios visibles para el cliente.
- Desde el pedido se arma la cotización con líneas (servicio o producto, cantidad, precio, descuento) y de ahí sale la factura.

### 6.4 Inventario

- **Productos** con sus variantes. El stock vive en la variante.
- Campos de variante: talla, color, SKU, stock, stock mínimo, costo unitario, precio de venta.
- Campos de producto: nombre, categoría, descripción, imágenes, proveedor, activo en tienda.
- **El stock nunca se edita a mano.** Se registran movimientos: entrada, salida, ajuste, merma. Cada uno guarda quién, cuándo, cuánto y por qué.
- El stock resultante se actualiza dentro de una transacción de Firestore, para que dos personas trabajando a la vez no lo descuadren.
- Alerta cuando `stock <= stockMinimo`, y marca de agotado en la tienda cuando llega a 0.
- Facturar una línea vinculada a una variante descuenta el stock automáticamente, previa confirmación en modal.
- También se lleva inventario de insumos sin venta directa (tinta, papel, vinilo), con las mismas reglas.

### 6.5 Facturación

- Consecutivo sin huecos (`FAC-2026-0001`), generado con transacción sobre `counters/{año}`.
- Datos del emisor y del cliente, líneas, subtotal, descuento, impuesto configurable, total.
- Estados: *Borrador → Emitida → Pagada → Anulada*. Una factura emitida no se edita; se anula con motivo registrado y se emite otra.
- PDF generado en el navegador (jsPDF o pdf-lib) con la identidad del estudio. No se paga un servicio para esto.
- Envío por correo al cliente con enlace de descarga.
- Registro de pagos: fecha, monto, método, parcial o total.

### 6.6 Clientes

Ficha con datos de contacto, historial de pedidos, facturas, total facturado y notas.

### 6.7 Tienda y portafolio desde el panel

El administrador crea y edita productos y proyectos del portafolio sin tocar código: subir imágenes, ordenar arrastrando, publicar o despublicar. Todo con confirmación en modal antes de despublicar o eliminar.

### 6.8 Configuración

WhatsApp, dirección, horarios, coordenadas del mapa, datos del emisor, impuesto, catálogo de servicios, plantillas de correo y textos legales.

---

## 7. Modelo de datos (Firestore)

```
users/{uid}
  nombre, email, telefono, ciudad, role, createdAt

services/{serviceId}
  nombre, categoria, descripcion, slug, activo, orden,
  requiereReferencias, requiereMedidas, campos[], precioBase

products/{productId}
  nombre, slug, categoria, descripcion, proveedor,
  imagenes[{publicId,url,ancho,alto,alt}],
  permitePersonalizacion, activo, orden, precioDesde,
  precioHasta, stockTotal, variantesBajoMinimo   // agregados que recalcula el servidor en cada movimiento

products/{productId}/variants/{variantId}
  talla, color, sku, stock, stockMinimo,
  costoUnitario, precioVenta, activo, orden

products/{productId}/variants/{variantId}/movements/{movementId}
  tipo, cantidad, motivo, orderId | null, autorUid, createdAt,
  delta, stockAnterior, stockNuevo, productId, variantId   // para auditar y consultar el historial del producto

supplies/{supplyId}
  nombre, sku, unidad, stock, stockMinimo, costoUnitario, proveedor

supplies/{supplyId}/movements/{movementId}
  tipo, cantidad, delta, stockAnterior, stockNuevo, motivo, insumoId, autorUid, createdAt

orders/{orderId}
  numero, tipo: 'servicio' | 'producto',
  uid | null, invitado{nombre,email,telefono,ciudad},
  serviceId | null,
  items[{productId,variantId,nombre,talla,color,cantidad,personalizado}],
  detalle, medidas, material, camposExtra{}, fechaDeseada, presupuestoAprox,
  archivos[{publicId,url,formato,bytes,ancho,alto}],
  archivosIncompletos,
  busqueda[],   // prefijos normalizados de nombre, correo y teléfono, para buscar desde el panel
  estado, prioridad, notasInternas, createdAt, updatedAt

orders/{orderId}/events/{eventId}
  tipo, estadoAnterior, estadoNuevo, autorUid, mensaje, createdAt

orders/{orderId}/messages/{messageId}
  autorUid, texto, visibleParaCliente, createdAt

invoices/{invoiceId}
  numero, orderId | null, clienteUid | null, clienteDatos{},
  lineas[{descripcion,cantidad,precioUnitario,variantId,descuento}],
  subtotal, descuento, impuesto, total, estado,
  emitidaEn, vencimientoEn, anulacion{motivo,autorUid,fecha},
  pagos[{fecha,monto,metodo}]

portfolio/{projectId}
  titulo, slug, categoria, cliente, descripcion,
  imagenes[{publicId,url,ancho,alto,alt}], destacado, orden, publicado

settings/general
  whatsapp, email, telefono,
  direccion{linea,barrio,ciudad,referencia,lat,lng},
  horarios[{dia,abre,cierra,cerrado}],
  redes{}, emisor{razonSocial,nit,direccion}, impuestoPorcentaje

stats/resumen
  pedidosNuevos, pedidosEnProduccion, porCobrar,
  ingresosMes, ingresosMesAnterior, variantesBajoMinimo, actualizadoEn

counters/{año}
  orders, invoices
```

### Reglas de seguridad — principios

1. Todo cerrado por defecto. Se abre lo mínimo.
2. Un cliente solo lee y escribe donde `uid` coincide con el suyo.
3. `role` nunca se escribe desde el cliente.
4. Inventario, facturas y configuración: solo `admin` u `operador` según corresponda.
5. Crear pedido está permitido a invitados, con validación de forma y tamaño.
6. Los totales de factura y el stock se recalculan en el servidor. Nunca se confía en el número que llega del cliente.
7. `products` y `portfolio` son de lectura pública solo cuando `activo` o `publicado` es verdadero.

---

## 8. Stack técnico

| Capa | Elección | Por qué |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components, buen SEO, Route Handlers en lugar de Cloud Functions. Versión estable actual al iniciar el proyecto (sep. 2026); SPEC.md originalmente fijaba la 15 |
| Lenguaje | TypeScript, modo estricto | Dos apps compartiendo datos |
| Estilos | Tailwind CSS | Rápido, y con tokens propios evita el aspecto de plantilla |
| Componentes base | Radix UI (sin estilos) | Modales, menús y selectores accesibles de verdad |
| Animación | Motion | Header, galería y pasos del formulario |
| Formularios | React Hook Form + Zod | Validación compartida cliente y servidor |
| Base de datos y auth | Firebase Spark | Gratuito |
| Imágenes | Cloudinary gratuito | Firebase Storage exige tarjeta |
| Datos en el panel | TanStack Query sobre listeners acotados | Caché y sincronización sin quemar cuota |
| Tablas | TanStack Table | Filtros, orden y paginación |
| PDF | jsPDF o pdf-lib, en el navegador | Sin servicio externo |
| Mapa | Leaflet + OpenStreetMap | Sin llave ni tarjeta |
| Correo | Resend gratuito | Confirmaciones y facturas |
| Hosting | Cloudflare Pages/Workers | Gratuito y permite uso comercial |
| Analítica | Cloudflare Web Analytics | Gratuita y sin cookies |

Estructura del repositorio (monorepo con Turborepo):

```
apps/web/        Sitio público  → jylartesgraficos.com
apps/panel/      SaaS           → sas.jylartesgraficos.com
packages/ui/     Componentes y tokens compartidos (incluye el sistema de modales)
packages/core/   Tipos, esquemas Zod, lógica de negocio, cliente Firebase
firestore.rules
```

---

## 9. Dirección de diseño

El sitio de un estudio gráfico se juzga por cómo se ve. Un diseño genérico es un argumento en contra del negocio.

**Principio rector:** el sitio es el marco, el trabajo es el cuadro. La interfaz es deliberadamente sobria para que las piezas del estudio sean lo único con color fuerte en pantalla.

**Color.** Base neutra profunda con un solo acento, usado poco y con intención: enlaces, estado activo y la acción principal. Nada de degradados decorativos.

**Tipografía.** Dos familias como máximo, claramente distintas. La de titulares se trata como elemento gráfico, con interletraje ajustado a mano en los títulos principales. Escala tipográfica definida. Nada de mayúsculas sostenidas en etiquetas ni de resaltar una sola palabra del titular en otro color.

**Rejilla.** Editorial y asimétrica, no tres tarjetas iguales en fila. Las piezas del portafolio conservan su proporción real.

**Movimiento.** Un momento orquestado en la carga de inicio. De ahí en adelante, el movimiento solo responde a acciones del usuario y muestra qué cambió: abrir una pieza, avanzar un paso, abrir un modal. Sin animaciones de entrada en cada sección al hacer scroll.

**Panel.** Densidad de información sobre aire decorativo. El administrador entra a trabajar. Tipografía más pequeña, filas compactas, teclado utilizable.

**Piso de calidad, no negociable:** responsive real desde 320 px, foco de teclado visible, contraste AA, `prefers-reduced-motion` respetado, texto alternativo en todas las imágenes.

---

## 10. Rendimiento y SEO

- Objetivo: LCP < 2,5 s, INP < 200 ms, CLS < 0,1 en móvil con 4G.
- Imágenes servidas por Cloudinary en AVIF/WEBP, con ancho y alto declarados y `sizes` correcto.
- El portafolio y la tienda se renderizan en el servidor y se revalidan. La primera carga no pide datos a Firestore desde el navegador.
- El mapa y la librería de PDF se cargan de forma diferida.
- Metadatos por página, Open Graph con imagen real de cada proyecto, `sitemap.xml` y `robots.txt`.
- Datos estructurados `LocalBusiness` con la dirección y los horarios, y `Product` en la tienda.
- El panel se excluye de la indexación.

---

## 11. Legal y confianza

- **Términos y condiciones:** alcance de los servicios, que un pedido es una solicitud y no una compra, plazos, propiedad intelectual de los diseños, política de revisiones, condiciones de pago, y condiciones de los productos físicos (cambios, garantías, disponibilidad).
- **Política de privacidad y tratamiento de datos:** qué se recoge, para qué, cuánto se guarda, cómo pedir borrado. Ajustada a la Ley 1581 de 2012 si el estudio opera en Colombia.
- Casilla de aceptación explícita en el formulario, sin premarcar.
- Datos de contacto y dirección reales en el pie de página.

> Estos textos deben ser revisados por un abogado antes de publicarse. Lo que se entregue en el repositorio son borradores de trabajo, no asesoría legal.

---

## 12. Fases

**Fase 1 — Base.** Monorepo, tokens de diseño, sistema de modales, header, proyecto Firebase, reglas de seguridad, autenticación, cuenta de Cloudinary.

**Fase 2 — Sitio público.** Inicio, portafolio, servicios, tienda, nosotros, contacto con mapa, WhatsApp, textos legales, formulario de pedido completo con subida de imágenes.

**Fase 3 — SaaS.** Tablero, pedidos con kanban, productos y variantes, inventario con movimientos, facturación con PDF y correo, clientes, configuración.

**Fase 4 — Pulido y extras.** Cuenta de cliente con aprobación de cotizaciones, reportes exportables, facturación electrónica oficial, notificaciones.

---

## 13. Criterios de aceptación

- [ ] Un visitante envía un pedido con 5 imágenes desde un móvil en menos de 2 minutos y recibe su número.
- [ ] Un visitante pide una camiseta negra talla M desde la tienda y el pedido llega con la variante correcta.
- [ ] Una variante agotada aparece deshabilitada en la tienda, no oculta.
- [ ] El administrador ve el pedido nuevo en el panel en menos de 5 segundos, sin recargar.
- [ ] Genera la factura desde el pedido, la descarga en PDF y la envía en menos de 1 minuto.
- [ ] Registrar una salida de inventario descuenta el stock correctamente con dos operadores actuando a la vez.
- [ ] Ninguna acción usa `alert()` ni `confirm()`. Todas las confirmaciones son modales, cerrables con Esc y navegables con teclado.
- [ ] Un cliente autenticado no puede leer el pedido de otro, comprobado con pruebas de reglas.
- [ ] El mapa muestra la ubicación correcta y el botón de cómo llegar abre la app de mapas.
- [ ] Lighthouse móvil: rendimiento ≥ 90, accesibilidad ≥ 95 en el sitio público.
- [ ] Todo funciona a 320 px sin scroll horizontal.
- [ ] **Costo mensual de infraestructura: $0**, con el dominio como único gasto.

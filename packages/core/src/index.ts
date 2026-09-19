export { getFirebase } from "./firebase/client";
export { usarEmuladores } from "./firebase/env";
export type { ConfigCliente } from "./firebase/env";

export { rolSchema, esPersonal, esAdmin, rolDesdeClaims } from "./auth/roles";
export type { Rol, RolDelPersonal } from "./auth/roles";

// Seguro en el cliente: ni credenciales ni firma, solo límites y URLs.
export {
  MAX_ARCHIVOS_POR_PEDIDO,
  MAX_BYTES_POR_ARCHIVO,
  FORMATOS_PERMITIDOS,
  CARPETAS,
  formatoPermitido,
  revisarArchivo,
} from "./cloudinary/limites";
export type { FormatoPermitido, Carpeta, ProblemaDeArchivo } from "./cloudinary/limites";
export { urlDeImagen, srcSetDeImagen, miniaturaDesdeUrl, urlDeDescarga } from "./cloudinary/url";
export type { OpcionesDeImagen } from "./cloudinary/url";

// Los esquemas los comparten formulario y servidor: misma validación en los
// dos lados, escrita una sola vez (AGENTS.md §9).
export {
  ESTADOS_PEDIDO,
  estadoPedidoSchema,
  invitadoSchema,
  itemPedidoSchema,
  pedidoEntranteSchema,
  NOMBRE_ESTADO,
  NOMBRE_CAMPO_EXTRA,
  cambioEstadoSchema,
  notasInternasSchema,
} from "./pedidos/esquemas";
export type { CambioEstado, EstadoPedido, Invitado, PedidoEntrante } from "./pedidos/esquemas";
export { formatearNumeroPedido } from "./pedidos/numeracion";
export {
  CATEGORIAS_SERVICIO,
  NOMBRE_CATEGORIA,
  esCategoriaServicio,
} from "./pedidos/servicios";
export type { CategoriaServicio, Servicio } from "./pedidos/servicios";

export {
  DIAS_SEMANA,
  NOMBRE_DIA,
  CONFIGURACION_VACIA,
  configuracionSchema,
  horarioSchema,
  normalizarWhatsapp,
} from "./configuracion/esquemas";
export type {
  Configuracion,
  ConfiguracionEntrante,
  DiaSemana,
  Horario,
} from "./configuracion/esquemas";

export { slugDe } from "./catalogo/slug";
export { servicioEditableSchema, ordenServiciosSchema } from "./servicios/esquemas";
export type {
  ServicioDelPanel,
  ServicioEditable,
  ServicioEditableEntrante,
} from "./servicios/esquemas";
export type {
  ArchivoDelPedido,
  ContactoDelPedido,
  EventoDelPedido,
  FilaPedido,
  PaginaDePedidos,
  PedidoDelPanel,
} from "./pedidos/tipos-panel";

export {
  TIPOS_MOVIMIENTO,
  NOMBRE_MOVIMIENTO,
  calcularMovimiento,
  estadoDeStock,
} from "./inventario/stock";
export type { TipoMovimiento } from "./inventario/stock";
export {
  MAX_IMAGENES_PRODUCTO,
  productoEditableSchema,
  varianteEditableSchema,
  varianteNuevaSchema,
  movimientoSchema,
  insumoEditableSchema,
} from "./inventario/esquemas";
export type { ProductoEditable, VarianteEditable, Movimiento, InsumoEditable } from "./inventario/esquemas";
export { nombreDeVariante } from "./inventario/tipos";
export type {
  ImagenGuardada,
  VarianteDelPanel,
  ProductoDelPanel,
  ProductoConVariantes,
  MovimientoDelPanel,
  InsumoDelPanel,
  VarianteParaVender,
} from "./inventario/tipos";

export { pedirPermiso, subirACloudinary } from "./cloudinary/subir-desde-navegador";
export type { PermisoDeSubidaNavegador, RespuestaCloudinary } from "./cloudinary/subir-desde-navegador";

export { MAX_IMAGENES_PROYECTO, proyectoEditableSchema } from "./portafolio/esquemas";
export type { ProyectoEditable, ProyectoDelPanel } from "./portafolio/esquemas";

export {
  ESTADOS_FACTURA,
  NOMBRE_ESTADO_FACTURA,
  METODOS_PAGO,
  NOMBRE_METODO_PAGO,
  MAX_LINEAS_FACTURA,
  lineaFacturaSchema,
  clienteFacturaSchema,
  borradorFacturaSchema,
  pagoSchema,
  anulacionSchema,
} from "./facturas/esquemas";
export type {
  EstadoFactura,
  MetodoPago,
  LineaFactura,
  ClienteFactura,
  BorradorFactura,
  BorradorFacturaEntrante,
  Pago,
} from "./facturas/esquemas";
export { calcularTotales, totalDeLinea, saldoPendiente, formatearNumeroFactura } from "./facturas/calculo";
export type { Totales } from "./facturas/calculo";
export type { EmisorFactura, PagoDeFactura, FilaFactura, FacturaDelPanel } from "./facturas/tipos";

export { normalizarTexto } from "./pedidos/busqueda";

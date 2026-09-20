// Punto de entrada solo para el servidor: aquí está lo que toca la cuenta de
// servicio. Importarlo desde un componente de cliente rompe la compilación a
// propósito (AGENTS.md §6).
export { getFirebaseAdmin } from "./firebase/admin";
export { leerConfigAdmin } from "./firebase/env";
export type { ConfigAdmin } from "./firebase/env";

export { crearCookieSesion, leerSesion, cookieDeCierre, COOKIE_SESION } from "./auth/session";
export type { Sesion, CookieSesion } from "./auth/session";

export { leerConfigCloudinary } from "./cloudinary/env";
export type { ConfigCloudinary } from "./cloudinary/env";
export { crearPermisoDeSubida, firmarParametros } from "./cloudinary/firma";
export type { PermisoDeSubida } from "./cloudinary/firma";
export { verificarSubida, borrarSubida } from "./cloudinary/verificar";
export type { ArchivoSubido, ResultadoVerificacion } from "./cloudinary/verificar";

export { crearPedido } from "./pedidos/crear";
export type { AutorDelPedido, PedidoCreado } from "./pedidos/crear";
export { siguienteNumeroDePedido } from "./pedidos/numeracion";
export { leerServiciosActivos } from "./pedidos/leer-servicios";

export { leerConfiguracion, guardarConfiguracion } from "./configuracion/servidor";
export {
  listarServiciosDelPanel,
  leerServicioDelPanel,
  crearServicio,
  actualizarServicio,
  reordenarServicios,
} from "./servicios/servidor";

export { leerContactoCliente, leerContactosClientes } from "./clientes/perfil";
export type { ContactoCliente } from "./clientes/perfil";

export {
  PEDIDOS_POR_PAGINA,
  listarPedidos,
  tableroDePedidos,
  PEDIDOS_POR_COLUMNA,
  buscarPedidos,
  leerPedidoDelPanel,
  cambiarEstadoPedido,
  guardarNotasInternas,
} from "./pedidos/panel";
export type { FiltroPedidos, ResultadoCambioEstado } from "./pedidos/panel";

export { ETIQUETAS_CACHE, avisarAlSitio, secretoValido } from "./cache/revalidacion";
export type { EtiquetaCache } from "./cache/revalidacion";

export {
  PRODUCTOS_POR_PAGINA,
  ErrorDeInventario,
  listarProductos,
  leerProducto,
  crearProducto,
  actualizarProducto,
  moverProducto,
  eliminarProducto,
  crearVariante,
  actualizarVariante,
  registrarMovimientoVariante,
  movimientosDeProducto,
  listarInsumos,
  leerInsumo,
  crearInsumo,
  actualizarInsumo,
  registrarMovimientoInsumo,
  movimientosDeInsumo,
  categoriasDeProductos,
  variantesParaVender,
} from "./inventario/servidor";
export type { ResultadoRegistro } from "./inventario/servidor";

export { ErrorDeCatalogo } from "./catalogo/imagenes";
export {
  PROYECTOS_POR_PAGINA,
  listarProyectos,
  leerProyecto,
  crearProyecto,
  actualizarProyecto,
  moverProyecto,
  eliminarProyecto,
  categoriasDeProyectos,
} from "./portafolio/servidor";

export {
  FACTURAS_POR_PAGINA,
  listarFacturas,
  facturasDePedido,
  leerFactura,
  borradorDesdePedido,
  crearBorrador,
  actualizarBorrador,
  eliminarBorrador,
  emitirFactura,
  anularFactura,
  registrarPago,
} from "./facturas/servidor";
export type { Resultado as ResultadoFactura } from "./facturas/servidor";

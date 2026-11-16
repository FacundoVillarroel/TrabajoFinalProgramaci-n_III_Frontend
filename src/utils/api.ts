import type { Categoria } from "../types/Categoria";
import type { Producto } from "../types/Producto";
import type { Usuario, UsuarioConCredenciales } from "../types/Usuario";
import type { EstadoPedido, FormaPago, Pedido } from "../types/Pedido";

// Estas interfaces describen el formato original de los JSON de la cátedra.
interface CategoriaJson {
  id: number;
  nombre: string;
  descripcion: string;
  imagen?: string;
  eliminado?: boolean;
}

interface ProductoJson {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
  disponible: boolean;
  eliminado?: boolean;
  categoria: CategoriaJson;
}

interface DetallePedidoJson {
  cantidad: number;
  subtotal: number;
  producto: ProductoJson;
}

interface PedidoJson {
  id: number;
  fecha: string;
  estado: string;
  total: number;
  formaPago: FormaPago;
  detalles: DetallePedidoJson[];
  usuarioDto: Usuario;
}

async function cargarArchivo(nombre: string): Promise<Response> {
  const respuesta = await fetch(`/data/${nombre}.json`);

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${nombre}. Código ${respuesta.status}.`);
  }

  return respuesta;
}

function adaptarEstado(estado: string): EstadoPedido {
  // Se unifica el formato de los estados.
  switch (estado) {
    case "PENDIENTE":
      return "PENDIENTE";

    case "CONFIRMADO":
    case "EN_PREPARACION":
      return "CONFIRMADO";

    case "TERMINADO":
    case "ENTREGADO":
      return "TERMINADO";

    case "CANCELADO":
      return "CANCELADO";

    default:
      throw new Error(`Estado de pedido desconocido: ${estado}.`);
  }
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  const respuesta = await cargarArchivo("categorias");
  const datos = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error("El archivo categorias.json debe contener una lista.");
  }

  // La conversión informa el tipo a TypeScript, sin validar cada campo.
  const categorias = datos as CategoriaJson[];

  return categorias.map((categoria) => ({
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion,
    imagen: categoria.imagen ?? "",
    eliminado: categoria.eliminado ?? false
  }));
}

export async function obtenerProductos(): Promise<Producto[]> {
  const respuesta = await cargarArchivo("productos");
  const datos = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error("El archivo productos.json debe contener una lista.");
  }

  const productos = datos as ProductoJson[];

  // Convertimos la categoría anidada del JSON en el identificador que usamos.
  return productos.map((producto) => ({
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    stock: producto.stock,
    imagen: producto.imagen,
    disponible: producto.disponible,
    eliminado: producto.eliminado ?? false,
    categoriaId: producto.categoria.id
  }));
}

export async function obtenerUsuarios(): Promise<UsuarioConCredenciales[]> {
  const respuesta = await cargarArchivo("usuarios");
  const datos = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error("El archivo usuarios.json debe contener una lista.");
  }

  return datos as UsuarioConCredenciales[];
}

export async function obtenerPedidos(): Promise<Pedido[]> {
  const respuesta = await cargarArchivo("pedidos");
  const datos = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error("El archivo pedidos.json debe contener una lista.");
  }

  const pedidos = datos as PedidoJson[];

  return pedidos.map((pedido) => {
    const detalles = pedido.detalles.map((detalle) => {
      if (!Number.isInteger(detalle.cantidad) || detalle.cantidad <= 0) {
        throw new Error(`El pedido ${pedido.id} tiene una cantidad inválida.`);
      }

      return {
        idProducto: detalle.producto.id,
        nombre: detalle.producto.nombre,
        imagen: detalle.producto.imagen,
        // El subtotal original permite recuperar el precio de esa compra.
        precioUnitario: detalle.subtotal / detalle.cantidad,
        cantidad: detalle.cantidad,
        subtotal: detalle.subtotal
      };
    });

    let subtotal = 0;

    for (const detalle of detalles) {
      subtotal += detalle.subtotal;
    }

    return {
      id: pedido.id,
      fecha: pedido.fecha,
      estado: adaptarEstado(pedido.estado),
      formaPago: pedido.formaPago,
      idUsuario: pedido.usuarioDto.id,
      nombreCliente:
        `${pedido.usuarioDto.nombre} ${pedido.usuarioDto.apellido}`.trim(),
      telefono: pedido.usuarioDto.celular ?? "",
      detalles,
      subtotal,
      // Los pedidos de prueba ya tienen su total calculado sin envío.
      envio: 0,
      total: pedido.total,
    };
  });
}
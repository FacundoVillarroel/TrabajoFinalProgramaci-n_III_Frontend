import type { Usuario } from "../types/Usuario";
import type { DetallePedido, FormaPago, Pedido } from "../types/Pedido";
import { COSTO_ENVIO } from "../config";
import { obtenerPedidos, obtenerProductos } from "./api";
import {
  eliminarCarrito,
  guardarPedidos,
  leerCarrito,
  leerPedidos,
} from "./storage";

export async function obtenerTodosLosPedidos(): Promise<Pedido[]> {
  const pedidosJson = await obtenerPedidos();
  const pedidosLocales = leerPedidos();

  return [...pedidosJson, ...pedidosLocales];
}

export async function crearPedido(
  usuario: Usuario,
  telefono: string,
  formaPago: FormaPago,
): Promise<Pedido> {
  if (usuario.rol !== "USUARIO") {
    throw new Error("La compra está disponible para los clientes.");
  }

  const telefonoLimpio = telefono.trim();

  if (!telefonoLimpio) {
    throw new Error("Ingresá un teléfono de contacto.");
  }

  if (
    formaPago !== "TARJETA" &&
    formaPago !== "TRANSFERENCIA" &&
    formaPago !== "EFECTIVO"
  ) {
    throw new Error("Seleccioná una forma de pago válida.");
  }

  const carrito = leerCarrito(usuario.id);

  if (carrito.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  // Consulta el catálogo nuevamente antes de generar el pedido.
  const productos = await obtenerProductos();
  const detalles: DetallePedido[] = [];
  let subtotal = 0;

  for (const item of carrito) {
    const producto = productos.find((actual) => actual.id === item.idProducto);

    if (!producto || producto.eliminado || !producto.disponible) {
      throw new Error(
        `${item.nombre} ya no está disponible. Quitalo del carrito.`,
      );
    }

    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new Error(`La cantidad de ${item.nombre} es inválida.`);
    }

    if (item.cantidad > producto.stock) {
      throw new Error(
        `${producto.nombre} tiene ${producto.stock} unidades disponibles.`,
      );
    }

    // Evita confirmar un importe diferente del que el cliente estaba viendo.
    if (item.precioUnitario !== producto.precio) {
      throw new Error(
        `Cambió el precio de ${producto.nombre}. Recargá el carrito para actualizarlo.`,
      );
    }

    const subtotalDetalle =
      Math.round(producto.precio * item.cantidad * 100) / 100;

    detalles.push({
      idProducto: producto.id,
      nombre: producto.nombre,
      imagen: producto.imagen,
      precioUnitario: producto.precio,
      cantidad: item.cantidad,
      subtotal: subtotalDetalle,
    });

    subtotal += subtotalDetalle;
  }

  subtotal = Math.round(subtotal * 100) / 100;

  const pedidosJson = await obtenerPedidos();
  const pedidosLocales = leerPedidos();
  const pedidosExistentes = [...pedidosJson, ...pedidosLocales];

  let id = Date.now();

  for (const pedido of pedidosExistentes) {
    if (pedido.id >= id) {
      id = pedido.id + 1;
    }
  }

  const pedido: Pedido = {
    id,
    fecha: new Date().toISOString(),
    estado: "PENDIENTE",
    formaPago,
    idUsuario: usuario.id,
    telefono: telefonoLimpio,
    detalles,
    subtotal,
    envio: COSTO_ENVIO,
    total: Math.round((subtotal + COSTO_ENVIO) * 100) / 100,
  };

  // Guarda primero el pedido. Si falla el almacenamiento, conserva el carrito.
  guardarPedidos([...pedidosLocales, pedido]);
  eliminarCarrito(usuario.id);

  return pedido;
}

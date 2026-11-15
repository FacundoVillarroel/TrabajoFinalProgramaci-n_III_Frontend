import type { ItemCarrito } from "../types/Carrito";
import type { Producto } from "../types/Producto";
import { eliminarCarrito, guardarCarrito, leerCarrito } from "./storage";

export function obtenerCarrito(idUsuario: number): ItemCarrito[] {
  return leerCarrito(idUsuario);
}

export function obtenerCantidadCarrito(idUsuario: number): number {
  const carrito = obtenerCarrito(idUsuario);
  let cantidad = 0;

  // El contador representa unidades, incluyendo las repetidas de cada producto.
  for (const item of carrito) {
    cantidad += item.cantidad;
  }

  return cantidad;
}

export function obtenerSubtotalCarrito(idUsuario: number): number {
  const carrito = obtenerCarrito(idUsuario);
  let subtotal = 0;

  for (const item of carrito) {
    subtotal += item.precioUnitario * item.cantidad;
  }

  return subtotal;
}

function validarCantidad(producto: Producto, cantidad: number): void {
  if (producto.eliminado || !producto.disponible) {
    throw new Error("El producto no está disponible.");
  }

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un número entero mayor a cero.");
  }

  if (cantidad > producto.stock) {
    throw new Error(`El stock disponible es de ${producto.stock} unidades.`);
  }
}

export function agregarAlCarrito(
  idUsuario: number,
  producto: Producto,
  cantidad: number,
): void {
  const carrito = obtenerCarrito(idUsuario);
  const item = carrito.find((actual) => actual.idProducto === producto.id);

  let cantidadTotal = cantidad;

  if (item) {
    cantidadTotal += item.cantidad;
  }

  // Valida tanto la cantidad ingresada como la suma con las unidades existentes.
  validarCantidad(producto, cantidad);
  validarCantidad(producto, cantidadTotal);

  if (item) {
    item.cantidad = cantidadTotal;
    item.nombre = producto.nombre;
    item.imagen = producto.imagen;
    item.precioUnitario = producto.precio;
  } else {
    carrito.push({
      idProducto: producto.id,
      nombre: producto.nombre,
      imagen: producto.imagen,
      precioUnitario: producto.precio,
      cantidad,
    });
  }

  guardarCarrito(idUsuario, carrito);
}

export function actualizarCantidadCarrito(
  idUsuario: number,
  producto: Producto,
  cantidad: number,
): void {
  validarCantidad(producto, cantidad);

  const carrito = obtenerCarrito(idUsuario);
  const item = carrito.find((actual) => actual.idProducto === producto.id);

  if (!item) {
    throw new Error("El producto no está en el carrito.");
  }

  // La cantidad recibida reemplaza la anterior.
  item.cantidad = cantidad;
  item.nombre = producto.nombre;
  item.imagen = producto.imagen;
  item.precioUnitario = producto.precio;

  guardarCarrito(idUsuario, carrito);
}

export function quitarDelCarrito(idUsuario: number, idProducto: number): void {
  const carrito = obtenerCarrito(idUsuario);
  const actualizado = carrito.filter((item) => item.idProducto !== idProducto);

  guardarCarrito(idUsuario, actualizado);
}

export function vaciarCarrito(idUsuario: number): void {
  eliminarCarrito(idUsuario);
}

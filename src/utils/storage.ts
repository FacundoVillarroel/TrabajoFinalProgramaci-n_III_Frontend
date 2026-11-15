import type { Usuario } from "../types/Usuario";
import type { ItemCarrito } from "../types/Carrito";
import type { Pedido } from "../types/Pedido";

const SESION_KEY = "foodstore.sesion";
const CARRITO_KEY = "foodstore.carrito";
const PEDIDOS_KEY = "foodstore.pedidos";

export function leerSesion(): Usuario | null {
  const contenido = localStorage.getItem(SESION_KEY);

  if (contenido === null) {
    return null;
  }

  try {
    const usuario = JSON.parse(contenido) as Usuario | null;

    // JSON.parse puede devolver otros valores. Revisamos los campos de sesión.
    if (
      usuario === null ||
      typeof usuario !== "object" ||
      !Number.isInteger(usuario.id) ||
      usuario.id <= 0 ||
      typeof usuario.nombre !== "string" ||
      typeof usuario.apellido !== "string" ||
      typeof usuario.mail !== "string" ||
      typeof usuario.celular !== "string" ||
      (usuario.rol !== "ADMIN" && usuario.rol !== "USUARIO")
    ) {
      localStorage.removeItem(SESION_KEY);
      return null;
    }

    return usuario;
  } catch {
    // Si el texto guardado está corrupto, se descarta la sesión.
    localStorage.removeItem(SESION_KEY);
    return null;
  }
}

export function guardarSesion(usuario: Usuario): void {
  // Elegimos los campos explícitamente para excluir cualquier contraseña.
  const sesion: Usuario = {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    mail: usuario.mail,
    celular: usuario.celular,
    rol: usuario.rol
  };

  localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
}

export function eliminarSesion(): void {
  localStorage.removeItem(SESION_KEY);
}

export function leerCarrito(idUsuario: number): ItemCarrito[] {
  // Por ejemplo, el usuario 2 usa la clave "foodstore.carrito.2".
  const clave = `${CARRITO_KEY}.${idUsuario}`;
  const contenido = localStorage.getItem(clave);

  if (contenido === null) {
    return [];
  }

  try {
    const carrito = JSON.parse(contenido);

    if (!Array.isArray(carrito)) {
      localStorage.removeItem(clave);
      return [];
    }

    return carrito as ItemCarrito[];
  } catch {
    localStorage.removeItem(clave);
    return [];
  }
}

export function guardarCarrito(idUsuario: number, carrito: ItemCarrito[]): void {
  const clave = `${CARRITO_KEY}.${idUsuario}`;
  localStorage.setItem(clave, JSON.stringify(carrito));
}

export function eliminarCarrito(idUsuario: number): void {
  const clave = `${CARRITO_KEY}.${idUsuario}`;
  localStorage.removeItem(clave);
}

export function leerPedidos(): Pedido[] {
  const contenido = localStorage.getItem(PEDIDOS_KEY);

  if (contenido === null) {
    return [];
  }

  try {
    const pedidos = JSON.parse(contenido);

    if (!Array.isArray(pedidos)) {
      localStorage.removeItem(PEDIDOS_KEY);
      return [];
    }

    return pedidos as Pedido[];
  } catch {
    localStorage.removeItem(PEDIDOS_KEY);
    return [];
  }
}

export function guardarPedidos(pedidos: Pedido[]): void {
  // Guarda los pedidos creados en el navegador. El JSON original sigue aparte.
  localStorage.setItem(PEDIDOS_KEY, JSON.stringify(pedidos));
}
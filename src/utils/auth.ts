import type { Rol, Usuario, UsuarioConCredenciales } from "../types/Usuario";
import { obtenerUsuarios } from "./api";
import { eliminarSesion, guardarSesion, leerSesion } from "./storage";

interface DatosRegistro {
  nombre: string;
  mail: string;
  password: string;
}

export const RUTAS = {
  login: "/src/pages/auth/login/login.html",
  registro: "/src/pages/auth/register/register.html",
  tienda: "/src/pages/store/home/home.html",
  admin: "/src/pages/admin/adminHome/adminHome.html"
};

// El registro es temporal, como establece esta iteración de la consigna.
// La lista se pierde al recargar o cambiar de página.
const usuariosRegistrados: UsuarioConCredenciales[] = [];

function normalizarMail(mail: string): string {
  return mail.trim().toLowerCase();
}

export function obtenerSesion(): Usuario | null {
  return leerSesion();
}

export async function iniciarSesion(mail: string, password: string): Promise<Usuario> {
  const mailNormalizado = normalizarMail(mail);

  if (!mailNormalizado || !password) {
    throw new Error("Completá el email y la contraseña.");
  }

  const usuariosJson = await obtenerUsuarios();
  const usuarios = [...usuariosJson, ...usuariosRegistrados];

  const usuario = usuarios.find(
    (actual) =>
      normalizarMail(actual.mail) === mailNormalizado &&
      actual.password === password
  );

  if (!usuario) {
    throw new Error("Email o contraseña incorrectos.");
  }

  guardarSesion(usuario);

  // Recuperamos la sesión para devolver los datos sin la contraseña.
  const sesion = obtenerSesion();

  if (!sesion) {
    throw new Error("No se pudo iniciar la sesión.");
  }

  return sesion;
}

export async function registrarUsuario(datos: DatosRegistro): Promise<Usuario> {
  const nombre = datos.nombre.trim();
  const mail = normalizarMail(datos.mail);
  const password = datos.password;

  if (!nombre || !mail || !password) {
    throw new Error("Completá todos los campos.");
  }

  // Comprueba un formato básico: texto, arroba, dominio y extensión.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    throw new Error("Ingresá un email válido.");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const usuariosJson = await obtenerUsuarios();
  const usuarios = [...usuariosJson, ...usuariosRegistrados];

  const existe = usuarios.some(
    (usuario) => normalizarMail(usuario.mail) === mail
  );

  if (existe) {
    throw new Error("Ya existe un usuario con ese email.");
  }

  // La fecha en milisegundos permite generar IDs para los registros temporales.
  let id = Date.now();

  for (const usuario of usuarios) {
    if (usuario.id >= id) {
      id = usuario.id + 1;
    }
  }

  const nuevoUsuario: UsuarioConCredenciales = {
    id,
    nombre,
    apellido: "",
    mail,
    celular: "",
    password,
    rol: "USUARIO"
  };

  // El registro inicia sesión automáticamente, sin guardar la contraseña.
  guardarSesion(nuevoUsuario);

  const sesion = obtenerSesion();

  if (!sesion) {
    throw new Error("No se pudo iniciar la sesión del usuario registrado.");
  }

  usuariosRegistrados.push(nuevoUsuario);
  return sesion;
}

export function redirigirPorRol(usuario: Usuario): void {
  if (usuario.rol === "ADMIN") {
    window.location.replace(RUTAS.admin);
    return;
  }

  window.location.replace(RUTAS.tienda);
}

export function requerirSesion(rolesPermitidos: Rol[]): Usuario | null {
  const usuario = obtenerSesion();

  if (!usuario) {
    window.location.replace(RUTAS.login);
    return null;
  }

  if (!rolesPermitidos.includes(usuario.rol)) {
    redirigirPorRol(usuario);
    return null;
  }

  return usuario;
}

export function cerrarSesion(): void {
  eliminarSesion();
  window.location.replace(RUTAS.login);
}
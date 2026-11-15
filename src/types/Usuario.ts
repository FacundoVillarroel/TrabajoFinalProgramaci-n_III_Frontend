export type Rol = "ADMIN" | "USUARIO";

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  mail: string;
  celular: string;
  rol: Rol;
}

export interface UsuarioConCredenciales extends Usuario {
  password: string;
}
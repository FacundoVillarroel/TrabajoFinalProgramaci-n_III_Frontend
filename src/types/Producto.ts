export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
  disponible: boolean; /* permite habilitar o deshabilitar el producto */
  eliminado: boolean; /* permite dar la baja lógica al producto */
  categoriaId: number;
}
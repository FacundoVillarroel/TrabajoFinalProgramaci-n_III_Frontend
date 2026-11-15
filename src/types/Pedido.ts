export type EstadoPedido =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "TERMINADO"
  | "CANCELADO";

export type FormaPago = "TARJETA" | "TRANSFERENCIA" | "EFECTIVO";

export interface DetallePedido {
  idProducto: number;
  nombre: string;
  imagen: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  fecha: string;
  estado: EstadoPedido;
  formaPago: FormaPago;
  idUsuario: number;
  telefono: string;
  detalles: DetallePedido[];
  subtotal: number;
  envio: number;
  total: number;
}
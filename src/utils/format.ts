export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(precio);
}

export function formatearFecha(fecha: string): string {
  // Las fechas sin hora se interpretan como locales para evitar cambios de día.
  const valor = fecha.length === 10 ? `${fecha}T00:00:00` : fecha;
  const fechaPedido = new Date(valor);

  if (Number.isNaN(fechaPedido.getTime())) {
    return "Fecha no disponible";
  }

  return fechaPedido.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

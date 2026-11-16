import type { EstadoPedido, Pedido } from "../types/Pedido";
import { formatearFecha, formatearPrecio } from "./format";

export function crearBadgeEstado(estado: EstadoPedido): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = "inline-block rounded-full px-3 py-1 text-sm font-bold";

  switch (estado) {
    case "PENDIENTE":
      badge.textContent = "Pendiente";
      badge.classList.add("bg-orange-100", "text-orange-800");
      break;

    case "CONFIRMADO":
      badge.textContent = "Confirmado";
      badge.classList.add("bg-blue-100", "text-blue-800");
      break;

    case "TERMINADO":
      badge.textContent = "Terminado";
      badge.classList.add("bg-green-100", "text-green-800");
      break;

    case "CANCELADO":
      badge.textContent = "Cancelado";
      badge.classList.add("bg-red-100", "text-red-800");
      break;
  }

  return badge;
}

export function mostrarDetallePedido(pedido: Pedido): void {
  const modal = document.createElement("dialog");

  modal.className =
    "m-auto max-h-[90vh] w-11/12 max-w-2xl overflow-y-auto rounded-xl border border-border bg-white p-6 text-text shadow-card backdrop:bg-black/50";

  // La estructura es fija. Los datos del pedido se incorporan con textContent.
  modal.innerHTML = `
    <div class="flex items-start justify-between gap-4">
      <h2 class="order-title min-w-0 break-words"></h2>
      <button type="button" class="secondary-button close-button">Cerrar</button>
    </div>

    <div class="order-status"></div>

    <dl class="my-5 grid gap-3 sm:grid-cols-2">
      <div>
        <dt class="font-bold">Fecha</dt>
        <dd class="order-date"></dd>
      </div>
      <div>
        <dt class="font-bold">Forma de pago</dt>
        <dd class="order-payment"></dd>
      </div>
      <div>
        <dt class="font-bold">Teléfono de contacto</dt>
        <dd class="order-phone"></dd>
      </div>
    </dl>

    <h3 class="mb-4 text-lg font-bold">Productos</h3>
    <ul class="order-items space-y-4"></ul>

    <dl class="mt-6 space-y-3 border-t border-border pt-4">
      <div class="flex justify-between gap-4">
        <dt>Subtotal</dt>
        <dd class="order-subtotal"></dd>
      </div>
      <div class="flex justify-between gap-4">
        <dt>Envío</dt>
        <dd class="order-shipping"></dd>
      </div>
      <div class="flex justify-between gap-4 text-lg font-bold">
        <dt>Total</dt>
        <dd class="order-total"></dd>
      </div>
    </dl>
  `;

  const titulo = modal.querySelector(".order-title") as HTMLHeadingElement;
  const estado = modal.querySelector(".order-status") as HTMLDivElement;
  const fecha = modal.querySelector(".order-date") as HTMLElement;
  const pago = modal.querySelector(".order-payment") as HTMLElement;
  const telefono = modal.querySelector(".order-phone") as HTMLElement;
  const lista = modal.querySelector(".order-items") as HTMLUListElement;
  const subtotal = modal.querySelector(".order-subtotal") as HTMLElement;
  const envio = modal.querySelector(".order-shipping") as HTMLElement;
  const total = modal.querySelector(".order-total") as HTMLElement;
  const cerrar = modal.querySelector(".close-button") as HTMLButtonElement;

  titulo.id = "order-detail-title";
  titulo.textContent = `Pedido #${pedido.id}`;
  modal.setAttribute("aria-labelledby", titulo.id);

  estado.appendChild(crearBadgeEstado(pedido.estado));
  fecha.textContent = formatearFecha(pedido.fecha);
  pago.textContent = pedido.formaPago;
  telefono.textContent = pedido.telefono || "No informado";
  subtotal.textContent = formatearPrecio(pedido.subtotal);
  envio.textContent = formatearPrecio(pedido.envio);
  total.textContent = formatearPrecio(pedido.total);

  for (const detalle of pedido.detalles) {
    const elemento = document.createElement("li");
    elemento.className = "flex items-start gap-4 border-b border-border pb-4";

    const imagen = document.createElement("img");
    imagen.src = detalle.imagen;
    imagen.alt = detalle.nombre;
    imagen.className = "h-16 w-16 rounded-md object-cover";
    imagen.loading = "lazy";

    const informacion = document.createElement("div");
    informacion.className = "min-w-0 flex-1";

    const nombre = document.createElement("p");
    nombre.className = "my-0 font-bold";
    nombre.textContent = detalle.nombre;

    const cantidad = document.createElement("p");
    cantidad.className = "my-1 text-sm";
    cantidad.textContent =
      `${detalle.cantidad} × ${formatearPrecio(detalle.precioUnitario)}`;

    const importe = document.createElement("p");
    importe.className = "my-0 font-bold";
    importe.textContent = formatearPrecio(detalle.subtotal);

    informacion.append(nombre, cantidad, importe);
    elemento.append(imagen, informacion);
    lista.appendChild(elemento);
  }

  cerrar.addEventListener("click", () => modal.close());

  // Elimina el modal al cerrarlo, tanto con el botón como con Escape.
  modal.addEventListener("close", () => modal.remove());

  document.body.appendChild(modal);

  // showModal bloquea la interacción con el fondo y mantiene el foco en el diálogo.
  modal.showModal();
}
import type { Pedido } from "../../../types/Pedido";
import { requerirSesion } from "../../../utils/auth";
import { formatearFecha, formatearPrecio } from "../../../utils/format";
import { renderizarEncabezado } from "../../../utils/layout";
import { obtenerTodosLosPedidos } from "../../../utils/orders";
import {
  crearBadgeEstado,
  mostrarDetallePedido,
} from "../../../utils/orderDetail";

const message = document.getElementById("message") as HTMLParagraphElement;
const retryButton = document.getElementById(
  "retry-button",
) as HTMLButtonElement;
const emptyOrders = document.getElementById("empty-orders") as HTMLElement;
const ordersContainer = document.getElementById(
  "orders-container",
) as HTMLDivElement;

function crearTarjetaPedido(pedido: Pedido): HTMLButtonElement {
  // La tarjeta completa es un botón para permitir abrirla también con el teclado.
  const tarjeta = document.createElement("button");
  tarjeta.type = "button";
  tarjeta.className =
    "block w-full cursor-pointer rounded-xl border border-border bg-white p-6 text-left shadow-card transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  tarjeta.setAttribute("aria-label", `Ver detalle del pedido ${pedido.id}`);

  const encabezado = document.createElement("div");
  encabezado.className = "flex flex-wrap items-center justify-between gap-3";

  const titulo = document.createElement("h3");
  titulo.className = "break-words text-lg font-bold text-primary";
  titulo.textContent = `Pedido #${pedido.id}`;

  encabezado.append(titulo, crearBadgeEstado(pedido.estado));

  const fecha = document.createElement("p");
  fecha.textContent = `Fecha: ${formatearFecha(pedido.fecha)}`;

  const resumen = document.createElement("p");

  // Muestra hasta tres productos para mantener breve el resumen de la tarjeta.
  const primerosProductos = pedido.detalles.slice(0, 3);
  const nombres = primerosProductos.map(
    (detalle) => `${detalle.cantidad} × ${detalle.nombre}`,
  );

  resumen.textContent = nombres.join(", ");

  if (pedido.detalles.length > 3) {
    resumen.textContent += ` y ${pedido.detalles.length - 3} más`;
  }

  const total = document.createElement("p");
  total.className = "mb-0 text-lg font-bold";
  total.textContent = `Total: ${formatearPrecio(pedido.total)}`;

  tarjeta.append(encabezado, fecha, resumen, total);

  tarjeta.addEventListener("click", () => {
    mostrarDetallePedido(pedido);
  });

  return tarjeta;
}

async function iniciarHistorial(): Promise<void> {
  const usuario = requerirSesion(["USUARIO"]);

  if (!usuario) {
    return;
  }

  renderizarEncabezado(usuario);

  try {
    const pedidos = await obtenerTodosLosPedidos();

    // Filtra antes de dibujar para mostrar únicamente los pedidos del cliente.
    const pedidosUsuario = pedidos.filter(
      (pedido) => pedido.idUsuario === usuario.id,
    );

    pedidosUsuario.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );

    ordersContainer.replaceChildren();
    emptyOrders.hidden = pedidosUsuario.length > 0;

    for (const pedido of pedidosUsuario) {
      ordersContainer.appendChild(crearTarjetaPedido(pedido));
    }

    message.textContent = "";
  } catch (error) {
    if (error instanceof Error) {
      message.textContent = error.message;
    } else {
      message.textContent = "No se pudo cargar el historial de pedidos.";
    }

    message.className = "message error";
    retryButton.hidden = false;
  }
}

retryButton.addEventListener("click", () => {
  window.location.reload();
});

iniciarHistorial();

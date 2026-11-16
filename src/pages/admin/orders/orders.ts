import type { EstadoPedido, Pedido } from "../../../types/Pedido";
import type { Usuario } from "../../../types/Usuario";
import { obtenerUsuarios } from "../../../utils/api";
import { requerirSesion } from "../../../utils/auth";
import { formatearFecha, formatearPrecio } from "../../../utils/format";
import { renderizarEncabezado } from "../../../utils/layout";
import {
  crearBadgeEstado,
  mostrarDetallePedido,
} from "../../../utils/orderDetail";
import { obtenerTodosLosPedidos } from "../../../utils/orders";

const stateFilter = document.getElementById(
  "state-filter",
) as HTMLSelectElement;
const message = document.getElementById("message") as HTMLParagraphElement;
const retryButton = document.getElementById(
  "retry-button",
) as HTMLButtonElement;
const emptyMessage = document.getElementById(
  "empty-message",
) as HTMLParagraphElement;
const ordersContainer = document.getElementById(
  "orders-container",
) as HTMLDivElement;

const estados: EstadoPedido[] = [
  "PENDIENTE",
  "CONFIRMADO",
  "TERMINADO",
  "CANCELADO",
];

let pedidos: Pedido[] = [];
let usuarios: Usuario[] = [];

function obtenerNombreCliente(pedido: Pedido): string {
  const usuario = usuarios.find((actual) => actual.id === pedido.idUsuario);

  if (usuario) {
    return `${usuario.nombre} ${usuario.apellido}`.trim();
  }

  if (pedido.nombreCliente) {
    return pedido.nombreCliente;
  }

  // Los pedidos locales antiguos pueden carecer del nombre del cliente.
  return `Cliente #${pedido.idUsuario}`;
}

function abrirPedido(pedido: Pedido): void {
  const modal = mostrarDetallePedido(pedido);

  const cliente = document.createElement("p");
  cliente.className = "font-bold";
  cliente.textContent = `Cliente: ${obtenerNombreCliente(pedido)}`;
  modal.prepend(cliente);

  const form = document.createElement("form");
  form.className = "mt-6 border-t border-border pt-5";

  form.innerHTML = `
    <div class="form-group">
      <label for="order-state">Estado del pedido</label>
      <select id="order-state" name="state" required></select>
    </div>

    <p class="state-error message error" role="alert"></p>

    <button type="submit" class="primary-button">
      Guardar estado
    </button>
  `;

  const select = form.querySelector("select") as HTMLSelectElement;
  const errorMessage = form.querySelector(
    ".state-error",
  ) as HTMLParagraphElement;

  for (const estado of estados) {
    const opcion = document.createElement("option");
    opcion.value = estado;

    // Reutiliza el texto legible del badge para mantener los mismos nombres.
    opcion.textContent = crearBadgeEstado(estado).textContent;
    select.appendChild(opcion);
  }

  select.value = pedido.estado;

  form.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    const nuevoEstado = estados.find((estado) => estado === select.value);

    if (!nuevoEstado) {
      errorMessage.textContent = "Seleccioná un estado válido.";
      return;
    }

    // Modifica el objeto de la lista en memoria, sin escribir en los JSON.
    pedido.estado = nuevoEstado;

    renderizarPedidos();
    message.textContent = `Se actualizó el estado del pedido #${pedido.id}.`;
    modal.close();
  });

  modal.appendChild(form);
}

function crearTarjetaPedido(pedido: Pedido): HTMLButtonElement {
  const tarjeta = document.createElement("button");
  tarjeta.type = "button";
  tarjeta.className =
    "block w-full cursor-pointer rounded-xl border border-border bg-white p-6 text-left shadow-card transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  tarjeta.setAttribute("aria-label", `Ver y gestionar el pedido ${pedido.id}`);

  const encabezado = document.createElement("div");
  encabezado.className = "flex flex-wrap items-center justify-between gap-3";

  const titulo = document.createElement("h3");
  titulo.className = "break-words text-lg font-bold text-primary";
  titulo.textContent = `Pedido #${pedido.id}`;

  encabezado.append(titulo, crearBadgeEstado(pedido.estado));

  const cliente = document.createElement("p");
  cliente.textContent = `Cliente: ${obtenerNombreCliente(pedido)}`;

  const fecha = document.createElement("p");
  fecha.textContent = `Fecha: ${formatearFecha(pedido.fecha)}`;

  let unidades = 0;

  for (const detalle of pedido.detalles) {
    unidades += detalle.cantidad;
  }

  const cantidad = document.createElement("p");
  cantidad.textContent = `Cantidad de productos: ${unidades}`;

  const total = document.createElement("p");
  total.className = "mb-0 text-lg font-bold";
  total.textContent = `Total: ${formatearPrecio(pedido.total)}`;

  tarjeta.append(encabezado, cliente, fecha, cantidad, total);

  tarjeta.addEventListener("click", () => abrirPedido(pedido));

  return tarjeta;
}

function renderizarPedidos(): void {
  const estadoSeleccionado = stateFilter.value;

  const resultado = pedidos.filter(
    (pedido) =>
      estadoSeleccionado === "" || pedido.estado === estadoSeleccionado,
  );

  resultado.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  ordersContainer.replaceChildren();
  emptyMessage.hidden = resultado.length > 0;

  for (const pedido of resultado) {
    ordersContainer.appendChild(crearTarjetaPedido(pedido));
  }
}

async function iniciarPedidos(): Promise<void> {
  const usuario = requerirSesion(["ADMIN"]);

  if (!usuario) {
    return;
  }

  renderizarEncabezado(usuario);

  try {
    // Obtiene todos los pedidos y consulta usuarios para identificar a sus clientes.
    usuarios = await obtenerUsuarios();
    pedidos = await obtenerTodosLosPedidos();

    renderizarPedidos();

    stateFilter.disabled = false;
    message.textContent = "";

    stateFilter.addEventListener("change", () => {
      message.textContent = "";
      renderizarPedidos();
    });
  } catch (error) {
    if (error instanceof Error) {
      message.textContent = error.message;
    } else {
      message.textContent = "No se pudieron cargar los pedidos.";
    }

    message.className = "message error";
    retryButton.hidden = false;
  }
}

retryButton.addEventListener("click", () => {
  window.location.reload();
});

iniciarPedidos();

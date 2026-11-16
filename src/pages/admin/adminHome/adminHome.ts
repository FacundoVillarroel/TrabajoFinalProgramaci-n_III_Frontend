import type { EstadoPedido, Pedido } from "../../../types/Pedido";
import {
  obtenerCategorias,
  obtenerProductos,
  obtenerUsuarios,
} from "../../../utils/api";
import { requerirSesion } from "../../../utils/auth";
import { renderizarEncabezado } from "../../../utils/layout";
import { crearBadgeEstado } from "../../../utils/orderDetail";
import { obtenerTodosLosPedidos } from "../../../utils/orders";

const message = document.getElementById("message") as HTMLParagraphElement;
const retryButton = document.getElementById(
  "retry-button",
) as HTMLButtonElement;
const dashboardContent = document.getElementById(
  "dashboard-content",
) as HTMLDivElement;
const categoriesCount = document.getElementById(
  "categories-count",
) as HTMLElement;
const productsCount = document.getElementById("products-count") as HTMLElement;
const ordersCount = document.getElementById("orders-count") as HTMLElement;
const availableCount = document.getElementById(
  "available-count",
) as HTMLElement;
const activeCategories = document.getElementById(
  "active-categories",
) as HTMLElement;
const deletedCategories = document.getElementById(
  "deleted-categories",
) as HTMLElement;
const activeProducts = document.getElementById(
  "active-products",
) as HTMLElement;
const deletedProducts = document.getElementById(
  "deleted-products",
) as HTMLElement;
const unavailableProducts = document.getElementById(
  "unavailable-products",
) as HTMLElement;
const ordersSummary = document.getElementById(
  "orders-summary",
) as HTMLUListElement;
const usersSummary = document.getElementById(
  "users-summary",
) as HTMLParagraphElement;

function renderizarEstados(pedidos: Pedido[]): void {
  const estados: EstadoPedido[] = [
    "PENDIENTE",
    "CONFIRMADO",
    "TERMINADO",
    "CANCELADO",
  ];

  ordersSummary.replaceChildren();

  for (const estado of estados) {
    const cantidad = pedidos.filter(
      (pedido) => pedido.estado === estado,
    ).length;

    const elemento = document.createElement("li");
    elemento.className = "flex items-center justify-between gap-4";

    const contador = document.createElement("span");
    contador.className = "font-bold";
    contador.textContent = String(cantidad);

    elemento.append(crearBadgeEstado(estado), contador);
    ordersSummary.appendChild(elemento);
  }
}

async function iniciarDashboard(): Promise<void> {
  const usuario = requerirSesion(["ADMIN"]);

  if (!usuario) {
    return;
  }

  renderizarEncabezado(usuario);

  try {
    // Consulta los cuatro recursos exigidos por la consigna.
    const categorias = await obtenerCategorias();
    const productos = await obtenerProductos();
    const usuarios = await obtenerUsuarios();
    const pedidos = await obtenerTodosLosPedidos();

    categoriesCount.textContent = String(categorias.length);
    productsCount.textContent = String(productos.length);
    ordersCount.textContent = String(pedidos.length);

    const categoriasActivas = categorias.filter(
      (categoria) => !categoria.eliminado,
    );

    const productosActivos = productos.filter(
      (producto) => !producto.eliminado,
    );

    const productosDisponibles = productosActivos.filter(
      (producto) => producto.disponible,
    );

    // Activo significa que no tiene baja lógica.
    // Disponible indica que está habilitado para la venta.
    availableCount.textContent = String(productosDisponibles.length);
    activeCategories.textContent = String(categoriasActivas.length);
    deletedCategories.textContent = String(
      categorias.length - categoriasActivas.length,
    );
    activeProducts.textContent = String(productosActivos.length);
    deletedProducts.textContent = String(
      productos.length - productosActivos.length,
    );

    unavailableProducts.textContent = String(
      productosActivos.length - productosDisponibles.length,
    );

    renderizarEstados(pedidos);

    usersSummary.textContent = `Usuarios en los datos de prueba: ${usuarios.length}.`;

    dashboardContent.hidden = false;
    message.textContent = "";
  } catch (error) {
    if (error instanceof Error) {
      message.textContent = error.message;
    } else {
      message.textContent = "No se pudo cargar el panel de administración.";
    }

    message.className = "message error";
    retryButton.hidden = false;
  }
}

retryButton.addEventListener("click", () => {
  window.location.reload();
});

iniciarDashboard();

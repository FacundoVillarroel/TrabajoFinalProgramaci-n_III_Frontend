import type { ItemCarrito } from "../../../types/Carrito";
import type { Producto } from "../../../types/Producto";
import type { Usuario } from "../../../types/Usuario";
import type { FormaPago } from "../../../types/Pedido";
import { COSTO_ENVIO } from "../../../config";
import { obtenerProductos } from "../../../utils/api";
import { requerirSesion } from "../../../utils/auth";
import {
  actualizarCantidadCarrito,
  obtenerCarrito,
  obtenerSubtotalCarrito,
  quitarDelCarrito,
  vaciarCarrito,
} from "../../../utils/cart";
import { formatearPrecio } from "../../../utils/format";
import {
  actualizarContadorCarrito,
  renderizarEncabezado,
} from "../../../utils/layout";
import { crearPedido } from "../../../utils/orders";
import { guardarCarrito } from "../../../utils/storage";

const message = document.getElementById("message") as HTMLParagraphElement;
const emptyCart = document.getElementById("empty-cart") as HTMLElement;
const cartContent = document.getElementById("cart-content") as HTMLDivElement;
const cartItems = document.getElementById("cart-items") as HTMLDivElement;
const cartControls = document.getElementById(
  "cart-controls",
) as HTMLFieldSetElement;
const clearButton = document.getElementById(
  "clear-button",
) as HTMLButtonElement;
const subtotalElement = document.getElementById("subtotal") as HTMLElement;
const shippingElement = document.getElementById("shipping") as HTMLElement;
const totalElement = document.getElementById("total") as HTMLElement;
const checkoutForm = document.getElementById(
  "checkout-form",
) as HTMLFormElement;
const checkoutControls = document.getElementById(
  "checkout-controls",
) as HTMLFieldSetElement;
const phoneInput = document.getElementById("phone") as HTMLInputElement;
const paymentSelect = document.getElementById("payment") as HTMLSelectElement;
const confirmButton = document.getElementById(
  "confirm-button",
) as HTMLButtonElement;

let productos: Producto[] = [];

function mostrarError(error: unknown): void {
  if (error instanceof Error) {
    window.alert(error.message);
  } else {
    window.alert("No se pudo completar la operación.");
  }
}

function cambiarCantidad(
  item: ItemCarrito,
  cantidad: number,
  usuario: Usuario,
): void {
  try {
    const producto = productos.find((actual) => actual.id === item.idProducto);

    if (!producto) {
      throw new Error("El producto ya no existe. Quitalo del carrito.");
    }

    actualizarCantidadCarrito(usuario.id, producto, cantidad);
    renderizarCarrito(usuario);
  } catch (error) {
    mostrarError(error);
  }
}

function crearFila(item: ItemCarrito, usuario: Usuario): HTMLElement {
  const fila = document.createElement("article");
  fila.className =
    "flex flex-col gap-4 rounded-xl border border-border bg-white p-5 sm:flex-row";

  // La estructura es fija. Los datos del producto se asignan como texto.
  fila.innerHTML = `
    <img class="h-28 w-full rounded-md object-cover sm:w-32" alt="">

    <div class="min-w-0 flex-1">
      <h3 class="text-lg font-bold text-primary"></h3>
      <p class="unit-price"></p>

      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="secondary-button decrease">−</button>
        <span class="quantity font-bold"></span>
        <button type="button" class="secondary-button increase">+</button>
        <button type="button" class="small-button delete-button remove">
          Eliminar
        </button>
      </div>

      <p class="line-total font-bold"></p>
    </div>
  `;

  const imagen = fila.querySelector("img") as HTMLImageElement;
  const titulo = fila.querySelector("h3") as HTMLHeadingElement;
  const precio = fila.querySelector(".unit-price") as HTMLParagraphElement;
  const cantidad = fila.querySelector(".quantity") as HTMLSpanElement;
  const total = fila.querySelector(".line-total") as HTMLParagraphElement;
  const disminuir = fila.querySelector(".decrease") as HTMLButtonElement;
  const aumentar = fila.querySelector(".increase") as HTMLButtonElement;
  const eliminar = fila.querySelector(".remove") as HTMLButtonElement;

  imagen.src = item.imagen;
  imagen.alt = item.nombre;
  titulo.textContent = item.nombre;
  precio.textContent = `Precio unitario: ${formatearPrecio(item.precioUnitario)}`;
  cantidad.textContent = String(item.cantidad);
  cantidad.setAttribute("aria-label", `Cantidad: ${item.cantidad}`);
  total.textContent = `Subtotal: ${formatearPrecio(item.precioUnitario * item.cantidad)}`;

  disminuir.setAttribute("aria-label", `Quitar una unidad de ${item.nombre}`);
  aumentar.setAttribute("aria-label", `Agregar una unidad de ${item.nombre}`);
  disminuir.disabled = item.cantidad <= 1;

  disminuir.addEventListener("click", () => {
    cambiarCantidad(item, item.cantidad - 1, usuario);
  });

  aumentar.addEventListener("click", () => {
    cambiarCantidad(item, item.cantidad + 1, usuario);
  });

  eliminar.addEventListener("click", () => {
    try {
      quitarDelCarrito(usuario.id, item.idProducto);
      renderizarCarrito(usuario);
    } catch (error) {
      mostrarError(error);
    }
  });

  return fila;
}

function renderizarCarrito(usuario: Usuario): void {
  const carrito = obtenerCarrito(usuario.id);
  const estaVacio = carrito.length === 0;

  emptyCart.hidden = !estaVacio;
  cartContent.hidden = estaVacio;
  cartItems.replaceChildren();

  for (const item of carrito) {
    cartItems.appendChild(crearFila(item, usuario));
  }

  const subtotal = obtenerSubtotalCarrito(usuario.id);

  subtotalElement.textContent = formatearPrecio(subtotal);
  shippingElement.textContent = formatearPrecio(COSTO_ENVIO);
  totalElement.textContent = formatearPrecio(subtotal + COSTO_ENVIO);

  actualizarContadorCarrito(usuario.id);
}

function configurarEventos(usuario: Usuario): void {
  clearButton.addEventListener("click", () => {
    if (!window.confirm("¿Querés vaciar el carrito?")) {
      return;
    }

    try {
      vaciarCarrito(usuario.id);
      renderizarCarrito(usuario);
    } catch (error) {
      mostrarError(error);
    }
  });

  checkoutForm.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    // Bloquea cantidades y checkout mientras valida y guarda la compra.
    cartControls.disabled = true;
    checkoutControls.disabled = true;
    confirmButton.textContent = "Confirmando...";

    try {
      const formaPago = paymentSelect.value as FormaPago;
      const pedido = await crearPedido(usuario, phoneInput.value, formaPago);

      renderizarCarrito(usuario);
      window.alert(
        `Pedido ${pedido.id} confirmado. Total: ${formatearPrecio(pedido.total)}`,
      );

      window.location.replace("/src/pages/client/orders/orders.html");
    } catch (error) {
      mostrarError(error);
    } finally {
      cartControls.disabled = false;
      checkoutControls.disabled = false;
      confirmButton.textContent = "Confirmar pedido";
    }
  });
}

async function iniciarCarrito(): Promise<void> {
  const usuario = requerirSesion(["USUARIO"]);

  if (!usuario) {
    return;
  }

  renderizarEncabezado(usuario);
  phoneInput.value = usuario.celular;

  try {
    productos = await obtenerProductos();
    const carrito = obtenerCarrito(usuario.id);

    // Actualiza los datos visibles con el catálogo actual al abrir el carrito.
    for (const item of carrito) {
      const producto = productos.find(
        (actual) => actual.id === item.idProducto,
      );

      if (producto) {
        item.nombre = producto.nombre;
        item.imagen = producto.imagen;
        item.precioUnitario = producto.precio;
      }
    }

    guardarCarrito(usuario.id, carrito);
    renderizarCarrito(usuario);
    configurarEventos(usuario);

    message.textContent = "";
  } catch (error) {
    message.textContent =
      "No se pudo cargar el carrito. Recargá la página para reintentar.";
    message.className = "message error";
    mostrarError(error);
  }
}

iniciarCarrito();

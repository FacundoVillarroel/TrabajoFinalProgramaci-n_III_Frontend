import type { Producto } from "../../../types/Producto";
import type { Usuario } from "../../../types/Usuario";
import { obtenerProductos } from "../../../utils/api";
import { requerirSesion } from "../../../utils/auth";
import { agregarAlCarrito } from "../../../utils/cart";
import { formatearPrecio } from "../../../utils/format";
import {
  actualizarContadorCarrito,
  renderizarEncabezado,
} from "../../../utils/layout";

const detail = document.getElementById("product-detail") as HTMLElement;
const image = document.getElementById("product-image") as HTMLImageElement;
const name = document.getElementById("product-name") as HTMLHeadingElement;
const description = document.getElementById(
  "product-description",
) as HTMLParagraphElement;
const price = document.getElementById("product-price") as HTMLParagraphElement;
const stock = document.getElementById("product-stock") as HTMLParagraphElement;
const status = document.getElementById("product-status") as HTMLSpanElement;
const form = document.getElementById("add-form") as HTMLFormElement;
const quantityInput = document.getElementById("quantity") as HTMLInputElement;
const addButton = document.getElementById("add-button") as HTMLButtonElement;
const message = document.getElementById("message") as HTMLParagraphElement;

function mostrarMensaje(texto: string, esError: boolean): void {
  message.textContent = texto;
  message.className = esError ? "message error" : "message";
}

function renderizarProducto(producto: Producto, usuario: Usuario): void {
  document.title = `${producto.nombre} | Food Store`;

  image.src = producto.imagen;
  image.alt = producto.nombre;
  name.textContent = producto.nombre;
  description.textContent = producto.descripcion;
  price.textContent = formatearPrecio(producto.precio);
  stock.textContent = `Stock disponible: ${producto.stock} unidades`;

  const sePuedeComprar = producto.disponible && producto.stock > 0;

  if (!producto.disponible) {
    status.textContent = "No disponible";
    status.classList.add("unavailable");
  } else if (producto.stock <= 0) {
    status.textContent = "Sin stock";
    status.classList.add("unavailable");
  } else {
    status.textContent = "Disponible";
  }

  // El administrador puede consultar el detalle. El formulario es del cliente.
  form.hidden = usuario.rol !== "USUARIO";
  quantityInput.max = String(producto.stock);
  quantityInput.disabled = !sePuedeComprar;
  addButton.disabled = !sePuedeComprar;

  detail.hidden = false;
}

function configurarCompra(producto: Producto, usuario: Usuario): void {
  form.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    const cantidad = Number(quantityInput.value);

    try {
      // El helper también comprueba las unidades que ya existen en el carrito.
      agregarAlCarrito(usuario.id, producto, cantidad);
      actualizarContadorCarrito(usuario.id);

      window.alert(
        `Se agregaron ${cantidad} unidades de ${producto.nombre} al carrito.`,
      );

      quantityInput.value = "1";
    } catch (error) {
      if (error instanceof Error) {
        window.alert(error.message);
      } else {
        window.alert("No se pudo agregar el producto al carrito.");
      }
    }
  });
}

async function iniciarDetalle(): Promise<void> {
  const usuario = requerirSesion(["ADMIN", "USUARIO"]);

  if (!usuario) {
    return;
  }

  renderizarEncabezado(usuario);

  // Obtiene el ID enviado por el catálogo en la URL, por ejemplo ?id=3.
  const parametros = new URLSearchParams(window.location.search);
  const idProducto = Number(parametros.get("id"));

  if (!Number.isInteger(idProducto) || idProducto <= 0) {
    mostrarMensaje("El identificador del producto es inválido.", true);
    return;
  }

  try {
    const productos = await obtenerProductos();
    const producto = productos.find((actual) => actual.id === idProducto);

    if (!producto || producto.eliminado) {
      mostrarMensaje("El producto no existe o fue dado de baja.", true);
      return;
    }

    renderizarProducto(producto, usuario);
    mostrarMensaje("", false);

    if (usuario.rol === "USUARIO") {
      configurarCompra(producto, usuario);
    }
  } catch (error) {
    if (error instanceof Error) {
      mostrarMensaje(error.message, true);
    } else {
      mostrarMensaje("No se pudo cargar el producto.", true);
    }
  }
}

iniciarDetalle();

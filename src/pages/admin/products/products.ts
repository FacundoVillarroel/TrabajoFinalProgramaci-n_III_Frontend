import type { Categoria } from "../../../types/Categoria";
import type { Producto } from "../../../types/Producto";
import { obtenerCategorias, obtenerProductos } from "../../../utils/api";
import { requerirSesion } from "../../../utils/auth";
import { formatearPrecio } from "../../../utils/format";
import { renderizarEncabezado } from "../../../utils/layout";

const newButton = document.getElementById("new-button") as HTMLButtonElement;
const message = document.getElementById("message") as HTMLParagraphElement;
const retryButton = document.getElementById(
  "retry-button",
) as HTMLButtonElement;
const emptyMessage = document.getElementById(
  "empty-message",
) as HTMLParagraphElement;
const tableContainer = document.getElementById(
  "table-container",
) as HTMLDivElement;
const tableBody = document.getElementById(
  "products-body",
) as HTMLTableSectionElement;
const modal = document.getElementById("product-modal") as HTMLDialogElement;
const modalTitle = document.getElementById("modal-title") as HTMLHeadingElement;
const form = document.getElementById("product-form") as HTMLFormElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const descriptionInput = document.getElementById(
  "description",
) as HTMLTextAreaElement;
const priceInput = document.getElementById("price") as HTMLInputElement;
const stockInput = document.getElementById("stock") as HTMLInputElement;
const categorySelect = document.getElementById("category") as HTMLSelectElement;
const imageInput = document.getElementById("image") as HTMLInputElement;
const availableInput = document.getElementById("available") as HTMLInputElement;
const formMessage = document.getElementById(
  "form-message",
) as HTMLParagraphElement;
const cancelButton = document.getElementById(
  "cancel-button",
) as HTMLButtonElement;

let categorias: Categoria[] = [];
let productos: Producto[] = [];
let idEdicion: number | null = null;

function cargarOpcionesCategorias(): void {
  categorySelect.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.textContent = "Seleccioná una categoría";
  categorySelect.appendChild(opcionInicial);

  for (const categoria of categorias) {
    if (!categoria.eliminado) {
      const opcion = document.createElement("option");
      opcion.value = String(categoria.id);
      opcion.textContent = categoria.nombre;
      categorySelect.appendChild(opcion);
    }
  }
}

function abrirFormulario(producto: Producto | null): void {
  const hayCategorias = categorias.some((categoria) => !categoria.eliminado);

  if (!hayCategorias) {
    window.alert(
      "Se necesita al menos una categoría activa para guardar productos.",
    );
    return;
  }

  form.reset();
  formMessage.textContent = "";

  if (producto) {
    idEdicion = producto.id;
    modalTitle.textContent = "Editar producto";
    nameInput.value = producto.nombre;
    descriptionInput.value = producto.descripcion;
    priceInput.value = String(producto.precio);
    stockInput.value = String(producto.stock);
    categorySelect.value = String(producto.categoriaId);
    imageInput.value = producto.imagen;
    availableInput.checked = producto.disponible;
  } else {
    idEdicion = null;
    modalTitle.textContent = "Nuevo producto";
    stockInput.value = "0";
    availableInput.checked = true;
  }

  modal.showModal();
  nameInput.focus();
}

function eliminarProducto(producto: Producto): void {
  if (!window.confirm(`¿Querés eliminar el producto "${producto.nombre}"?`)) {
    return;
  }

  producto.eliminado = true;
  renderizarProductos();
  message.textContent = `Se eliminó el producto "${producto.nombre}".`;
}

function crearFila(producto: Producto): HTMLTableRowElement {
  const fila = document.createElement("tr");

  fila.innerHTML = `
    <td class="product-id"></td>
    <td class="product-image"></td>
    <td class="product-name"></td>
    <td class="product-description min-w-40 max-w-xs break-words"></td>
    <td class="product-price-cell whitespace-nowrap"></td>
    <td class="product-category"></td>
    <td class="product-stock"></td>
    <td class="product-status"></td>
    <td>
      <button type="button" class="small-button edit-button">Editar</button>
      <button type="button" class="small-button delete-button">Eliminar</button>
    </td>
  `;

  const id = fila.querySelector(".product-id") as HTMLTableCellElement;
  const imagen = fila.querySelector(".product-image") as HTMLTableCellElement;
  const nombre = fila.querySelector(".product-name") as HTMLTableCellElement;
  const descripcion = fila.querySelector(
    ".product-description",
  ) as HTMLTableCellElement;
  const precio = fila.querySelector(
    ".product-price-cell",
  ) as HTMLTableCellElement;
  const categoria = fila.querySelector(
    ".product-category",
  ) as HTMLTableCellElement;
  const stock = fila.querySelector(".product-stock") as HTMLTableCellElement;
  const estado = fila.querySelector(".product-status") as HTMLTableCellElement;
  const editar = fila.querySelector(".edit-button") as HTMLButtonElement;
  const eliminar = fila.querySelector(".delete-button") as HTMLButtonElement;

  const categoriaProducto = categorias.find(
    (actual) => actual.id === producto.categoriaId,
  );

  id.textContent = String(producto.id);
  nombre.textContent = producto.nombre;
  descripcion.textContent = producto.descripcion;
  precio.textContent = formatearPrecio(producto.precio);
  categoria.textContent = categoriaProducto?.nombre ?? "Sin categoría";
  stock.textContent = String(producto.stock);

  const badge = document.createElement("span");
  badge.className = "inline-block rounded-full px-3 py-1 text-sm font-bold";

  if (producto.disponible) {
    badge.textContent = "Disponible";
    badge.classList.add("bg-green-100", "text-green-800");
  } else {
    badge.textContent = "Fuera de venta";
    badge.classList.add("bg-red-100", "text-red-800");
  }

  estado.appendChild(badge);

  if (producto.imagen) {
    const thumbnail = document.createElement("img");
    thumbnail.src = producto.imagen;
    thumbnail.alt = producto.nombre;
    thumbnail.className = "inventory-image";
    thumbnail.loading = "lazy";
    imagen.appendChild(thumbnail);
  } else {
    imagen.textContent = "Sin imagen";
  }

  editar.setAttribute("aria-label", `Editar ${producto.nombre}`);
  eliminar.setAttribute("aria-label", `Eliminar ${producto.nombre}`);

  editar.addEventListener("click", () => abrirFormulario(producto));
  eliminar.addEventListener("click", () => eliminarProducto(producto));

  return fila;
}

function renderizarProductos(): void {
  const activos = productos.filter((producto) => !producto.eliminado);

  tableBody.replaceChildren();
  emptyMessage.hidden = activos.length > 0;
  tableContainer.hidden = activos.length === 0;

  for (const producto of activos) {
    tableBody.appendChild(crearFila(producto));
  }
}

function guardarProducto(event: SubmitEvent): void {
  event.preventDefault();
  formMessage.textContent = "";

  const nombre = nameInput.value.trim();
  const descripcion = descriptionInput.value.trim();
  const precio = Number(priceInput.value);
  const stock = Number(stockInput.value);
  const categoriaId = Number(categorySelect.value);
  const imagen = imageInput.value.trim();
  const disponible = availableInput.checked;

  if (!nombre) {
    formMessage.textContent = "El nombre es obligatorio.";
    return;
  }

  if (!Number.isFinite(precio) || precio <= 0) {
    formMessage.textContent = "El precio debe ser mayor a cero.";
    return;
  }

  if (stockInput.value.trim() === "" || !Number.isInteger(stock) || stock < 0) {
    formMessage.textContent =
      "El stock debe ser un número entero mayor o igual a cero.";
    return;
  }

  // Comprueba la selección contra las categorías cargadas, además del required.
  const categoria = categorias.find(
    (actual) => actual.id === categoriaId && !actual.eliminado,
  );

  if (!categoria) {
    formMessage.textContent = "Seleccioná una categoría activa.";
    return;
  }

  if (idEdicion === null) {
    let id = 1;

    for (const producto of productos) {
      if (producto.id >= id) {
        id = producto.id + 1;
      }
    }

    productos.push({
      id,
      nombre,
      descripcion,
      precio,
      stock,
      imagen,
      disponible,
      eliminado: false,
      categoriaId,
    });

    message.textContent = `Se creó el producto "${nombre}".`;
  } else {
    const producto = productos.find(
      (actual) => actual.id === idEdicion && !actual.eliminado,
    );

    if (!producto) {
      formMessage.textContent = "El producto ya no está disponible.";
      return;
    }

    producto.nombre = nombre;
    producto.descripcion = descripcion;
    producto.precio = precio;
    producto.stock = stock;
    producto.imagen = imagen;
    producto.disponible = disponible;
    producto.categoriaId = categoriaId;

    message.textContent = `Se actualizó el producto "${nombre}".`;
  }

  renderizarProductos();
  modal.close();
}

async function iniciarProductos(): Promise<void> {
  const usuario = requerirSesion(["ADMIN"]);

  if (!usuario) {
    return;
  }

  renderizarEncabezado(usuario);

  try {
    categorias = await obtenerCategorias();
    productos = await obtenerProductos();

    cargarOpcionesCategorias();
    renderizarProductos();

    newButton.disabled = false;
    message.textContent = "";

    newButton.addEventListener("click", () => abrirFormulario(null));
    cancelButton.addEventListener("click", () => modal.close());
    form.addEventListener("submit", guardarProducto);
  } catch (error) {
    if (error instanceof Error) {
      message.textContent = error.message;
    } else {
      message.textContent = "No se pudieron cargar los productos.";
    }

    message.className = "message error";
    retryButton.hidden = false;
  }
}

retryButton.addEventListener("click", () => {
  window.location.reload();
});

iniciarProductos();

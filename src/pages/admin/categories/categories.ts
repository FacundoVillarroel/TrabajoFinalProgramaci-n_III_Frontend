import type { Categoria } from "../../../types/Categoria";
import { obtenerCategorias } from "../../../utils/api";
import { requerirSesion } from "../../../utils/auth";
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
  "categories-body",
) as HTMLTableSectionElement;
const modal = document.getElementById("category-modal") as HTMLDialogElement;
const modalTitle = document.getElementById("modal-title") as HTMLHeadingElement;
const form = document.getElementById("category-form") as HTMLFormElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const descriptionInput = document.getElementById(
  "description",
) as HTMLTextAreaElement;
const imageInput = document.getElementById("image") as HTMLInputElement;
const formMessage = document.getElementById(
  "form-message",
) as HTMLParagraphElement;
const cancelButton = document.getElementById(
  "cancel-button",
) as HTMLButtonElement;

let categorias: Categoria[] = [];

// null identifica un alta. Un ID identifica la categoría que se está editando.
let idEdicion: number | null = null;

function abrirFormulario(categoria: Categoria | null): void {
  form.reset();
  formMessage.textContent = "";

  if (categoria) {
    idEdicion = categoria.id;
    modalTitle.textContent = "Editar categoría";
    nameInput.value = categoria.nombre;
    descriptionInput.value = categoria.descripcion;
    imageInput.value = categoria.imagen;
  } else {
    idEdicion = null;
    modalTitle.textContent = "Nueva categoría";
  }

  modal.showModal();
  nameInput.focus();
}

function eliminarCategoria(categoria: Categoria): void {
  const confirmado = window.confirm(
    `¿Querés eliminar la categoría "${categoria.nombre}"?`,
  );

  if (!confirmado) {
    return;
  }

  // La baja lógica conserva el registro en el estado de la página.
  categoria.eliminado = true;

  renderizarCategorias();
  message.textContent = `Se eliminó la categoría "${categoria.nombre}".`;
}

function crearFila(categoria: Categoria): HTMLTableRowElement {
  const fila = document.createElement("tr");

  fila.innerHTML = `
    <td class="category-id"></td>
    <td class="category-image"></td>
    <td class="category-name"></td>
    <td class="category-description max-w-sm break-words"></td>
    <td>
      <button type="button" class="small-button edit-button">Editar</button>
      <button type="button" class="small-button delete-button">Eliminar</button>
    </td>
  `;

  const id = fila.querySelector(".category-id") as HTMLTableCellElement;
  const imagen = fila.querySelector(".category-image") as HTMLTableCellElement;
  const nombre = fila.querySelector(".category-name") as HTMLTableCellElement;
  const descripcion = fila.querySelector(
    ".category-description",
  ) as HTMLTableCellElement;
  const editar = fila.querySelector(".edit-button") as HTMLButtonElement;
  const eliminar = fila.querySelector(".delete-button") as HTMLButtonElement;

  id.textContent = String(categoria.id);
  nombre.textContent = categoria.nombre;
  descripcion.textContent = categoria.descripcion;

  if (categoria.imagen) {
    const thumbnail = document.createElement("img");
    thumbnail.src = categoria.imagen;
    thumbnail.alt = categoria.nombre;
    thumbnail.className = "inventory-image";
    thumbnail.loading = "lazy";
    imagen.appendChild(thumbnail);
  } else {
    // Las categorías originales del JSON vienen sin imagen.
    imagen.textContent = "Sin imagen";
  }

  editar.setAttribute("aria-label", `Editar ${categoria.nombre}`);
  eliminar.setAttribute("aria-label", `Eliminar ${categoria.nombre}`);

  editar.addEventListener("click", () => abrirFormulario(categoria));
  eliminar.addEventListener("click", () => eliminarCategoria(categoria));

  return fila;
}

function renderizarCategorias(): void {
  const activas = categorias.filter((categoria) => !categoria.eliminado);

  tableBody.replaceChildren();
  emptyMessage.hidden = activas.length > 0;
  tableContainer.hidden = activas.length === 0;

  for (const categoria of activas) {
    tableBody.appendChild(crearFila(categoria));
  }
}

function guardarCategoria(event: SubmitEvent): void {
  event.preventDefault();
  formMessage.textContent = "";

  const nombre = nameInput.value.trim();
  const descripcion = descriptionInput.value.trim();
  const imagen = imageInput.value.trim();

  // required controla campos vacíos. trim también detecta entradas con solo espacios.
  if (!nombre || !descripcion || !imagen) {
    formMessage.textContent = "Completá todos los campos.";
    return;
  }

  if (idEdicion === null) {
    let id = 1;

    // Incluye las bajas lógicas para evitar reutilizar sus identificadores.
    for (const categoria of categorias) {
      if (categoria.id >= id) {
        id = categoria.id + 1;
      }
    }

    categorias.push({
      id,
      nombre,
      descripcion,
      imagen,
      eliminado: false,
    });

    message.textContent = `Se creó la categoría "${nombre}".`;
  } else {
    const categoria = categorias.find(
      (actual) => actual.id === idEdicion && !actual.eliminado,
    );

    if (!categoria) {
      formMessage.textContent = "La categoría ya no está disponible.";
      return;
    }

    categoria.nombre = nombre;
    categoria.descripcion = descripcion;
    categoria.imagen = imagen;

    message.textContent = `Se actualizó la categoría "${nombre}".`;
  }

  renderizarCategorias();
  modal.close();
}

async function iniciarCategorias(): Promise<void> {
  const usuario = requerirSesion(["ADMIN"]);

  if (!usuario) {
    return;
  }

  renderizarEncabezado(usuario);

  try {
    categorias = await obtenerCategorias();
    renderizarCategorias();

    newButton.disabled = false;
    message.textContent = "";

    newButton.addEventListener("click", () => abrirFormulario(null));
    cancelButton.addEventListener("click", () => modal.close());
    form.addEventListener("submit", guardarCategoria);
  } catch (error) {
    if (error instanceof Error) {
      message.textContent = error.message;
    } else {
      message.textContent = "No se pudieron cargar las categorías.";
    }

    message.className = "message error";
    retryButton.hidden = false;
  }
}

retryButton.addEventListener("click", () => {
  window.location.reload();
});

iniciarCategorias();

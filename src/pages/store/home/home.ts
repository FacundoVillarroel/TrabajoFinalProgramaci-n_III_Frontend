import type { Categoria } from "../../../types/Categoria";
import type { Producto } from "../../../types/Producto";
import type { Usuario } from "../../../types/Usuario";
import { obtenerCategorias, obtenerProductos } from "../../../utils/api";
import { requerirSesion } from "../../../utils/auth";
import { agregarAlCarrito } from "../../../utils/cart";
import { formatearPrecio } from "../../../utils/format";
import {
  actualizarContadorCarrito,
  renderizarEncabezado,
} from "../../../utils/layout";

const categoryList = document.getElementById(
  "category-list",
) as HTMLUListElement;
const searchInput = document.getElementById("search") as HTMLInputElement;
const sortSelect = document.getElementById("sort") as HTMLSelectElement;
const message = document.getElementById("message") as HTMLParagraphElement;
const productsContainer = document.getElementById(
  "products-container",
) as HTMLDivElement;

let productos: Producto[] = [];
let categoriaSeleccionada = 0;

function mostrarMensaje(texto: string, esError: boolean): void {
  message.textContent = texto;
  message.className = esError ? "message error" : "message";
}

function crearEnlaceCategoria(
  nombre: string,
  id: number,
  usuario: Usuario,
): HTMLLIElement {
  const elemento = document.createElement("li");
  const enlace = document.createElement("a");

  enlace.href = "#";
  enlace.textContent = nombre;

  if (id === categoriaSeleccionada) {
    enlace.setAttribute("aria-current", "true");
  }

  enlace.addEventListener("click", (event) => {
    event.preventDefault();
    categoriaSeleccionada = id;

    // Actualiza la categoría marcada sin volver a consultar los JSON.
    const enlaces = categoryList.querySelectorAll("a");

    for (const actual of enlaces) {
      actual.removeAttribute("aria-current");
    }

    enlace.setAttribute("aria-current", "true");
    renderizarProductos(usuario);
  });

  elemento.appendChild(enlace);
  return elemento;
}

function renderizarCategorias(categorias: Categoria[], usuario: Usuario): void {
  categoryList.replaceChildren();
  categoryList.appendChild(crearEnlaceCategoria("Todas", 0, usuario));

  for (const categoria of categorias) {
    if (!categoria.eliminado) {
      const elemento = crearEnlaceCategoria(
        categoria.nombre,
        categoria.id,
        usuario,
      );
      categoryList.appendChild(elemento);
    }
  }
}

function crearTarjetaProducto(
  producto: Producto,
  usuario: Usuario,
): HTMLElement {
  const tarjeta = document.createElement("article");
  tarjeta.className = "product-card";

  const rutaDetalle = `/src/pages/store/productDetail/productDetail.html?id=${producto.id}`;

  const enlaceImagen = document.createElement("a");
  enlaceImagen.href = rutaDetalle;

  const imagen = document.createElement("img");
  imagen.src = producto.imagen;
  imagen.alt = producto.nombre;
  imagen.loading = "lazy";

  enlaceImagen.appendChild(imagen);

  const titulo = document.createElement("h3");
  const enlaceTitulo = document.createElement("a");

  enlaceTitulo.href = rutaDetalle;
  enlaceTitulo.textContent = producto.nombre;
  titulo.appendChild(enlaceTitulo);

  const descripcion = document.createElement("p");
  descripcion.textContent = producto.descripcion;

  const precio = document.createElement("p");
  precio.className = "product-price";
  precio.textContent = formatearPrecio(producto.precio);

  const disponibilidad = document.createElement("span");
  disponibilidad.className = "availability-badge";

  if (producto.stock > 0) {
    disponibilidad.textContent = "Disponible";
  } else {
    disponibilidad.textContent = "Sin stock";
    disponibilidad.classList.add("unavailable");
  }

  const acciones = document.createElement("div");
  acciones.className = "product-actions";

  // El administrador puede consultar la tienda, mientras la compra es del cliente.
  if (usuario.rol === "USUARIO") {
    const botonAgregar = document.createElement("button");

    botonAgregar.type = "button";
    botonAgregar.className = "primary-button";
    botonAgregar.textContent = "Agregar al carrito";
    botonAgregar.disabled = producto.stock <= 0;

    botonAgregar.addEventListener("click", () => {
      try {
        agregarAlCarrito(usuario.id, producto, 1);
        actualizarContadorCarrito(usuario.id);

        // El aviso es visible aunque el usuario esté al final del catálogo.
        window.alert(`Se agregó ${producto.nombre} al carrito.`);
      } catch (error) {
        if (error instanceof Error) {
          window.alert(error.message);
        } else {
          window.alert("No se pudo agregar el producto.");
        }
      }
    });

    acciones.appendChild(botonAgregar);
  }

  const enlaceDetalle = document.createElement("a");
  enlaceDetalle.href = rutaDetalle;
  enlaceDetalle.className = "secondary-button";
  enlaceDetalle.textContent = "Ver detalles";

  acciones.appendChild(enlaceDetalle);

  tarjeta.append(
    enlaceImagen,
    titulo,
    descripcion,
    precio,
    disponibilidad,
    acciones,
  );

  return tarjeta;
}

function renderizarProductos(usuario: Usuario): void {
  const busqueda = searchInput.value.trim().toLowerCase();

  // Aplica todos los filtros juntos para conservar la búsqueda al cambiar categoría.
  const resultado = productos.filter((producto) => {
    const coincideCategoria =
      categoriaSeleccionada === 0 ||
      producto.categoriaId === categoriaSeleccionada;

    const coincideNombre = producto.nombre.toLowerCase().includes(busqueda);

    return (
      producto.disponible &&
      !producto.eliminado &&
      coincideCategoria &&
      coincideNombre
    );
  });

  // filter genera una lista nueva. El ordenamiento conserva intacto el catálogo base.
  switch (sortSelect.value) {
    case "nombre-desc":
      resultado.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
      break;

    case "precio-asc":
      resultado.sort((a, b) => a.precio - b.precio);
      break;

    case "precio-desc":
      resultado.sort((a, b) => b.precio - a.precio);
      break;

    default:
      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  productsContainer.replaceChildren();

  if (resultado.length === 0) {
    const aviso = document.createElement("p");
    aviso.textContent = "No se encontraron productos con esos filtros.";
    productsContainer.appendChild(aviso);
    return;
  }

  for (const producto of resultado) {
    productsContainer.appendChild(crearTarjetaProducto(producto, usuario));
  }
}

async function iniciarCatalogo(): Promise<void> {
  const usuario = requerirSesion(["ADMIN", "USUARIO"]);

  // La redirección no detiene el código. El return evita inicializar sin permiso.
  if (!usuario) {
    return;
  }

  renderizarEncabezado(usuario);

  try {
    const categorias = await obtenerCategorias();
    productos = await obtenerProductos();

    renderizarCategorias(categorias, usuario);
    renderizarProductos(usuario);

    searchInput.disabled = false;
    sortSelect.disabled = false;
    mostrarMensaje("", false);

    searchInput.addEventListener("input", () => renderizarProductos(usuario));
    sortSelect.addEventListener("change", () => renderizarProductos(usuario));
  } catch (error) {
    if (error instanceof Error) {
      mostrarMensaje(error.message, true);
    } else {
      mostrarMensaje("No se pudo cargar el catálogo.", true);
    }
  }
}

iniciarCatalogo();

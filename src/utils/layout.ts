import type { Usuario } from "../types/Usuario";
import { cerrarSesion, RUTAS } from "./auth";
import { obtenerCantidadCarrito } from "./cart";

interface EnlaceMenu {
  texto: string;
  ruta: string;
}

export function actualizarContadorCarrito(idUsuario: number): void {
  const enlace = document.getElementById("cart-link");

  if (enlace) {
    const cantidad = obtenerCantidadCarrito(idUsuario);
    enlace.textContent = `Carrito (${cantidad})`;
  }
}

export function renderizarEncabezado(usuario: Usuario): void {
  const contenedor = document.getElementById("header");

  if (!contenedor) {
    throw new Error("La página debe incluir un contenedor con id header.");
  }

  const enlaces: EnlaceMenu[] = [];

  if (usuario.rol === "ADMIN") {
    enlaces.push(
      { texto: "Panel", ruta: RUTAS.admin },
      {
        texto: "Categorías",
        ruta: "/src/pages/admin/categories/categories.html",
      },
      { texto: "Productos", ruta: "/src/pages/admin/products/products.html" },
      { texto: "Pedidos", ruta: "/src/pages/admin/orders/orders.html" },
      { texto: "Ver tienda", ruta: RUTAS.tienda },
    );
  } else {
    enlaces.push(
      { texto: "Tienda", ruta: RUTAS.tienda },
      { texto: "Mis pedidos", ruta: "/src/pages/client/orders/orders.html" },
      { texto: "Carrito", ruta: "/src/pages/store/cart/cart.html" },
    );
  }

  const encabezado = document.createElement("header");
  encabezado.className = "main-header";

  const titulo = document.createElement("h1");
  titulo.textContent = "Food Store";

  const saludo = document.createElement("p");

  // textContent muestra el nombre como texto y evita interpretarlo como HTML.
  saludo.textContent = `Hola, ${usuario.nombre}`;

  const navegacion = document.createElement("nav");
  navegacion.setAttribute("aria-label", "Navegación principal");

  const lista = document.createElement("ul");

  for (const enlace of enlaces) {
    const elemento = document.createElement("li");
    const link = document.createElement("a");

    link.href = enlace.ruta;
    link.textContent = enlace.texto;

    if (enlace.ruta === window.location.pathname) {
      link.setAttribute("aria-current", "page");
    }

    if (enlace.ruta === "/src/pages/store/cart/cart.html") {
      link.id = "cart-link";
    }

    elemento.appendChild(link);
    lista.appendChild(elemento);
  }

  const elementoSalir = document.createElement("li");
  const botonSalir = document.createElement("button");

  botonSalir.type = "button";
  botonSalir.className = "logout-button";
  botonSalir.textContent = "Cerrar sesión";
  botonSalir.addEventListener("click", cerrarSesion);

  elementoSalir.appendChild(botonSalir);
  lista.appendChild(elementoSalir);
  navegacion.appendChild(lista);

  encabezado.append(titulo, saludo, navegacion);

  // Reemplaza el encabezado anterior si la función se ejecuta nuevamente.
  contenedor.replaceChildren(encabezado);

  if (usuario.rol === "USUARIO") {
    actualizarContadorCarrito(usuario.id);
  }
}

# Food Store — Frontend

Trabajo Práctico Integrador de Programación III de la Tecnicatura Universitaria en Programación a Distancia.

**Autor** Facundo Villarroel.

## Descripción

Aplicación web de pedidos de comida desarrollada con TypeScript, Vite y Tailwind CSS. Permite consultar el catálogo, gestionar un carrito, confirmar compras y administrar categorías, productos y pedidos.

El frontend funciona de forma independiente del backend de consola. En esta iteración consume archivos JSON locales mediante `fetch()`. La conexión con una API REST queda prevista para una iteración futura.

## Tecnologías

- TypeScript.
- Vite.
- HTML5.
- Tailwind CSS 4, integrado mediante `@tailwindcss/vite`.
- API de almacenamiento `localStorage` del navegador.

## Requisitos

- Node.js 22.12 o superior.
- npm.
- Navegador moderno actualizado.
- Acceso a Internet para instalar dependencias y cargar las imágenes externas del catálogo.

## Instalación y ejecución

Abrir una terminal en la raíz de este repositorio e instalar las dependencias.

```bash
npm install
```

Iniciar el servidor de desarrollo.

```bash
npm run dev
```

Abrir la dirección que indique Vite en la terminal. Habitualmente es `http://localhost:5173`.

## Compilación y vista previa

Comprobar TypeScript y generar la versión de producción en `dist/`.

```bash
npm run build
```

Servir la versión compilada para probarla localmente.

```bash
npm run preview
```

Abrir la dirección indicada en la terminal. Las páginas deben ejecutarse a través del servidor para que funcionen las consultas a los JSON.

## Credenciales de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `admin@admin.com` | `123456` |
| Cliente | `cliente@food.com` | `cliente123` |

Las credenciales se consultan en `public/data/usuarios.json`. Al iniciar sesión se guardan los datos del usuario en `localStorage`, excluyendo su contraseña.

El registro permite crear temporalmente un cliente con rol `USUARIO` e inicia sesión automáticamente. Sus credenciales permanecen únicamente en memoria y se pierden al navegar o recargar. La sesión iniciada se conserva hasta cerrarla. Después de cerrar esa sesión, el usuario temporal debe registrarse nuevamente para ingresar.

## Funcionalidades

### Cliente

- Login, registro y cierre de sesión.
- Catálogo con filtro por categoría, búsqueda por nombre y ordenamiento por nombre o precio.
- Detalle de producto con cantidad y validación de stock.
- Carrito individual por usuario, con actualización de cantidades, eliminación de productos y vaciado.
- Checkout con teléfono y forma de pago.
- Historial de pedidos propios, ordenados del más reciente al más antiguo.
- Modal con estado, productos, cantidades, teléfono e importes del pedido.

### Administrador

- Dashboard con totales de categorías, productos, pedidos y productos disponibles.
- Resumen de categorías y productos activos o dados de baja, productos fuera de venta y pedidos por estado.
- Alta, edición y baja lógica de categorías y productos.
- Listado de todos los pedidos, identificación del cliente y filtro por estado.
- Consulta del detalle y cambio de estado desde el modal.
- Acceso al catálogo y al detalle de los productos.

Cada pantalla protegida verifica la sesión y el rol antes de cargar su contenido. La autenticación y los permisos se simulan en el navegador con fines educativos.

## Datos y persistencia

Los datos iniciales se encuentran en `public/data/`.

| Archivo | Contenido |
| --- | --- |
| `categorias.json` | 5 categorías |
| `productos.json` | 19 productos |
| `usuarios.json` | 2 usuarios, uno por rol |
| `pedidos.json` | 3 pedidos de prueba |

La lectura y adaptación de estos archivos está centralizada en `src/utils/api.ts`.

| Información | Almacenamiento y duración |
| --- | --- |
| Sesión | `localStorage`, hasta cerrar sesión o eliminar los datos del navegador |
| Carrito | `localStorage`, separado por ID de usuario |
| Pedidos confirmados por el cliente | `localStorage`, disponibles después de recargar |
| Credenciales de clientes registrados temporalmente | Memoria de la página |
| Altas, ediciones y bajas administrativas de categorías y productos | Memoria de la página |
| Cambios administrativos de estado de pedidos | Memoria de la página |

Las modificaciones administrativas se descartan al navegar o recargar. Los JSON originales conservan sus datos. Este comportamiento corresponde al alcance de esta iteración del TPI.

El stock se valida al agregar productos, modificar cantidades y confirmar la compra. El frontend conserva el inventario de los datos de prueba. La actualización persistente del stock forma parte del backend de consola.

## Envío y cálculo de importes

Las compras nuevas tienen un envío fijo de **$1000**, definido en `src/config.ts` mediante `COSTO_ENVIO`.

- Subtotal de cada producto = precio unitario × cantidad.
- Subtotal del pedido = suma de los subtotales de sus productos.
- Total del pedido = subtotal del pedido + envío.

Los importes se muestran en pesos argentinos. Los pedidos históricos del JSON conservan sus importes y tienen envío de $0, porque sus totales originales coinciden con la suma de sus detalles.

## Adaptación de los JSON

La capa de lectura transforma las relaciones anidadas del material de la cátedra en identificadores usados por la interfaz.

- `producto.categoria.id` se convierte en `categoriaId`.
- `pedido.usuarioDto.id` se convierte en `idUsuario`.
- `detalle.producto.id` se convierte en `idProducto`.
- Los campos `eliminado` ausentes se inicializan en `false`.
- Las categorías originales sin imagen se muestran con el texto “Sin imagen”.

Los estados se unifican con los exigidos por el TPI.

| Estado original | Estado utilizado |
| --- | --- |
| `ENTREGADO` | `TERMINADO` |
| `EN_PREPARACION` | `CONFIRMADO` |
| `PENDIENTE` | `PENDIENTE` |

Los pedidos nuevos comienzan en `PENDIENTE`. Los estados disponibles son `PENDIENTE`, `CONFIRMADO`, `TERMINADO` y `CANCELADO`.

Para los detalles históricos se conserva el subtotal registrado. El precio unitario histórico se obtiene dividiendo ese subtotal por la cantidad, ya que puede diferir del precio del catálogo incluido en el JSON.

## Organización del código

| Ruta | Responsabilidad |
| --- | --- |
| `src/pages/auth/` | Login y registro |
| `src/pages/store/` | Catálogo, detalle y carrito |
| `src/pages/client/orders/` | Historial del cliente |
| `src/pages/admin/` | Dashboard y gestión administrativa |
| `src/types/` | Interfaces y tipos del dominio |
| `src/utils/` | Lectura de datos, sesión, almacenamiento, carrito, pedidos y componentes compartidos |
| `src/config.ts` | Configuración del envío |
| `src/style.css` | Tema visual y componentes compartidos de Tailwind CSS |

Cada pantalla carga su propio módulo TypeScript. `vite.config.ts` declara las entradas HTML de la aplicación multipágina.

## Video y documentación del TPI

[Enlace al video de presentación](https://youtu.be/sl-H9z2PtGE)

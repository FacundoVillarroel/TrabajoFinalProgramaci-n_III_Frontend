import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  appType: "mpa",
  build: {
    rollupOptions: {
      /* Declaro las páginas de la web */
      input: [
        "index.html",
        "src/pages/auth/login/login.html",
        "src/pages/auth/register/register.html",
        "src/pages/store/home/home.html",
        "src/pages/store/productDetail/productDetail.html",
        "src/pages/store/cart/cart.html",
        "src/pages/client/orders/orders.html",
        "src/pages/admin/adminHome/adminHome.html",
        "src/pages/admin/categories/categories.html",
        "src/pages/admin/products/products.html",
        "src/pages/admin/orders/orders.html",
      ],
    },
  },
});
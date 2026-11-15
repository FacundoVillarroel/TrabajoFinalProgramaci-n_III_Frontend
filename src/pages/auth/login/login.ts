import { iniciarSesion, obtenerSesion, redirigirPorRol } from "../../../utils/auth";

const form = document.getElementById("login-form") as HTMLFormElement;
const inputEmail = document.getElementById("email") as HTMLInputElement;
const inputPassword = document.getElementById("password") as HTMLInputElement;
const message = document.getElementById("message") as HTMLParagraphElement;
const loginButton = document.getElementById("login-button") as HTMLButtonElement;

const usuarioActual = obtenerSesion();

if (usuarioActual) {
  redirigirPorRol(usuarioActual);
}

form.addEventListener("submit", async (event: SubmitEvent) => {
  event.preventDefault();

  message.textContent = "";
  message.className = "message";

  // Bloqueamos el botón mientras se consulta el JSON para evitar envíos repetidos.
  loginButton.disabled = true;
  loginButton.textContent = "Ingresando...";

  try {
    const usuario = await iniciarSesion(inputEmail.value, inputPassword.value);
    redirigirPorRol(usuario);
  } catch (error) {
    if (error instanceof Error) {
      message.textContent = error.message;
    } else {
      message.textContent = "No se pudo iniciar sesión. Intentá nuevamente.";
    }

    message.className = "message error";
  } finally {
    // También se ejecuta cuando falla la consulta o las credenciales son incorrectas.
    loginButton.disabled = false;
    loginButton.textContent = "Ingresar";
  }
});
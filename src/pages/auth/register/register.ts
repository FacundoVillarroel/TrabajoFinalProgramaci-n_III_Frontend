import {
  obtenerSesion,
  redirigirPorRol,
  registrarUsuario,
} from "../../../utils/auth";

const form = document.getElementById("register-form") as HTMLFormElement;
const inputName = document.getElementById("name") as HTMLInputElement;
const inputEmail = document.getElementById("email") as HTMLInputElement;
const inputPassword = document.getElementById("password") as HTMLInputElement;
const inputRepeatPassword = document.getElementById(
  "repeat-password",
) as HTMLInputElement;
const message = document.getElementById("message") as HTMLParagraphElement;
const registerButton = document.getElementById(
  "register-button",
) as HTMLButtonElement;

const usuarioActual = obtenerSesion();

if (usuarioActual) {
  redirigirPorRol(usuarioActual);
}

form.addEventListener("submit", async (event: SubmitEvent) => {
  event.preventDefault();

  message.textContent = "";
  message.className = "message";

  if (inputPassword.value !== inputRepeatPassword.value) {
    message.textContent = "Las contraseñas no coinciden.";
    message.className = "message error";
    return;
  }

  // Evita solicitudes repetidas mientras verifica el email en el JSON.
  registerButton.disabled = true;
  registerButton.textContent = "Creando cuenta...";

  try {
    const usuario = await registrarUsuario({
      nombre: inputName.value,
      mail: inputEmail.value,
      password: inputPassword.value,
    });

    // El registro ya guardó la sesión y asignó el rol USUARIO.
    redirigirPorRol(usuario);
  } catch (error) {
    if (error instanceof Error) {
      message.textContent = error.message;
    } else {
      message.textContent = "No se pudo crear la cuenta. Intentá nuevamente.";
    }

    message.className = "message error";
  } finally {
    registerButton.disabled = false;
    registerButton.textContent = "Registrarme";
  }
});

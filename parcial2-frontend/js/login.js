document.addEventListener("DOMContentLoaded", () => {
  const auth = Auth.getAuth();
  if (auth) {
    window.location.href = "todos.html";
    return;
  }

  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = (document.getElementById("username").value || "").trim();
    const password = (document.getElementById("password").value || "").trim();

    const valid = Auth.USERS.find(u => u.username === username && u.password === password);
    if (!valid) {
      errorEl.textContent = "Usuario o contraseña incorrectos.";
      return;
    }
    Auth.setAuth(valid);
    window.location.href = "todos.html";
  });
});

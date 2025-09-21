const EXTERNAL_URL = "https://dummyjson.com/c/28e8-a101-22-11";

document.addEventListener("DOMContentLoaded", () => {
  const auth = Auth.getAuth();
  if (!auth) {
    window.location.href = "index.html";
    return;
  }
  document.getElementById("welcome").textContent = `Hola, ${auth.username}`;

  const logoutBtn = document.getElementById("logout-btn");
  const form = document.getElementById("task-form");
  const input = document.getElementById("task-text");
  const errorEl = document.getElementById("task-error");
  const list = document.getElementById("task-list");
  const template = document.getElementById("task-item-template");

  const storeKey = `userTasks_${auth.username}`;
  let userTasks = loadTasks();
  let externalTasks = [];
  let merged = [];

  render();
  fetchExternal();

  logoutBtn.addEventListener("click", () => {
    Auth.clearAuth();
    window.location.href = "index.html";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (input.value || "").trim();
    const validation = validateText(text, userTasks);
    if (validation !== true) {
      errorEl.textContent = validation;
      return;
    }
    errorEl.textContent = "";
    const task = {
      id: cryptoRandom(),
      text,
      done: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    userTasks.push(task);
    persist();
    input.value = "";
    render();
  });

  function loadTasks(){
    try {
      const raw = localStorage.getItem(storeKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function persist(){
    localStorage.setItem(storeKey, JSON.stringify(userTasks));
  }

  function render(){
    list.innerHTML = "";
    merged = [...userTasks, ...externalTasks];

    merged.sort((a,b) => Number(a.createdAt) - Number(b.createdAt));

    for (const t of merged) {
      const node = template.content.firstElementChild.cloneNode(true);
      node.dataset.id = t.id;
      node.classList.toggle("done", !!t.done);

      const cb = node.querySelector('[data-role="toggle"]');
      const textEl = node.querySelector('[data-role="text"]');
      const createdEl = node.querySelector('[data-role="created"]');
      const editBtn = node.querySelector('[data-role="edit"]');
      const delBtn = node.querySelector('[data-role="delete"]');

      textEl.textContent = t.text;
      createdEl.dateTime = new Date(normalizeTs(t.createdAt)).toISOString();
      createdEl.textContent = new Date(normalizeTs(t.createdAt)).toLocaleString();

      const isExternal = !userTasks.find(ut => ut.id === t.id);
      cb.checked = !!t.done;
      cb.disabled = isExternal;
      editBtn.disabled = isExternal;
      delBtn.disabled = isExternal;

      cb.addEventListener("change", () => {
        const idx = userTasks.findIndex(x => x.id === t.id);
        if (idx >= 0) {
          userTasks[idx].done = cb.checked;
          userTasks[idx].updatedAt = Date.now();
          persist();
          render();
        }
      });

      editBtn.addEventListener("click", () => {
        const current = userTasks.find(x => x.id === t.id);
        if (!current) return;
        const next = prompt("Editar texto de la tarea:", current.text) || "";
        const trimmed = next.trim();
        const v = validateText(trimmed, userTasks, current.id);
        if (v !== true) {
          alert(v);
          return;
        }
        current.text = trimmed;
        current.updatedAt = Date.now();
        persist();
        render();
      });

      delBtn.addEventListener("click", () => {
        if (confirm("¿Eliminar esta tarea?")) {
          userTasks = userTasks.filter(x => x.id !== t.id);
          persist();
          render();
        }
      });

      list.appendChild(node);
    }
  }

  async function fetchExternal(){
    try {
      const res = await fetch(EXTERNAL_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        externalTasks = data.map(x => ({
          id: x.id,
          text: String(x.text ?? "").trim(),
          done: !!x.done,
          createdAt: x.createdAt ?? 0,
          updatedAt: x.updatedAt ?? 0
        }));
        render();
      }
    } catch (err) {
      console.error("Error obteniendo datos externos:", err);
    }
  }

  function validateText(text, currentTasks, excludeId = null){
    if (!text) return "El texto no puede estar vacío.";
    if (/^\d+$/.test(text)) return "El texto no puede ser solo números.";
    if (text.length < 10) return "Mínimo 10 caracteres.";
    const lower = text.toLowerCase();
    const exists = currentTasks.some(t => t.id !== excludeId && t.text.toLowerCase() === lower);
    if (exists) return "Ya existe una tarea con ese texto.";
    return true;
  }

  function normalizeTs(ts){
    const n = Number(ts);
    return n < 1e11 ? n * 1000 : n;
  }

  function cryptoRandom(){
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "id-" + Math.random().toString(36).slice(2, 10);
  }
});

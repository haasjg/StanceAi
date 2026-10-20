const $ = (selector) => document.querySelector(selector);
const authScreen = $("#auth-screen");
const appScreen = $("#app-screen");
let signup = false;
let busy = false;

async function api(path, options = {}) {
  const response = await fetch(`/api/${path}`, { credentials: "same-origin", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("visible");
  window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove("visible"), 3200);
}
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function addMessage(role, text) {
  $("#welcome")?.remove();
  const message = document.createElement("article"); message.className = `message ${role}`;
  const label = role === "user" ? "YOU" : "STANCEAI";
  message.innerHTML = `<span class="message-label">${label}</span><div class="message-body">${escapeHTML(text).replace(/\n/g, "<br>")}</div>`;
  $("#messages").append(message); message.scrollIntoView({ block: "end", behavior: "smooth" });
}
function showApp() { authScreen.classList.add("hidden"); appScreen.classList.remove("hidden"); }
function showAuth() { appScreen.classList.add("hidden"); authScreen.classList.remove("hidden"); }
async function loadDocuments() {
  const { documents } = await api("documents");
  const list = $("#document-list"); list.replaceChildren();
  for (const doc of documents) {
    const li = document.createElement("li"); li.className = "document-item";
    li.innerHTML = `<span class="file-icon">↳</span><span class="document-name" title="${escapeHTML(doc.name)}">${escapeHTML(doc.name)}</span><button type="button" class="remove-document" aria-label="Remove ${escapeHTML(doc.name)}">×</button>`;
    li.querySelector("button").addEventListener("click", async () => {
      try { await api(`documents/${encodeURIComponent(doc.id)}`, { method: "DELETE" }); await loadDocuments(); showToast("Document removed."); }
      catch (error) { showToast(error.message); }
    });
    list.append(li);
  }
}
async function loadMessages() {
  const { messages } = await api("messages");
  if (!messages.length) return;
  $("#welcome")?.remove();
  for (const item of messages) addMessage(item.role, item.body);
}
async function boot() {
  try { await api("me"); showApp(); await Promise.all([loadDocuments(), loadMessages()]); }
  catch { showAuth(); }
}

$("#auth-switch").addEventListener("click", () => {
  signup = !signup;
  $("#auth-submit").innerHTML = signup ? 'Create account <span aria-hidden="true">↗</span>' : 'Sign in <span aria-hidden="true">↗</span>';
  $("#switch-label").textContent = signup ? "Already have an account?" : "New to StanceAI?";
  $("#auth-switch").textContent = signup ? "Sign in" : "Create an account";
  $("#auth-form [name=password]").autocomplete = signup ? "new-password" : "current-password";
  $("#auth-error").textContent = "";
});
$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault(); if (busy) return; busy = true;
  const button = $("#auth-submit"); button.disabled = true; $("#auth-error").textContent = "";
  const payload = Object.fromEntries(new FormData(event.currentTarget));
  try { await api(signup ? "signup" : "login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); await boot(); }
  catch (error) { $("#auth-error").textContent = error.message; }
  finally { busy = false; button.disabled = false; }
});
$("#logout").addEventListener("click", async () => { await api("logout", { method: "POST" }); $("#messages").innerHTML = $("#welcome")?.outerHTML || ""; showAuth(); });
$("#document-file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  const form = new FormData(); form.append("file", file);
  try { await api("documents", { method: "POST", body: form }); await loadDocuments(); showToast("Source added to your workspace."); }
  catch (error) { showToast(error.message); }
  finally { event.target.value = ""; }
});
$("#chat-form").addEventListener("submit", async (event) => {
  event.preventDefault(); if (busy) return;
  const input = $("#chat-input"); const prompt = input.value.trim(); if (!prompt) return;
  input.value = ""; addMessage("user", prompt); busy = true;
  const button = $("#send-button"); button.disabled = true;
  const thinking = document.createElement("p"); thinking.className = "thinking"; thinking.textContent = "Thinking through it…"; $("#messages").append(thinking);
  try { const result = await api("chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: prompt }) }); thinking.remove(); addMessage("assistant", result.answer); $("#usage-label").textContent = `${result.remaining} free messages left today`; }
  catch (error) { thinking.remove(); addMessage("assistant", error.message); }
  finally { busy = false; button.disabled = false; input.focus(); }
});
$(".suggestions").addEventListener("click", (event) => { const button = event.target.closest("[data-prompt]"); if (button) { $("#chat-input").value = button.dataset.prompt; $("#chat-input").focus(); } });
$("#chat-input").addEventListener("input", (event) => { event.target.style.height = "auto"; event.target.style.height = `${Math.min(event.target.scrollHeight, 180)}px`; });
boot();

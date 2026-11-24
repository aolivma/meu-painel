const form = document.getElementById("form");
const titleInput = document.getElementById("title");
const urlInput = document.getElementById("url");
const categoryInput = document.getElementById("category");
const categoryOptions = document.getElementById("category-options");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit");

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind ? `status ${kind}` : "status";
}

async function init() {
  const links = await Store.init();

  categoryOptions.replaceChildren();
  for (const name of categoriesOf(links)) {
    const option = document.createElement("option");
    option.value = name;
    categoryOptions.append(option);
  }

  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = (tab && tab.url) || "";
    if (/^https?:/i.test(url)) {
      titleInput.value = (tab && tab.title) || url;
      urlInput.value = url;
    } else {
      setStatus("Não é possível salvar esta página.", "warn");
      submitBtn.disabled = true;
    }
  }

  titleInput.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const rawUrl = urlInput.value.trim();
  const title = titleInput.value.trim() || rawUrl;
  if (!rawUrl || !title) return;

  const url = normalizeUrl(rawUrl);
  const category = categoryInput.value.trim();

  submitBtn.disabled = true;
  const links = await Store.init();

  if (links.some((link) => link.url === url)) {
    setStatus("Este link já está salvo.", "warn");
    submitBtn.disabled = false;
    return;
  }

  links.push({ id: crypto.randomUUID(), title, url, category });
  await Store.save(links);

  setStatus("Adicionado a meus links!", "ok");
  setTimeout(() => window.close(), 700);
});

init();

const grid = document.getElementById("grid");
const chipsBar = document.getElementById("chips");
const empty = document.getElementById("empty");
const dialog = document.getElementById("dialog");
const dialogHeading = document.getElementById("dialog-heading");
const form = document.getElementById("form");
const titleInput = document.getElementById("input-title");
const urlInput = document.getElementById("input-url");
const categoryInput = document.getElementById("input-category");
const categoryOptions = document.getElementById("category-options");
const iconUrlInput = document.getElementById("input-icon-url");
const iconFileInput = document.getElementById("input-icon-file");
const iconNoneBtn = document.getElementById("icon-none");
const iconResetBtn = document.getElementById("icon-reset");
const iconPreview = document.getElementById("icon-preview");
const cardColorInput = document.getElementById("input-card-color");
const cardColorHexInput = document.getElementById("input-card-color-hex");
const cardColorResetBtn = document.getElementById("card-color-reset");
const cancelBtn = document.getElementById("cancel-btn");
const contextMenu = document.getElementById("context-menu");
const contextDeleteBtn = document.getElementById("context-delete");
const settingsBtn = document.getElementById("settings-btn");
const settingsDialog = document.getElementById("settings-dialog");
const settingsForm = document.getElementById("settings-form");
const settingsResetBtn = document.getElementById("settings-reset");
const settingsCancelBtn = document.getElementById("settings-cancel");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFileInput = document.getElementById("import-file");
const backupStatus = document.getElementById("backup-status");
const bgColorInput = document.getElementById("setting-bg");
const bgHexInput = document.getElementById("setting-bg-hex");
const cardSizeInput = document.getElementById("setting-card-size");
const cardSizeValue = document.getElementById("card-size-value");
const toggleIconBtn = document.getElementById("toggle-icon");
const toggleTitleBtn = document.getElementById("toggle-title");
const toggleHostBtn = document.getElementById("toggle-host");
const privacyLink = document.getElementById("privacy-link");

// URL pública da política, a mesma informada no Chrome Web Store.
// Se ficar vazia, a cópia incluída na extensão (privacy.html) é aberta.
const PRIVACY_URL = "";

const ALL = "__all__";
const UNCATEGORIZED = "__none__";
const DEFAULT_SETTINGS = {
  bg: "#0d0f14",
  cardMin: 180,
  showIcon: true,
  showTitle: true,
  showHost: true,
};
const CARD_MIN_RANGE = { min: 50, max: 320 };

let links = [];
let iconMap = {};
let autoIconMap = {};
const failedAutoIcons = new Set();
let activeCategory = ALL;
let editingId = null;
let editingLink = null;
let pendingIcon = null;
let pendingNoIcon = false;
let pendingDefault = false;
let draggingEl = null;
let contextLinkId = null;
let confirmingDelete = false;
let settings = { ...DEFAULT_SETTINGS };

function normalizeHex(value) {
  let text = String(value || "").trim().toLowerCase();
  if (!text.startsWith("#")) text = `#${text}`;
  const short = /^#([0-9a-f]{3})$/.exec(text);
  if (short) {
    return `#${short[1].split("").map((char) => char + char).join("")}`;
  }
  const full = /^#([0-9a-f]{6})$/.exec(text);
  return full ? `#${full[1]}` : "";
}

function clampCardMin(value) {
  const size = Number(value);
  if (!Number.isFinite(size)) return DEFAULT_SETTINGS.cardMin;
  return Math.min(CARD_MIN_RANGE.max, Math.max(CARD_MIN_RANGE.min, Math.round(size)));
}

function isLightColor(hex) {
  const color = normalizeHex(hex);
  if (!color) return false;
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function glowFor(hex) {
  const color = normalizeHex(hex);
  if (!color) return "";
  const channels = [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16));
  const mixed = channels.map((channel) => Math.round(channel + (255 - channel) * 0.25));
  return `rgba(${mixed.join(", ")}, 0.16)`;
}

function shadeColor(hex, amount) {
  const color = normalizeHex(hex);
  if (!color) return "";
  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.abs(amount);
  const mixed = [1, 3, 5].map((index) => {
    const channel = parseInt(color.slice(index, index + 2), 16);
    return Math.round(channel + (target - channel) * ratio);
  });
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function currentDefaultCardColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--card").trim();
  return normalizeHex(value) || "#171a21";
}

function applyCardColor(card, value) {
  const color = normalizeHex(value);
  if (!color) return;
  const light = isLightColor(color);
  card.style.setProperty("--card-bg", color);
  card.style.setProperty("--card-bg-hover", shadeColor(color, light ? -0.08 : 0.12));
  card.style.setProperty("--card-text", light ? "#16181d" : "#f4f6fb");
  card.style.setProperty(
    "--muted",
    light ? "rgba(22, 24, 29, 0.62)" : "rgba(244, 246, 251, 0.7)"
  );
  card.style.setProperty("--overlay", light ? "rgba(255, 255, 255, 0.8)" : "rgba(13, 15, 20, 0.55)");
  card.style.setProperty("--avatar-bg", light ? "rgba(0, 0, 0, 0.07)" : "rgba(255, 255, 255, 0.14)");
  card.style.setProperty("--tag-bg", light ? "rgba(0, 0, 0, 0.07)" : "rgba(255, 255, 255, 0.14)");
  card.style.setProperty("--tag-color", light ? "#16181d" : "#f4f6fb");
}

function setToggle(button, enabled) {
  button.setAttribute("aria-checked", String(enabled));
}

function applySettings(value) {
  const config = value || {};
  const root = document.documentElement;
  const bg = normalizeHex(config.bg) || DEFAULT_SETTINGS.bg;
  const cardMin = clampCardMin(config.cardMin);

  if (bg === DEFAULT_SETTINGS.bg) {
    root.style.removeProperty("--bg");
    root.style.removeProperty("--bg-glow");
  } else {
    root.style.setProperty("--bg", bg);
    root.style.setProperty("--bg-glow", glowFor(bg));
  }
  root.style.setProperty("--card-min", `${cardMin}px`);
  root.classList.toggle("light", isLightColor(bg));
  root.classList.toggle("hide-icons", config.showIcon === false);
  root.classList.toggle("hide-titles", config.showTitle === false);
  root.classList.toggle("hide-hosts", config.showHost === false);
}

function syncSettingsInputs(value) {
  const config = value || {};
  const bg = normalizeHex(config.bg) || DEFAULT_SETTINGS.bg;
  const cardMin = clampCardMin(config.cardMin);
  bgColorInput.value = bg;
  bgHexInput.value = bg.toUpperCase();
  cardSizeInput.value = String(cardMin);
  cardSizeValue.textContent = `${cardMin} px`;
  setToggle(toggleIconBtn, config.showIcon !== false);
  setToggle(toggleTitleBtn, config.showTitle !== false);
  setToggle(toggleHostBtn, config.showHost !== false);
}

function readSettingsInputs() {
  return {
    bg: normalizeHex(bgHexInput.value) || bgColorInput.value || DEFAULT_SETTINGS.bg,
    cardMin: clampCardMin(cardSizeInput.value),
    showIcon: toggleIconBtn.getAttribute("aria-checked") === "true",
    showTitle: toggleTitleBtn.getAttribute("aria-checked") === "true",
    showHost: toggleHostBtn.getAttribute("aria-checked") === "true",
  };
}

function previewSettings() {
  applySettings(readSettingsInputs());
}

settingsBtn.addEventListener("click", () => {
  syncSettingsInputs(settings);
  settingsDialog.showModal();
});

bgColorInput.addEventListener("input", () => {
  bgHexInput.value = bgColorInput.value.toUpperCase();
  previewSettings();
});

bgHexInput.addEventListener("input", () => {
  const bg = normalizeHex(bgHexInput.value);
  if (!bg) return;
  bgColorInput.value = bg;
  previewSettings();
});

bgHexInput.addEventListener("blur", () => {
  const bg = normalizeHex(bgHexInput.value) || bgColorInput.value || DEFAULT_SETTINGS.bg;
  bgHexInput.value = bg.toUpperCase();
  bgColorInput.value = bg;
  previewSettings();
});

cardSizeInput.addEventListener("input", () => {
  cardSizeValue.textContent = `${clampCardMin(cardSizeInput.value)} px`;
  previewSettings();
});

for (const button of [toggleIconBtn, toggleTitleBtn, toggleHostBtn]) {
  button.addEventListener("click", () => {
    setToggle(button, button.getAttribute("aria-checked") !== "true");
    previewSettings();
  });
}

settingsResetBtn.addEventListener("click", () => {
  syncSettingsInputs(DEFAULT_SETTINGS);
  applySettings(DEFAULT_SETTINGS);
});

settingsCancelBtn.addEventListener("click", () => {
  applySettings(settings);
  settingsDialog.close();
});

settingsDialog.addEventListener("cancel", () => applySettings(settings));

settingsForm.addEventListener("submit", async () => {
  settings = readSettingsInputs();
  applySettings(settings);
  await Store.saveSettings(settings);
});

function setBackupStatus(message, kind = "") {
  backupStatus.hidden = !message;
  backupStatus.textContent = message;
  backupStatus.className = "backup-status" + (kind ? ` ${kind}` : "");
}

function sanitizeImportedSettings(raw) {
  const config = raw && typeof raw === "object" ? raw : {};
  return {
    bg: normalizeHex(config.bg) || DEFAULT_SETTINGS.bg,
    cardMin: clampCardMin(config.cardMin),
    showIcon: config.showIcon !== false,
    showTitle: config.showTitle !== false,
    showHost: config.showHost !== false,
  };
}

function sanitizeImportedLinks(rawLinks) {
  if (!Array.isArray(rawLinks)) return null;
  const seen = new Set();
  const result = [];
  for (const raw of rawLinks) {
    if (!raw || typeof raw !== "object") continue;
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const rawUrl = typeof raw.url === "string" ? raw.url.trim() : "";
    if (!title || !rawUrl) continue;
    let id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : crypto.randomUUID();
    while (seen.has(id)) id = crypto.randomUUID();
    seen.add(id);
    result.push({
      id,
      title,
      url: normalizeUrl(rawUrl),
      category: typeof raw.category === "string" ? raw.category.trim() : "",
      icon: raw.icon === "none" ? "none" : typeof raw.icon === "string" ? raw.icon : "",
      color: normalizeHex(raw.color),
    });
  }
  return result;
}

function sanitizeImportedIconMap(raw, ids, allowUrl) {
  const result = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [id, value] of Object.entries(raw)) {
    if (!ids.has(id) || typeof value !== "string") continue;
    const valid = allowUrl
      ? /^(https?:\/\/|data:image\/)/i.test(value)
      : /^data:image\//i.test(value);
    if (valid) result[id] = value;
  }
  return result;
}

exportBtn.addEventListener("click", async () => {
  try {
    const backup = {
      app: "meu-painel",
      format: 1,
      exportedAt: new Date().toISOString(),
      settings: readSettingsInputs(),
      links,
      icons: await Store.getIcons(),
      autoIcons: await Store.getAutoIcons(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `meu-painel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupStatus(`Backup exportado com ${links.length} link(s).`, "ok");
  } catch {
    setBackupStatus("Não foi possível exportar o backup.", "error");
  }
});

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsText(file);
  });
}

function prepareBackup(data) {
  const importedLinks =
    data && typeof data === "object" && Array.isArray(data.links)
      ? sanitizeImportedLinks(data.links)
      : null;
  if (!importedLinks) return null;
  const ids = new Set(importedLinks.map((link) => link.id));
  return {
    links: importedLinks,
    settings: sanitizeImportedSettings(data.settings),
    icons: sanitizeImportedIconMap(data.icons, ids, false),
    autoIcons: sanitizeImportedIconMap(data.autoIcons, ids, true),
  };
}

async function applyBackup(backup) {
  links = backup.links;
  await Store.save(links);

  settings = backup.settings;
  applySettings(settings);
  syncSettingsInputs(settings);
  await Store.saveSettings(settings);

  const currentIcons = await Store.getIcons();
  for (const id of Object.keys(currentIcons)) {
    if (!(id in backup.icons)) await Store.removeIcon(id);
  }
  for (const [id, value] of Object.entries(backup.icons)) {
    await Store.setIcon(id, value);
  }
  iconMap = { ...backup.icons };

  const currentAutoIcons = await Store.getAutoIcons();
  for (const id of Object.keys(currentAutoIcons)) {
    if (!(id in backup.autoIcons)) await Store.removeAutoIcon(id);
  }
  for (const [id, value] of Object.entries(backup.autoIcons)) {
    await Store.setAutoIcon(id, value);
  }
  autoIconMap = { ...backup.autoIcons };
  failedAutoIcons.clear();

  render();
  resolveIcons();
  return links.length;
}

importBtn.addEventListener("click", () => {
  importFileInput.value = "";
  importFileInput.click();
});

importFileInput.addEventListener("change", async () => {
  const file = importFileInput.files && importFileInput.files[0];
  if (!file) return;

  let data;
  try {
    data = JSON.parse(await readTextFile(file));
  } catch {
    setBackupStatus("Arquivo inválido: não foi possível ler o JSON.", "error");
    importFileInput.value = "";
    return;
  }

  const backup = prepareBackup(data);
  if (!backup) {
    setBackupStatus("Arquivo inválido: formato de backup não reconhecido.", "error");
    importFileInput.value = "";
    return;
  }

  const confirmed = window.confirm(
    `Importar ${backup.links.length} link(s)? Os links e configurações atuais serão substituídos.`
  );
  if (!confirmed) {
    setBackupStatus("Importação cancelada.", "");
    importFileInput.value = "";
    return;
  }

  try {
    const count = await applyBackup(backup);
    setBackupStatus(`Backup importado: ${count} link(s) e configurações restauradas.`, "ok");
  } catch {
    setBackupStatus("Não foi possível importar o backup.", "error");
  } finally {
    importFileInput.value = "";
  }
});

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function faviconUrl(url) {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
    return `${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(url)}&size=64`;
  }
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
}

function categories() {
  return categoriesOf(links);
}

function setAvatar(el, letter, src, fallbackSrc) {
  el.textContent = letter;
  if (!src) return;

  const img = document.createElement("img");
  img.className = "favicon";
  img.alt = "";
  img.draggable = false;
  img.addEventListener("error", () => {
    if (fallbackSrc && img.src !== fallbackSrc) img.src = fallbackSrc;
    else img.remove();
  });
  img.src = src;
  el.append(img);
}

function processIconFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const source = new Image();
      source.onerror = () => reject(new Error("decode failed"));
      source.onload = () => {
        const size = 96;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        const scale = Math.min(size / source.width, size / source.height);
        const width = Math.max(1, Math.round(source.width * scale));
        const height = Math.max(1, Math.round(source.height * scale));
        context.drawImage(source, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      source.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function visibleLinks() {
  if (activeCategory === ALL) return links;
  if (activeCategory === UNCATEGORIZED) return links.filter((link) => !link.category);
  return links.filter((link) => link.category === activeCategory);
}

function renderChips() {
  const names = categories();
  const hasUncategorized = links.some((link) => !link.category);
  const items = [[ALL, "Todas"], ...names.map((name) => [name, name])];
  if (hasUncategorized) items.push([UNCATEGORIZED, "Sem categoria"]);

  if (!items.some(([value]) => value === activeCategory)) activeCategory = ALL;

  chipsBar.replaceChildren();
  chipsBar.hidden = names.length === 0 && !hasUncategorized;

  for (const [value, label] of items) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = value === activeCategory ? "chip active" : "chip";
    chip.textContent = label;
    chip.addEventListener("click", () => {
      activeCategory = value;
      render();
    });
    chipsBar.append(chip);
  }
}

function render() {
  renderChips();
  const visible = visibleLinks();

  grid.replaceChildren();
  for (const link of visible) grid.append(buildCard(link));
  grid.append(buildAddCard());

  empty.hidden = visible.length > 0;
  empty.textContent =
    links.length === 0
      ? "Nenhum link por aqui ainda. Use o card + para criar o primeiro."
      : "Nenhum link nesta categoria.";
}

function buildAddCard() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "add-card";
  button.title = "Adicionar link";

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = "+";

  const label = document.createElement("span");
  label.className = "add-label";
  label.textContent = "Adicionar link";

  button.append(avatar, label);
  button.addEventListener("click", () => openDialog());
  return button;
}

function buildCard(link) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = link.id;
  card.draggable = true;
  applyCardColor(card, link.color);

  const anchor = document.createElement("a");
  anchor.className = "card-link";
  anchor.href = link.url;
  anchor.draggable = false;

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  if (link.icon === "none") {
    setAvatar(avatar, "", "", "");
  } else {
    const fallback = faviconUrl(link.url);
    const custom = iconMap[link.id] || link.icon || "";
    const src = custom || autoIconMap[link.id] || fallback;
    setAvatar(avatar, (link.title.trim().charAt(0) || "?").toUpperCase(), src, fallback);
  }

  const title = document.createElement("span");
  title.className = "title";
  title.textContent = link.title;

  const host = document.createElement("span");
  host.className = "host";
  host.textContent = hostnameOf(link.url);

  anchor.append(avatar, title, host);

  if (link.category) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = link.category;
    anchor.append(tag);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "icon-btn";
  editBtn.title = "Editar";
  editBtn.textContent = "✎";
  editBtn.addEventListener("click", () => openDialog(link));

  actions.append(editBtn);
  card.append(anchor, actions);

  card.addEventListener("contextmenu", (event) => openContextMenu(event, link.id));

  card.addEventListener("dragstart", (event) => {
    draggingEl = card;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", link.id);
  });

  card.addEventListener("dragend", async () => {
    card.classList.remove("dragging");
    draggingEl = null;
    const ids = [...grid.querySelectorAll(".card")].map((item) => item.dataset.id);
    links = applyVisibleOrder(ids);
    await Store.save(links);
    render();
  });

  return card;
}

function applyVisibleOrder(domIds) {
  const visible = new Set(domIds);
  const byId = new Map(links.map((link) => [link.id, link]));
  let index = 0;
  return links.map((link) => (visible.has(link.id) ? byId.get(domIds[index++]) : link));
}

function currentPreviewSrc() {
  if (pendingIcon) return pendingIcon;
  const typed = iconUrlInput.value.trim();
  if (typed) return normalizeUrl(typed);
  if (editingLink && editingLink.icon !== "none") {
    if (iconMap[editingLink.id]) return iconMap[editingLink.id];
    if (editingLink.icon) return editingLink.icon;
  }
  return "";
}

function isNoIconState() {
  if (pendingDefault) return false;
  if (pendingNoIcon) return true;
  if (pendingIcon) return false;
  if (iconUrlInput.value.trim()) return false;
  return editingLink ? editingLink.icon === "none" : false;
}

function previewFallbackSrc() {
  const typed = urlInput.value.trim();
  const url = typed ? normalizeUrl(typed) : editingLink ? editingLink.url : "";
  if (!url) return "";
  if (editingLink && !typed) {
    const auto = autoIconMap[editingLink.id];
    if (auto) return auto;
  }
  return faviconUrl(url);
}

function updatePreview() {
  if (isNoIconState()) {
    setAvatar(iconPreview, "", "", "");
    return;
  }
  const letter = (titleInput.value.trim().charAt(0) || "?").toUpperCase();
  const custom = currentPreviewSrc();
  const fallback = previewFallbackSrc();
  setAvatar(iconPreview, letter, custom || fallback, custom ? fallback : "");
}

function openDialog(link = null) {
  editingId = link ? link.id : null;
  editingLink = link;
  pendingIcon = null;
  pendingNoIcon = link ? link.icon === "none" : false;
  pendingDefault = false;
  dialogHeading.textContent = link ? "Editar link" : "Adicionar link";
  titleInput.value = link ? link.title : "";
  urlInput.value = link ? link.url : "";
  categoryInput.value = link
    ? link.category || ""
    : activeCategory !== ALL && activeCategory !== UNCATEGORIZED
      ? activeCategory
      : "";
  iconUrlInput.value = link && link.icon !== "none" ? link.icon || "" : "";
  iconFileInput.value = "";
  const cardColor = link ? normalizeHex(link.color) : "";
  cardColorHexInput.value = cardColor ? cardColor.toUpperCase() : "";
  cardColorInput.value = cardColor || currentDefaultCardColor();
  updatePreview();

  categoryOptions.replaceChildren();
  for (const name of categories()) {
    const option = document.createElement("option");
    option.value = name;
    categoryOptions.append(option);
  }

  dialog.showModal();
  titleInput.focus();
}

async function removeLink(id) {
  links = links.filter((link) => link.id !== id);
  delete iconMap[id];
  delete autoIconMap[id];
  failedAutoIcons.delete(id);
  await Store.removeIcon(id);
  await Store.removeAutoIcon(id);
  await Store.save(links);
  render();
}

grid.addEventListener("dragover", (event) => {
  if (!draggingEl) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const target = event.target.closest(".card");
  if (!target || target === draggingEl) return;
  const rect = target.getBoundingClientRect();
  const before = event.clientX < rect.left + rect.width / 2;
  grid.insertBefore(draggingEl, before ? target : target.nextSibling);
});

grid.addEventListener("drop", (event) => event.preventDefault());

form.addEventListener("submit", async () => {
  const title = titleInput.value.trim();
  const rawUrl = urlInput.value.trim();
  const category = categoryInput.value.trim();
  if (!title || !rawUrl) return;
  const url = normalizeUrl(rawUrl);
  const iconUrl = iconUrlInput.value.trim();
  const icon = pendingNoIcon ? "none" : pendingIcon ? "" : iconUrl ? normalizeUrl(iconUrl) : "";
  const color = normalizeHex(cardColorHexInput.value);
  const id = editingId || crypto.randomUUID();

  if (editingId) {
    const link = links.find((item) => item.id === editingId);
    if (link) {
      if (link.url !== url) {
        delete autoIconMap[id];
        failedAutoIcons.delete(id);
        await Store.removeAutoIcon(id);
      }
      link.title = title;
      link.url = url;
      link.category = category;
      link.icon = icon;
      link.color = color;
    }
  } else {
    links.push({ id, title, url, category, icon, color });
  }

  if (pendingIcon) {
    iconMap[id] = pendingIcon;
    await Store.setIcon(id, pendingIcon);
  } else {
    delete iconMap[id];
    await Store.removeIcon(id);
  }

  editingId = null;
  editingLink = null;
  pendingIcon = null;
  pendingNoIcon = false;
  pendingDefault = false;
  form.reset();
  await Store.save(links);
  render();
  resolveIcons();
});

titleInput.addEventListener("input", updatePreview);
urlInput.addEventListener("input", updatePreview);

cardColorInput.addEventListener("input", () => {
  cardColorHexInput.value = cardColorInput.value.toUpperCase();
});

cardColorHexInput.addEventListener("input", () => {
  const color = normalizeHex(cardColorHexInput.value);
  if (color) cardColorInput.value = color;
});

cardColorHexInput.addEventListener("blur", () => {
  const color = normalizeHex(cardColorHexInput.value);
  cardColorHexInput.value = color ? color.toUpperCase() : "";
  if (color) cardColorInput.value = color;
});

cardColorResetBtn.addEventListener("click", () => {
  cardColorHexInput.value = "";
  cardColorInput.value = currentDefaultCardColor();
});

iconUrlInput.addEventListener("input", () => {
  pendingIcon = null;
  pendingNoIcon = false;
  pendingDefault = false;
  updatePreview();
});

iconFileInput.addEventListener("change", async () => {
  const file = iconFileInput.files && iconFileInput.files[0];
  if (!file) return;
  try {
    pendingIcon = await processIconFile(file);
    pendingNoIcon = false;
    pendingDefault = false;
    iconUrlInput.value = "";
    updatePreview();
  } catch {
    pendingIcon = null;
  }
});

iconNoneBtn.addEventListener("click", () => {
  pendingNoIcon = true;
  pendingIcon = null;
  pendingDefault = false;
  iconUrlInput.value = "";
  iconFileInput.value = "";
  updatePreview();
});

iconResetBtn.addEventListener("click", () => {
  pendingNoIcon = false;
  pendingIcon = null;
  pendingDefault = true;
  iconUrlInput.value = "";
  iconFileInput.value = "";
  updatePreview();
});

cancelBtn.addEventListener("click", () => dialog.close());

function openContextMenu(event, id) {
  event.preventDefault();
  contextLinkId = id;
  confirmingDelete = false;
  contextDeleteBtn.textContent = "Excluir link";

  contextMenu.hidden = false;
  const rect = contextMenu.getBoundingClientRect();
  const x = Math.min(event.clientX, window.innerWidth - rect.width - 8);
  const y = Math.min(event.clientY, window.innerHeight - rect.height - 8);
  contextMenu.style.left = `${Math.max(8, x)}px`;
  contextMenu.style.top = `${Math.max(8, y)}px`;
}

function closeContextMenu() {
  contextMenu.hidden = true;
  contextLinkId = null;
  confirmingDelete = false;
}

contextDeleteBtn.addEventListener("click", async () => {
  if (!contextLinkId) return;
  if (!confirmingDelete) {
    confirmingDelete = true;
    contextDeleteBtn.textContent = "Confirmar exclusão?";
    return;
  }
  const id = contextLinkId;
  closeContextMenu();
  await removeLink(id);
});

document.addEventListener("click", (event) => {
  if (!contextMenu.hidden && !contextMenu.contains(event.target)) closeContextMenu();
});

document.addEventListener("contextmenu", (event) => {
  if (!contextMenu.hidden && !event.target.closest(".card")) closeContextMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeContextMenu();
});

window.addEventListener("scroll", closeContextMenu, true);
window.addEventListener("blur", closeContextMenu);

let reloadTimer = null;
Store.onChanged(() => {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(async () => {
    if (draggingEl || dialog.open || settingsDialog.open) return;
    settings = await Store.getSettings();
    applySettings(settings);
    links = await Store.init();
    iconMap = await Store.getIcons();
    autoIconMap = await Store.getAutoIcons();
    render();
    resolveIcons();
  }, 150);
});

function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { credentials: "omit", redirect: "follow", signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function safeUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return "";
  }
}

function parseSizes(value) {
  if (!value) return 0;
  let best = 0;
  for (const part of value.split(/\s+/)) {
    const match = /^(\d+)x(\d+)$/i.exec(part.trim());
    if (match) best = Math.max(best, parseInt(match[1], 10), parseInt(match[2], 10));
  }
  return best;
}

function collectCandidates(doc, base) {
  const candidates = [];
  for (const el of doc.querySelectorAll('link[rel~="apple-touch-icon"], link[rel~="icon"]')) {
    const href = el.getAttribute("href");
    if (!href) continue;
    const resolved = safeUrl(href, base);
    if (!resolved || !/^https?:/i.test(resolved)) continue;
    const rel = (el.getAttribute("rel") || "").toLowerCase();
    const type = (el.getAttribute("type") || "").toLowerCase();
    const isApple = rel.includes("apple-touch-icon");
    const isSvg = type.includes("svg") || /\.svg(\?|#|$)/i.test(resolved);
    let score = parseSizes(el.getAttribute("sizes"));
    if (score) {
      if (isSvg) score += 50;
    } else {
      score = isApple ? 180 : isSvg ? 256 : 32;
    }
    candidates.push({ url: resolved, score });
  }
  return candidates;
}

async function resolveSiteIcon(pageUrl) {
  try {
    const response = await fetchWithTimeout(pageUrl, 8000);
    if (!response.ok) return "";
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType && !contentType.includes("html")) return "";

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const baseEl = doc.querySelector("base[href]");
    const base =
      (baseEl && safeUrl(baseEl.getAttribute("href"), response.url)) || response.url || pageUrl;

    const candidates = collectCandidates(doc, base);

    const manifestEl = doc.querySelector('link[rel="manifest"]');
    if (manifestEl) {
      const manifestUrl = safeUrl(manifestEl.getAttribute("href"), base);
      if (manifestUrl && /^https?:/i.test(manifestUrl)) {
        try {
          const manifestResponse = await fetchWithTimeout(manifestUrl, 8000);
          if (manifestResponse.ok) {
            const manifest = await manifestResponse.json();
            const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
            for (const icon of icons) {
              if (!icon || !icon.src) continue;
              const resolved = safeUrl(icon.src, manifestUrl);
              if (!resolved || !/^https?:/i.test(resolved)) continue;
              const isSvg = (icon.type || "").includes("svg") || /\.svg(\?|#|$)/i.test(resolved);
              let score = parseSizes(icon.sizes);
              if (score) {
                if (isSvg) score += 50;
              } else {
                score = isSvg ? 256 : 64;
              }
              candidates.push({ url: resolved, score });
            }
          }
        } catch {}
      }
    }

    if (!candidates.length) return "";
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].url;
  } catch {
    return "";
  }
}

const iconQueue = [];
const queuedIconIds = new Set();
let activeFetches = 0;

function resolveIcons() {
  for (const link of links) {
    if (iconMap[link.id] || link.icon) continue;
    if (link.id in autoIconMap) continue;
    if (failedAutoIcons.has(link.id)) continue;
    if (queuedIconIds.has(link.id)) continue;
    queuedIconIds.add(link.id);
    iconQueue.push(link);
  }
  pumpIconQueue();
}

function pumpIconQueue() {
  while (activeFetches < 3 && iconQueue.length) {
    const link = iconQueue.shift();
    activeFetches += 1;
    resolveSiteIcon(link.url)
      .then(async (iconUrl) => {
        if (!links.some((item) => item.id === link.id)) return;
        if (iconUrl) {
          autoIconMap[link.id] = iconUrl;
          await Store.setAutoIcon(link.id, iconUrl);
          refreshCardIcon(link.id);
        } else {
          failedAutoIcons.add(link.id);
        }
      })
      .catch(() => failedAutoIcons.add(link.id))
      .finally(() => {
        queuedIconIds.delete(link.id);
        activeFetches -= 1;
        pumpIconQueue();
      });
  }
}

function refreshCardIcon(id) {
  const card = grid.querySelector(`.card[data-id="${id}"]`);
  const auto = autoIconMap[id];
  if (!card || !auto) return;
  const link = links.find((item) => item.id === id);
  if (!link || iconMap[id] || link.icon) return;
  const img = card.querySelector(".favicon");
  if (!img) return;
  img.src = auto;
}

if (privacyLink) {
  privacyLink.addEventListener("click", (event) => {
    event.preventDefault();
    const url =
      PRIVACY_URL ||
      (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL("privacy.html")
        : "privacy.html");
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener");
    }
  });
}

async function start() {
  settings = await Store.getSettings();
  applySettings(settings);
  links = await Store.init();
  iconMap = await Store.getIcons();
  autoIconMap = await Store.getAutoIcons();
  render();
  resolveIcons();
}

start();

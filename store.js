const LINK_PREFIX = "link:";
const ORDER_KEY = "order";
const MODE_KEY = "mode";
const ICON_PREFIX = "icon:";
const AUTO_ICON_PREFIX = "autoicon:";
const SETTINGS_KEY = "settings";

const Store = (() => {
  const isExtension =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.sync &&
    chrome.storage.local;

  let mode = isExtension ? "sync" : "browser";
  let snapshot = [];

  const clone = (records) => records.map((record) => ({ ...record }));

  async function readBrowser() {
    try {
      const raw = localStorage.getItem("mylinks.links");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async function readSync() {
    const all = await chrome.storage.sync.get(null);
    const records = [];
    let order = [];
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith(LINK_PREFIX)) records.push(value);
      else if (key === ORDER_KEY && Array.isArray(value)) order = value;
    }
    const byId = new Map(
      records.filter((record) => record && record.id).map((record) => [record.id, record])
    );
    const ordered = [];
    for (const id of order) {
      const record = byId.get(id);
      if (record) {
        ordered.push(record);
        byId.delete(id);
      }
    }
    for (const record of byId.values()) ordered.push(record);
    return ordered;
  }

  async function writeAllSync(records) {
    const payload = {};
    for (const record of records) payload[LINK_PREFIX + record.id] = record;
    payload[ORDER_KEY] = records.map((record) => record.id);
    await chrome.storage.sync.set(payload);
  }

  async function init() {
    if (mode === "browser") {
      snapshot = await readBrowser();
      return clone(snapshot);
    }

    const stored = await chrome.storage.local.get({ [MODE_KEY]: null, links: [] });
    const legacy = Array.isArray(stored.links) ? stored.links : [];

    if (stored[MODE_KEY] === "local") {
      mode = "local";
      snapshot = legacy;
      return clone(snapshot);
    }

    try {
      const synced = await readSync();
      if (synced.length) {
        snapshot = synced;
        return clone(snapshot);
      }
      if (legacy.length) {
        await writeAllSync(legacy);
        await chrome.storage.local.remove("links");
        snapshot = legacy;
        return clone(snapshot);
      }
    } catch {
      mode = "local";
      snapshot = legacy;
      return clone(snapshot);
    }

    snapshot = [];
    return [];
  }

  async function save(records) {
    if (mode === "browser") {
      localStorage.setItem("mylinks.links", JSON.stringify(records));
      snapshot = clone(records);
      return;
    }

    if (mode === "local") {
      await chrome.storage.local.set({ links: records });
      snapshot = clone(records);
      return;
    }

    try {
      const previous = new Map(snapshot.map((record) => [record.id, record]));
      const next = new Map(records.map((record) => [record.id, record]));
      const payload = {};
      const removals = [];

      for (const [id, record] of next) {
        if (JSON.stringify(previous.get(id)) !== JSON.stringify(record)) {
          payload[LINK_PREFIX + id] = record;
        }
      }
      for (const id of previous.keys()) {
        if (!next.has(id)) removals.push(LINK_PREFIX + id);
      }

      const order = records.map((record) => record.id);
      if (JSON.stringify(order) !== JSON.stringify(snapshot.map((record) => record.id))) {
        payload[ORDER_KEY] = order;
      }

      if (Object.keys(payload).length) await chrome.storage.sync.set(payload);
      if (removals.length) await chrome.storage.sync.remove(removals);
    } catch {
      mode = "local";
      await chrome.storage.local.set({ [MODE_KEY]: "local", links: records });
    }

    snapshot = clone(records);
  }

  async function collectLocal(prefix) {
    const values = {};
    if (mode === "browser") {
      const keyPrefix = "mylinks." + prefix;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(keyPrefix)) {
          values[key.slice(keyPrefix.length)] = localStorage.getItem(key);
        }
      }
      return values;
    }
    const all = await chrome.storage.local.get(null);
    for (const [key, value] of Object.entries(all)) {
      if (key.startsWith(prefix)) values[key.slice(prefix.length)] = value;
    }
    return values;
  }

  async function setLocal(key, value) {
    if (mode === "browser") {
      localStorage.setItem("mylinks." + key, value);
      return;
    }
    await chrome.storage.local.set({ [key]: value });
  }

  async function removeLocal(key) {
    if (mode === "browser") {
      localStorage.removeItem("mylinks." + key);
      return;
    }
    await chrome.storage.local.remove(key);
  }

  const getIcons = () => collectLocal(ICON_PREFIX);
  const getAutoIcons = () => collectLocal(AUTO_ICON_PREFIX);
  const setIcon = (id, dataUrl) => setLocal(ICON_PREFIX + id, dataUrl);
  const removeIcon = (id) => removeLocal(ICON_PREFIX + id);
  const setAutoIcon = (id, url) => setLocal(AUTO_ICON_PREFIX + id, url);
  const removeAutoIcon = (id) => removeLocal(AUTO_ICON_PREFIX + id);

  async function getSettings() {
    if (mode === "browser") {
      try {
        const raw = localStorage.getItem("mylinks.settings");
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    }
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    return stored[SETTINGS_KEY] || {};
  }

  async function saveSettings(value) {
    if (mode === "browser") {
      localStorage.setItem("mylinks.settings", JSON.stringify(value));
      return;
    }
    await chrome.storage.local.set({ [SETTINGS_KEY]: value });
  }

  function onChanged(handler) {
    if (mode === "browser") {
      if (typeof window !== "undefined") window.addEventListener("storage", handler);
      return;
    }
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === mode) return handler();
      if (
        areaName === "local" &&
        Object.keys(changes).some(
          (key) => key.startsWith(ICON_PREFIX) || key === SETTINGS_KEY
        )
      ) {
        handler();
      }
    });
  }

  return {
    init,
    save,
    getIcons,
    getAutoIcons,
    setIcon,
    removeIcon,
    setAutoIcon,
    removeAutoIcon,
    getSettings,
    saveSettings,
    onChanged,
  };
})();

function normalizeUrl(value) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function categoriesOf(records) {
  return [...new Set(records.map((record) => record.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

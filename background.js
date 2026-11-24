importScripts("store.js");

const MENU_ID = "add-to-my-links";

function registerMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Adicionar a meus links",
      contexts: ["page", "action"],
    });
  });
}

chrome.runtime.onInstalled.addListener(registerMenu);
chrome.runtime.onStartup.addListener(registerMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const url = info.pageUrl || (tab && tab.url) || "";
  if (!/^https?:/i.test(url)) return;

  const links = await Store.init();
  if (links.some((link) => link.url === url)) return;

  const title = (tab && tab.title) || url;
  links.push({ id: crypto.randomUUID(), title, url, category: "" });
  await Store.save(links);
});

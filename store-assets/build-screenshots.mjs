#!/usr/bin/env node
// Gera os screenshots 1280x800 da Chrome Web Store a partir das capturas em docs/assets/screenshots.
// Uso: node store-assets/build-screenshots.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "docs/assets/screenshots");
const outDir = join(root, "store-assets/screenshots");
const tmpDir = join(root, "store-assets/.render");
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const img = (name) => pathToFileURL(join(src, name)).href;
const icon = pathToFileURL(join(root, "docs/icon128.png")).href;

const check = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

const baseCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1280px; height: 800px; overflow: hidden; }
  body {
    position: relative;
    background: #0d0f14;
    color: #e9ebf0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  body::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(900px 520px at 22% -12%, rgba(91, 140, 255, .20), transparent 62%),
      radial-gradient(720px 500px at 102% 112%, rgba(91, 140, 255, .10), transparent 66%);
    pointer-events: none;
  }
  .brand {
    position: absolute;
    top: 34px;
    left: 56px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 2;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .brand img { display: block; width: 34px; height: 34px; border-radius: 9px; }
  .content { position: relative; z-index: 1; height: 100%; }
  .frame {
    border: 1px solid #2b3140;
    border-radius: 16px;
    background: #0a0c11;
    box-shadow: 0 32px 90px rgba(0, 0, 0, .5);
    overflow: hidden;
  }
  .frame img { display: block; }
  h1 { font-size: 42px; line-height: 1.08; letter-spacing: -0.03em; }
  .sub { margin-top: 13px; font-size: 18px; line-height: 1.5; color: #8b93a7; }
`;

const layoutA = (title, sub, shotHtml, extras = "") => `
  <div class="content a-main">
    <header class="a-head">
      <h1>${title}</h1>
      <p class="sub">${sub}</p>
    </header>
    ${shotHtml}
    ${extras}
  </div>
  <style>
    .a-main {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 84px 60px 40px;
    }
    .a-head { max-width: 840px; text-align: center; }
    .a-head h1 { font-size: 44px; }
    .pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 4px; }
    .pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border: 1px solid #262b36;
      border-radius: 999px;
      background: rgba(23, 26, 33, .75);
      color: #c6cbd8;
      font-size: 15px;
      font-weight: 500;
    }
    .pill svg { color: #5b8cff; }
  </style>
`;

const layoutB = (title, sub, bullets, shotHtml) => `
  <div class="content b-main">
    <div class="b-copy">
      <h1>${title}</h1>
      <p class="sub">${sub}</p>
      <ul class="b-list">
        ${bullets.map((b) => `<li>${check}<span>${b}</span></li>`).join("")}
      </ul>
    </div>
    <div class="b-shot">${shotHtml}</div>
  </div>
  <style>
    .b-main {
      display: grid;
      grid-template-columns: 470px 1fr;
      align-items: center;
      gap: 56px;
      padding: 96px 64px 48px;
    }
    .b-copy h1 { font-size: 42px; }
    .b-list { list-style: none; display: grid; gap: 13px; margin-top: 26px; }
    .b-list li { display: flex; align-items: flex-start; gap: 11px; font-size: 16.5px; line-height: 1.45; color: #c6cbd8; }
    .b-list svg { flex: 0 0 auto; margin-top: 2px; color: #5b8cff; }
    .b-shot { position: relative; display: grid; place-items: center; }
    .b-shot::before {
      content: "";
      position: absolute;
      width: 540px;
      height: 540px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(91, 140, 255, .18), transparent 66%);
    }
    .b-shot .frame { position: relative; }
  </style>
`;

const page = (body, extraCss = "") => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<style>${baseCss}${extraCss}</style>
</head>
<body>
<header class="brand"><img src="${icon}" alt="" />Meu Painel</header>
${body}
</body>
</html>`;

const configs = [
  {
    file: "01-nova-aba.png",
    html: page(
      layoutA(
        "Sua nova aba, do seu jeito",
        "Todos os seus links favoritos em cards, organizados por categorias.",
        `<figure class="frame" style="max-width:100%"><img src="${img("02-painel.png")}" alt="" style="height:560px;width:auto" /></figure>`
      )
    ),
  },
  {
    file: "02-adicionar-popup.png",
    html: page(
      layoutA(
        "Adicione a página atual em um clique",
        "O popup já vem com título, URL e categoria prontos para salvar.",
        `<figure class="frame" style="width:1040px"><img src="${img("01-popup.png")}" alt="" style="width:100%;height:auto" /></figure>`,
        `<div class="pills">
          <span class="pill">${check}Título e URL automáticos</span>
          <span class="pill">${check}Categoria em um clique</span>
          <span class="pill">${check}Nada é enviado ao desenvolvedor</span>
        </div>`
      )
    ),
  },
  {
    file: "03-adicionar-link.png",
    html: page(
      layoutB(
        "Crie links com categorias",
        "Salve qualquer site e mantenha o painel organizado.",
        ["Ícone automático do site", "Imagem personalizada", "Categoria opcional"],
        `<figure class="frame"><img src="${img("05-adicionar.png")}" alt="" style="height:620px;width:auto" /></figure>`
      )
    ),
  },
  {
    file: "04-editar-link.png",
    html: page(
      layoutB(
        "Edite qualquer detalhe",
        "Atualize um link sem precisar apagar e criar de novo.",
        ["Título e URL", "Categoria", "Ícone próprio ou favicon", "Cor do card"],
        `<figure class="frame"><img src="${img("04-editar.png")}" alt="" style="height:620px;width:auto" /></figure>`
      )
    ),
  },
  {
    file: "05-personalizar.png",
    html: page(
      layoutB(
        "Personalize cada detalhe",
        "Deixe o painel com a sua cara e faça backup quando quiser.",
        ["Cor de fundo e dos cards", "Tamanho dos cards", "Mostrar ícone, título e URL", "Exportar e importar JSON"],
        `<figure class="frame"><img src="${img("03-personalizar.png")}" alt="" style="height:620px;width:auto" /></figure>`
      )
    ),
  },
];

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

for (const config of configs) {
  const htmlPath = join(tmpDir, config.file.replace(/\.png$/, ".html"));
  writeFileSync(htmlPath, config.html);
  const output = join(outDir, config.file);
  execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1280,800",
    "--virtual-time-budget=3000",
    `--screenshot=${output}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: "ignore" });
  console.log("gerado:", output);
}

rmSync(tmpDir, { recursive: true, force: true });
console.log("pronto.");

#!/usr/bin/env node
// Monta o ZIP de upload da Chrome Web Store com apenas os arquivos da extensão.
// Uso: node store-assets/build-package.mjs
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const staging = join(root, "store-assets/.package");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const output = join(root, `store-assets/meu-painel-${manifest.version}.zip`);

const files = [
  "manifest.json",
  "background.js",
  "store.js",
  "newtab.html",
  "newtab.js",
  "style.css",
  "popup.html",
  "popup.js",
  "popup.css",
  "LICENSE",
];
const dirs = ["icons"];
const nested = [["docs/privacy.html", "docs/privacy.html"]];

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

for (const file of files) cpSync(join(root, file), join(staging, file));
for (const dir of dirs) cpSync(join(root, dir), join(staging, dir), { recursive: true });
for (const [from, to] of nested) {
  mkdirSync(dirname(join(staging, to)), { recursive: true });
  cpSync(join(root, from), join(staging, to));
}

execFileSync("find", [staging, "-name", ".DS_Store", "-delete"]);
rmSync(output, { force: true });
execFileSync("zip", ["-qr", output, "."], { cwd: staging });
rmSync(staging, { recursive: true, force: true });

if (!existsSync(output)) throw new Error("Falha ao gerar o ZIP");
console.log("pacote:", output);
console.log("versão:", manifest.version);

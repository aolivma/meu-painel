# Assets da Chrome Web Store

Materiais prontos para upload no Developer Dashboard.

## Screenshots (1280×800)

| Arquivo | Tela | Origem |
| --- | --- | --- |
| `screenshots/01-nova-aba.png` | Nova aba com os cards | `docs/assets/screenshots/02-painel.png` |
| `screenshots/02-adicionar-popup.png` | Popup salvando a página atual | `docs/assets/screenshots/01-popup.png` |
| `screenshots/03-adicionar-link.png` | Diálogo “Adicionar link” | `docs/assets/screenshots/05-adicionar.png` |
| `screenshots/04-editar-link.png` | Diálogo “Editar link” | `docs/assets/screenshots/04-editar.png` |
| `screenshots/05-personalizar.png` | Diálogo “Personalizar” | `docs/assets/screenshots/03-personalizar.png` |

Todos em PNG 24 bits, sem transparência, 1280×800, abaixo de 300 KB — dentro dos
requisitos da Chrome Web Store (1280×800 ou 640×400; até 5 imagens).

## Imagens promocionais (opcionais)

| Arquivo | Formato | Onde usar |
| --- | --- | --- |
| `promo/tile-440x280.png` | 440×280 PNG | “Small promo tile” na listagem |
| `promo/marquee-1400x560.png` | 1400×560 PNG | “Marquee” na parte superior da loja |

Ambas em PNG 24 bits, sem transparência. O tile é renderizado em 2× e reduzido para
manter o texto nítido.

## Textos da listagem

Os textos prontos para colar no formulário (nome, descrição curta e descrição detalhada) estão em
[`listing-pt-br.md`](listing-pt-br.md).

## Regenerar

As imagens são montadas em HTML e capturadas pelo Chrome headless:

```bash
node store-assets/build-screenshots.mjs
```

Requisitos: Google Chrome instalado no caminho padrão do macOS (ou defina `CHROME=/caminho/do/chrome`).

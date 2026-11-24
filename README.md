# Meu Painel

Extensão para Google Chrome (Manifest V3) que substitui a página de nova aba por um painel de links favoritos exibidos em cards.

## Funcionalidades

- Página de nova aba personalizada com seus links em cards
- Adição rápida do site atual pelo popup da extensão ou pelo menu de contexto
- Categorias com filtros rápidos
- Ícones automáticos (favicon) ou personalizados por URL/arquivo
- Cores de fundo e dos cards configuráveis, com tamanho dos cards ajustável
- Opções de exibição: ícone, título e endereço do site
- Exportação e importação de backup em JSON
- Dados armazenados apenas localmente no navegador (`chrome.storage` / `localStorage`)

## Instalação (modo desenvolvedor)

1. Baixe ou clone este repositório:
   ```bash
   git clone https://github.com/aolivma/meu-painel.git
   ```
2. Abra `chrome://extensions` no Google Chrome.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto.
5. Abra uma nova aba.

## Estrutura

| Arquivo | Descrição |
| --- | --- |
| `manifest.json` | Configuração da extensão (Manifest V3) |
| `newtab.html` / `newtab.js` / `style.css` | Página de nova aba (painel de links) |
| `popup.html` / `popup.js` / `popup.css` | Popup para adicionar o site atual |
| `background.js` | Service worker e menu de contexto |
| `store.js` | Camada de armazenamento local |
| `docs/privacy.html` | Política de privacidade (publicada no GitHub Pages) |
| `docs/index.html` | Página inicial do site publicado |
| `docs/icon128.png` | Ícone usado na página publicada |
| `docs/assets/screenshots/` | Capturas reais da extensão usadas na página inicial |
| `icons/` | Ícones da extensão |

## Privacidade

A extensão não envia dados ao desenvolvedor. Títulos, URLs e preferências ficam armazenados apenas no seu navegador. Veja [docs/privacy.html](docs/privacy.html) ou a versão publicada em <https://aolivma.github.io/meu-painel/privacy.html>.

## Licença

Distribuído sob a licença Apache 2.0. Veja [LICENSE](LICENSE).

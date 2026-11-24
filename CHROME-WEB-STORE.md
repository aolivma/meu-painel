# Chrome Web Store — privacidade e textos para o formulário

Checklist e textos prontos para colar no Developer Dashboard, alinhados ao código atual
(`manifest.json` 1.7.1, `popup.js`, `background.js`, `store.js`, `newtab.js`) e à política
em [`docs/privacy.html`](docs/privacy.html).

---

## 1. Antes de publicar a política

1. Contato já preenchido em `docs/privacy.html` (blocos PT e EN): **Amanda Oliveira de Lima** /
   **amandaoliveiradelima@gmail.com**. Se mudar, atualize os dois blocos.
2. O `manifest.json` já aponta `homepage_url` para a URL real do projeto:
   `https://aolivma.github.io/meu-painel/` (mesma base onde a política é publicada).
3. Publique em uma URL **pública, sem login, sem 404 e sem redirecionar para outra página**.
4. Informe essa URL em **Developer Dashboard → seu item → Store listing → Privacy practices →
   Privacy policy URL**.
5. Confira que a política, o formulário da loja e o comportamento real da extensão dizem a mesma
   coisa. Divergência entre eles é motivo de remoção (Listing Requirements, item 3).

### Opções de hospedagem (URL pública)

| Opção | Como | URL típica |
| --- | --- | --- |
| **GitHub Pages** (recomendado) | Repositório público → Settings → Pages → Deploy from branch → `main` / `/docs` | `https://aolivma.github.io/meu-painel/privacy.html` |
| **Netlify Drop** | Arraste uma pasta com `privacy.html` em <https://app.netlify.com/drop> | `https://nome-aleatorio.netlify.app/privacy.html` |
| **Cloudflare Pages** | Upload direto ou conexão com o repositório | `https://projeto.pages.dev/privacy.html` |

> O repositório precisa ser público para o GitHub Pages no plano gratuito. Não use links do
> Google Docs/Drive que exijam login, nem URLs de pré-visualização que mudam.

---

## 2. Campo “Single purpose” (propósito único)

**PT-BR**

> Substituir a página de nova aba do Chrome por um painel pessoal de links favoritos, no qual o
> usuário salva a página atual (título e endereço) como um cartão e pode personalizar ícone,
> categoria e aparência.

**EN**

> Replace Chrome's New Tab page with a personal dashboard of favorite links, where the user saves the
> current page (title and URL) as a card and can customize its icon, category, and appearance.

---

## 3. Justificativa das permissões

Preencha cada campo do formulário de permissões. Sugestão em inglês (idioma da revisão) com nota em
português.

### `storage`
> **EN:** Used to save the user's links, icons, and appearance settings in `chrome.storage.sync`
> and `chrome.storage.local`, so the dashboard persists and can sync across the user's devices.
> No data is sent to the developer.
>
> **PT:** Salva links, ícones e ajustes no armazenamento do Chrome. Nada é enviado ao desenvolvedor.

### `favicon`
> **EN:** Used to display each saved site's icon from Chrome's local favicon cache
> (`chrome://favicon`), avoiding external requests for icons.
>
> **PT:** Exibe o ícone do site a partir do cache local de favicons do Chrome.

### `activeTab`
> **EN:** Grants temporary access to the active tab only when the user clicks the extension icon or
> uses its context-menu item, so the popup can prefill the title and URL of the page the user chose
> to save.
>
> **PT:** Dá acesso temporário à aba ativa somente no clique do usuário, para preencher o formulário.

### `contextMenus`
> **EN:** Adds the “Adicionar a meus links” item to the page context menu, so the user can save the
> current page without opening the popup.
>
> **PT:** Adiciona o item “Adicionar a meus links” ao menu de contexto.

### Host permission `<all_urls>`
> **EN:** The extension lets the user save a link from any website, so it cannot know the host in
> advance. The host permission is used for two things: (1) reading the URL and title of the tab the
> user explicitly chooses to save; and (2) fetching that same saved page's HTML (and its web app
> manifest, when present) directly from the site to locate the icon the page declares. These requests
> are sent without cookies (`credentials: "omit"`), the HTML is discarded after parsing, and no data
> is transmitted to the developer or any third party.
>
> **PT:** Necessária porque o usuário pode salvar qualquer site. Serve para ler a URL/título da aba
> escolhida e baixar o HTML/manifesto do próprio site salvo para achar o ícone declarado. Sem cookies,
> HTML descartado, nada enviado ao desenvolvedor.

---

## 4. Aba “Privacy practices” — uso de dados

Marque **somente** o que se aplica:

| Categoria | Marcar? | Motivo |
| --- | --- | --- |
| Personally identifiable information | **Não** | Não há nome, e-mail, endereço ou identificador de usuário. |
| Health information | **Não** | — |
| Financial and payment information | **Não** | — |
| Authentication information | **Não** | Não lê senhas, tokens ou cookies. |
| Personal communications | **Não** | — |
| Location | **Não** | — |
| **Web history** | **Sim** | URLs das páginas que o usuário escolhe salvar. |
| User activity | **Não** | Não há analytics nem registro de cliques/navegação. |
| **Website content** | **Sim** | HTML baixado temporariamente para localizar o ícone. |

Certificações (as três devem ser marcadas como verdadeiras):

- [x] Não vendo nem transfiro dados de usuário a terceiros, fora dos casos aprovados.
- [x] Não uso nem transfiro dados para fins não relacionados ao propósito único declarado.
- [x] Não uso nem transfiro dados para determinar capacidade de crédito ou para empréstimos.

**Código remoto:** Não. Todo o JavaScript está no pacote; não há `eval`, `<script>` externo nem
execução de código baixado.

---

## 5. Descrição da loja

Textos prontos para colar (nome, descrição curta e descrição completa) em
[`store-assets/listing-pt-br.md`](store-assets/listing-pt-br.md). A descrição completa já inclui a
divulgação de privacidade exigida **antes da instalação**.

Se precisar do parágrafo de divulgação isolado (para outro idioma ou campo), use:

**PT-BR**

> **Privacidade:** para adicionar um site, o Meu Painel lê o título e o endereço da aba em que você
> clicou — somente quando você manda salvar, nunca as outras abas nem seu histórico. Ao abrir a nova
> aba, ele pode baixar o HTML de um site salvo para descobrir o ícone declarado por ele. Seus links e
> ajustes ficam no armazenamento do Chrome e, se você usa a sincronização, na sua conta do Google. O
> desenvolvedor não tem servidores, não recebe seus dados e não os vende. Política completa:
> https://aolivma.github.io/meu-painel/privacy.html

**EN**

> **Privacy:** to add a site, Meu Painel reads the title and URL of the tab you clicked — only when
> you choose to save it, never other tabs or your history. When the New Tab page opens, it may
> download a saved site's HTML to discover the icon that site declares. Your links and settings stay
> in Chrome's storage and, with sync enabled, in your Google Account. The developer has no servers,
> never receives your data, and never sells it. Full policy:
> https://aolivma.github.io/meu-painel/privacy.html

---

## 6. Declaração de Uso Limitado

Já está em `docs/privacy.html` (seção 14). O texto exigido é:

> “The use of information received from Google APIs will adhere to the Chrome Web Store User Data
> Policy, including the Limited Use requirements.”

Ela precisa estar **em um site seu** — a própria política serve. Não basta colar só no formulário.

---

## 7. Divulgação *dentro* do produto (já implementada)

A cláusula de Uso Limitado exige que a coleta de **atividade de navegação** esteja descrita de forma
destacada na página da Chrome Web Store **e na interface do produto**. Isso foi implementado em:

- **`popup.html`** — nota abaixo do campo de URL: “Lemos o título e o endereço desta aba apenas para
  salvar o link. Nada é enviado ao desenvolvedor.” (estilo `.privacy-note` em `popup.css`).
- **`newtab.html`** — link “Política de privacidade” no rodapé do diálogo “Personalizar”
  (estilo `.settings-privacy` em `style.css`).
- **`newtab.js`** — o link abre a versão pública definida em `PRIVACY_URL`; se ela estiver vazia,
  abre a cópia incluída na extensão (`docs/privacy.html`).

Mantenha esse texto alinhado com a política: se o comportamento mudar, ajuste os dois.

---

## 8. Instruções para o revisor (opcional, mas ajuda)

**PT-BR**

1. Instale a extensão. A nova aba passa a mostrar o painel (vazio no início).
2. Abra qualquer site (ex.: `https://example.com`) e clique no ícone da extensão. O título e a URL já
   vêm preenchidos; clique em “Salvar”.
3. Abra uma nova aba: o cartão aparece. O ícone é obtido primeiro do cache do Chrome e, se ausente,
   do HTML do próprio site salvo.
4. Clique com o botão direito em qualquer página → “Adicionar a meus links”. O link é salvo sem abrir
   o popup.
5. Abra “Personalizar” (engrenagem) para alterar aparência, exportar/importar JSON e testar a exclusão.
6. Nenhuma requisição é feita a servidores do desenvolvedor. Não há conta, login, anúncios ou
   analytics.

**EN**

1. Install the extension. The New Tab page becomes the dashboard (empty at first).
2. Open any site (e.g. `https://example.com`) and click the extension icon. Title and URL are
   prefilled; click “Salvar”.
3. Open a new tab: the card appears. The icon comes from Chrome's favicon cache first and, if missing,
   from the saved site's own HTML.
4. Right-click any page → “Adicionar a meus links”. The link is saved without opening the popup.
5. Open “Personalizar” (gear) to change appearance, export/import JSON, and test deletion.
6. No requests go to developer servers. There is no account, login, ads, or analytics.

---

## 9. Checklist final

- [x] `docs/privacy.html` publicado em URL pública e sem login
- [x] Contato preenchido em `docs/privacy.html` (Amanda Oliveira de Lima / e-mail)
- [x] `homepage_url` no `manifest.json` trocado pela URL real
- [x] Constante `PRIVACY_URL` em `newtab.js` preenchida com a URL pública
- [x] Data de atualização e versão iguais às do `manifest.json`
- [ ] URL da política preenchida no Developer Dashboard
- [ ] Categorias “Web history” e “Website content” marcadas; as demais desmarcadas
- [ ] Três certificações de uso limitado marcadas
- [ ] Single purpose e justificativas de permissão preenchidos
- [ ] Divulgação de privacidade na descrição da loja (antes da instalação)
- [x] Declaração de Uso Limitado publicada no site (seção 14 da política)
- [x] Divulgação na interface do produto (nota no popup + link no “Personalizar”)
- [x] Textos da listagem prontos ([`store-assets/listing-pt-br.md`](store-assets/listing-pt-br.md))
- [x] Screenshots 1280×800 prontos (5 imagens)
- [x] Tile 440×280 e marquee 1400×560 prontos
- [ ] Descrição e imagens enviadas no Developer Dashboard
- [ ] Verificação em duas etapas ativa na conta de desenvolvedor

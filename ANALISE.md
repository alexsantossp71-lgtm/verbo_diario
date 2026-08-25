# Análise Técnica — Verbo Diário

Data da análise: 25/08/2026 · Commit base: `ec0c000` (`main`)
Escopo: repositório completo + aplicação web publicada em <https://alexsantossp71-lgtm.github.io/verbo_diario/>

---

## 1. Visão geral

| Item | Situação |
|---|---|
| Estrutura | 1 arquivo monolítico `index.html` (540 linhas, 27 KB) com HTML + CSS + JS |
| Stack | HTML5, Tailwind via CDN, JS vanilla, fonte Lexend + Material Symbols |
| Backend | Nenhum — consome `https://liturgia.up.railway.app/` direto do navegador |
| Testes | 4 testes que só verificam existência de arquivos |
| CI | **Vermelho** (falha desde o último commit) |
| Deploy | GitHub Pages, funcionando |

O conceito é bom e a tipografia é agradável, mas a camada de **transformação de dados tem bugs que fazem o site exibir a liturgia incompleta em produção hoje mesmo** — o problema mais grave num app cujo único propósito é apresentar o texto litúrgico corretamente.

---

## 2. Bugs críticos (verificados em produção)

### 🔴 C1 — Trechos do Evangelho desaparecem da página

`Components.parseVerses()` divide o texto com `/(\d+)(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ])/` e **descarta `parts[0]`** (tudo o que vem antes do primeiro número de versículo casado).

Dois efeitos combinados:

1. A introdução narrativa (`"Naquele tempo, disse Jesus:"`) é sempre jogada fora.
2. Quando o número de versículo é seguido de aspa curva (`23“Ai de vós…`) — padrão constante na API para falas de Jesus — o lookahead não casa, e **o versículo inteiro some junto com tudo que o antecede**.

Evidência (Evangelho de 25/08/2026, Mt 23,23-26 — página publicada):

```
texto da API : Naquele tempo, disse Jesus: 23“Ai de vós, mestres da Lei… 24Guias cegos!…
página renderiza:                                    24 Guias cegos!…
```

101 caracteres de origem → 37 renderizados. **~63% do Evangelho do dia perdido silenciosamente.** O mesmo ocorre em qualquer dia cuja leitura comece com discurso direto.

### 🔴 C2 — Salmo responsorial não é dividido em estrofes

`PsalmSection()` faz `texto.split('—')` usando **travessão EM DASH (U+2014)**, mas a API separa as estrofes com **EN DASH (U+2013)** + `\n`.

Resultado: nenhuma divisão ocorre, as 3–4 estrofes viram um único parágrafo corrido e os **refrãos intercalados nunca são inseridos** (só sobra o do início e o do fim) — justamente a estrutura responsorial que a seção existe para representar.

Verificado: `Sl 95(96)` de hoje → 1 estrofe renderizada em vez de 3.

Bônus: a linha 362 (`const raw = ...`) é código morto, calculado e nunca usado — e usa lookbehind regex, sem suporte em Safari < 16.4.

### 🔴 C3 — Falha de API é mascarada por conteúdo falso

No `catch` do `fetchData()` o app injeta um objeto de exemplo truncado:

```js
primeiraLeitura: { referencia: "Atos 1, 1-11", texto: "No meu primeiro livro..." }
salmo:           { refrao: "O Senhor é o pastor...", ... }
```

O usuário vê "1ª Leitura (Atos 1, 1-11)" com reticências, **sem qualquer aviso de que a API caiu**. Num app de liturgia, exibir leituras erradas como se fossem as do dia é pior do que exibir um erro. O mesmo vale para uma data em que a API responda 404: o fallback aparece como se fosse a liturgia daquele dia.

Não há `AbortController`/timeout no `fetch`: se a Railway travar sem responder, o esqueleto de carregamento fica girando indefinidamente.

---

## 3. Bugs funcionais

### 🟠 F1 — Tema escuro praticamente não funciona

`toggleTheme()` adiciona `.dark` ao `<body>` e redefine variáveis CSS, mas o HTML **não tem uma única classe `dark:`** (0 ocorrências) e usa 23 cores fixas do Tailwind:

- `header`: `bg-white/90 border-gray-100` → continua branco
- modal de data: `bg-white` → branco puro sobre fundo escuro
- `aside` e `footer`: `bg-gray-50` / `bg-gray-50/50`
- numeração de versículos: `text-gray-300`, `border-gray-200`
- chips de versículo inline: `bg-gray-100 text-gray-400`
- botão "Ver Leituras": `text-white` sobre `--primary` que **no dark vira branco** → texto branco em botão branco, invisível

Ou seja: só o corpo do texto troca de cor. Cabeçalho, rodapé, sidebar e modal continuam claros.

### 🟠 F2 — `cor` litúrgica gera CSS inválido

```js
<span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
```

`color` vem da API como `"Verde"`, `"Roxo"`, `"Branco"`, `"Vermelho"` — não são cores CSS. A declaração é descartada pelo parser (confirmado: `style.backgroundColor === ""`) e a bolinha indicadora fica **sempre transparente**. Falta um mapa `Verde → #16a34a`, `Roxo → #7e22ce`, etc.

### 🟠 F3 — Tamanho de fonte não é persistido e briga com o CSS

- O tema é salvo em `localStorage` (`verbo.theme`), mas `fontIndex` **não** — a preferência de acessibilidade mais importante se perde a cada recarga.
- `applyFont()` aplica `style.fontSize` inline em **todos** os `h1`, `h2` e `section p`, sobrescrevendo as classes responsivas (`text-xl md:text-2xl`, `text-4xl md:text-6xl`). Em desktop, o texto fica **menor** no nível "A" (1.125rem) do que o `md:text-2xl` (1.5rem) definido no markup.
- A regra `body.large-text` (linha 77) é código morto — nada nunca adiciona essa classe.

### 🟠 F4 — Estado da data não vive na URL

Escolher 30/08 muda a tela, mas não a URL. Consequências: não dá para compartilhar/favoritar a liturgia de um dia, F5 volta para "hoje" e o botão "voltar" do navegador sai do site. Um `?data=2026-08-30` + `history.pushState` resolveria.

### 🟡 F5 — Modal sem acessibilidade de teclado

Sem `role="dialog"`, `aria-modal`, sem fechar no `Esc`, sem foco inicial no input nem retenção de foco. O atributo `max=""` no `<input type="date">` é vazio e inútil (resquício de uma restrição removida). Link "Evangelho de Hoje" na sidebar aponta para `href="#"` (link morto).

### 🟡 F6 — Renderização sem JS e primeira pintura

`window.onload = () => new App()` espera **todos** os recursos (Tailwind CDN, 2 famílias de fonte) antes de sequer iniciar o fetch — `DOMContentLoaded` seria bem mais rápido. Sem `<noscript>`, a página é um esqueleto cinza vazio para crawlers e usuários sem JS.

`handleScroll()` divide por `scrollHeight - clientHeight`, que é 0 em páginas curtas → `height: NaN%`.

---

## 4. Qualidade, segurança e infraestrutura

### 🔴 I1 — CI quebrado e badge enganoso

`tests/test_app.py::test_css` afirma `os.path.exists("style.css")` — **arquivo que não existe no repositório**. Reproduzi localmente:

```
..F.  [100%]
FAILED tests/test_app.py::test_css - AssertionError: assert False
```

O run `31537876265` em `main` está `failure`. O README exibe um badge de CI que hoje mostra "failing", logo abaixo do título — e o commit que introduziu isso se chama "Eleva verbo_diario para nota 9".

Ainda no workflow: falta `actions/setup-python`, o `pip install pytest` sem cache roda a cada push, e a suíte não valida absolutamente nada do comportamento real (só `os.path.exists` ×4). Um único teste de parsing de versículos teria pego o bug C1.

### 🟠 I2 — Tailwind CDN em produção

`cdn.tailwindcss.com` é explicitamente marcado pela própria Tailwind como ferramenta de desenvolvimento: baixa ~100 KB de JS, compila as classes no cliente e provoca FOUC. Para um site estático no Pages, o ideal é gerar o CSS no build (o workflow de Pages já existe e poderia rodar o `tailwindcss` CLI) ou substituir por CSS próprio — o projeto usa poucas dezenas de utilitários.

O `@import` do Lexend dentro de `<style>` bloqueia o render e não há `<link rel="preconnect">` para `fonts.gstatic.com`.

### 🟠 I3 — `innerHTML` com dados de terceiros

Todo o conteúdo da API entra via `innerHTML` sem sanitização, e `formatInlineVerses` faz `replace` com `$1` interpolado em HTML. Se a API pública for comprometida ou passar a devolver HTML, é XSS direto. Um app sem login tem impacto limitado, mas o custo de usar `textContent`/`DOMPurify` é próximo de zero.

### 🟡 I4 — Higiene do repositório

- **Sem `.gitignore`** — `tests/__pycache__/` e `.pytest_cache/` aparecem como untracked assim que se roda a suíte (aconteceu nesta análise).
- `pages.yml` publica a raiz inteira: `tests/`, `pytest.ini` e `.github/` vão para o site.
- README diz `└── index.html   # Aplicação completa` — desatualizado, ignora `tests/` e os workflows.
- Sem `favicon.ico` (404 em toda visita), sem `manifest.json`/service worker. Para um app de leitura diária, **offline-first e "adicionar à tela inicial" seriam funcionalidades naturais** e hoje não existem.
- `og:image`, `canonical` e Twitter Card ausentes → compartilhamento em redes sociais sai sem imagem.
- Rodapé com "© 2026" hardcoded.
- 12 handlers `onclick=` inline impedem uma CSP restritiva.

### 🟡 I5 — Acessibilidade (contraste)

Contrastes calculados sobre fundo branco:

| Elemento | Cor | Ratio | WCAG AA (4.5) |
|---|---|---|---|
| Número do versículo | `text-gray-300` `#d1d5db` | **1.47:1** | ✗ |
| Chip de versículo inline / labels | `text-gray-400` `#9ca3af` | **2.54:1** | ✗ |
| Texto secundário | `--secondary` `#5f5e5e` | 6.14:1 | ✓ |

Hierarquia de headings também está invertida: as seções de leitura usam `<h2>` e o único `<h1>` da página aparece **depois**, dentro da "Reflexão".

### 🟡 I6 — Conteúdo placeholder em produção

`HomilySection("Reflexão", "Padre Antônio", "O silêncio é a voz de Deus.")` está hardcoded, só aparece quando a data é "hoje", e o parâmetro `author` é recebido e **nunca renderizado**. Isso está no ar agora, assinando uma reflexão de uma frase.

---

## 5. Plano de correção sugerido (por impacto)

**Prioridade 1 — corretude do conteúdo (1 dia)**
1. Reescrever `parseVerses`: preservar o texto anterior ao 1º versículo e aceitar aspas/pontuação após o número (`/(\d+)(?=[“"«]?[A-ZÁ-Ú])/`). Cobrir com testes de regressão usando os payloads reais de 25/08 e 30/08.
2. Corrigir a divisão do salmo: dividir por `\n` e/ou por `[–—-]` (classe de caracteres), não pelo EM DASH literal. Remover o `raw` morto.
3. Substituir o fallback falso por um estado de erro honesto ("Não foi possível carregar a liturgia de hoje — tentar novamente"), com `AbortController` (timeout ~8 s) e botão de retry.

**Prioridade 2 — CI verde e testes reais (meio dia)**
4. Remover/ajustar `test_css`; adicionar `actions/setup-python` + cache.
5. Migrar os testes de parsing para Node (`node --test`) extraindo o JS do HTML, ou externalizar `app.js` e testá-lo diretamente — o que também torna o código muito mais fácil de manter.
6. Adicionar `.gitignore` (`__pycache__/`, `.pytest_cache/`).

**Prioridade 3 — UI e acessibilidade (1–2 dias)**
7. Dark mode real: trocar as 23 cores fixas por variáveis/`dark:` e corrigir o botão branco-sobre-branco.
8. Mapear `cor` litúrgica → cor CSS; persistir `fontIndex`; parar de sobrescrever `font-size` inline (usar apenas variáveis CSS).
9. Modal acessível (`role="dialog"`, `Esc`, foco) e estado de data na URL.
10. Subir contraste dos cinzas para ≥ 4.5:1 e corrigir hierarquia de headings.

**Prioridade 4 — plataforma (1–2 dias)**
11. Compilar o Tailwind no workflow de Pages em vez do CDN; `preconnect` nas fontes.
12. Favicon + `manifest.json` + service worker com cache da última liturgia (offline real), `og:image` e `canonical`.
13. Separar `index.html` em `index.html` / `styles.css` / `app.js` — pré-requisito prático para quase tudo acima.

---

## 6. Notas

- A API `liturgia.up.railway.app` respondeu corretamente e com CORS liberado durante toda a análise; os dados de origem estão íntegros — as perdas de conteúdo são 100% do lado do cliente.
- Nenhum arquivo de código foi alterado nesta análise; apenas este relatório foi adicionado.

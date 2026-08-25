# Verbo Diário 📖

![CI](https://img.shields.io/github/actions/workflow/status/alexsantossp71-lgtm/verbo_diario/ci.yml?label=CI)
![Pages](https://img.shields.io/github/actions/workflow/status/alexsantossp71-lgtm/verbo_diario/pages.yml?label=Pages)
![License](https://img.shields.io/github/license/alexsantossp71-lgtm/verbo_diario)

Aplicativo web de **liturgia diária** — leitura e acompanhamento das leituras do dia com tipografia confortável e tema Material Design.

## ✨ Funcionalidades

- 📖 **Liturgia diária** com leituras do dia (1ª Leitura, Salmo Responsorial e Evangelho)
- 💭 **Reflexões diárias locais** com 366 textos curtos, carregados por mês
- 📅 **Seletor de data e links diretos**: navegação por calendário com sincronização na URL via `?data=YYYY-MM-DD` e suporte aos botões voltar/avançar do navegador
- 📲 **PWA & Suporte Offline**: Service Worker com cache de leituras e reflexões, `manifest.json` e ícones para instalação na tela inicial
- ⚡ **CSS Otimizado**: estilos compilados localmente e estáticos em `styles.css` (sem overhead ou parsing do CDN em runtime)
- 🔤 **Tipografia otimizada para leitura** (fonte Lexend, tamanho e espaçamento ajustáveis)
- 🌓 **Tema claro/escuro** estilo Material Design (preferência salva no navegador)
- 📱 **Layout responsivo** para mobile e desktop
- ♿ **Acessibilidade**: modal fecha com `Esc`, foco contido no diálogo, rótulos para leitores de tela e aviso `<noscript>`
- 🛡️ **Estado de erro honesto** quando a API está indisponível (com botão de tentar novamente)

## 🚀 Como executar

Para a liturgia, as reflexões mensais e o Service Worker funcionarem juntos, sirva o projeto via servidor local:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

## 🔌 API utilizada

Os dados litúrgicos são obtidos da API pública:

- `https://liturgia.up.railway.app/` (liturgia de hoje)
- `https://liturgia.up.railway.app/DD-MM-YYYY` (data específica)

As requisições têm timeout de 8 s. Se a API falhar, o aplicativo exibe uma mensagem
de erro com opção de tentar novamente — nunca leituras inventadas.

## 📁 Estrutura do projeto

```
├── index.html              # Interface e aplicação web
├── styles.css              # Estilos compilados e otimizados
├── manifest.json           # Manifesto PWA
├── sw.js                   # Service Worker (estratégia de cache e suporte offline)
├── favicon.svg             # Ícone vetorial do aplicativo
├── icons/                  # Ícones PWA em múltiplas resoluções
├── data/reflexoes/         # Reflexões diárias agrupadas por mês (01.json ... 12.json)
├── ANALISE.md              # Relatório técnico do projeto
└── tests/
    ├── parsing.test.js     # Testes de renderização (node --test)
    ├── harness.js          # Extrai o JS do index.html para teste
    ├── test_app.py         # Testes estruturais (pytest)
    └── fixtures/           # Respostas reais da API usadas nos testes
```

## 🛠️ Tecnologias

- HTML5 + CSS3 (Tailwind CSS compilado)
- JavaScript vanilla
- Service Worker & Web App Manifest

## 🧪 Testes

```bash
node --test 'tests/*.test.js'   # renderização das leituras e do salmo
pytest -q                       # verificações estruturais
```

## 📄 Licença

Distribuído sob a **MIT License** — veja `LICENSE`.

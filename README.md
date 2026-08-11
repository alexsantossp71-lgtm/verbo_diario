# Verbo Diário 📖

Aplicativo web de **liturgia diária** — leitura e acompanhamento das leituras do dia com tipografia confortável e tema Material Design.

## ✨ Funcionalidades

- 📖 **Liturgia diária** com leituras do dia (1ª Leitura, Salmo Responsorial, Evangelho e reflexão)
- 📅 **Seletor de data** para consultar qualquer dia do calendário litúrgico
- 🔤 **Tipografia otimizada para leitura** (fonte Lexend, tamanho e espaçamento ajustáveis)
- 🌓 **Tema claro/escuro** estilo Material Design (preferência salva no navegador)
- 📱 **Layout responsivo** para mobile e desktop
- 🛡️ **Fallback local** quando a API está indisponível (mostra conteúdo de exemplo)

## 🚀 Como executar

Basta abrir o arquivo no navegador:

```
index.html
```

Ou servir via servidor local:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

## 🔌 API utilizada

Os dados litúrgicos são obtidos da API pública:

- `https://liturgia.up.railway.app/` (liturgia de hoje)
- `https://liturgia.up.railway.app/DD-MM-YYYY` (data específica)

Se a API falhar, o aplicativo exibe um conteúdo de exemplo para não ficar em branco.

## 📁 Estrutura do projeto

```
└── index.html    # Aplicação completa (HTML + CSS + JS)
```

## 🛠️ Tecnologias

- HTML5 + CSS3
- Tailwind CSS (via CDN)
- JavaScript vanilla

## 📄 Licença

Distribuído sob a **MIT License** — veja `LICENSE`.
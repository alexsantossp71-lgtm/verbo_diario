# Alterações propostas para os workflows

O ambiente que gerou este branch não tem permissão `workflows` para alterar
arquivos em `.github/workflows/`, então as mudanças de CI ficaram registradas
aqui como patch.

## Como aplicar

```bash
git apply .github/proposed/workflows.patch
git add .github/workflows && git commit -m "CI: roda testes Node e usa setup-python"
```

## O que o patch faz

- **ci.yml**: adiciona `actions/setup-node` e executa `node --test 'tests/*.test.js'`
  (os testes de regressão das leituras); adiciona `actions/setup-python` com cache
  de pip em vez de instalar o pytest do zero a cada push; roda também em PRs de
  qualquer branch.
- **pages.yml**: publica apenas `index.html` e `LICENSE` em vez da raiz inteira,
  que hoje envia `tests/`, `pytest.ini` e `.github/` para o site.

Sem aplicar o patch, o CI continua verde (a falha do `test_css` foi corrigida),
mas os testes de renderização em `tests/parsing.test.js` **não rodam no CI** —
apenas localmente com `node --test 'tests/*.test.js'`.

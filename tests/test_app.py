"""Verificações estruturais do repositório.

Os testes de comportamento da aplicação ficam em tests/parsing.test.js
(executados com `node --test`), já que o app é JavaScript.
"""

import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _path(*parts):
    return os.path.join(ROOT, *parts)


def test_readme():
    assert os.path.exists(_path("README.md"))


def test_index():
    assert os.path.exists(_path("index.html"))


def test_license():
    assert os.path.exists(_path("LICENSE"))


def test_fixtures_sao_json_valido():
    fixtures = _path("tests", "fixtures")
    arquivos = [f for f in os.listdir(fixtures) if f.endswith(".json")]
    assert arquivos, "nenhuma fixture encontrada"
    for nome in arquivos:
        with open(os.path.join(fixtures, nome), encoding="utf-8") as fh:
            dados = json.load(fh)
        assert "primeiraLeitura" in dados
        assert "salmo" in dados
        assert "evangelho" in dados


def test_index_nao_contem_leituras_falsas():
    """Regressão: o fallback inventava leituras quando a API falhava."""
    with open(_path("index.html"), encoding="utf-8") as fh:
        html = fh.read()
    assert "No meu primeiro livro..." not in html
    assert "Vendo as multidões..." not in html


def test_index_referencia_ancoras_da_navegacao():
    with open(_path("index.html"), encoding="utf-8") as fh:
        html = fh.read()
    for ancora in ("reading-1", "psalm", "gospel"):
        assert re.search(r'href="#%s"' % ancora, html), f"link para #{ancora} ausente"

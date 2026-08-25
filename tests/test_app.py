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
    assert "O silêncio é a voz de Deus." not in html


def test_index_referencia_ancoras_da_navegacao():
    with open(_path("index.html"), encoding="utf-8") as fh:
        html = fh.read()
    for ancora in ("reading-1", "psalm", "gospel", "reflection"):
        assert re.search(r'href="#%s"' % ancora, html), f"link para #{ancora} ausente"


def test_reflexoes_mensais_totalizam_366_registros():
    base = _path("data", "reflexoes")
    arquivos = sorted(f for f in os.listdir(base) if f.endswith(".json"))
    assert arquivos == [f"{mes:02d}.json" for mes in range(1, 13)]

    total = 0
    fevereiro = None
    for nome in arquivos:
        with open(os.path.join(base, nome), encoding="utf-8") as fh:
            dados = json.load(fh)
        dias = dados.get("days", {})
        total += len(dias)
        if nome == "02.json":
            fevereiro = dias

    assert total == 366, f"esperado 366 reflexões, obtido {total}"
    assert fevereiro is not None and "29" in fevereiro, "fevereiro precisa conter o dia 29"


def test_setembro_tem_uma_reflexao_unica_para_cada_dia():
    """Setembro deve relacionar cada dia a uma reflexão diferente."""
    with open(_path("data", "reflexoes", "09.json"), encoding="utf-8") as fh:
        dias = json.load(fh)["days"]

    assert sorted(dias) == [f"{dia:02d}" for dia in range(1, 31)]
    reflexoes = [json.dumps(dias[dia], ensure_ascii=False, sort_keys=True) for dia in sorted(dias)]
    assert len(set(reflexoes)) == 30, "há reflexões repetidas em setembro"
    assert len({dias[dia]["title"] for dia in dias}) == 30, "há títulos repetidos em setembro"
    assert all(
        isinstance(dias[dia].get("content"), list)
        and len(dias[dia]["content"]) == 2
        and all(isinstance(paragrafo, str) and paragrafo.strip() for paragrafo in dias[dia]["content"])
        for dia in dias
    ), "cada reflexão de setembro deve ter dois parágrafos não vazios"


def test_index_carrega_reflexoes_por_mes():
    with open(_path("index.html"), encoding="utf-8") as fh:
        html = fh.read()
    assert "REFLECTIONS_BASE_PATH = './data/reflexoes'" in html
    assert "getReflectionMonthPath(month)" in html
    assert "this.reflectionsCache = new Map()" in html
    assert "await fetch(getReflectionMonthPath(monthKey))" in html


def test_modal_de_data_e_dialogo_acessivel():
    """O modal deve ser anunciado como diálogo, fechar no Esc e rotular o campo."""
    with open(_path("index.html"), encoding="utf-8") as fh:
        html = fh.read()
    assert 'id="dateModal"' in html
    assert 'role="dialog"' in html, "modal sem role=dialog"
    assert 'aria-modal="true"' in html, "modal sem aria-modal"
    assert 'aria-labelledby="dateModalTitle"' in html, "modal sem título acessível"
    assert 'for="dateInput"' in html, "campo de data sem <label> associado"
    assert "e.key === 'Escape'" in html, "modal não fecha com Esc"


def test_indicador_de_rolagem_protegido_contra_nan():
    """Páginas mais curtas que a viewport dividiam por zero (height: NaN%)."""
    with open(_path("index.html"), encoding="utf-8") as fh:
        html = fh.read()
    assert "height <= 0" in html, "handleScroll sem proteção contra divisão por zero"


def test_pagina_tem_aviso_noscript():
    with open(_path("index.html"), encoding="utf-8") as fh:
        html = fh.read()
    assert "<noscript>" in html

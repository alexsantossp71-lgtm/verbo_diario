'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, fixture, plainText, normalize } = require('./harness');

const { Components, escapeHtml } = loadApp();

const terca = fixture('25-08-2026');   // dia de semana, sem 2ª leitura
const domingo = fixture('30-08-2026'); // domingo, com 2ª leitura

test('parseVerses preserva o preâmbulo narrativo do Evangelho', () => {
  // Regressão: "Naquele tempo, disse Jesus:" era descartado silenciosamente
  const verses = Components.parseVerses(terca.evangelho.texto);
  assert.equal(verses[0].num, '');
  assert.match(verses[0].content, /Naquele tempo, disse Jesus/);
});

test('parseVerses reconhece versículo seguido de aspas (discurso direto)', () => {
  // Regressão: 23“Ai de vós... não casava com o lookahead e sumia da página
  const verses = Components.parseVerses(terca.evangelho.texto);
  const v23 = verses.find(v => v.num === '23');
  assert.ok(v23, 'versículo 23 deve ser reconhecido');
  assert.match(v23.content, /Ai de vós, mestres da Lei/);
});

test('nenhum texto do Evangelho é perdido na renderização', () => {
  // Regressão: ~63% do Evangelho de 25/08/2026 desaparecia
  for (const dia of [terca, domingo]) {
    const origem = dia.evangelho.texto;
    const render = Components.parseVerses(origem).map(v => plainText(v.content)).join(' ');
    assert.equal(
      normalize(render),
      normalize(origem),
      `conteúdo perdido no Evangelho de ${dia.data}`
    );
  }
});

test('nenhum texto das leituras é perdido na renderização', () => {
  const leituras = [
    terca.primeiraLeitura,
    domingo.primeiraLeitura,
    domingo.segundaLeitura,
  ];
  for (const leitura of leituras) {
    const render = Components.parseVerses(leitura.texto).map(v => plainText(v.content)).join(' ');
    assert.equal(
      normalize(render),
      normalize(leitura.texto),
      `conteúdo perdido em ${leitura.referencia}`
    );
  }
});

test('parseVerses numera os versículos em ordem crescente', () => {
  const nums = Components.parseVerses(terca.primeiraLeitura.texto)
    .map(v => v.num)
    .filter(Boolean)
    .map(Number);
  assert.deepEqual(nums, [1, 3, 14, 15, 16]); // 2 e 17 são inline (minúscula)
  assert.deepEqual([...nums].sort((a, b) => a - b), nums);
});

test('parseVerses lida com texto vazio ou ausente', () => {
  assert.deepEqual(Components.parseVerses(''), []);
  assert.deepEqual(Components.parseVerses(null), []);
  assert.deepEqual(Components.parseVerses(undefined), []);
});

test('parseVerses trata texto sem numeração como bloco único', () => {
  const verses = Components.parseVerses('Vendo as multidões, Jesus subiu ao monte.');
  assert.equal(verses.length, 1);
  assert.equal(verses[0].num, '');
  assert.match(verses[0].content, /Vendo as multidões/);
});

test('PsalmSection divide as estrofes separadas por EN DASH', () => {
  // Regressão: split('—') com EM DASH nunca casava com o – (U+2013) da API
  const html = Components.PsalmSection(
    terca.salmo.referencia,
    terca.salmo.refrao,
    terca.salmo.texto
  );
  const estrofes = html.match(/mb-10 pl-2/g) || [];
  assert.equal(estrofes.length, 3, 'Sl 95(96) tem 3 estrofes');
});

test('PsalmSection intercala o refrão entre as estrofes', () => {
  const html = Components.PsalmSection(
    domingo.salmo.referencia,
    domingo.salmo.refrao,
    domingo.salmo.texto
  );
  const estrofes = html.match(/mb-10 pl-2/g) || [];
  assert.equal(estrofes.length, 4, 'Sl 62(63) tem 4 estrofes');

  // 1 refrão grande no início + 1 entre cada par de estrofes + 1 no final
  const refroes = html.match(/border-l-4 border-primary/g) || [];
  assert.equal(refroes.length, estrofes.length, 'um refrão intercalado por estrofe');
});

test('nenhum texto do salmo é perdido na renderização', () => {
  for (const dia of [terca, domingo]) {
    const html = Components.PsalmSection(dia.salmo.referencia, dia.salmo.refrao, dia.salmo.texto);
    const render = plainText(html);
    for (const estrofe of dia.salmo.texto.split('\n')) {
      const limpa = estrofe.replace(/^[\u2013\u2014-]\s*/, '').trim();
      if (!limpa) continue;
      assert.ok(
        normalize(render).includes(normalize(limpa)),
        `estrofe ausente no salmo de ${dia.data}: ${limpa.slice(0, 40)}...`
      );
    }
  }
});

test('escapeHtml neutraliza HTML vindo da API', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHtml('aspas " e \''), 'aspas &quot; e &#39;');
});

test('conteúdo malicioso da API não vira HTML na página', () => {
  const payload = '1<img src=x onerror="alert(1)">Texto da leitura.';
  const html = Components.ReadingCard('1ª Leitura', '<b>Gn 1</b>', payload, 'reading-1');
  assert.ok(!html.includes('<img src=x'), 'a tag <img> deve ser escapada');
  assert.ok(!html.includes('onerror="alert(1)"'), 'o handler inline deve ser escapado');
  assert.ok(!html.includes('<b>Gn 1</b>'), 'a referência deve ser escapada');
});

test('ReadingCard e PsalmSection produzem as âncoras usadas na navegação', () => {
  const leitura = Components.ReadingCard('1ª Leitura', 'Jr 20,7-9', terca.primeiraLeitura.texto, 'reading-1');
  assert.match(leitura, /id="reading-1"/);

  const evangelho = Components.ReadingCard('Evangelho', 'Mt 23', terca.evangelho.texto, 'gospel');
  assert.match(evangelho, /id="gospel"/);

  const salmo = Components.PsalmSection(terca.salmo.referencia, terca.salmo.refrao, terca.salmo.texto);
  assert.match(salmo, /id="psalm"/);
});

test('HomilySection renderiza autor, âncora e escapa o conteúdo', () => {
  const html = Components.HomilySection(
    'Reflexão <do dia>',
    'Equipe <VD>',
    ['Primeiro parágrafo.', '<img src=x onerror="alert(1)">']
  );

  assert.match(html, /id="reflection"/);
  assert.ok(html.includes('Equipe &lt;VD&gt;'), 'o autor deve ser escapado');
  assert.ok(!html.includes('<img src=x'), 'o conteúdo da reflexão deve ser escapado');
  assert.match(plainText(html), /Primeiro parágrafo\./);
});

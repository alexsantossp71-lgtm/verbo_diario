'use strict';

// Extrai as funções de renderização de dentro do index.html para que possam
// ser testadas isoladamente, sem navegador. Enquanto o app for um único
// arquivo, este harness é a ponte entre o HTML e os testes.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function loadApp() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (scripts.length === 0) throw new Error('Nenhum <script> inline encontrado em index.html');

  // O último bloco inline contém Components / App
  const code = scripts[scripts.length - 1].replace(/window\.onload[\s\S]*$/, '');

  // Avaliado no mesmo realm do test runner para que os objetos criados pelo
  // app (arrays, objetos) sejam comparáveis com assert.deepEqual.
  const noop = () => {};
  const stubs = {
    localStorage: { getItem: () => null, setItem: noop },
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { classList: { contains: () => false, add: noop, toggle: noop } },
      documentElement: { style: { setProperty: noop } },
    },
    window: { addEventListener: noop },
  };

  const factory = new Function(
    ...Object.keys(stubs),
    code + '\n;return { Components, escapeHtml };'
  );

  return factory(...Object.values(stubs));
}

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name + '.json'), 'utf8'));
}

// Texto visível após a renderização, sem tags nem entidades
function plainText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Normaliza para comparar conteúdo de origem com conteúdo renderizado:
// remove espaços e os números de versículo, que viram elementos próprios.
function normalize(str) {
  return str.replace(/\d+/g, '').replace(/\s+/g, '').trim();
}

module.exports = { loadApp, fixture, plainText, normalize };

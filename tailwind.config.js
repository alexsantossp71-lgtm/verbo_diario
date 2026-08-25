/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,html}',
    './data/**/*.json'
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'on-surface': 'var(--on-surface)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        tertiary: 'var(--tertiary)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container': 'var(--surface-container)',
        'surface-container-high': 'var(--surface-container-high)',
        'surface-container-highest': 'var(--surface-container-highest)',
        'on-primary': 'var(--on-primary)',
      }
    }
  },
  plugins: [],
};

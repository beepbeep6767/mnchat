/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { school: { pink: '#fb63ac', blue: '#249dff', ink: '#26345c', muted: '#6f85ac', pale: '#f4f9ff' } } } },
  plugins: []
};

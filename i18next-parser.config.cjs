module.exports = {
  keySeparator: ':',
  namespaceSeparator: '.',
  useKeysAsDefaultValue: true,
  output: 'public/locales/$LOCALE/$NAMESPACE.json',
  input: ['app/**/*.{js,jsx,ts,tsx}', 'components/**/*.{js,jsx,ts,tsx}'],
  sort: true,
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JavascriptLexer'],
  },
};
module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'react-app',
    'prettier',
    'prettier/react',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {},
};

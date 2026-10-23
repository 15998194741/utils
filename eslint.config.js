const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = [
  { ignores: ['dist/**', 'dist-umd/**', 'webpack/**', 'node_modules/**', 'coverage/**', 'rust/**'] },

  {
    files: ['**/*.js', '**/*.cjs'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', process: 'readonly', __dirname: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  {
    files: ['**/*.ts', '**/*.mts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript itself resolves identifiers and reports unused symbols.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },

  {
    files: ['scripts/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-var-requires': 'off' },
  },

  {
    // Legacy MD5 implementation kept in the vendored style it was written in.
    files: ['src/encry/**/*.ts'],
    rules: {
      'no-var': 'off',
      'no-control-regex': 'off',
      '@typescript-eslint/no-array-constructor': 'off',
    },
  },

  {
    // Capturing `this` in a local variable is the intended way to preserve the
    // receiver across a deferred callback.
    files: ['src/function/index.ts'],
    rules: { '@typescript-eslint/no-this-alias': 'off' },
  },

  {
    // sample.ts is a usage probe: it references the exported names to show
    // their shape, so bare references are intentional there.
    files: ['sample.ts'],
    rules: { '@typescript-eslint/no-unused-expressions': 'off' },
  },

  prettierConfig,
];

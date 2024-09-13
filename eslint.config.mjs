import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';
import html from 'eslint-plugin-html';
import js from '@eslint/js';
import typeScriptESLint from '@typescript-eslint/eslint-plugin';
import typeScriptESLintParser from '@typescript-eslint/parser';
import globals from 'globals';
import tSESLint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const compat = new FlatCompat();

export default [
  {
    ignores: ['**/node_modules/**', '**/build/**', 'webpack.config.ts', '*.mjs'],
  },
  js.configs.recommended,
  ...tSESLint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  ...compat.extends('plugin:@typescript-eslint/eslint-recommended'),
  {
    plugins: {
      typeScriptESLint,
      html,
    },
    languageOptions: {
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        ...globals.browser,
      },
      parser: typeScriptESLintParser,
      parserOptions: {
        sourceType: 'module',
        project: './tsconfig.json',
        // 2015（6と同じ）、2016（7と同じ）、2017（8と同じ）、2018（9と同じ）、2019（10と同じ）、2020（11と同じ）、または2021（2021と同じ）
        ecmaVersion: 2015,
      },
    },
    settings: {
      // react: {
      //   version: 'detect',
      // },
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'error',
      'node/no-deprecated-api': 'off',
      'node/no-unpublished-import': 'off',
      'node/no-unpublished-require': 'off',
      'node/no-unsupported-features/es-syntax': 'off',
      'no-process-exit': 'off',
      'node/no-missing-import': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'node/no-unsupported-features/es-builtins': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    },
  },
];
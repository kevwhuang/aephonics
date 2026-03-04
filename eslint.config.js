import a11y from 'eslint-plugin-jsx-a11y';
import astro from 'eslint-plugin-astro';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import ts from 'typescript-eslint';

const ignores = {
    ignores: ['.astro/', 'dist/', '.netlify/'],
};

const style = stylistic.configs.customize({
    indent: 4,
    quotes: 'single',
    semi: true,
});

const overrides = {
    files: ['**/*.astro'],
    rules: {
        '@stylistic/jsx-one-expression-per-line': 'off',
    },
};

export default [
    ignores,
    js.configs.recommended,
    style,
    ...ts.configs.recommended,
    ...astro.configs.recommended,
    a11y.flatConfigs.recommended,
    overrides,
];

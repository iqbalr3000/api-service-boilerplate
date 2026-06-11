/** @type {import('@typescript-eslint/utils').TSESLint.Linter.Config} */
module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'airbnb-typescript/base',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:jest/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],
    plugins: ['filenames'],
    parserOptions: {
        project: './tsconfig.eslint.json',
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/naming-convention': 'off',
    },
    env: {
        'jest/globals': true,
    },
    settings: {
        'import/resolver': {
            alias: {
                map: [['src', './src']],
                extensions: ['.ts', '.js', '.json'],
            },
        },
    },
};

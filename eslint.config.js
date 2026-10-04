const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const importX = require('eslint-plugin-import-x');
const { createTypeScriptImportResolver } = require('eslint-import-resolver-typescript');
const jest = require('eslint-plugin-jest');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = tseslint.config(
    { ignores: ['node_modules/', 'dist/', 'coverage/'] },
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    {
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                project: './tsconfig.eslint.json',
                tsconfigRootDir: __dirname,
            },
        },
        settings: {
            'import-x/resolver-next': [createTypeScriptImportResolver({ project: './tsconfig.eslint.json' })],
        },
        rules: {
            'no-console': 'error',
            'no-process-env': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            // Decorator controllers/services are static-only classes by design.
            '@typescript-eslint/no-extraneous-class': 'off',
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
            'import-x/no-extraneous-dependencies': [
                'error',
                { devDependencies: ['tests/**', 'src/cmd/**', '*.js', '*.ts'] },
            ],
            'import-x/no-cycle': 'error',
            // CJS libs (jsonwebtoken, express) are idiomatically used via their default export.
            'import-x/no-named-as-default-member': 'off',
        },
    },
    {
        files: ['src/config.ts', 'jest-global-setup.js'],
        rules: { 'no-process-env': 'off' },
    },
    {
        files: ['**/*.js'],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: { sourceType: 'commonjs' },
        rules: { '@typescript-eslint/no-require-imports': 'off' },
    },
    {
        files: ['tests/**'],
        ...jest.configs['flat/recommended'],
        rules: {
            ...jest.configs['flat/recommended'].rules,
            // Static handlers are invoked as bare functions on purpose; jest mocks trip these.
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
        },
    },
    prettier,
);

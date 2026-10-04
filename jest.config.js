const { resolve } = require('path');

module.exports = {
    transform: {
        // tsconfig.json only covers src (the build); tests also need jest types.
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.eslint.json' }],
    },
    testMatch: ['**/tests/**/*.test.ts'],
    moduleNameMapper: {
        '^src/(.*)$': resolve(__dirname, './src/$1'),
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    moduleDirectories: ['node_modules'],
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    collectCoverage: false, // only collect coverage on full test suite run (see package.json script)
    collectCoverageFrom: ['src/**/*.ts', '!src/**/index.ts'],
    coveragePathIgnorePatterns: ['/node_modules/', 'dist/'],
    coverageReporters: ['json', 'json-summary', 'lcov', 'text', 'text-summary', 'html'],
    testEnvironment: 'node',
    verbose: true,
    setupFiles: ['./jest-setup.ts'],
    setupFilesAfterEnv: ['jest-extended'],
    globalSetup: './jest-global-setup.js',
};

// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
//   # Pierluigi Spedicato
/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	setupFiles: [],
	setupFilesAfterEnv: ['dotenv/config', './tests/unit/setupEnv.ts'],
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {}],
		'^.+\\.js$': ['ts-jest', { diagnostics: false, tsconfig: { allowJs: true, module: 'CommonJS' } }]
	},
	transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
	reporters: [
		'default',
		[
			'./node_modules/jest-html-reporter',
			{
				pageTitle: 'Test Report'
			}
		],
		['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }]
	],
	testTimeout: 30000,
	collectCoverage: true,
	collectCoverageFrom: [
		'**/*.{ts,tsx}',
		'!**/node_modules/**',
		'!**/src/models/**',
		'!**/db/**',
		'!**/src/server.ts',
		'!**/src/config/**',
		'!**/src/plugins/sequilize.plugin.ts',
		'!**/src/plugins/underpressure.plugin.ts',
		'!**/src/plugins/register-plugin.ts',
		'!**/src/routes/base/**',
		'!**/src/utils/database.ts',
		'!**/src/utils/database.migrations.ts',
		'!**/tests/**'
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'html', 'lcov'],
	modulePathIgnorePatterns: ['<rootDir>/build/'],
	// Force exit to prevent hanging
	forceExit: true,
	// Detect open handles
	detectOpenHandles: true
};

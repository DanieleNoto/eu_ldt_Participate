/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	setupFiles: ['dotenv/config', './tests/unit/setupEnv.ts'],
	setupFilesAfterEnv: ['dotenv/config'],
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		'^/test/unit/+.test.ts?$': ['ts-jest', { useESM: true }]
	},
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
		'!**/tests/**'
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'html', 'lcov'],
	modulePathIgnorePatterns: ['<rootDir>/build/']
};

export default {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'jsdom',
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	moduleNameMapper: {
		'@theme/styles/global\\.css$': '<rootDir>/src/tests/unit/__mocks__/cssMock.ts',
		'@app/theme/styles/global\\.css$': '<rootDir>/src/tests/unit/__mocks__/cssMock.ts',
		'\\.(css|less|sass|scss)$': 'identity-obj-proxy',
		'\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/tests/unit/__mocks__/fileMock.ts',
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@app/(.*)$': '<rootDir>/src/app/$1',
		'^@config/(.*)$': '<rootDir>/src/config/$1',
		'^@core/(.*)$': '<rootDir>/src/app/core/$1',
		'^@logger/(.*)$': '<rootDir>/src/app/logger/$1',
		'^@pages/(.*)$': '<rootDir>/src/app/pages/$1',
		'^@theme/(.*)$': '<rootDir>/src/app/theme/$1',
		'^@src/(.*)$': '<rootDir>/src/$1',
		'^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
		'^@utils/(.*)$': '<rootDir>/src/app/utils/$1'
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	transform: {
		'^.+\\.(js|jsx)$': 'babel-jest',
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.jest.json',
				useESM: true
			}
		]
	},
	reporters: ['default', ['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }]],
	testMatch: ['<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}', '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	collectCoverage: true,
	coverageReporters: ['text', 'html', 'lcov'],
	collectCoverageFrom: [
		'src/**/*.{js,jsx,ts,tsx}',
		'!src/**/*.d.ts',
		'!src/**/index.ts',
		'!src/config/**',
		'!src/tests/**',
		'!**/*.json',
		'!src/**/*.routes.*',
		'!src/**/*.model.*',
		'!src/app/store/**',
		'!src/app/auth/**',
		'!src/app/core/**',
		'!src/app/theme/**',
		'!src/app/pages/example/**',
		'!src/main.tsx',
		'!src/app/App.tsx',
		'!src/app/RemoteRoot.tsx',
		'!src/app/StandaloneRoot.tsx',
		'!src/app/MainProvider.tsx'
	]
};

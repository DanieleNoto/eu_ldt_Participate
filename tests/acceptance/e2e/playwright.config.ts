import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: '../', // Relative to this config file location

	// Global test timeout (default is 30 seconds)
	timeout: 300000, // 300 seconds for each test 5 minutes

	// Timeout for expect() assertions (default is 5 seconds)
	expect: {
		timeout: 120000 // 120 seconds for assertions
	},

	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.FE_BASE_URL || 'http://localhost:3000',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',

		// Action timeout (default is 0 - no timeout)
		actionTimeout: 120000, // 120 seconds for actions like click, fill, etc.

		// Navigation timeout (default is 30 seconds)
		navigationTimeout: 120000 // 120 seconds for page navigation
	},

	/* Configure projects for major browsers */
	projects: [
		// Setup project for user authentication
		{
			name: 'user-setup',
			testMatch: 'tests/**/auth/user-auth.setup.ts',
			teardown: 'user-cleanup'
		},
		// Setup project for admin authentication
		{
			name: 'admin-setup',
			testMatch: 'tests/**/auth/admin-auth.setup.ts',
			teardown: 'admin-cleanup'
		},

		// Cleanup project
		{
			name: 'user-cleanup',
			testMatch: 'tests/**/auth/user-auth.cleanup.ts'
		},
		// Cleanup project
		{
			name: 'admin-cleanup',
			testMatch: 'tests/**/auth/admin-auth.cleanup.ts'
		},

		// User tests with authenticated state
		{
			name: 'user-tests',
			use: {
				...devices['Desktop Chrome'],
				storageState: STORAGE_STATE.USER
			},
			dependencies: ['user-setup'],
			testMatch: 'tests/user/**/*.spec.ts'
		},

		// Admin tests with authenticated state
		{
			name: 'admin-tests',
			use: {
				...devices['Desktop Chrome'],
				storageState: STORAGE_STATE.ADMIN
			},
			dependencies: ['admin-setup'],
			testMatch: 'tests/admin/**/*.spec.ts'
		},

		// Shared/general tests
		{
			name: 'shared-tests',
			use: { ...devices['Desktop Chrome'] },
			testMatch: 'tests/shared/**/*.spec.ts'
		},

		// Legacy tests (existing structure)
		{
			name: 'legacy-tests',
			use: { ...devices['Desktop Chrome'] },
			testMatch: 'tests/**/*.spec.ts',
			testIgnore: ['tests/user/**', 'tests/admin/**', 'tests/shared/**']
		}

		// {
		//   name: 'firefox',
		//   use: { ...devices['Desktop Firefox'] },
		// },

		// {
		//   name: 'webkit',
		//   use: { ...devices['Desktop Safari'] },
		// },

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	]

	/* Run your local dev server before starting the tests */
	// webServer: {
	//   command: 'npm run start',
	//   url: 'http://localhost:3000',
	//   reuseExistingServer: !process.env.CI,
	// },
});

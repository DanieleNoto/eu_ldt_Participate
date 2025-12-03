/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Simone Bianchelli
 */

import { defineConfig, devices } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.ci') });

const storageStateAdmin = process.env.USE_KEYCLOAK === 'true' ? STORAGE_STATE.KEYCLOAK_ADMIN : STORAGE_STATE.ADMIN;

const storageStateUser = process.env.USE_KEYCLOAK === 'true' ? STORAGE_STATE.KEYCLOAK_USER : STORAGE_STATE.USER;

/**
 * Parallel execution configuration.
 *
 * Set TEST_PARALLEL=true and TEST_WORKERS=3 to enable parallel execution
 * with multiple user accounts to avoid Decidim session conflicts.
 *
 * Worker assignment (when parallel):
 * - Worker 0: TEST_ADMIN1_EMAIL / TEST_USER1_EMAIL
 * - Worker 1: TEST_ADMIN2_EMAIL / TEST_USER2_EMAIL
 * - Worker 2: TEST_ADMIN3_EMAIL / TEST_USER3_EMAIL
 *
 * Note: TEST_ADMIN_EMAIL / TEST_USER_EMAIL (worker 0 without suffix) are reserved
 * for sequential tests and should not be used in parallel mode.
 */
const isParallelMode = process.env.TEST_PARALLEL === 'true';
const workerCount = isParallelMode ? parseInt(process.env.TEST_WORKERS || '4', 10) : 1;

/**
 * Browser configurations for cross-browser testing.
 * Tests will run on all browsers defined here.
 */
const browsers = [
	{ name: 'chromium', device: devices['Desktop Chrome'] },
	{ name: 'firefox', device: devices['Desktop Firefox'] }
];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './', // Look for tests starting from the current directory

	// Global test timeout
	timeout: 180000, // 180 seconds = 3 minutes per test

	// Timeout for expect() assertions
	expect: {
		timeout: 30000 // 30 seconds for assertions
	},

	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* No retries - trace is generated on failure */
	retries: 0,

	/* Opt out of parallel tests on CI. */
	workers: workerCount,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [['html'], ['list', { printSteps: true }]],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app',

		/* Collect trace on test failure. See https://playwright.dev/docs/trace-viewer */
		trace: 'retain-on-failure',

		// Action timeout for click, fill, etc.
		actionTimeout: 30000, // 30 seconds

		// Navigation timeout for page navigation
		navigationTimeout: 60000 // 60 seconds
	},

	/* Configure projects for major browsers */
	projects: [
		// Setup project for user authentication
		{
			name: 'user-setup',
			testMatch: 'auth/user-auth.setup.ts',
			teardown: 'user-cleanup'
		},
		// Setup project for admin authentication
		{
			name: 'admin-setup',
			testMatch: 'auth/admin-auth.setup.ts',
			teardown: 'admin-cleanup'
		},

		// Cleanup user project
		{
			name: 'user-cleanup',
			testMatch: 'tests/**/auth/user-auth.cleanup.ts'
		},
		// Cleanup admin project
		{
			name: 'admin-cleanup',
			testMatch: 'auth/admin-auth.cleanup.ts'
		},
		// Cleanup user without messages project
		{
			name: 'user-without-messages-cleanup',
			testMatch: 'tests/**/auth/user-without-messages-auth.cleanup.ts'
		},

		// Generate browser-specific projects dynamically
		...browsers.flatMap(({ name: browserName, device }) => [
			// User tests with authenticated state
			{
				name: `user-tests-${browserName}`,
				use: {
					...device,
					storageState: storageStateUser
				},
				dependencies: ['user-setup'],
				testMatch: [
					'../user/**/*.spec.ts',
					'tests/user/**/*.spec.ts',
					'**/tests/user/**/*.spec.ts',
					'**/user/**/*.spec.ts'
				]
			},

			// Admin tests with authenticated state
			{
				name: `admin-tests-${browserName}`,
				use: {
					...device,
					storageState: storageStateAdmin
				},
				dependencies: ['admin-setup'],
				testMatch: ['../admin/**/*.spec.ts', 'tests/admin/**/*.spec.ts', '**/tests/admin/**/*.spec.ts']
			},

			// User to delete tests
			{
				name: `user-to-delete-tests-${browserName}`,
				use: {
					...device
				},
				testMatch: [
					'../user-to-delete/**/*.spec.ts',
					'tests/user-to-delete/**/*.spec.ts',
					'**/tests/user-to-delete/**/*.spec.ts'
				]
			},

			// Guest tests for unregistered users
			{
				name: `guest-tests-${browserName}`,
				use: {
					...device
				},
				dependencies: ['admin-setup'],
				testMatch: ['tests/guest/**/*.spec.ts', '**/tests/guest/**/*.spec.ts']
			},

			// Grafana tests
			{
				name: `grafana-tests-${browserName}`,
				use: {
					...device
				},
				testMatch: ['tests/admin/reports/**/*.spec.ts']
			},

			// User without messages tests
			{
				name: `user-without-messages-tests-${browserName}`,
				use: {
					...device
				},
				testMatch: 'tests/user-without-messages/**/*.spec.ts'
			},

			// Combined test project that ensures all setups run
			{
				name: `all-authenticated-tests-${browserName}`,
				use: {
					...device
				},
				dependencies: ['user-setup', 'admin-setup'],
				testMatch: [
					'../user/**/*.spec.ts',
					'tests/user/**/*.spec.ts',
					'**/tests/user/**/*.spec.ts',
					'../admin/**/*.spec.ts',
					'tests/admin/**/*.spec.ts',
					'**/tests/admin/**/*.spec.ts',
					'tests/user-to-delete/**/*.spec.ts'
				]
			}
		])
	]
});

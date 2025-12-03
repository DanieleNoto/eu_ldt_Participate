/**
 * SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.ci') });

/**
 * Configuration for running parallel tests with multiple user accounts.
 * Uses the storage states created by parallel-setup.
 */
export default defineConfig({
	testDir: './tests',
	timeout: 180000, // 180 seconds = 3 minutes per test
	expect: {
		timeout: 30000 // 30 seconds for assertions
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 3, // Number of parallel workers
	reporter: [['list', { printSteps: true }]],
	use: {
		baseURL: process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app',
		trace: 'retain-on-failure',
		actionTimeout: 30000, // 30 seconds for click/fill actions
		navigationTimeout: 60000 // 60 seconds for page navigation
	},
	projects: [
		{
			name: 'parallel-tests-chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'parallel-tests-firefox',
			use: { ...devices['Desktop Firefox'] }
		}
	]
});

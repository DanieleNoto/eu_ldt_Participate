/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.ci') });

/**
 * Configuration specifically for running reserved authentication setup only.
 * This creates storage states for:
 * - 2 reserved accounts (TEST_ADMIN_EMAIL, TEST_USER_EMAIL) for fixed fixtures
 */
export default defineConfig({
	testDir: './auth',
	testMatch: ['parallel-reserved-auth.setup.ts'],
	timeout: 180000, // 3 minutes per setup test
	expect: {
		timeout: 30000
	},
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 2, // Retry up to 2 times on failure to handle intermittent timeouts
	workers: 1, // Single worker for setup
	reporter: [['list', { printSteps: true }]],
	use: {
		baseURL: process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app',
		trace: 'retain-on-failure',
		actionTimeout: 60000,
		navigationTimeout: 90000
	},
	projects: [
		{
			name: 'reserved-setup-chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'reserved-setup-firefox',
			use: { ...devices['Desktop Firefox'] }
		}
	]
});

/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Simone Bianchelli
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.ci') });

/**
 * Configuration specifically for running parallel authentication setup.
 * This creates storage states for:
 * - 10 admin accounts (admin1, admin2, admin3, admin4, admin5, admin6, admin7, admin8, admin9, admin10) for parallel pool
 * - 10 user accounts (user1, user2, user3, user4, user5, user6, user7, user8, user9, user10) for parallel pool
 */
export default defineConfig({
	testDir: './auth',
	testMatch: ['parallel-admin-auth.setup.ts', 'parallel-user-auth.setup.ts'],
	timeout: 180000, // 3 minutes per setup test
	expect: {
		timeout: 30000
	},
	fullyParallel: false, // Run setup sequentially to avoid race conditions
	forbidOnly: !!process.env.CI,
	retries: 2, // Retry up to 2 times on failure to handle intermittent timeouts
	workers: 1, // Single worker for setup
	reporter: [['list', { printSteps: true }]],
	use: {
		baseURL: process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app',
		trace: 'retain-on-failure',
		actionTimeout: 60000,
		navigationTimeout: 90000 // Increased to 90s for slow page loads during setup
	},
	projects: [
		{
			name: 'parallel-setup-chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'parallel-setup-firefox',
			use: { ...devices['Desktop Firefox'] }
		}
	]
});

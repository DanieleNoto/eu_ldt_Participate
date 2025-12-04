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
 * Configuration specifically for running parallel authentication setup.
 * This creates storage states for:
 * - 3 admin accounts (admin1, admin2, admin3) for parallel pool
 * - 3 user accounts (user1, user2, user3) for parallel pool
 * - 2 reserved accounts (TEST_ADMIN_EMAIL, TEST_USER_EMAIL) for fixed fixtures
 */
export default defineConfig({
	testDir: './auth',
	testMatch: ['parallel-admin-auth.setup.ts', 'parallel-user-auth.setup.ts', 'parallel-reserved-auth.setup.ts'],
	timeout: 120000,
	expect: {
		timeout: 30000
	},
	fullyParallel: false, // Run setup sequentially to avoid race conditions
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1, // Single worker for setup
	reporter: [['list', { printSteps: true }]],
	use: {
		baseURL: process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app',
		trace: 'on-first-retry',
		actionTimeout: 60000,
		navigationTimeout: 60000
	},
	projects: [
		{
			name: 'parallel-setup',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});

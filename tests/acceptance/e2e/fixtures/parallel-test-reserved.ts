/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Test fixture for tests that need BOTH reserved/fixed accounts:
 * - Fixed admin account (admin-state-reserved.json)
 * - Fixed user account (user-state-reserved.json)
 *
 * Use this fixture for tests marked with @reserved that require
 * specific user accounts that cannot be shared with parallel workers.
 *
 * IMPORTANT: Tests using this fixture MUST run with --workers=1
 * to avoid conflicts on both fixed accounts.
 *
 * Usage:
 *   import { test, expect } from '@fixtures/parallel-test-reserved';
 *
 *   test('@reserved my test', async ({ adminPage, userPage }) => {
 *     // adminPage = reserved admin user
 *     // userPage = reserved regular user
 *   });
 */

/**
 * Helper function to check if user is still logged in and re-authenticate if needed.
 */
async function ensureAuthenticated(
	page: Page,
	user: { email: string; password: string },
	role: 'admin' | 'user',
	workerIndex: number
): Promise<void> {
	const baseURL = process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app';
	const isCI = process.env.CI === 'true';
	const sessionCheckTimeout = isCI ? 20000 : 10000; // 20s on CI, 10s local
	const navigationTimeout = isCI ? 60000 : 60000; // 60s both CI and local

	await page.goto(baseURL, { timeout: navigationTimeout });
	await page.waitForLoadState('networkidle', { timeout: navigationTimeout });

	// Check if user is still logged in
	const isLoggedIn = await page
		.locator('#trigger-dropdown-account')
		.isVisible({ timeout: sessionCheckTimeout })
		.catch(() => false);

	if (isLoggedIn) {
		console.log(`[Worker ${workerIndex}] Session still valid for reserved ${role}`);
		return;
	}

	console.log(`[Worker ${workerIndex}] Session expired for reserved ${role} - Re-authenticating...`);

	// Navigate directly to login page
	const loginUrl = `${baseURL}/users/sign_in`;
	await page.goto(loginUrl, { timeout: navigationTimeout });
	await page.waitForLoadState('networkidle', { timeout: navigationTimeout });

	// Wait for login form to be visible
	const emailField = page.locator('#session_user_email');
	const passwordField = page.locator('#session_user_password');

	await emailField.waitFor({ state: 'visible', timeout: sessionCheckTimeout });
	await passwordField.waitFor({ state: 'visible', timeout: sessionCheckTimeout });

	// Fill and submit login form
	await emailField.fill(user.email);
	await passwordField.fill(user.password);
	await page.getByRole('button', { name: 'Log in' }).click();

	// Wait for login to complete
	await page.locator('#trigger-dropdown-account').waitFor({ state: 'visible', timeout: navigationTimeout });

	// After re-authentication, navigate admin to admin homepage
	if (role === 'admin') {
		await page.goto(`${baseURL}/admin/`, { timeout: navigationTimeout });
		await page.waitForLoadState('networkidle', { timeout: navigationTimeout });
	}

	console.log(`[Worker ${workerIndex}] Re-authentication successful for reserved ${role}`);
}

export type ParallelTestReservedFixtures = {
	/** Page authenticated as reserved admin */
	adminPage: Page;
	/** Page authenticated as reserved user */
	userPage: Page;
	/** Admin context (fixed admin) */
	adminContext: BrowserContext;
	/** User context (fixed user) */
	userContext: BrowserContext;
	/** Worker index (always 0 for reserved tests) */
	workerIndex: number;
	/** Fixed admin credentials */
	fixedAdmin: { email: string; password: string; role: 'admin' };
	/** Fixed user credentials */
	fixedUser: { email: string; password: string; role: 'user' };
};

export const test = base.extend<ParallelTestReservedFixtures>({
	workerIndex: async ({}, use, testInfo) => {
		await use(testInfo.parallelIndex);
	},

	// Reserved admin account
	fixedAdmin: async ({}, use) => {
		const admin = {
			email: process.env.TEST_ADMIN_EMAIL || '',
			password: process.env.TEST_ADMIN_PASSWORD || '',
			role: 'admin' as const
		};
		await use(admin);
	},

	// Reserved user account
	fixedUser: async ({}, use) => {
		const user = {
			email: process.env.TEST_USER_EMAIL || '',
			password: process.env.TEST_USER_PASSWORD || '',
			role: 'user' as const
		};
		await use(user);
	},

	// Fixed admin context - always use admin-state-reserved.json
	adminContext: async ({ browser, workerIndex }, use) => {
		const storagePath = path.resolve(__dirname, '../auth/admin-state-reserved.json');

		if (!fs.existsSync(storagePath)) {
			throw new Error(
				`Admin storage state not found: ${storagePath}. ` + `Run 'npm run test:parallel:setup' first.`
			);
		}

		const context = await browser.newContext({
			storageState: storagePath
		});

		console.log(`[Worker ${workerIndex}] Using reserved admin state: admin-state-reserved.json`);

		await use(context);
		await context.close();
	},

	// Fixed user context - always use user-state-reserved.json
	userContext: async ({ browser, workerIndex }, use) => {
		const storagePath = path.resolve(__dirname, '../auth/user-state-reserved.json');

		if (!fs.existsSync(storagePath)) {
			throw new Error(
				`User storage state not found: ${storagePath}. ` + `Run 'npm run test:parallel:setup' first.`
			);
		}

		const context = await browser.newContext({
			storageState: storagePath
		});

		console.log(`[Worker ${workerIndex}] Using reserved user state: user-state-reserved.json`);

		await use(context);
		await context.close();
	},

	adminPage: async ({ adminContext, fixedAdmin, workerIndex }, use) => {
		const page = await adminContext.newPage();
		await ensureAuthenticated(page, fixedAdmin, 'admin', workerIndex);
		await use(page);
		await page.close();
	},

	userPage: async ({ userContext, fixedUser, workerIndex }, use) => {
		const page = await userContext.newPage();
		await ensureAuthenticated(page, fixedUser, 'user', workerIndex);
		await use(page);
		await page.close();
	}
});

export { expect } from '@playwright/test';

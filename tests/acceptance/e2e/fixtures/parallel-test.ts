/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import { getWorkerUser, getUserPoolSize } from '@config/worker-users';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Custom test fixture for parallel execution.
 *
 * Automatically loads the correct storage state based on the worker index,
 * ensuring each worker uses a different user to avoid session conflicts.
 *
 * IMPORTANT: Uses `test.info().parallelIndex` which is the correct way to get
 * the worker index inside Playwright tests.
 *
 * FEATURES:
 * - Automatic session validation before each test
 * - Re-authentication if session has expired
 * - Worker-specific user assignment from pool
 *
 * Usage:
 *   import { test } from '@fixtures/parallel-test';
 *
 *   test('my admin test', async ({ adminPage }) => {
 *     // adminPage is authenticated as the worker's assigned admin
 *   });
 *
 *   test('my user test', async ({ userPage }) => {
 *     // userPage is authenticated as the worker's assigned user
 *   });
 */

/**
 * Helper function to check if user is still logged in and re-authenticate if needed.
 * Handles Decidim session timeout by performing fresh login when session expires.
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
	const authTimeout = isCI ? 90000 : 60000; // 90s on CI for authentication, 60s local

	// Navigate to home page to check session status
	await page.goto(baseURL, { timeout: authTimeout, waitUntil: 'domcontentloaded' });

	// Wait for page body to be loaded before checking login status
	await page.locator('body').waitFor({ state: 'attached', timeout: sessionCheckTimeout });

	// First check if we're already logged in by looking for the account dropdown
	// This is a positive indicator that the session is valid
	const isLoggedIn = await page
		.locator('#trigger-dropdown-account')
		.isVisible({ timeout: sessionCheckTimeout })
		.catch(() => false);

	if (isLoggedIn) {
		console.log(`[Worker ${workerIndex}] Already logged in as ${role} (account dropdown visible)`);

		// Navigate to appropriate page based on role
		if (role === 'admin') {
			await page.goto(`${baseURL}/admin/`, { timeout: authTimeout, waitUntil: 'domcontentloaded' });
			await page.locator('body').waitFor({ state: 'attached', timeout: sessionCheckTimeout });
		}

		return;
	}

	// If not logged in, check if we see the login link
	const needsLogin = await page
		.getByRole('link', { name: 'Log in' })
		.isVisible({ timeout: sessionCheckTimeout })
		.catch(() => false);

	if (!needsLogin) {
		// Neither account dropdown nor login link visible - session might be in invalid state
		console.log(`[Worker ${workerIndex}] Session state unclear for ${role} - forcing re-authentication`);
	} else {
		console.log(`[Worker ${workerIndex}] Not logged in as ${role} - Login link visible`);
	}

	// Navigate directly to login page
	await page.goto(`${baseURL}/users/sign_in`, { timeout: authTimeout });
	await page.waitForLoadState('load', { timeout: authTimeout });

	// Wait for login form to be visible
	const emailField = page.locator('#session_user_email');
	const passwordField = page.locator('#session_user_password');

	await emailField.waitFor({ state: 'visible', timeout: authTimeout });
	await passwordField.waitFor({ state: 'visible', timeout: authTimeout });

	// Fill and submit login form
	await emailField.fill(user.email);
	await passwordField.fill(user.password);
	await page.getByRole('button', { name: 'Log in' }).click();

	// Wait for login to complete
	await page.locator('#trigger-dropdown-account').waitFor({ state: 'visible', timeout: authTimeout });

	// After authentication, navigate admin to admin homepage
	if (role === 'admin') {
		await page.goto(`${baseURL}/admin/`, { timeout: authTimeout });
		await page.waitForLoadState('load', { timeout: authTimeout });
	}

	console.log(`[Worker ${workerIndex}] Authentication successful for ${role}`);
}

export type ParallelTestFixtures = {
	/** Page authenticated as admin for this worker */
	adminPage: Page;
	/** Page authenticated as regular user for this worker */
	userPage: Page;
	/** Admin context for this worker */
	adminContext: BrowserContext;
	/** User context for this worker */
	userContext: BrowserContext;
	/** Current worker index (from Playwright's parallelIndex) */
	workerIndex: number;
	/** Admin user credentials for this worker */
	adminUser: ReturnType<typeof getWorkerUser>;
	/** Regular user credentials for this worker */
	regularUser: ReturnType<typeof getWorkerUser>;
};

export const test = base.extend<ParallelTestFixtures>({
	workerIndex: async ({}, use, testInfo) => {
		await use(testInfo.parallelIndex);
	},

	adminUser: async ({ workerIndex }, use) => {
		await use(getWorkerUser('admin', workerIndex));
	},

	regularUser: async ({ workerIndex }, use) => {
		await use(getWorkerUser('user', workerIndex));
	},

	adminContext: async ({ browser, workerIndex }, use) => {
		const poolSize = getUserPoolSize('admin');
		const userIndex = workerIndex % poolSize;
		const storagePath = path.resolve(__dirname, `../auth/admin-state-${userIndex}.json`);

		// Check if storage state exists
		if (!fs.existsSync(storagePath)) {
			throw new Error(
				`Admin storage state not found for worker ${workerIndex} (user index ${userIndex}). ` +
					`Expected file: ${storagePath}. Run 'npm run test:parallel:setup' first.`
			);
		}

		const context = await browser.newContext({
			storageState: storagePath
		});

		console.log(`[Worker ${workerIndex}] Using admin state: admin-state-${userIndex}.json`);

		await use(context);
		await context.close();
	},

	userContext: async ({ browser, workerIndex }, use) => {
		const poolSize = getUserPoolSize('user');
		const userIndex = workerIndex % poolSize;
		const storagePath = path.resolve(__dirname, `../auth/user-state-${userIndex}.json`);

		// Check if storage state exists
		if (!fs.existsSync(storagePath)) {
			throw new Error(
				`User storage state not found for worker ${workerIndex} (user index ${userIndex}). ` +
					`Expected file: ${storagePath}. Run 'npm run test:parallel:setup' first.`
			);
		}

		const context = await browser.newContext({
			storageState: storagePath
		});

		console.log(`[Worker ${workerIndex}] Using user state: user-state-${userIndex}.json`);

		await use(context);
		await context.close();
	},

	adminPage: async ({ adminContext, adminUser, workerIndex }, use) => {
		const page = await adminContext.newPage();

		// Verify session is still valid, re-authenticate if expired
		await ensureAuthenticated(page, adminUser, 'admin', workerIndex);

		await use(page);
		await page.close();
	},

	userPage: async ({ userContext, regularUser, workerIndex }, use) => {
		const page = await userContext.newPage();

		// Verify session is still valid, re-authenticate if expired
		await ensureAuthenticated(page, regularUser, 'user', workerIndex);

		await use(page);
		await page.close();
	}
});

export { expect } from '@playwright/test';

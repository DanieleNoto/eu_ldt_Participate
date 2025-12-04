/**
 * SPDX-License-Identifier: AGPL-3.0
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

	// Navigate to home page to check session status
	await page.goto(baseURL);
	await page.waitForLoadState('networkidle');

	// Check if user is still logged in (10 seconds to allow Decidim session validation)
	const isLoggedIn = await page
		.locator('#trigger-dropdown-account')
		.isVisible({ timeout: 10000 })
		.catch(() => false);

	if (isLoggedIn) {
		console.log(`[Worker ${workerIndex}] Session valid for ${role}`);
		return;
	}

	// Session expired - need to re-authenticate
	console.log(`[Worker ${workerIndex}] Session expired for ${role} - Re-authenticating...`);

	// Navigate directly to login page
	await page.goto(`${baseURL}/users/sign_in`);
	await page.waitForLoadState('networkidle');

	// Wait for login form to be visible
	const emailField = page.locator('#session_user_email');
	const passwordField = page.locator('#session_user_password');

	await emailField.waitFor({ state: 'visible' });
	await passwordField.waitFor({ state: 'visible' });

	// Fill and submit login form
	await emailField.fill(user.email);
	await passwordField.fill(user.password);
	await page.getByRole('button', { name: 'Log in' }).click();

	// Wait for login to complete
	await page.locator('#trigger-dropdown-account').waitFor({ state: 'visible' });

	// After re-authentication, navigate admin to admin homepage
	if (role === 'admin') {
		await page.goto(`${baseURL}/admin/`);
		await page.waitForLoadState('networkidle');
	}

	console.log(`[Worker ${workerIndex}] Re-authentication successful for ${role}`);
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

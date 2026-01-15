/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import { DecidimKeycloakAuthHelper } from '../utils/decidim-keycloak-auth';
import { STORAGE_STATE } from '../utils/constants';
import * as fs from 'fs';

/**
 * Test fixture for tests using Keycloak authentication.
 * Automatically checks session validity and re-authenticates if needed.
 *
 * Usage:
 *   import { test, expect } from '@fixtures/keycloak-test';
 *
 *   test('@useKeycloak my test', async ({ adminPage }) => {
 *     // Use adminPage with automatic session management
 *   });
 */

/**
 * Helper function to check if user is still logged in and re-authenticate if needed.
 */
async function ensureKeycloakAuthenticated(page: Page, role: 'admin' | 'user'): Promise<void> {
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
		console.log(`[Keycloak] Already logged in as ${role} (account dropdown visible)`);

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
		console.log(`[Keycloak] Session state unclear for ${role} - forcing re-authentication`);
	} else {
		console.log(`[Keycloak] Not logged in as ${role} - Login link visible`);
	}

	const email = role === 'admin' ? process.env.TEST_KEYCLOAK_ADMIN_EMAIL : process.env.TEST_KEYCLOAK_USER_EMAIL;
	const password =
		role === 'admin' ? process.env.TEST_KEYCLOAK_ADMIN_PASSWORD : process.env.TEST_KEYCLOAK_USER_PASSWORD;

	if (!email || !password) {
		throw new Error(`Keycloak credentials not found for ${role}`);
	}

	// Use Keycloak authentication helper
	const authHelper = new DecidimKeycloakAuthHelper();
	await authHelper.injectSessionIntoPage(page, email, password, role === 'admin', '/account');

	// Wait for authentication to complete
	await page.locator('#trigger-dropdown-account').waitFor({ state: 'visible', timeout: authTimeout });

	// After authentication, navigate admin to admin homepage
	if (role === 'admin') {
		await page.goto(`${baseURL}/admin/`, { timeout: authTimeout, waitUntil: 'domcontentloaded' });
		await page.locator('body').waitFor({ state: 'attached', timeout: sessionCheckTimeout });
	}

	console.log(`[Keycloak] Authentication successful for ${role}`);
}

export type KeycloakTestFixtures = {
	/** Page authenticated as admin via Keycloak */
	adminPage: Page;
	/** Page authenticated as regular user via Keycloak */
	userPage: Page;
	/** Admin context (Keycloak admin) */
	adminContext: BrowserContext;
	/** User context (Keycloak user) */
	userContext: BrowserContext;
};

export const test = base.extend<KeycloakTestFixtures>({
	// Keycloak admin context
	adminContext: async ({ browser }, use) => {
		const storagePath = STORAGE_STATE.KEYCLOAK_ADMIN;

		if (!fs.existsSync(storagePath)) {
			throw new Error(
				`Keycloak admin storage state not found: ${storagePath}. ` +
					`Run 'USE_KEYCLOAK=true npx playwright test --project admin-setup' first.`
			);
		}

		const context = await browser.newContext({
			storageState: storagePath
		});

		console.log(`[Keycloak] Using admin state: ${storagePath}`);

		await use(context);
		await context.close();
	},

	// Keycloak user context
	userContext: async ({ browser }, use) => {
		const storagePath = STORAGE_STATE.KEYCLOAK_USER;

		if (!fs.existsSync(storagePath)) {
			throw new Error(
				`Keycloak user storage state not found: ${storagePath}. ` +
					`Run 'USE_KEYCLOAK=true npx playwright test --project user-setup' first.`
			);
		}

		const context = await browser.newContext({
			storageState: storagePath
		});

		console.log(`[Keycloak] Using user state: ${storagePath}`);

		await use(context);
		await context.close();
	},

	adminPage: async ({ adminContext }, use) => {
		const page = await adminContext.newPage();
		await ensureKeycloakAuthenticated(page, 'admin');
		await use(page);
		await page.close();
	},

	userPage: async ({ userContext }, use) => {
		const page = await userContext.newPage();
		await ensureKeycloakAuthenticated(page, 'user');
		await use(page);
		await page.close();
	}
});

export { expect } from '@playwright/test';

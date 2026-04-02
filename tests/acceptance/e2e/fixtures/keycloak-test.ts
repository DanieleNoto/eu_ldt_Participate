/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import { DecidimKeycloakAuthHelper } from '../utils/decidim-keycloak-auth';

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
	const email = role === 'admin' ? process.env.TEST_KEYCLOAK_ADMIN_EMAIL : process.env.TEST_KEYCLOAK_USER_EMAIL;
	const password =
		role === 'admin' ? process.env.TEST_KEYCLOAK_ADMIN_PASSWORD : process.env.TEST_KEYCLOAK_USER_PASSWORD;

	if (!email || !password) {
		throw new Error(`Keycloak credentials not found for ${role}`);
	}

	console.log(`[Keycloak] Forcing fresh authentication for ${role}`);

	// Use Keycloak authentication helper
	const authHelper = new DecidimKeycloakAuthHelper();
	await authHelper.injectSessionIntoPage(page, email, password, true, '/account');

	// Wait for authentication to complete
	await page.locator('#trigger-dropdown-account').waitFor({ state: 'visible', timeout: authTimeout });

	// After authentication, navigate admin to admin homepage
	if (role === 'admin') {
		await page.goto(`${baseURL}/admin/`, { timeout: authTimeout, waitUntil: 'domcontentloaded' });
		await page.locator('body').waitFor({ state: 'attached', timeout: sessionCheckTimeout });
	}

	console.log(`[Keycloak] Fresh authentication successful for ${role}`);
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
		const context = await browser.newContext();

		console.log('[Keycloak] Using fresh admin browser context');

		await use(context);
		await context.close();
	},

	// Keycloak user context
	userContext: async ({ browser }, use) => {
		const context = await browser.newContext();

		console.log('[Keycloak] Using fresh user browser context');

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

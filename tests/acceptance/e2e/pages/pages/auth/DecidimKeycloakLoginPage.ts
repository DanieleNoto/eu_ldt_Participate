/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import type { Page } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

const auth_redirect_uri = process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app';

export class DecidimLoginPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Authenticate via the Keycloak SSO flow.
	 *
	 * All wait operations rely on the global `navigationTimeout` and
	 * `actionTimeout` configured in playwright.config.ts
	 *
	 * The `waitForURL` is registered *before* `click()` via `Promise.all` to
	 * avoid the race condition where the Keycloak redirect completes before
	 * `waitForURL` is called.
	 *
	 * Flow: sign_in → Keycloak auth → Continue → credentials → Accept → app
	 */
	async loginWithKeycloak(username: string, password: string): Promise<void> {
		// 1. Navigate to the Decidim login page
		console.log('Navigating to sign_in page...');
		await this.page.goto('/users/sign_in', { waitUntil: 'domcontentloaded' });

		// 2. Click the Keycloak SSO button
		console.log('Waiting for Keycloak button...');
		const keycloakButton = this.page.locator('a[href*="/users/auth/keycloakopenid"]').first();
		await keycloakButton.waitFor({ state: 'visible' });
		console.log('Keycloak button found – clicking and waiting for Keycloak auth page...');

		// Register the URL listener before the click to avoid the race condition.
		await Promise.all([
			this.page.waitForURL('**/realms/LDT/protocol/openid-connect/auth**'),
			keycloakButton.click()
		]);

		// 3. "Continue" button
		console.log('Waiting for Continue button...');
		const continueButton = this.page.getByRole('button').filter({ hasText: 'Continue' });
		await continueButton.waitFor({ state: 'visible' });
		console.log('Clicking Continue...');
		await continueButton.click();

		// 4. Fill in credentials
		console.log('Filling username...');
		const usernameField = this.page.getByRole('textbox', { name: 'Email' });
		await usernameField.waitFor({ state: 'visible' });
		await usernameField.fill(username);

		console.log('Filling password...');
		const passwordField = this.page.getByRole('textbox', { name: 'Password' });
		await passwordField.waitFor({ state: 'visible' });
		await passwordField.fill(password);

		console.log('Clicking Sign In...');
		const signInButton = this.page.getByRole('button', { name: 'Sign In' });
		await signInButton.waitFor({ state: 'visible' });
		await signInButton.click();

		// 5. OIDC consent screen ("Accept")
		// Use explicit timeout early — setup contexts (browser.newContext()) do not inherit
		// navigationTimeout from playwright.config.ts and default to 30s.
		const isCI = process.env.CI === 'true';
		const redirectTimeout = isCI ? 90000 : 60000;
		console.log('Waiting for Accept button...');
		const acceptButton = this.page.getByRole('button', { name: 'Accept' });
		await acceptButton.waitFor({ state: 'visible', timeout: redirectTimeout });
		console.log('Clicking Accept...');
		await acceptButton.click();

		// 6. Wait for the final redirect back to the app
		console.log('Waiting for redirect to app...');
		await this.page.waitForURL(
			url => url.toString().startsWith(`${auth_redirect_uri}/`) && !url.toString().includes('/users/sign_in'),
			{ timeout: redirectTimeout }
		);
		await this.page.locator('body').waitFor({ state: 'attached', timeout: redirectTimeout });
		// Public pages use #trigger-dropdown-account; the admin panel uses #admin-dropdown-menu-login-trigger.
		const accountDropdown = this.page
			.locator('#trigger-dropdown-account, #admin-dropdown-menu-login-trigger')
			.first();
		await accountDropdown.waitFor({ state: 'visible', timeout: redirectTimeout });

		if (this.page.url().includes('/users/sign_in')) {
			throw new Error('Authentication failed - still on login page after redirect');
		}

		console.log('Authentication successful');
	}
}

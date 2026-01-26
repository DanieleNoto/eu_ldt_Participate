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

	async loginWithKeycloak(username: string, password: string): Promise<void> {
		console.log('Starting Keycloak authentication');

		await this.page.goto('/users/sign_in', { waitUntil: 'networkidle' });

		console.log('Login page loaded, waiting for Keycloak button...');

		const keycloakButton = this.page.locator('a[href*="/users/auth/keycloakopenid"]').first();

		// Wait for the Keycloak button to be visible before clicking
		await keycloakButton.waitFor({ state: 'visible' });
		console.log('Keycloak button found, clicking...');

		await keycloakButton.click();

		console.log('Waiting for Keycloak auth page...');
		await this.page.waitForURL('**/realms/LDT/protocol/openid-connect/auth**');

		console.log('Waiting for Continue button...');
		const continueButton = this.page.getByRole('button').filter({ hasText: 'Continue' });
		await continueButton.waitFor({ state: 'visible' });
		console.log('Clicking Continue button...');
		await continueButton.click();

		console.log('Waiting for username field...');
		const usernameField = this.page.getByRole('textbox', { name: 'username' });
		await usernameField.waitFor({ state: 'visible' });
		console.log('Filling username...');
		await usernameField.fill(username);

		console.log('Waiting for password field...');
		const passwordField = this.page.getByRole('textbox', { name: 'Password' });
		await passwordField.waitFor({ state: 'visible' });
		console.log('Filling password...');
		await passwordField.fill(password);

		console.log('Waiting for Sign In button...');
		const signInButton = this.page.getByRole('button', { name: 'Sign In' });
		await signInButton.waitFor({ state: 'visible' });
		console.log('Clicking Sign In...');
		await signInButton.click();

		console.log('Waiting for Accept button...');
		const acceptButton = this.page.getByRole('button', { name: 'Accept' });
		await acceptButton.waitFor({ state: 'visible' });
		console.log('Clicking Accept...');
		await acceptButton.click();

		console.log('Waiting for redirect...');
		await this.page.waitForURL(`${auth_redirect_uri}/**`);
		await this.page.waitForLoadState('networkidle');

		if (this.page.url().includes('/users/sign_in')) {
			throw new Error('Authentication failed - still on login page');
		}

		console.log('Authentication successful');
	}
}

/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
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

		await this.page.goto('/users/sign_in');

		const keycloakButton = this.page.locator('a[href*="/users/auth/keycloakopenid"]').first();
		await keycloakButton.click();

		await this.page.waitForURL('**/realms/LDT/protocol/openid-connect/auth**');

		await this.page.getByRole('button').filter({ hasText: 'Continue' }).click();

		await this.page.getByRole('textbox', { name: 'Email' }).fill(username);
		await this.page.getByRole('textbox', { name: 'Password' }).fill(password);

		await this.page.getByRole('button', { name: 'Sign In' }).click();

		await this.page.getByRole('button', { name: 'Accept' }).click();

		await this.page.waitForURL(`${auth_redirect_uri}/**`);
		await this.page.waitForLoadState('networkidle');

		if (this.page.url().includes('/users/sign_in')) {
			throw new Error('Authentication failed - still on login page');
		}

		console.log('Authentication successful');
	}
}

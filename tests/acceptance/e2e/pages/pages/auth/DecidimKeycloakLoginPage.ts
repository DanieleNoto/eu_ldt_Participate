/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Simone Bianchelli
 */

import type { Page } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

const auth_redirect_uri = process.env.FE_BASE_URL || 'https://part-int.ldttoolbox.app';
const max_retry_attempts = 3;

export class DecidimLoginPage extends BasePage {
	private readonly flashSuccess = this.page.locator('.flash.success');
	private readonly flashSuccessMessage = this.flashSuccess.locator('.flash__message');

	constructor(page: Page) {
		super(page);
	}

	/**
	 * Click Continue button if present
	 */
	private async clickContinueIfPresent(): Promise<boolean> {
		try {
			const continueButton = this.page.getByRole('button', { name: 'Continue' });
			await continueButton.waitFor({ state: 'visible' });

			console.log('Clicking Continue');
			await continueButton.click();
			await this.page.waitForLoadState('networkidle');
			return true;
		} catch (error) {
			if (error instanceof Error) {
				console.warn('Continue button not visible:', error.message);
			} else {
				console.warn('Continue button not visible');
			}
			return false;
		}
	}

	/**
	 * Fill email and password then submit
	 */
	private async fillCredentialsAndSubmit(username: string, password: string): Promise<void> {
		console.log('Waiting for email field');
		const emailField = this.page.getByRole('textbox', { name: 'Email' });
		await emailField.waitFor({ state: 'visible' });

		console.log('Filling email');
		await emailField.fill(username);

		console.log('Filling password');
		const passwordField = this.page.getByRole('textbox', { name: 'Password' });
		await passwordField.fill(password);

		console.log('Clicking Sign In');
		const signInButton = this.page.getByRole('button', { name: 'Sign In' });
		await signInButton.click();
	}

	/**
	 * Fill only password and submit
	 */
	private async fillPasswordAndSubmit(password: string): Promise<void> {
		console.log('Waiting for password field');
		const passwordField = this.page.getByRole('textbox', { name: 'Password' });
		await passwordField.waitFor({ state: 'visible' });

		console.log('Filling password');
		await passwordField.fill(password);

		console.log('Clicking Sign In');
		const signInButton = this.page.getByRole('button', { name: 'Sign In' });
		await signInButton.click();
	}

	/**
	 * Click Accept button if present
	 */
	private async clickAcceptIfPresent(): Promise<boolean> {
		try {
			const acceptButton = this.page.getByRole('button', { name: 'Accept' });
			await acceptButton.waitFor({ state: 'visible' });

			console.log('Clicking Accept');
			await acceptButton.click();
			return true;
		} catch (error) {
			if (error instanceof Error) {
				console.warn('Accept button not visible:', error.message);
			} else {
				console.warn('Accept button not visible');
			}
			return false;
		}
	}

	/**
	 * Check if on Decidim home page
	 */
	private async isOnDecidimHome(): Promise<boolean> {
		const currentUrl = this.page.url();
		return (
			currentUrl === `${auth_redirect_uri}/` ||
			(currentUrl.startsWith(auth_redirect_uri) && !currentUrl.includes('/realms/LDT'))
		);
	}

	/**
	 * Check if on Keycloak auth page
	 */
	private isOnKeycloakAuthPage(): boolean {
		const currentUrl = this.page.url();
		return currentUrl.includes('/realms/LDT/protocol/openid-connect/auth');
	}

	/**
	 * Verify authentication success flash message
	 */
	private async verifyAuthenticationFlashMessage(): Promise<boolean> {
		try {
			await this.flashSuccessMessage.waitFor({ state: 'visible' });
			const messageText = await this.flashSuccessMessage.textContent();

			if (messageText?.includes('Successfully authenticated from Keycloakopenid account')) {
				console.log('Authentication flash message verified');
				return true;
			}

			console.warn(`Unexpected flash message: ${messageText}`);
			return false;
		} catch (error) {
			if (error instanceof Error) {
				console.warn('Flash message not found:', error.message);
			} else {
				console.warn('Flash message not found');
			}
			return false;
		}
	}

	/**
	 * Attempt authentication with retry logic
	 */
	private async attemptAuthentication(password: string, isFirstAttempt: boolean): Promise<boolean> {
		if (isFirstAttempt) {
			await this.page.waitForLoadState('networkidle');
		} else {
			await this.fillPasswordAndSubmit(password);
			await this.page.waitForLoadState('networkidle');
		}

		const acceptClicked = await this.clickAcceptIfPresent();
		if (acceptClicked) {
			await this.page.waitForLoadState('networkidle');
		}

		if (await this.isOnDecidimHome()) {
			return await this.verifyAuthenticationFlashMessage();
		}

		return false;
	}

	/**
	 * Login with Keycloak - retry logic if Accept doesn't redirect
	 */
	async loginWithKeycloak(username: string, password: string): Promise<void> {
		console.log('Starting Keycloak authentication');

		await this.page.goto('/users/sign_in');
		await this.page.waitForLoadState('domcontentloaded');
		console.log('Navigated to login page');

		const keycloakButton = this.page.locator('a[href*="/users/auth/keycloakopenid"]').first();
		await keycloakButton.click();
		console.log('Clicked Keycloak button');

		await this.page.waitForURL('**/realms/LDT/protocol/openid-connect/auth**');
		await this.page.waitForLoadState('networkidle');
		console.log('Redirected to Keycloak auth page');

		await this.clickContinueIfPresent();
		await this.fillCredentialsAndSubmit(username, password);

		// First attempt
		if (await this.attemptAuthentication(password, true)) {
			console.log('Authentication completed successfully on first attempt');
			return;
		}

		// Retry loop
		for (let attempt = 2; attempt <= max_retry_attempts; attempt++) {
			if (!this.isOnKeycloakAuthPage()) {
				console.warn(`Unexpected page: ${this.page.url()}`);
				break;
			}

			console.log(`Retry attempt ${attempt}/${max_retry_attempts}`);

			if (await this.attemptAuthentication(password, false)) {
				console.log(`Authentication completed successfully on attempt ${attempt}`);
				return;
			}

			if (this.isOnKeycloakAuthPage()) {
				console.log('Still on Keycloak auth page, will retry');
			}
		}

		// Final verification
		await this.page.waitForLoadState('networkidle');

		if (!(await this.isOnDecidimHome())) {
			throw new Error(
				`Authentication failed after ${max_retry_attempts} attempts. Final URL: ${this.page.url()}`
			);
		}

		await this.verifyAuthenticationFlashMessage();
		console.log('Authentication completed successfully');
	}
}

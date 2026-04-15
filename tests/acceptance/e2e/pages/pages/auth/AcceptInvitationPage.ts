/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Antonio Abramo Carotenuto
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/**
 * AcceptInvitationPage - Page Object Model for the invitation acceptance/registration completion page.
 *
 * This page allows users to complete their account creation after accepting an invitation.
 * It contains fields for nickname (pre-filled), password, terms of service agreement, and a Save button.
 */
export class AcceptInvitationPage extends BasePage {
	private readonly pageTitle: Locator;
	private readonly nicknameInput: Locator;
	private readonly passwordInput: Locator;
	private readonly termsOfServiceCheckbox: Locator;
	private readonly saveButton: Locator;
	private readonly invitationTokenInput: Locator;

	constructor(page: Page) {
		super(page);
		this.pageTitle = this.page.getByRole('heading', { name: 'Finish creating your account' });
		this.nicknameInput = this.page.getByRole('textbox', { name: 'Nickname Required field Your' });
		this.passwordInput = this.page.getByRole('textbox', { name: 'Password' });
		this.termsOfServiceCheckbox = this.page.getByRole('checkbox', { name: 'By signing up you agree to' });
		this.saveButton = this.page.getByRole('button', { name: 'Save' });
		this.invitationTokenInput = this.page.locator('input[name="user[invitation_token]"]');
	}

	/**
	 * Navigate to the accept invitation page with a specific token
	 * @param token - The invitation token
	 */
	async navigateToAcceptInvitation(token: string): Promise<void> {
		await this.page.goto(`/users/invitation/accept?invitation_token=${token}`);
		await this.page.waitForLoadState('load');
	}

	/**
	 * Verify that we are on the accept invitation page
	 */
	async expectToBeOnAcceptInvitationPage(): Promise<void> {
		await expect(this.pageTitle).toBeVisible();
		await expect(this.page).toHaveURL(/.*users\/invitation\/accept.*/);
	}

	/**
	 * Verify the page title is correct
	 */
	async verifyPageTitle(): Promise<void> {
		await expect(this.pageTitle).toBeVisible();
		await expect(this.pageTitle).toHaveText('Finish creating your account');
	}

	/**
	 * Get the current value of the nickname field
	 * @returns The nickname value
	 */
	async getNicknameValue(): Promise<string> {
		return await this.nicknameInput.inputValue();
	}

	/**
	 * Verify that the nickname field is pre-filled with the expected value
	 * @param expectedValue - The expected nickname value (converted to lowercase by Decidim)
	 */
	async verifyNicknamePrefilled(expectedValue: string): Promise<void> {
		await expect(this.nicknameInput).toBeVisible();

		// Decidim converts the name to lowercase automatically
		const expectedNickname = expectedValue.toLowerCase();

		const nicknameValue = await this.getNicknameValue();
		expect(nicknameValue).toBe(expectedNickname);
	}

	/**
	 * Fill the password field
	 * @param password - The password to enter
	 */
	async fillPassword(password: string): Promise<void> {
		await this.passwordInput.waitFor({ state: 'visible' });
		await this.passwordInput.fill(password);
	}

	/**
	 * Check the terms of service checkbox
	 */
	async acceptTermsOfService(): Promise<void> {
		await this.termsOfServiceCheckbox.waitFor({ state: 'visible' });
		await expect(this.termsOfServiceCheckbox).toBeEnabled();
		await this.termsOfServiceCheckbox.scrollIntoViewIfNeeded();

		if (await this.termsOfServiceCheckbox.isChecked()) {
			return;
		}

		try {
			await this.termsOfServiceCheckbox.check();
		} catch (error: unknown) {
			// Playwright's check() may fail if a custom component intercepts the click;
			// fall back to direct DOM manipulation to ensure the checkbox state is set.
			console.warn('Checkbox check() failed, falling back to evaluate():', error);
			await this.termsOfServiceCheckbox.evaluate((checkbox: HTMLInputElement) => {
				checkbox.checked = true;
				checkbox.dispatchEvent(new Event('input', { bubbles: true }));
				checkbox.dispatchEvent(new Event('change', { bubbles: true }));
			});
		}

		await expect(this.termsOfServiceCheckbox).toBeChecked();
	}

	/**
	 * Verify that the terms of service checkbox is checked
	 */
	async verifyTermsOfServiceAccepted(): Promise<void> {
		await expect(this.termsOfServiceCheckbox).toBeChecked();
	}

	/**
	 * Click the save button to complete registration.
	 */
	async clickSave(): Promise<void> {
		await expect(this.saveButton).toBeVisible();
		await expect(this.saveButton).toBeEnabled();
		await this.saveButton.scrollIntoViewIfNeeded();
		await this.saveButton.click();
	}

	/**
	 * Verify that the invitation token is present in the form
	 */
	async verifyInvitationTokenPresent(): Promise<void> {
		await expect(this.invitationTokenInput).toBeAttached();
		const tokenValue = await this.invitationTokenInput.inputValue();
		expect(tokenValue).toBeTruthy();
		expect(tokenValue.length).toBeGreaterThan(0);
	}
}

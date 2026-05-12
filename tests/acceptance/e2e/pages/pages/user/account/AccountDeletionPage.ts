/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { Locator, Page, expect } from '@playwright/test';
import { getLocalizedText } from '../../../../utils/localization.utils';
import { HeaderComponent } from '../../../components/common/HeaderComponent';
import { VerticalTabsComponent } from '../../../components/common/VerticalTabsComponent';

/**
 * Page Object Model for the Account Deletion page
 * Handles the account deletion functionality and related interactions
 */
export class AccountDeletionPage {
	private page: Page;
	public headerComponent: HeaderComponent;
	public verticalTabsComponent: VerticalTabsComponent;

	constructor(page: Page) {
		this.page = page;
		this.headerComponent = new HeaderComponent(page);
		this.verticalTabsComponent = new VerticalTabsComponent(page);
	}

	// Page elements
	get pageTitle(): Locator {
		return this.page.locator('h1.title-decorator');
	}

	get warningMessage(): Locator {
		return this.page.locator('main section .flash.alert .flash__message');
	}

	get deleteReasonTextarea(): Locator {
		return this.page.getByRole('textbox', { name: 'Reason to delete your account' });
	}

	get deleteReasonLabel(): Locator {
		return this.page.locator('label .help-text');
	}

	get deleteAccountButton(): Locator {
		return this.page.locator('button[data-dialog-open="delete-account"]');
	}

	get deleteAccountForm(): Locator {
		return this.page.locator('form.delete-account');
	}

	get authenticityToken(): Locator {
		return this.page.locator('input[name="authenticity_token"]');
	}

	get methodInput(): Locator {
		return this.page.locator('input[name="_method"][value="delete"]');
	}

	// Vertical tabs navigation
	get verticalTabsDropdown(): Locator {
		return this.page.locator('#dropdown-trigger-profile');
	}

	get verticalTabsList(): Locator {
		return this.page.locator('#dropdown-menu-profile');
	}

	get accountTab(): Locator {
		return this.page.locator('#dropdown-menu-profile a[href*="/account"]').first();
	}

	get notificationsTab(): Locator {
		return this.page.locator('#dropdown-menu-profile a[href*="/notifications_settings"]');
	}

	get interestsTab(): Locator {
		return this.page.locator('#dropdown-menu-profile a[href*="/user_interests"]');
	}

	get dataTab(): Locator {
		return this.page.locator('#dropdown-menu-profile a[href*="/download_your_data"]');
	}

	get deleteAccountTab(): Locator {
		return this.page.locator('#dropdown-menu-profile a[href*="/account/delete"]');
	}

	// Modal elements (these will appear after clicking delete button)
	get deleteConfirmationModal(): Locator {
		return this.page.locator('#delete-account[data-dialog="delete-account"]');
	}

	get modalConfirmButton(): Locator {
		return this.page.locator('#delete-account input[type="submit"]');
	}

	get modalCancelButton(): Locator {
		// Select the main cancel button (not the close X button)
		return this.page.locator('#delete-account button[data-dialog-close="delete-account"].button');
	}

	// Additional modal elements for more specific testing
	get modalTitle(): Locator {
		return this.page.locator('#dialog-title-delete-account');
	}

	get modalCloseButton(): Locator {
		// The X button in the top right
		return this.page.locator('#delete-account button[data-dialog-closable][aria-label="Close modal"]');
	}

	get modalCancelWindowButton(): Locator {
		// Alternative selector for the "Close window" button
		return this.page.locator('#delete-account button:has-text("Close window")');
	}

	get modalForm(): Locator {
		return this.page.locator('#delete-account form.delete-account-modal');
	}

	get modalAuthenticityToken(): Locator {
		return this.page.locator('#delete-account input[name="authenticity_token"]');
	}

	get modalHiddenReasonField(): Locator {
		return this.page.locator('#delete-account input[name="delete_account[delete_reason]"]');
	}

	// Success/Error messages
	get successMessage(): Locator {
		return this.page.locator('#menu-bar-container .flash.success .flash__message');
	}

	get errorMessage(): Locator {
		return this.page.locator('#menu-bar-container .flash.error .flash__message');
	}

	// Session timeout elements
	get loginForm(): Locator {
		return this.page.locator('form[action*="sign_in"]');
	}

	get sessionTimeoutMessage(): Locator {
		return this.page.locator('.flash.alert .flash__message');
	}

	// Methods
	async navigateToMyAccount(): Promise<void> {
		await this.headerComponent.goToMyAccount();
	}
	async navigateToAccountDeletion(): Promise<void> {
		await this.verticalTabsComponent.navigateToDeleteAccount();
	}

	async fillDeleteReason(reason: string): Promise<void> {
		await this.deleteReasonTextarea.fill(reason);
	}

	async clickDeleteAccountButton(): Promise<void> {
		await this.deleteAccountButton.click();
	}

	async confirmDeletion(): Promise<void> {
		await this.modalConfirmButton.click();
	}

	async cancelDeletion(): Promise<void> {
		// Try the main cancel button first (Close window), then the close button if needed
		const cancelButton = this.modalCancelButton;
		const closeButton = this.modalCloseButton;

		if (await cancelButton.isVisible()) {
			await cancelButton.click();
		} else if (await closeButton.isVisible()) {
			await closeButton.click();
		} else {
			// Fallback: use Escape key
			await this.page.keyboard.press('Escape');
		}
	}

	async closeModalWithX(): Promise<void> {
		// Specifically use the X button to close the modal
		await this.modalCloseButton.click();
	}

	async closeModalWithCancelButton(): Promise<void> {
		// Specifically use the "Close window" button
		await this.modalCancelButton.click();
	}

	async waitForConfirmationModal(): Promise<void> {
		await this.deleteConfirmationModal.waitFor({ state: 'visible' });
	}

	async verifyModalContent(): Promise<void> {
		await expect(this.modalTitle).toBeVisible();
		await expect(this.modalTitle).toContainText('Are you sure you want to delete your account?');
		await expect(this.modalConfirmButton).toBeVisible();

		// Verify at least one cancel/close button is visible
		const cancelVisible = await this.modalCancelButton.isVisible();
		const closeVisible = await this.modalCloseButton.isVisible();
		expect(cancelVisible || closeVisible).toBe(true);
	}

	async verifyAllModalButtons(): Promise<void> {
		// Verify all buttons are present and visible
		await expect(this.modalConfirmButton).toBeVisible();
		await expect(this.modalCancelButton).toBeVisible(); // "Close window" button
		await expect(this.modalCloseButton).toBeVisible(); // "×" button

		// Verify button texts
		await expect(this.modalConfirmButton).toHaveValue('Yes, I want to delete my account');
		await expect(this.modalCancelButton).toContainText('Close window');
		await expect(this.modalCloseButton).toHaveAttribute('aria-label', 'Close modal');
	}

	async verifyModalAccessibility(): Promise<void> {
		// Verify modal has proper ARIA attributes
		await expect(this.deleteConfirmationModal).toHaveAttribute('role', 'dialog');
		await expect(this.deleteConfirmationModal).toHaveAttribute('aria-modal', 'true');
		await expect(this.deleteConfirmationModal).toHaveAttribute('aria-hidden', 'false');
	}

	async isModalVisible(): Promise<boolean> {
		return await this.deleteConfirmationModal.isVisible();
	}

	async isModalHidden(): Promise<boolean> {
		const ariaHidden = await this.deleteConfirmationModal.getAttribute('aria-hidden');
		return ariaHidden === 'true' || !(await this.deleteConfirmationModal.isVisible());
	}

	async waitForPageLoad(): Promise<void> {
		await this.page.waitForLoadState('load');
		await this.pageTitle.waitFor({ state: 'visible' });
	}

	async verifyPageElements(): Promise<void> {
		await expect(this.pageTitle).toBeVisible();
		await expect(this.warningMessage).toBeVisible();
		await expect(this.deleteReasonTextarea).toBeVisible();
		await expect(this.deleteAccountButton).toBeVisible();
	}

	async verifyWarningMessage(): Promise<void> {
		const expectedText = getLocalizedText('accountDeletion.warningMessage');
		await expect(this.warningMessage).toContainText(expectedText);
	}

	async verifyDeleteButtonText(): Promise<void> {
		const expectedText = getLocalizedText('accountDeletion.deleteButton');
		await expect(this.deleteAccountButton).toContainText(expectedText);
	}

	async verifyVerticalTabsNavigation(): Promise<void> {
		await expect(this.verticalTabsDropdown).toBeVisible();

		// Check that the delete account tab is active
		await expect(this.deleteAccountTab).toHaveClass(/is-active/);
	}

	async navigateToOtherTab(tabName: 'account' | 'notifications' | 'interests' | 'data'): Promise<void> {
		await this.verticalTabsDropdown.click();

		switch (tabName) {
			case 'account':
				await this.accountTab.click();
				break;
			case 'notifications':
				await this.notificationsTab.click();
				break;
			case 'interests':
				await this.interestsTab.click();
				break;
			case 'data':
				await this.dataTab.click();
				break;
		}
	}

	async verifySuccessMessage(): Promise<void> {
		await expect(this.successMessage).toBeVisible();
		const expectedText = getLocalizedText('accountDeletion.successMessage');
		await expect(this.successMessage).toContainText(expectedText);
	}

	async verifyErrorMessage(): Promise<void> {
		await expect(this.errorMessage).toBeVisible();
		const expectedText = getLocalizedText('accountDeletion.errorMessage');
		await expect(this.errorMessage).toContainText(expectedText);
	}

	async verifySessionTimeout(): Promise<void> {
		await expect(this.loginForm).toBeVisible();
		await expect(this.sessionTimeoutMessage).toBeVisible();
		const expectedText = getLocalizedText('session.timeoutMessage');
		await expect(this.sessionTimeoutMessage).toContainText(expectedText);
	}

	async getAuthenticityToken(): Promise<string> {
		return (await this.authenticityToken.getAttribute('value')) || '';
	}

	async isDeleteReasonFilled(): Promise<boolean> {
		const value = await this.deleteReasonTextarea.inputValue();
		return value.length > 0;
	}

	async isDeleteButtonEnabled(): Promise<boolean> {
		return await this.deleteAccountButton.isEnabled();
	}

	async simulateSessionTimeout(): Promise<void> {
		// Simulate session timeout by waiting for a specific duration
		// This is a test utility method to simulate timeout scenarios
		await this.page.waitForTimeout(30000); // 30 seconds
	}

	async simulateNetworkError(): Promise<void> {
		// Simulate network error by intercepting the request
		await this.page.route('**/account**', route => {
			route.abort('failed');
		});
	}

	async clearNetworkInterceptions(): Promise<void> {
		await this.page.unroute('**/account**');
	}
}

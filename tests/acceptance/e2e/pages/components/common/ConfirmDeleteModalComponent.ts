/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for the confirm delete modal component.
 * Handles the confirmation dialog that appears when deleting items.
 */
export class ConfirmDeleteModalComponent {
	private readonly page: Page;
	private readonly modal: Locator;
	private readonly closeButton: Locator;
	private readonly modalTitle: Locator;
	private readonly modalContent: Locator;
	private readonly cancelButton: Locator;
	private readonly okButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.modal = page.locator('#confirm-modal[data-dialog="confirm-modal"]');
		this.closeButton = this.modal.locator('button[data-dialog-close="confirm-modal"]');
		this.modalTitle = this.modal.locator('#dialog-title-confirm-modal');
		this.modalContent = this.modal.locator('[data-confirm-modal-content]');
		this.cancelButton = this.modal.locator('button[data-confirm-cancel]');
		this.okButton = this.modal.locator('button[data-confirm-ok]');
	}

	/**
	 * Asserts that the confirm delete modal is visible
	 */
	async expectModalVisible(): Promise<void> {
		await expect(this.modal).toBeVisible();
		await expect(this.modal).toHaveAttribute('aria-hidden', 'false');
	}

	/**
	 * Asserts that the confirm delete modal is not visible
	 */
	async expectModalNotVisible(): Promise<void> {
		await expect(this.modal).not.toBeVisible();
	}

	/**
	 * Clicks the close button (X) to close the modal
	 */
	async clickClose(): Promise<void> {
		await this.closeButton.click();
	}

	/**
	 * Clicks the Cancel button to cancel the deletion
	 */
	async clickCancel(): Promise<void> {
		await this.cancelButton.click();
	}

	/**
	 * Clicks the OK button to confirm the deletion
	 */
	async clickOK(): Promise<void> {
		await this.okButton.click();
	}

	/**
	 * Confirms the deletion by clicking OK
	 * Alias for clickOK() for better readability in tests
	 */
	async confirmDelete(): Promise<void> {
		await this.clickOK();
	}

	/**
	 * Cancels the deletion by clicking Cancel
	 * Alias for clickCancel() for better readability in tests
	 */
	async cancelDelete(): Promise<void> {
		await this.clickCancel();
	}

	/**
	 * Gets the modal title text
	 * @returns The title text of the modal
	 */
	async getModalTitle(): Promise<string> {
		return (await this.modalTitle.textContent())?.trim() || '';
	}

	/**
	 * Gets the modal content text
	 * @returns The content text of the modal
	 */
	async getModalContent(): Promise<string> {
		return (await this.modalContent.textContent())?.trim() || '';
	}

	/**
	 * Verifies that the modal displays the expected title
	 * @param expectedTitle The expected title text
	 */
	async expectModalTitle(expectedTitle: string): Promise<void> {
		await expect(this.modalTitle).toHaveText(expectedTitle);
	}

	/**
	 * Verifies that the modal displays the expected content
	 * @param expectedContent The expected content text
	 */
	async expectModalContent(expectedContent: string): Promise<void> {
		await expect(this.modalContent).toHaveText(expectedContent);
	}

	/**
	 * Verifies that this is a delete confirmation modal with standard content
	 */
	async expectDeleteConfirmationModal(): Promise<void> {
		await this.expectModalVisible();
		await this.expectModalTitle('Confirm');
		await this.expectModalContent('Confirm delete');
	}

	/**
	 * Waits for the modal to appear and then confirms the deletion
	 * Useful for quick confirmation flows in tests
	 */
	async waitAndConfirmDelete(): Promise<void> {
		await this.expectModalVisible();
		await this.confirmDelete();
	}

	/**
	 * Waits for the modal to appear and then cancels the deletion
	 * Useful for testing cancel flows
	 */
	async waitAndCancelDelete(): Promise<void> {
		await this.expectModalVisible();
		await this.cancelDelete();
	}
}

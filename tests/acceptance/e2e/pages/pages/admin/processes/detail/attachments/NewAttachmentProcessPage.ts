/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { Locator, Page, expect } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * Page Object Model for the New Attachment form in the admin area of a process.
 * Handles filling English fields, clicking Add file, and submitting the form.
 */
export class NewAttachmentProcessPage extends BaseAdminPage {
	private readonly titleInputEn: Locator;
	private readonly descriptionInputEn: Locator;
	private readonly weightInput: Locator;
	private readonly folderSelect: Locator;
	private readonly addFileButton: Locator;
	private readonly linkInput: Locator;
	private readonly submitButton: Locator;
	private readonly linkTabButton: Locator;
	private readonly successMessage: Locator;
	private readonly fileInput: Locator;
	private readonly saveButton: Locator;

	constructor(page: Page) {
		super(page);
		this.titleInputEn = page.locator('#attachment_title_en');
		this.descriptionInputEn = page.locator('#attachment_description_en');
		this.weightInput = page.locator('#attachment_weight');
		this.folderSelect = page.locator('#attachment_attachment_collection_id');
		this.addFileButton = page.locator('#attachment_file_button');
		this.linkInput = page.locator('#attachment_link');
		this.submitButton = page.locator('div.item__edit-sticky button[type="submit"]');
		this.linkTabButton = page.getByRole('button', { name: 'Link' });
		this.successMessage = page.getByText('Attachment created');
		this.fileInput = page.locator('input[type="file"][name="attachment[file]"]');
		this.saveButton = page.locator('button[data-dropzone-save]');
	}

	/**
	 * Fills the English title field
	 * @param title The attachment title (English)
	 */
	async fillTitle(title: string): Promise<void> {
		await this.titleInputEn.fill(title);
	}

	/**
	 * Fills the English description field
	 * @param description The attachment description (English)
	 */
	async fillDescription(description: string): Promise<void> {
		await this.descriptionInputEn.fill(description);
	}

	/**
	 * Fills the order position (weight) field
	 * @param weight The order position (number)
	 */
	async fillWeight(weight: number): Promise<void> {
		await this.weightInput.fill(weight.toString());
	}

	/**
	 * Selects a folder by visible text (if any folder is available)
	 * @param folderName The folder name to select
	 */
	async selectFolder(folderName: string): Promise<void> {
		await this.folderSelect.selectOption({ label: folderName });
	}

	/**
	 * Fills the link field (if using the link tab)
	 * @param url The URL to set
	 */
	async fillLink(url: string): Promise<void> {
		await this.linkInput.fill(url);
	}

	/**
	 * Clicks the "Add file" button to open the upload dialog
	 */
	async clickAddFile(): Promise<void> {
		await this.addFileButton.click();
	}

	/**
	 * Submits the new attachment form.
	 * Waits for a flash notification (success or error) rather than just waitForLoadState,
	 * because Decidim may respond with a Turbo/Rails inline re-render (no full navigation)
	 * on validation errors — causing waitForLoadState('load') to settle before the flash appears.
	 */
	async submitForm(): Promise<void> {
		await this.submitButton.click();
		await Promise.race([
			this.page
				.locator('.flash.success[data-alert-box], .flash.notice[data-alert-box]')
				.first()
				.waitFor({ state: 'visible' }),
			this.page
				.locator('.flash.alert[data-alert-box], .flash.error[data-alert-box]')
				.first()
				.waitFor({ state: 'visible' }),
			this.page.waitForLoadState('load')
		]);
	}

	/**
	 * Fills the form with the provided data (only English fields)
	 */
	async fillAttachmentForm(data: {
		title: string;
		description: string;
		weight?: number;
		folderName?: string;
		link?: string;
	}): Promise<void> {
		await this.fillTitle(data.title);
		await this.fillDescription(data.description);
		if (data.weight !== undefined) {
			await this.fillWeight(data.weight);
		}
		if (data.folderName) {
			await this.selectFolder(data.folderName);
		}
		if (data.link) {
			await this.fillLink(data.link);
		}
	}

	/**
	 * Clicks on the "Link" tab to switch to URL input mode
	 */
	async clickLinkTab(): Promise<void> {
		await this.linkTabButton.click();
	}

	/**
	 * Asserts that the new attachment form is visible
	 */
	async expectToBeOnNewAttachmentPage(): Promise<void> {
		await expect(this.titleInputEn).toBeVisible();
		await expect(this.descriptionInputEn).toBeVisible();
		await expect(this.submitButton).toBeVisible();
	}

	/**
	 * Verifies that both title and description fields are filled
	 * @returns Promise that resolves when the assertion is complete
	 */
	async expectRequiredFieldsFilled(): Promise<void> {
		const titleValue = await this.titleInputEn.inputValue();
		const descriptionValue = await this.descriptionInputEn.inputValue();

		expect(titleValue.trim()).not.toBe('');
		expect(descriptionValue.trim()).not.toBe('');
	}

	/**
	 * Verifies that at least one of the required fields (title or description) is empty
	 * @returns Promise that resolves when the assertion is complete
	 */
	async expectAtLeastOneRequiredFieldEmpty(): Promise<void> {
		const titleValue = await this.titleInputEn.inputValue();
		const descriptionValue = await this.descriptionInputEn.inputValue();

		const isTitleEmpty = titleValue.trim() === '';
		const isDescriptionEmpty = descriptionValue.trim() === '';

		expect(isTitleEmpty || isDescriptionEmpty).toBe(true);

		if (isTitleEmpty) {
			console.log('Title field is empty');
		}

		if (isDescriptionEmpty) {
			console.log('Description field is empty');
		}
	}

	/**
	 * Verifies that the success message "Attachment created" is visible
	 */
	async expectAttachmentCreatedSuccessMessage(): Promise<void> {
		await expect(this.successMessage).toBeVisible();
	}

	/**
	 * Uploads a file directly to the file input
	 * @param filePath Path to the file to upload
	 */
	async uploadFile(filePath: string): Promise<void> {
		await this.fileInput.setInputFiles(filePath);
	}

	/**
	 * Verifies that a file has been uploaded successfully by checking for the "ok" template
	 * @param fileName Name of the file that was uploaded (without path)
	 */
	async expectFileUploadedSuccessfully(fileName: string): Promise<void> {
		// Wait for the list item with the exact filename in validated state
		const uploadedFileItem = this.page.locator(
			`ul[data-dropzone-items] li[data-filename="${fileName}"][data-state="validated"]`
		);
		await expect(uploadedFileItem).toBeVisible();

		// Verify the Remove button is visible
		const removeButton = uploadedFileItem.locator('div[data-template="ok"] button', { hasText: 'Remove' });
		await expect(removeButton).toBeVisible();
	}

	/**
	 * Verifies that the validation error message is visible
	 */
	async expectValidationErrorMessage(): Promise<void> {
		const errorMessage = this.page.getByText(/Validation error!/);
		await expect(errorMessage).toBeVisible();
	}

	/**
	 * Checks if a URL is accessible by making a HEAD request
	 * @param url URL to check
	 * @returns Promise that resolves to true if the URL returns a successful response (2xx status)
	 */
	static async isUrlAccessible(url: string): Promise<boolean> {
		try {
			const response = await fetch(url, { method: 'HEAD' });
			return response.ok;
		} catch {
			return false;
		}
	}

	/**
	 * Finds the first accessible URL from an array of options by testing each one
	 * @param urls Array of URLs to check in order of preference
	 * @returns Promise that resolves to the first accessible URL
	 * @throws Error if no URLs in the array are accessible
	 */
	static async findAccessibleUrl(urls: string[]): Promise<string> {
		for (const url of urls) {
			if (await this.isUrlAccessible(url)) {
				console.log(`Using attachment URL: ${url}`);
				return url;
			}
		}
		// If none are accessible, throw an error instead of returning unusable URL
		throw new Error('No accessible URLs found in the provided list. Please check them or update the URL list.');
	}

	/**
	 * Clicks the "Save" button in the file upload modal
	 */
	async clickSaveButton(): Promise<void> {
		await this.saveButton.waitFor({ state: 'visible' });
		// Use evaluate to click directly via JavaScript
		await this.saveButton.evaluate((button: HTMLElement) => button.click());
	}

	/**
	 * Verifies that the uploaded file is visible in the upload list
	 * @param fileName Name of the file that was uploaded (without path)
	 */
	async expectUploadedFileVisible(fileName: string): Promise<void> {
		const uploadedFile = this.page.locator(`.upload-modal__files [data-filename="${fileName}"]`);
		await expect(uploadedFile).toBeVisible();
	}
}

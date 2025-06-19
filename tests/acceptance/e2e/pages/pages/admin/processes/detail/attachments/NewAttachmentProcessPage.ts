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

	constructor(page: Page) {
		super(page);
		this.titleInputEn = page.locator('#attachment_title_en');
		this.descriptionInputEn = page.locator('#attachment_description_en');
		this.weightInput = page.locator('#attachment_weight');
		this.folderSelect = page.locator('#attachment_attachment_collection_id');
		this.addFileButton = page.locator('#attachment_file_button');
		this.linkInput = page.locator('#attachment_link');
		this.submitButton = page.locator('div.item__edit-sticky button[type="submit"]');
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
	 * Submits the new attachment form
	 */
	async submitForm(): Promise<void> {
		await this.submitButton.click();
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
}

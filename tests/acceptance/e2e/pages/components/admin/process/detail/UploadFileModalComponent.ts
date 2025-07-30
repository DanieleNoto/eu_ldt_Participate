import { Locator, Page, expect } from '@playwright/test';
import { TEST_ASSETS } from '@utils/constants';


/**
 * Page Object Model for the file upload modal in the admin process area.
 * Handles file selection, cancel, and save actions.
 */
export class UploadFileModalComponent {
	private readonly page: Page;
	private readonly modal: Locator;
	private readonly closeButton: Locator;
	private readonly fileInput: Locator;
	private readonly selectFileLabel: Locator;
	private readonly cancelButton: Locator;
	private readonly saveButton: Locator;
	private readonly removeButton: Locator;
	private readonly dropzoneItems: Locator;

	constructor(page: Page) {
		this.page = page;
		this.modal = page.locator(`div.upload-modal`);
		this.closeButton = this.modal.locator('button[data-dialog-close]');
		this.fileInput = this.modal.locator('input[type="file"]');
		this.selectFileLabel = this.modal.locator('label[for^="files-"]');
		this.cancelButton = this.modal.locator('button[data-dropzone-cancel]');
		this.saveButton = this.modal.locator('button[data-dropzone-save]');
		this.removeButton = this.modal.locator('li[data-state="error"] button');
		this.dropzoneItems = this.modal.locator('.upload-modal__dropzone[data-dropzone-items]');
	}

	/**
	 * Asserts that the modal is visible
	 */
	async expectModalVisible(): Promise<void> {
		await expect(this.modal).toBeVisible();
	}
	/**
	 * Asserts that the modal is not visible
	 */
	async expectModalNotVisible(): Promise<void> {
		await expect(this.modal).not.toBeVisible();
	}

	/**
	 * Closes the modal using the close (X) button
	 */
	async closeModal(): Promise<void> {
		await this.closeButton.click();
	}

	/**
	 * Selects a file for upload
	 * @param filePath Path to the file to upload
	 */
	async selectFile(filePath: string): Promise<void> {
		await this.fileInput.setInputFiles(filePath);
	}

	/**
	 * Uploads the standard test CSV (test.csv)
	 * This method selects the test CSV file and waits for it to be processed
	 * @returns Promise that resolves when the file is uploaded
	 */
	async uploadTestCsv(): Promise<void> {
		await this.selectFile(TEST_ASSETS.TEST_CSV);
		// Wait for upload processing (optional timeout adjustment if needed)
		await this.page.waitForTimeout(1500);
	}
	/**
	 * Uploads the standard test image (test.jpg)
	 * This method selects the test image file and waits for it to be processed
	 * @returns Promise that resolves when the file is uploaded
	 */
	async uploadTestImage(): Promise<void> {
		await this.selectFile(TEST_ASSETS.TEST_IMAGE);
		// Wait for upload processing (optional timeout adjustment if needed)
		await this.page.waitForTimeout(1500);
	}
	/**
	 * Uploads the standard not valid test image (not-valid-test.jpg)
	 * This method selects the test image file and waits for it to be processed
	 * @returns Promise that resolves when the file is uploaded
	 */
	async uploadNotValidTestImage(): Promise<void> {
		await this.selectFile(TEST_ASSETS.NOT_VALID_FILE);
		// Wait for upload processing (optional timeout adjustment if needed)
		await this.page.waitForTimeout(1500);
	}

	/**
	 * Clicks the "Select file" label to open the file dialog (if needed)
	 */
	async clickSelectFileLabel(): Promise<void> {
		await this.selectFileLabel.click();
	}

	/**
	 * Clicks the Cancel button in the modal
	 */
	async clickCancel(): Promise<void> {
		await this.cancelButton.click();
	}
	/**
	 * Clicks the Remove button in the modal
	 */
	async clickRemove(): Promise<void> {
		await this.removeButton.click();
	}

	/**
	 * Clicks the Save button in the modal
	 */
	async clickSave(): Promise<void> {
		await this.saveButton.click();
	}

	/**
	 * Gets the uploaded file item by filename
	 * @param filename The filename to look for
	 * @returns Locator for the file item
	 */
	private getFileItemByFilename(filename: string): Locator {
		return this.dropzoneItems.locator(`li[data-filename="${filename}"]`);
	}

	/**
	 * Checks if a file is in error state
	 * @param filename The filename to check
	 * @returns True if the file has validation errors, false otherwise
	 */
	async isFileInErrorState(filename: string): Promise<boolean> {
		const fileItem = this.getFileItemByFilename(filename);
		const errorState = await fileItem.getAttribute('data-state');
		return errorState === 'error';
	}

	/**
	 * Checks if a file is valid (not in error state)
	 * @param filename The filename to check
	 * @returns True if the file is valid, false if it has validation errors
	 */
	async isFileValid(filename: string): Promise<boolean> {
		const isInError = await this.isFileInErrorState(filename);
		return !isInError;
	}

	/**
	 * Gets the validation error message for a file
	 * @param filename The filename to check
	 * @returns The error message text, or null if no error
	 */
	async getFileValidationError(filename: string): Promise<string | null> {
		const fileItem = this.getFileItemByFilename(filename);
		const errorTemplate = fileItem.locator('[data-template="error"]');

		if (await errorTemplate.isVisible()) {
			const errorSpan = errorTemplate.locator('span').nth(1); // Second span contains the error message
			return await errorSpan.textContent();
		}

		return null;
	}

	/**
	 * Clicks the Remove button for a specific file
	 * @param filename The filename of the file to remove
	 */
	async clickRemoveFile(filename: string): Promise<void> {
		const fileItem = this.getFileItemByFilename(filename);
		const removeButton = fileItem.locator('button', { hasText: 'Remove' });
		await removeButton.click();
	}

	/**
	 * Clicks the Remove button for the not valid test file
	 */
	async clickRemoveNotValidTestFile(): Promise<void> {
		await this.clickRemoveFile('not.valid.file');
	}

	/**
	 * Verifies that a file has validation errors
	 * @param filename The filename to check
	 * @param expectedErrorMessage Optional specific error message to verify
	 */
	async expectFileHasValidationError(filename: string, expectedErrorMessage?: string): Promise<void> {
		const isInError = await this.isFileInErrorState(filename);
		expect(isInError, `File "${filename}" should have validation errors`).toBe(true);

		if (expectedErrorMessage) {
			const actualError = await this.getFileValidationError(filename);
			expect(actualError, `File "${filename}" should have specific error message`).toContain(
				expectedErrorMessage
			);
		}
	}

	/**
	 * Verifies that a file is valid (no validation errors)
	 * @param filename The filename to check
	 */
	async expectFileIsValid(filename: string): Promise<void> {
		const isValid = await this.isFileValid(filename);
		expect(isValid, `File "${filename}" should be valid`).toBe(true);
	}

	/**
	 * Verifies that the not valid test file has validation errors
	 */
	async expectNotValidTestFileHasError(): Promise<void> {
		await this.expectFileHasValidationError(
			'not.valid.file',
			'Validation error! Check that the file has an allowed extension or size.'
		);
	}
}

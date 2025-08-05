import { Page } from '@playwright/test';

/**
 * Component for handling flash messages/notifications in the admin area.
 * Manages success, error, and warning notifications that appear after actions.
 */
export class FlashMessageComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get calloutWrapper() {
		return this.page.locator('[data-callout-wrapper]');
	}

	private get flashMessage() {
		return this.page.locator('.flash[data-alert-box]');
	}

	private get successMessage() {
		return this.page.locator('.flash.success');
	}

	private get errorMessage() {
		return this.page.locator('.flash.error');
	}

	private get warningMessage() {
		return this.page.locator('.flash.warning');
	}

	private get infoMessage() {
		return this.page.locator('.flash.info');
	}

	// Flash message elements
	private get flashIcon() {
		return this.flashMessage.locator('.flash__icon svg');
	}

	private get flashMessageText() {
		return this.flashMessage.locator('.flash__message');
	}

	private get closeButton() {
		return this.flashMessage.locator('.close-button[data-close]');
	}

	// Verification methods
	async isFlashMessageVisible(): Promise<boolean> {
		return await this.flashMessage.isVisible();
	}

	async isSuccessMessageVisible(): Promise<boolean> {
		return await this.successMessage.isVisible();
	}

	async isErrorMessageVisible(): Promise<boolean> {
		return await this.errorMessage.isVisible();
	}

	async isWarningMessageVisible(): Promise<boolean> {
		return await this.warningMessage.isVisible();
	}

	async isInfoMessageVisible(): Promise<boolean> {
		return await this.infoMessage.isVisible();
	}

	async isCloseButtonVisible(): Promise<boolean> {
		return await this.closeButton.isVisible();
	}

	// Get message content
	async getFlashMessageText(): Promise<string> {
		return (await this.flashMessageText.textContent()) || '';
	}

	async getSuccessMessageText(): Promise<string> {
		if (await this.isSuccessMessageVisible()) {
			return (await this.successMessage.locator('.flash__message').textContent()) || '';
		}
		return '';
	}

	async getErrorMessageText(): Promise<string> {
		if (await this.isErrorMessageVisible()) {
			return (await this.errorMessage.locator('.flash__message').textContent()) || '';
		}
		return '';
	}

	async getWarningMessageText(): Promise<string> {
		if (await this.isWarningMessageVisible()) {
			return (await this.warningMessage.locator('.flash__message').textContent()) || '';
		}
		return '';
	}

	async getInfoMessageText(): Promise<string> {
		if (await this.isInfoMessageVisible()) {
			return (await this.infoMessage.locator('.flash__message').textContent()) || '';
		}
		return '';
	}

	// Interaction methods
	async closeFlashMessage(): Promise<void> {
		if (await this.isCloseButtonVisible()) {
			await this.closeButton.click();
		}
	}

	async dismissNotification(): Promise<void> {
		await this.closeFlashMessage();
	}

	// Wait for flash message to appear
	async waitForFlashMessage(): Promise<void> {
		await this.flashMessage.waitFor({ state: 'visible' });
	}

	async waitForSuccessMessage(): Promise<void> {
		await this.successMessage.waitFor({ state: 'visible' });
	}

	async waitForErrorMessage(): Promise<void> {
		await this.errorMessage.waitFor({ state: 'visible' });
	}

	// Wait for flash message to disappear
	async waitForFlashMessageToDisappear(): Promise<void> {
		await this.flashMessage.waitFor({ state: 'hidden' });
	}

	// Check for specific success messages
	async isTemplateCreatedSuccessVisible(): Promise<boolean> {
		const isVisible = await this.isSuccessMessageVisible();
		if (isVisible) {
			const text = await this.getSuccessMessageText();
			return text.includes('Template created successfully');
		}
		return false;
	}

	async isTemplateUpdatedSuccessVisible(): Promise<boolean> {
		const isVisible = await this.isSuccessMessageVisible();
		if (isVisible) {
			const text = await this.getSuccessMessageText();
			return text.includes('Template updated successfully') || text.includes('Template saved successfully');
		}
		return false;
	}

	async isTemplateDeletedSuccessVisible(): Promise<boolean> {
		const isVisible = await this.isSuccessMessageVisible();
		if (isVisible) {
			const text = await this.getSuccessMessageText();
			return text.includes('Template deleted successfully');
		}
		return false;
	}

	async isTemplateCopiedSuccessVisible(): Promise<boolean> {
		const isVisible = await this.isSuccessMessageVisible();
		if (isVisible) {
			const text = await this.getSuccessMessageText();
			return text.includes('Template copied successfully') || text.includes('Template duplicated successfully');
		}
		return false;
	}

	// Get flash message type
	async getFlashMessageType(): Promise<'success' | 'error' | 'warning' | 'info' | 'none'> {
		if (await this.isSuccessMessageVisible()) return 'success';
		if (await this.isErrorMessageVisible()) return 'error';
		if (await this.isWarningMessageVisible()) return 'warning';
		if (await this.isInfoMessageVisible()) return 'info';
		return 'none';
	}

	// Check if any flash message exists
	async hasAnyFlashMessage(): Promise<boolean> {
		return await this.isFlashMessageVisible();
	}

	// Get flash message details
	async getFlashMessageDetails(): Promise<{
		type: 'success' | 'error' | 'warning' | 'info' | 'none';
		text: string;
		isVisible: boolean;
		hasCloseButton: boolean;
	}> {
		const type = await this.getFlashMessageType();
		const text = await this.getFlashMessageText();
		const isVisible = await this.isFlashMessageVisible();
		const hasCloseButton = await this.isCloseButtonVisible();

		return {
			type,
			text,
			isVisible,
			hasCloseButton
		};
	}

	// Wait for specific template operation success messages
	async waitForTemplateCreatedSuccess(): Promise<void> {
		await this.page.waitForFunction(
			() => {
				const flashElement = document.querySelector('.flash.success .flash__message');
				return flashElement && flashElement.textContent?.includes('Template created successfully');
			},
			{ timeout: 10000 }
		);
	}

	async waitForTemplateUpdatedSuccess(): Promise<void> {
		await this.page.waitForFunction(
			() => {
				const flashElement = document.querySelector('.flash.success .flash__message');
				return (
					flashElement &&
					(flashElement.textContent?.includes('Template updated successfully') ||
						flashElement.textContent?.includes('Template saved successfully'))
				);
			},
			{ timeout: 10000 }
		);
	}
}

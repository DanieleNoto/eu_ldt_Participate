/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component for handling flash messages and notifications in the admin interface.
 * Manages success, error, warning, and info messages with dismiss functionality.
 */
export class FlashMessageComponent {
	private readonly page: Page;

	// Different types of flash messages
	private readonly successMessage: Locator;
	private readonly errorMessage: Locator;
	private readonly warningMessage: Locator;
	private readonly infoMessage: Locator;

	// Flash message elements
	private readonly flashIcon: Locator;
	private readonly flashMessageText: Locator;
	private readonly closeButton: Locator;

	// Generic flash message (any type)
	private readonly anyFlashMessage: Locator;

	constructor(page: Page) {
		this.page = page;

		// Different message types
		this.successMessage = page.locator('.flash.success[data-alert-box]');
		this.errorMessage = page.locator('.flash.error[data-alert-box], .flash.alert[data-alert-box]');
		this.warningMessage = page.locator('.flash.warning[data-alert-box]');
		this.infoMessage = page.locator('.flash.info[data-alert-box], .flash.notice[data-alert-box]');

		// Flash message components
		this.flashIcon = page.locator('.flash__icon');
		this.flashMessageText = page.locator('.flash__message');
		this.closeButton = page.locator('.close-button[data-close]');

		// Generic flash message selector
		this.anyFlashMessage = page.locator('.flash[data-alert-box]');
	}

	// Visibility checks
	async isFlashMessageVisible(): Promise<boolean> {
		return await this.anyFlashMessage.isVisible();
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

	// Message content getters
	async getFlashMessageText(): Promise<string> {
		if (await this.isFlashMessageVisible()) {
			return (await this.flashMessageText.textContent()) || '';
		}
		return '';
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

	// Message type detection
	async getFlashMessageType(): Promise<'success' | 'error' | 'warning' | 'info' | 'none'> {
		if (await this.isSuccessMessageVisible()) return 'success';
		if (await this.isErrorMessageVisible()) return 'error';
		if (await this.isWarningMessageVisible()) return 'warning';
		if (await this.isInfoMessageVisible()) return 'info';
		return 'none';
	}

	// Actions
	async dismissFlashMessage(): Promise<void> {
		if ((await this.isFlashMessageVisible()) && (await this.closeButton.isVisible())) {
			await this.closeButton.click();
			// Wait for message to disappear
			await this.anyFlashMessage.waitFor({ state: 'hidden', timeout: 3000 });
		}
	}

	async dismissSuccessMessage(): Promise<void> {
		if (await this.isSuccessMessageVisible()) {
			const closeBtn = this.successMessage.locator('.close-button[data-close]');
			if (await closeBtn.isVisible()) {
				await closeBtn.click();
				await this.successMessage.waitFor({ state: 'hidden', timeout: 3000 });
			}
		}
	}

	async dismissErrorMessage(): Promise<void> {
		if (await this.isErrorMessageVisible()) {
			const closeBtn = this.errorMessage.locator('.close-button[data-close]');
			if (await closeBtn.isVisible()) {
				await closeBtn.click();
				await this.errorMessage.waitFor({ state: 'hidden', timeout: 3000 });
			}
		}
	}

	// Wait for specific messages
	async waitForSuccessMessage(timeout: number = 5000): Promise<void> {
		await this.successMessage.waitFor({ state: 'visible', timeout });
	}

	async waitForErrorMessage(timeout: number = 5000): Promise<void> {
		await this.errorMessage.waitFor({ state: 'visible', timeout });
	}

	async waitForAnyMessage(timeout: number = 5000): Promise<void> {
		await this.anyFlashMessage.waitFor({ state: 'visible', timeout });
	}

	// Wait for message to disappear
	async waitForMessageToDisappear(timeout: number = 5000): Promise<void> {
		if (await this.isFlashMessageVisible()) {
			await this.anyFlashMessage.waitFor({ state: 'hidden', timeout });
		}
	}

	// Message validation methods
	async hasSuccessMessage(expectedText?: string): Promise<boolean> {
		if (!(await this.isSuccessMessageVisible())) return false;

		if (expectedText) {
			const messageText = await this.getSuccessMessageText();
			return messageText.includes(expectedText);
		}

		return true;
	}

	async hasErrorMessage(expectedText?: string): Promise<boolean> {
		if (!(await this.isErrorMessageVisible())) return false;

		if (expectedText) {
			const messageText = await this.getErrorMessageText();
			return messageText.includes(expectedText);
		}

		return true;
	}

	async hasWarningMessage(expectedText?: string): Promise<boolean> {
		if (!(await this.isWarningMessageVisible())) return false;

		if (expectedText) {
			const messageText = await this.getWarningMessageText();
			return messageText.includes(expectedText);
		}

		return true;
	}

	// Specific success messages for moderation actions
	async hasResourceHiddenMessage(): Promise<boolean> {
		return await this.hasSuccessMessage('Resource successfully hidden.');
	}

	async hasResourceUnreportedMessage(): Promise<boolean> {
		return (
			(await this.hasSuccessMessage('Resource successfully unreported.')) ||
			(await this.hasSuccessMessage('Resource successfully removed from moderation.'))
		);
	}

	async hasResourceRestoredMessage(): Promise<boolean> {
		return (
			(await this.hasSuccessMessage('Resource successfully restored.')) ||
			(await this.hasSuccessMessage('Resource successfully shown.'))
		);
	}

	// Multiple message handling
	async getAllFlashMessages(): Promise<FlashMessage[]> {
		const messages: FlashMessage[] = [];
		const flashElements = await this.anyFlashMessage.all();

		for (const element of flashElements) {
			const messageText = (await element.locator('.flash__message').textContent()) || '';
			const classList = (await element.getAttribute('class')) || '';

			let type: 'success' | 'error' | 'warning' | 'info' = 'info';
			if (classList.includes('success')) type = 'success';
			else if (classList.includes('error') || classList.includes('alert')) type = 'error';
			else if (classList.includes('warning')) type = 'warning';
			else if (classList.includes('info') || classList.includes('notice')) type = 'info';

			messages.push({
				text: messageText.trim(),
				type,
				isVisible: await element.isVisible()
			});
		}

		return messages;
	}

	async dismissAllMessages(): Promise<void> {
		const closeButtons = await this.page.locator('.flash .close-button[data-close]').all();

		for (const button of closeButtons) {
			if (await button.isVisible()) {
				await button.click();
				// Small delay between dismissals
				await this.page.waitForTimeout(200);
			}
		}

		// Wait for all messages to disappear
		await this.page.waitForFunction(
			() => {
				const flashMessages = document.querySelectorAll('.flash[data-alert-box]');
				return (
					flashMessages.length === 0 ||
					Array.from(flashMessages).every(
						msg => msg.getAttribute('aria-hidden') === 'true' || (msg as HTMLElement).offsetParent === null
					)
				);
			},
			{ timeout: 5000 }
		);
	}

	// Auto-dismiss detection
	async isMessageAutoDismissible(): Promise<boolean> {
		// Check if message has data attributes that suggest auto-dismiss
		if (await this.isFlashMessageVisible()) {
			const dataDismiss = await this.anyFlashMessage.getAttribute('data-auto-dismiss');
			const dataTimeout = await this.anyFlashMessage.getAttribute('data-timeout');
			return dataDismiss === 'true' || dataTimeout !== null;
		}
		return false;
	}

	// Icon validation
	async getFlashMessageIcon(): Promise<string> {
		if (await this.flashIcon.isVisible()) {
			const useElement = this.flashIcon.locator('use');
			const href = (await useElement.getAttribute('href')) || '';

			// Extract icon name from href
			const match = href.match(/#ri-(.+)/);
			return match ? match[1] : '';
		}
		return '';
	}

	async hasSuccessIcon(): Promise<boolean> {
		const icon = await this.getFlashMessageIcon();
		return icon.includes('checkbox-circle') || icon.includes('check');
	}

	async hasErrorIcon(): Promise<boolean> {
		const icon = await this.getFlashMessageIcon();
		return icon.includes('error') || icon.includes('alert') || icon.includes('warning');
	}

	// Accessibility checks
	async checkAccessibility(): Promise<void> {
		if (await this.isFlashMessageVisible()) {
			// Check that flash message has proper role
			const role = await this.anyFlashMessage.getAttribute('role');
			if (role !== 'alert' && role !== 'status') {
				console.warn('Flash message should have role="alert" or role="status"');
			}

			// Check aria-atomic for dynamic content
			const ariaAtomic = await this.anyFlashMessage.getAttribute('aria-atomic');
			if (ariaAtomic !== 'true') {
				console.warn('Flash message should have aria-atomic="true"');
			}

			// Check close button accessibility
			if (await this.closeButton.isVisible()) {
				const ariaLabel = await this.closeButton.getAttribute('aria-label');
				if (!ariaLabel) {
					console.warn('Close button should have aria-label');
				}
			}
		}
	}
}

// Interface for flash message data
export interface FlashMessage {
	text: string;
	type: 'success' | 'error' | 'warning' | 'info';
	isVisible: boolean;
}

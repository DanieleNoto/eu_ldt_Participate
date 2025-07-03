import { Page } from '@playwright/test';

export class OfflineMessageComponent {
	constructor(private page: Page) {}

	// Selectors for the offline message
	private get offlineMessage() {
		return this.page.locator('.js-offline-message');
	}

	private get offlineMessageFlash() {
		return this.page.locator('.js-offline-message .flash');
	}

	private get offlineMessageText() {
		return this.page.locator('.js-offline-message .flash__message');
	}

	// Methods to check visibility
	async isOfflineMessageVisible(): Promise<boolean> {
		return await this.offlineMessage.isVisible();
	}

	async getOfflineMessageText(): Promise<string> {
		return (await this.offlineMessageText.textContent()) || '';
	}

	// Utility methods
	async waitForOfflineMessage() {
		await this.offlineMessage.waitFor({ state: 'visible' });
	}

	async isOfflineMessageHidden(): Promise<boolean> {
		return await this.offlineMessage.isHidden();
	}
}

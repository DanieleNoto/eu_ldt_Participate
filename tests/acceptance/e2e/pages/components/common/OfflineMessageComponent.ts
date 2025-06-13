import { Page } from '@playwright/test';

export class OfflineMessageComponent {
	constructor(private page: Page) {}

	// Selettori per il messaggio offline
	private get offlineMessage() {
		return this.page.locator('.js-offline-message');
	}

	private get offlineMessageFlash() {
		return this.page.locator('.js-offline-message .flash');
	}

	private get offlineMessageText() {
		return this.page.locator('.js-offline-message .flash__message');
	}

	// Metodi per verificare la visibilità
	async isOfflineMessageVisible(): Promise<boolean> {
		return await this.offlineMessage.isVisible();
	}

	async getOfflineMessageText(): Promise<string> {
		return (await this.offlineMessageText.textContent()) || '';
	}

	// Metodi di utilità
	async waitForOfflineMessage() {
		await this.offlineMessage.waitFor({ state: 'visible' });
	}

	async isOfflineMessageHidden(): Promise<boolean> {
		return await this.offlineMessage.isHidden();
	}
}

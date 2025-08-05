import { Page } from '@playwright/test';

export class ShareModalComponent {
	private page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async closeModal() {
		await this.page.click('[data-dialog-close="socialShare"]');
	}

	async shareToX() {
		await this.page.click('[data-site="x"]');
	}

	async shareToFacebook() {
		await this.page.click('[data-site="facebook"]');
	}

	async shareToWhatsApp() {
		await this.page.click('[data-site="whatsapp"]');
	}

	async shareToTelegram() {
		await this.page.click('[data-site="telegram"]');
	}

	async copyShareLink() {
		await this.page.click('[data-clipboard-copy="#urlShareLink"]');
	}

	async getShareLinkValue(): Promise<string> {
		return await this.page.getAttribute('#urlShareLink', 'value');
	}

	async expectModalVisible() {
		await this.page.waitForSelector('#socialShare-content', { state: 'visible' });
	}

	async expectShareToXSuccess() {
		await this.page.waitForSelector('[data-site="x"]', { state: 'attached' });
	}

	async expectShareToFacebookSuccess() {
		await this.page.waitForSelector('[data-site="facebook"]', { state: 'attached' });
	}

	async expectShareToWhatsAppSuccess() {
		await this.page.waitForSelector('[data-site="whatsapp"]', { state: 'attached' });
	}

	async expectShareToTelegramSuccess() {
		await this.page.waitForSelector('[data-site="telegram"]', { state: 'attached' });
	}

	async expectClipboardCopySuccess() {
		const copiedMessage = await this.page.getAttribute(
			'[data-clipboard-copy="#urlShareLink"]',
			'data-clipboard-copy-message'
		);
		if (copiedMessage !== 'The link was successfully copied to clipboard.') {
			throw new Error('Clipboard copy failed');
		}
	}
}

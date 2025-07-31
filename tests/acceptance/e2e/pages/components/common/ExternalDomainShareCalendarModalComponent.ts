import { Locator, Page, expect } from '@playwright/test';

export class ExternalDomainWarningModal {
	readonly container: Locator;
	readonly closeButton: Locator;
	readonly title: Locator;
	readonly description: Locator;
	readonly externalLink: Locator;
	readonly cancelButton: Locator;
	readonly proceedButton: Locator;

	constructor(page: Page) {
		this.container = page.locator('#external-domain-warning-content');
		this.closeButton = page.locator('[data-dialog-close="external-domain-warning"]');
		this.title = page.locator('#dialog-title-external-domain-warning');
		this.description = page.locator('#dialog-desc-external-domain-warning');
		this.externalLink = page.locator('code .text-alert');
		this.cancelButton = page.locator('[data-dialog-close="external-domain-warning"]:text("Cancel")');
		this.proceedButton = page.locator('a[href^="https://calendar.google.com"]:text("Proceed")');
	}

	async expectContainerVisible() {
		await expect(this.container).toBeVisible();
	}

	async expectTitleVisible() {
		await expect(this.title).toBeVisible();
	}

	async expectDescriptionVisible() {
		await expect(this.description).toBeVisible();
	}

	async expectExternalLinkVisible() {
		await expect(this.externalLink).toBeVisible();
	}

	async expectCancelButtonVisible() {
		await expect(this.cancelButton).toBeVisible();
	}

	async expectProceedButtonVisible() {
		await expect(this.proceedButton).toBeVisible();
	}

	async clickCloseButton() {
		await this.closeButton.click();
	}

	async clickCancelButton() {
		await this.cancelButton.click();
	}

	async clickProceedButton() {
		await this.proceedButton.click();
	}
}

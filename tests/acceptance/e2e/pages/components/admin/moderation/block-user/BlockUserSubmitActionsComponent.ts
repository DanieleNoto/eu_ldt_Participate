import { Locator, Page } from '@playwright/test';

/**
 * Component representing the submit actions on the Block User page
 */
export class BlockUserSubmitActionsComponent {
	readonly page: Page;
	readonly actionsContainer: Locator;
	readonly submitButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.actionsContainer = page.locator('.item__edit-sticky');
		this.submitButton = this.actionsContainer.locator('button[type="submit"]');
	}

	/**
	 * Click the submit button
	 */
	async clickSubmit(): Promise<void> {
		await this.submitButton.click();
	}

	/**
	 * Get the submit button text
	 */
	async getSubmitButtonText(): Promise<string> {
		return (await this.submitButton.textContent()) || '';
	}

	/**
	 * Check if submit button is visible
	 */
	async isSubmitButtonVisible(): Promise<boolean> {
		return await this.submitButton.isVisible();
	}

	/**
	 * Check if submit button is enabled
	 */
	async isSubmitButtonEnabled(): Promise<boolean> {
		return await this.submitButton.isEnabled();
	}

	/**
	 * Check if actions container is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.actionsContainer.isVisible();
	}

	/**
	 * Check if actions container has sticky positioning
	 */
	async hasStickyStyling(): Promise<boolean> {
		const classes = (await this.actionsContainer.getAttribute('class')) || '';
		return classes.includes('sticky');
	}

	/**
	 * Verify submit button has expected text
	 */
	async hasExpectedSubmitText(): Promise<boolean> {
		const text = await this.getSubmitButtonText();
		return text.includes('Block account and send justification');
	}

	/**
	 * Get submit button type attribute
	 */
	async getSubmitButtonType(): Promise<string> {
		return (await this.submitButton.getAttribute('type')) || '';
	}

	/**
	 * Get submit button name attribute
	 */
	async getSubmitButtonName(): Promise<string> {
		return (await this.submitButton.getAttribute('name')) || '';
	}

	/**
	 * Wait for submit button to be ready
	 */
	async waitForSubmitReady(): Promise<void> {
		await this.actionsContainer.waitFor({ state: 'visible' });
		await this.submitButton.waitFor({ state: 'visible' });
	}

	/**
	 * Verify actions are properly configured
	 */
	async verifyActionsConfiguration(): Promise<{
		isVisible: boolean;
		buttonEnabled: boolean;
		hasCorrectText: boolean;
		hasCorrectType: boolean;
		isSticky: boolean;
	}> {
		return {
			isVisible: await this.isVisible(),
			buttonEnabled: await this.isSubmitButtonEnabled(),
			hasCorrectText: await this.hasExpectedSubmitText(),
			hasCorrectType: (await this.getSubmitButtonType()) === 'submit',
			isSticky: await this.hasStickyStyling()
		};
	}
}

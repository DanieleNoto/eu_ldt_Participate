import { Locator, Page } from '@playwright/test';

/**
 * Component for managing toggle switch elements
 */
export class ToggleSwitchComponent {
	private toggleContainer: Locator;
	private checkbox: Locator;
	private label: Locator;

	constructor(page: Page, toggleId: string) {
		this.toggleContainer = page.locator(`[for="${toggleId}"]`);
		this.checkbox = page.locator(`#${toggleId}`);
		this.label = this.toggleContainer.locator('.toggle__switch-trigger-text');
	}

	/**
	 * Check if the toggle is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.toggleContainer.isVisible();
	}

	/**
	 * Check if the toggle is enabled (not disabled)
	 */
	async isEnabled(): Promise<boolean> {
		return await this.checkbox.isEnabled();
	}

	/**
	 * Check if the toggle is currently checked/enabled
	 */
	async isChecked(): Promise<boolean> {
		return await this.checkbox.isChecked();
	}

	/**
	 * Get the label text of the toggle
	 */
	async getLabelText(): Promise<string> {
		return (await this.label.textContent()) || '';
	}

	/**
	 * Toggle the switch (click it)
	 */
	async toggle(): Promise<void> {
		await this.toggleContainer.click();
	}

	/**
	 * Set the toggle to a specific state
	 */
	async setToggleState(enabled: boolean): Promise<void> {
		const currentState = await this.isChecked();
		if (currentState !== enabled) {
			await this.toggle();
		}
	}

	/**
	 * Enable the toggle (turn it on)
	 */
	async enable(): Promise<void> {
		await this.setToggleState(true);
	}

	/**
	 * Disable the toggle (turn it off)
	 */
	async disable(): Promise<void> {
		await this.setToggleState(false);
	}
}

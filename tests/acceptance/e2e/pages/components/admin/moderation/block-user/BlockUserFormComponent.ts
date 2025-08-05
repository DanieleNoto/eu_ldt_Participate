import { Locator, Page } from '@playwright/test';

/**
 * Component representing the block user form on the Block User page
 */
export class BlockUserFormComponent {
	readonly page: Page;
	readonly formContainer: Locator;
	readonly form: Locator;
	readonly informationText: Locator;
	readonly justificationLabel: Locator;
	readonly justificationTextarea: Locator;
	readonly characterCounter: Locator;
	readonly characterCounterSr: Locator;
	readonly formError: Locator;
	readonly userIdHiddenField: Locator;
	readonly hideHiddenField: Locator;
	readonly requiredIndicator: Locator;

	constructor(page: Page) {
		this.page = page;
		this.formContainer = page.locator('.item__edit');
		this.form = page.locator('form[id^="edit_block_user"]');
		this.informationText = this.form.locator('.row.column').filter({ hasText: 'Blocking a user will render' });
		this.justificationLabel = page.locator('label[for*="block_user_justification"]');
		this.justificationTextarea = page.locator('textarea[id*="block_user_justification"]');
		this.characterCounter = page.locator('[id*="block_user_justification_characters"]:not([class*="sr-only"])');
		this.characterCounterSr = page.locator('[id*="block_user_justification_characters_sr"]');
		this.formError = this.form.locator('.form-error[role="alert"]');
		this.userIdHiddenField = page.locator('input[id*="block_user_user_id"]');
		this.hideHiddenField = page.locator('input[id*="block_user_hide"]');
		this.requiredIndicator = this.justificationLabel.locator('.label-required');
	}

	/**
	 * Get the information text about blocking users
	 */
	async getInformationText(): Promise<string> {
		return (await this.informationText.textContent()) || '';
	}

	/**
	 * Fill the justification textarea
	 */
	async fillJustification(justification: string): Promise<void> {
		await this.justificationTextarea.fill(justification);
	}

	/**
	 * Clear the justification textarea
	 */
	async clearJustification(): Promise<void> {
		await this.justificationTextarea.clear();
	}

	/**
	 * Get the current justification value
	 */
	async getJustificationValue(): Promise<string> {
		return (await this.justificationTextarea.inputValue()) || '';
	}

	/**
	 * Get the justification label text
	 */
	async getJustificationLabelText(): Promise<string> {
		return (await this.justificationLabel.textContent()) || '';
	}

	/**
	 * Check if justification field is required
	 */
	async isJustificationRequired(): Promise<boolean> {
		const required = await this.justificationTextarea.getAttribute('required');
		return required !== null;
	}

	/**
	 * Get the minimum length requirement for justification
	 */
	async getJustificationMinLength(): Promise<number> {
		const minLength = await this.justificationTextarea.getAttribute('minlength');
		return minLength ? parseInt(minLength, 10) : 0;
	}

	/**
	 * Get the character counter text
	 */
	async getCharacterCounterText(): Promise<string> {
		return (await this.characterCounter.textContent()) || '';
	}

	/**
	 * Get the screen reader character counter text
	 */
	async getCharacterCounterSrText(): Promise<string> {
		return (await this.characterCounterSr.textContent()) || '';
	}

	/**
	 * Check if form error is visible
	 */
	async isFormErrorVisible(): Promise<boolean> {
		return await this.formError.isVisible();
	}

	/**
	 * Get the form error text
	 */
	async getFormErrorText(): Promise<string> {
		return (await this.formError.textContent()) || '';
	}

	/**
	 * Get the user ID from hidden field
	 */
	async getUserId(): Promise<string> {
		return (await this.userIdHiddenField.getAttribute('value')) || '';
	}

	/**
	 * Get the hide value from hidden field
	 */
	async getHideValue(): Promise<string> {
		return (await this.hideHiddenField.getAttribute('value')) || '';
	}

	/**
	 * Get the form action URL
	 */
	async getFormAction(): Promise<string> {
		return (await this.form.getAttribute('action')) || '';
	}

	/**
	 * Get the form method
	 */
	async getFormMethod(): Promise<string> {
		return (await this.form.getAttribute('method')) || '';
	}

	/**
	 * Check if form is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.formContainer.isVisible();
	}

	/**
	 * Check if required field indicator is visible
	 */
	async hasRequiredFieldIndicator(): Promise<boolean> {
		return await this.requiredIndicator.isVisible();
	}

	/**
	 * Trigger validation by blurring the justification field
	 */
	async triggerValidation(): Promise<void> {
		await this.justificationTextarea.blur();
	}

	/**
	 * Focus on the justification textarea
	 */
	async focusJustification(): Promise<void> {
		await this.justificationTextarea.focus();
	}

	/**
	 * Check if form is valid based on error visibility
	 */
	async isFormValid(): Promise<boolean> {
		const isErrorVisible = await this.isFormErrorVisible();
		return !isErrorVisible;
	}

	/**
	 * Validate form based on justification length
	 */
	async validateForm(): Promise<boolean> {
		const justificationValue = await this.getJustificationValue();
		const minLength = await this.getJustificationMinLength();
		return justificationValue.length >= minLength;
	}

	/**
	 * Wait for character counter to appear
	 */
	async waitForCharacterCounter(): Promise<void> {
		await this.characterCounter.waitFor({ state: 'visible' });
	}

	/**
	 * Wait for form to load
	 */
	async waitForFormToLoad(): Promise<void> {
		await this.form.waitFor({ state: 'visible' });
		await this.justificationTextarea.waitFor({ state: 'visible' });
	}

	/**
	 * Get all form data
	 */
	async getFormData(): Promise<{
		userId: string;
		hide: string;
		justification: string;
		action: string;
		method: string;
		minLength: number;
		isRequired: boolean;
	}> {
		return {
			userId: await this.getUserId(),
			hide: await this.getHideValue(),
			justification: await this.getJustificationValue(),
			action: await this.getFormAction(),
			method: await this.getFormMethod(),
			minLength: await this.getJustificationMinLength(),
			isRequired: await this.isJustificationRequired()
		};
	}

	/**
	 * Check if information text is displayed
	 */
	async hasInformationText(): Promise<boolean> {
		return await this.informationText.isVisible();
	}

	/**
	 * Verify all form components are present
	 */
	async hasAllFormComponents(): Promise<boolean> {
		const informationVisible = await this.hasInformationText();
		const labelVisible = await this.justificationLabel.isVisible();
		const textareaVisible = await this.justificationTextarea.isVisible();
		const counterVisible = await this.characterCounter.isVisible();
		const requiredVisible = await this.hasRequiredFieldIndicator();

		return informationVisible && labelVisible && textareaVisible && counterVisible && requiredVisible;
	}
}

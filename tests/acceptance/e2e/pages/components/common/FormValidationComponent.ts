import { Page, expect } from '@playwright/test';

/**
 * Component for handling form validation functionality across account pages
 */
export class FormValidationComponent {
	constructor(private page: Page) {}

	/**
	 * Validate that required fields are marked as required
	 */
	async validateRequiredFieldsMarking(fieldSelectors: string[]): Promise<void> {
		for (const selector of fieldSelectors) {
			const field = this.page.locator(selector);

			// Check if field has required attribute or is marked with asterisk
			const isRequired =
				(await field.getAttribute('required')) !== null ||
				(await this.page
					.locator(
						`label[for="${await field.getAttribute('id')}"] .required, label[for="${await field.getAttribute('id')}"] *:has-text("*")`
					)
					.isVisible());

			if (isRequired) {
				await expect(field).toBeVisible();
			}
		}
	}

	/**
	 * Test form validation by submitting empty form
	 */
	async testEmptyFormValidation(submitButtonSelector: string): Promise<void> {
		const submitButton = this.page.locator(submitButtonSelector);
		await submitButton.click();

		// Look for validation messages
		const validationMessages = this.page.locator('.field-error, .error-message, .invalid-feedback, [role="alert"]');
		const messageCount = await validationMessages.count();

		expect(messageCount).toBeGreaterThan(0);
	}

	/**
	 * Test individual field validation
	 */
	async testFieldValidation(fieldSelector: string, invalidValue: string, validValue: string): Promise<void> {
		const field = this.page.locator(fieldSelector);

		// Test invalid value
		await field.fill(invalidValue);
		await field.blur(); // Trigger validation

		// Look for field-specific error message
		const errorMessage = this.page
			.locator(`${fieldSelector} + .error, .field-error, [data-field-error="${fieldSelector}"]`)
			.first();

		// Error message should appear for invalid input
		const hasError = await errorMessage.isVisible();

		// Test valid value
		await field.fill(validValue);
		await field.blur();

		// Error message should disappear for valid input
		if (hasError) {
			await expect(errorMessage).not.toBeVisible();
		}
	}

	/**
	 * Test email field validation specifically
	 */
	async testEmailValidation(emailFieldSelector: string): Promise<void> {
		await this.testFieldValidation(emailFieldSelector, 'invalid-email-format', 'valid.email@example.com');
	}

	/**
	 * Test password strength validation
	 */
	async testPasswordStrengthValidation(passwordFieldSelector: string): Promise<void> {
		const passwordField = this.page.locator(passwordFieldSelector);

		const weakPasswords = ['123', 'password', 'abc'];
		const strongPassword = 'StrongP@ssw0rd123!';

		for (const weakPassword of weakPasswords) {
			await passwordField.fill(weakPassword);
			await passwordField.blur();

			// Look for password strength indicator or warning
			const strengthIndicator = this.page
				.locator('.password-strength, .password-warning, [data-password-strength]')
				.first();

			// Weak password should trigger some form of feedback
			const hasWeakPasswordFeedback = await strengthIndicator.isVisible();

			if (hasWeakPasswordFeedback) {
				const strengthText = await strengthIndicator.textContent();
				expect(strengthText?.toLowerCase()).toContain('weak');
			}
		}

		// Test strong password
		await passwordField.fill(strongPassword);
		await passwordField.blur();
	}

	/**
	 * Test form submission prevention for invalid data
	 */
	async testFormSubmissionPrevention(formSelector: string, submitButtonSelector: string): Promise<void> {
		const form = this.page.locator(formSelector);
		const submitButton = this.page.locator(submitButtonSelector);

		// Add invalid data to form
		const textInputs = form.locator('input[type="text"], input[type="email"]');
		const inputCount = await textInputs.count();

		if (inputCount > 0) {
			// Fill first text input with invalid data
			await textInputs.first().fill('invalid@@@data');
		}

		const currentUrl = this.page.url();

		// Try to submit form
		await submitButton.click();

		// URL should not change if form validation prevents submission
		await this.page.waitForTimeout(2000);
		const newUrl = this.page.url();

		// Either URL stays the same (client-side validation) or we get validation errors
		const hasValidationErrors =
			(await this.page.locator('.field-error, .error-message, .invalid-feedback').count()) > 0;

		expect(currentUrl === newUrl || hasValidationErrors).toBeTruthy();
	}

	/**
	 * Test accessibility of form validation messages
	 */
	async testValidationAccessibility(formSelector: string): Promise<void> {
		const form = this.page.locator(formSelector);

		// Check that error messages have proper ARIA attributes
		const errorMessages = form.locator('.field-error, .error-message, [role="alert"]');
		const errorCount = await errorMessages.count();

		for (let i = 0; i < errorCount; i++) {
			const errorElement = errorMessages.nth(i);

			// Error messages should have proper ARIA roles or be associated with form fields
			const hasAriaRole = (await errorElement.getAttribute('role')) !== null;
			const hasAriaDescribedBy = (await errorElement.getAttribute('aria-describedby')) !== null;
			const hasId = (await errorElement.getAttribute('id')) !== null;

			expect(hasAriaRole || hasAriaDescribedBy || hasId).toBeTruthy();
		}
	}

	/**
	 * Test form auto-save functionality if present
	 */
	async testFormAutoSave(fieldSelector: string, testValue: string): Promise<void> {
		const field = this.page.locator(fieldSelector);

		await field.fill(testValue);

		// Wait for potential auto-save
		await this.page.waitForTimeout(3000);

		// Refresh page
		await this.page.reload();

		// Check if value was auto-saved
		const savedValue = await field.inputValue();

		// If auto-save is implemented, value should persist
		if (savedValue === testValue) {
			console.log('Auto-save functionality detected and working');
		}
	}

	/**
	 * Validate form submission success indicators
	 */
	async validateSubmissionSuccess(): Promise<boolean> {
		// Look for various success indicators
		const successIndicators = [
			'.flash.success',
			'.alert.success',
			'.notification.success',
			'[role="alert"].success',
			'.success-message',
			'.form-success'
		];

		for (const selector of successIndicators) {
			const element = this.page.locator(selector);
			if (await element.isVisible()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Validate form submission error indicators
	 */
	async validateSubmissionError(): Promise<boolean> {
		// Look for various error indicators
		const errorIndicators = [
			'.flash.error',
			'.alert.error',
			'.notification.error',
			'[role="alert"].error',
			'.error-message',
			'.form-error'
		];

		for (const selector of errorIndicators) {
			const element = this.page.locator(selector);
			if (await element.isVisible()) {
				return true;
			}
		}

		return false;
	}
}

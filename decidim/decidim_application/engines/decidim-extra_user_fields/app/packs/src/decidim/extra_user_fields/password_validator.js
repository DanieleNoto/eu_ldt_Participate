import { Controller } from '@hotwired/stimulus';

/**
 * Stimulus controller for real-time password field validation
 * Triggers form validation as the user types in the password field
 */
export default class PasswordValidatorController extends Controller {
	static targets = ['form'];

	connect() {
		// Get the form this controller is attached to
		const form = this.element.closest('form');
		if (!form) return;

		// Find all password fields in the form
		const passwordFields = form.querySelectorAll('input[type="password"][name*="password"]');

		// Add event listeners to each password field
		passwordFields.forEach(field => {
			// Real-time validation on input
			field.addEventListener('input', () => {
				this.validatePasswordField(form, field);
			});

			// Also validate on blur
			field.addEventListener('blur', () => {
				this.validatePasswordField(form, field);
			});
		});
	}

	validatePasswordField(form, field) {
		// Create and dispatch a change event to trigger form validation
		const event = new Event('change', { bubbles: true });
		field.dispatchEvent(event);

		// If the form has a validation handler (like the account-form controller),
		// it will catch this event and perform validation
	}
}

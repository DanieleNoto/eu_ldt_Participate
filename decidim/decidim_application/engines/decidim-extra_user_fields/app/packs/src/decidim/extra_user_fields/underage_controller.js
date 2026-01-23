// SPDX-License-Identifier: AGPL-3.0
// Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// Authors: Gianfranco Cedro

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
	static targets = ['underageCheckbox', 'underageFieldset', 'representativeEmailField', 'underageWarning'];
	static values = { underageLimit: Number };

	connect() {
		this.updateUnderageFields();
		this.fetchUnderageLimit();
	}

	dateChanged() {
		this.updateUnderageFields();
	}

	checkboxChanged() {
		if (this.underageCheckboxTarget.checked) {
			this.representativeEmailFieldTarget.classList.remove('hidden');
			this.underageWarningTarget.classList.remove('hidden');
		} else {
			this.representativeEmailFieldTarget.querySelector('input').value = '';
			this.representativeEmailFieldTarget.classList.add('hidden');
			this.underageWarningTarget.classList.add('hidden');
		}
	}

	updateUnderageFields() {
		const dateOfBirth = this.getDateOfBirth();

		if (!dateOfBirth) {
			this.hideUnderageFields();
			return;
		}

		const age = this.calculateAge(dateOfBirth);
		const underageLimit = this.underageLimitValue || 18;

		if (age < underageLimit) {
			this.showUnderageFields();
		} else {
			this.hideUnderageFields();
		}
	}

	getDateOfBirth() {
		// Get date from date input field
		const dateInput = document.querySelector('input[id*="date_of_birth"][type="date"]');
		if (dateInput && dateInput.value) {
			return new Date(dateInput.value);
		}

		// Fallback to LocalizedDate selects if they exist
		const yearField = document.querySelector('select[id$="date_of_birth_1i"]');
		const monthField = document.querySelector('select[id$="date_of_birth_2i"]');
		const dayField = document.querySelector('select[id$="date_of_birth_3i"]');

		if (yearField && monthField && dayField) {
			const year = yearField.value;
			const month = monthField.value;
			const day = dayField.value;

			if (year && month && day) {
				return new Date(year, month - 1, day);
			}
		}

		return null;
	}

	calculateAge(dateOfBirth) {
		const currentDate = new Date();
		const ageInMilliseconds = currentDate - dateOfBirth;
		return Math.floor(ageInMilliseconds / (365.25 * 24 * 60 * 60 * 1000));
	}

	showUnderageFields() {
		this.underageFieldsetTarget.classList.remove('hidden');
		this.underageCheckboxTarget.checked = true;
		this.representativeEmailFieldTarget.classList.remove('hidden');
		this.underageWarningTarget.classList.remove('hidden');
	}

	hideUnderageFields() {
		this.underageFieldsetTarget.classList.add('hidden');
		this.underageCheckboxTarget.checked = false;
		this.representativeEmailFieldTarget.classList.add('hidden');
		this.underageWarningTarget.classList.add('hidden');

		// Clear the email field
		const emailInput = this.representativeEmailFieldTarget.querySelector('input');
		if (emailInput) {
			emailInput.value = '';
		}
	}

	async fetchUnderageLimit() {
		try {
			const response = await fetch('/extra_user_fields/underage_limit');
			const data = await response.json();
			this.underageLimitValue = data.underage_limit || 18;
			this.updateUnderageFields();
		} catch (error) {
			console.error('Failed to fetch underage limit:', error);
			this.underageLimitValue = 18; // fallback
		}
	}
}

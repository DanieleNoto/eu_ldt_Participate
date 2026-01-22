// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Gianfranco Cedro
//   # Simone Bianchelli

// Ensure jQuery is available before using it
if (typeof jQuery !== 'undefined') {
	jQuery(document).ready(function ($) {
		// Ensure I18n translations are loaded before proceeding
		// This prevents errors with the Decidim datepicker
		if (typeof window.I18n === 'undefined' || !window.I18n.translations) {
			console.warn('I18n translations not loaded yet, waiting...');
			setTimeout(function () {
				// Retry after translations should be loaded
				if (typeof window.I18n !== 'undefined' && window.I18n.translations) {
					initializeExtraUserFields($);
				}
			}, 500);
			return;
		}

		initializeExtraUserFields($);
	});
}

function initializeExtraUserFields($) {
	try {
		const underageCheckbox = $('#registration_underage_checkbox');
		const statutoryRepresentativeEmailField = $('#statutory_representative_email_field');
		const underageWarning = $('#underage_warning');
		// Look for any input field that matches the date of birth pattern
		// Can be either a text input or LocalizedDate selects
		const dateInputField = $('input[id*="registration_user_date_of_birth"]').first();
		const dateFieldContainer = $('[id*="registration_user_date_of_birth"]').first().closest('.date_field, .field');
		const underageFieldSet = $('#underage_fieldset');
		let underageLimit = 18;

		// Function to show or hide underage related fields based on age
		function updateUnderageFields() {
			let year, month, day;

			// Check if we have a text input field (format: dd/mm/yyyy or mm/dd/yyyy)
			if (dateInputField.length && dateInputField.is('input[type="text"]')) {
				const dateValue = dateInputField.val();
				if (!dateValue) {
					underageFieldSet.addClass('hidden');
					underageCheckbox.prop('checked', false);
					statutoryRepresentativeEmailField.addClass('hidden');
					underageWarning.addClass('hidden');
					return;
				}

				// Parse date in format dd/mm/yyyy or mm/dd/yyyy
				const parts = dateValue.split('/');
				if (parts.length === 3) {
					// Try dd/mm/yyyy format first (European)
					day = parseInt(parts[0], 10);
					month = parseInt(parts[1], 10);
					year = parseInt(parts[2], 10);

					// If month > 12, it's probably mm/dd/yyyy (US format)
					if (month > 12) {
						const temp = day;
						day = month;
						month = temp;
					}
				} else {
					underageFieldSet.addClass('hidden');
					return;
				}
			} else {
				// LocalizedDate generates 3 select fields: year (1i), month (2i), day (3i)
				const yearField = $('select[id$="date_of_birth_1i"]');
				const monthField = $('select[id$="date_of_birth_2i"]');
				const dayField = $('select[id$="date_of_birth_3i"]');

				year = yearField.val();
				month = monthField.val();
				day = dayField.val();

				if (!year || !month || !day) {
					underageFieldSet.addClass('hidden');
					underageCheckbox.prop('checked', false);
					statutoryRepresentativeEmailField.addClass('hidden');
					underageWarning.addClass('hidden');
					return;
				}
			}

			try {
				const dobDate = new Date(year, month - 1, day);
				const currentDate = new Date();
				const ageInMilliseconds = currentDate - dobDate;
				const age = Math.abs(new Date(ageInMilliseconds).getUTCFullYear() - 1970);

				if (age < underageLimit) {
					underageFieldSet.removeClass('hidden');
					underageCheckbox.prop('checked', true);
					statutoryRepresentativeEmailField.removeClass('hidden');
					underageWarning.removeClass('hidden');
				} else {
					statutoryRepresentativeEmailField.find('input').val('');
					underageFieldSet.addClass('hidden');
					underageCheckbox.prop('checked', false);
					statutoryRepresentativeEmailField.addClass('hidden');
					underageWarning.addClass('hidden');
				}
			} catch (error) {
				console.error('Error parsing date of birth:', error);
			}
		}

		if (underageCheckbox.length && statutoryRepresentativeEmailField.length) {
			underageCheckbox.on('change', function () {
				if (underageCheckbox.prop('checked')) {
					statutoryRepresentativeEmailField.removeClass('hidden');
					underageWarning.removeClass('hidden');
				} else {
					statutoryRepresentativeEmailField.find('input').val('');
					statutoryRepresentativeEmailField.addClass('hidden');
					underageWarning.addClass('hidden');
				}
			});
		}

		if (dateFieldContainer.length && underageCheckbox.length) {
			updateUnderageFields();
		}

		if (underageCheckbox.length) {
			$.ajax({
				url: '/extra_user_fields/underage_limit',
				type: 'GET',
				success: function (data) {
					underageLimit = data.underage_limit;
					if (dateOfBirthField.length && underageFieldSet.length) {
						updateUnderageFields();
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					console.error('Failed to fetch underage limit:', textStatus, errorThrown);
				}
			});
		}

		if (dateFieldContainer.length && underageFieldSet.length) {
			// Watch all three select fields for changes (LocalizedDate)
			$('select[id$="date_of_birth_1i"], select[id$="date_of_birth_2i"], select[id$="date_of_birth_3i"]').on(
				'change',
				function () {
					updateUnderageFields();
				}
			);

			// Also watch text input field for changes
			if (dateInputField.length) {
				dateInputField.on('change blur', function () {
					updateUnderageFields();
				});
			}
		} // Clear validation errors for gender field when it's populated
		const genderField = $('#registration_user_gender');
		if (genderField.length) {
			// Function to clear gender errors
			function clearGenderErrors() {
				const value = genderField.val();
				// Clear errors if a valid value is selected (not empty and not a placeholder)
				if (value && value.trim() !== '' && !value.toLowerCase().includes('select')) {
					// Remove error styling
					genderField.removeClass('is-invalid-input');

					// Find and hide all error messages related to this field
					const fieldContainer = genderField.closest('.field, label');
					if (fieldContainer.length) {
						fieldContainer.find('.form-error').hide();
						fieldContainer.find('small.form-error').hide();
					}

					// Also check parent containers
					const parentField = genderField.closest('.select');
					if (parentField.length) {
						parentField.find('.form-error').hide();
					}
				}
			}

			// Clear errors on change
			genderField.on('change', function () {
				clearGenderErrors();
			});

			// Clear errors on load if already has value
			clearGenderErrors();
		}

		// Validate country field to prevent submission with placeholder values
		const countryField = $('#registration_user_country');
		if (countryField.length) {
			function validateCountry() {
				const value = countryField.val();
				const fieldContainer = countryField.closest('.field, label');

				// Show error if empty or looks like placeholder
				if (
					!value ||
					value.trim() === '' ||
					value.toLowerCase().includes('select') ||
					value.toLowerCase().includes('country')
				) {
					countryField.addClass('is-invalid-input');
					if (fieldContainer.length && !fieldContainer.find('.form-error:visible').length) {
						const errorMsg = $('<small class="form-error is-visible">Please select a country</small>');
						fieldContainer.append(errorMsg);
					}
					return false;
				} else {
					countryField.removeClass('is-invalid-input');
					if (fieldContainer.length) {
						fieldContainer.find('.form-error').remove();
					}
					return true;
				}
			}

			countryField.on('change', validateCountry);
		} // Clear validation errors for phone_number field when it's populated
		const phoneNumberField = $('#registration_user_phone_number');
		if (phoneNumberField.length) {
			phoneNumberField.on('input', function () {
				const value = $(this).val();
				if (value && value.trim() !== '') {
					// Remove error styling and error message
					phoneNumberField.removeClass('is-invalid-input');
					const label = phoneNumberField.closest('label');
					if (label.length) {
						label.find('.form-error').hide();
						label.find('small.form-error').hide();
					}
					const field = phoneNumberField.closest('.field');
					if (field.length) {
						field.find('.form-error').hide();
					}
				}
			});
		}

		// Clear validation errors for date_of_birth field when it's populated
		if (dateFieldContainer.length) {
			// For LocalizedDate select fields
			$('select[id$="date_of_birth_1i"], select[id$="date_of_birth_2i"], select[id$="date_of_birth_3i"]').on(
				'change',
				function () {
					const value = $(this).val();
					if (value && value.trim() !== '') {
						// Remove error styling and error message from all date selects
						$(
							'select[id$="date_of_birth_1i"], select[id$="date_of_birth_2i"], select[id$="date_of_birth_3i"]'
						).removeClass('is-invalid-input');
						const field = dateFieldContainer.closest('.field, .date_field');
						if (field.length) {
							field.find('.form-error').hide();
							field.find('small.form-error').hide();
						}
					}
				}
			);

			// For text input field
			if (dateInputField.length) {
				dateInputField.on('change blur', function () {
					const value = $(this).val();
					if (value && value.trim() !== '') {
						dateInputField.removeClass('is-invalid-input');
						const field = dateFieldContainer.closest('.field, .date_field');
						if (field.length) {
							field.find('.form-error').hide();
							field.find('small.form-error').hide();
						}
					}
				});
			}
		}
	} catch (error) {
		console.error('Error in extra user fields signup form:', error);
	}
}

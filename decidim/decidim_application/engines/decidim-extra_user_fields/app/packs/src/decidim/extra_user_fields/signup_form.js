// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Gianfranco Cedro
//   # Simone Bianchelli

// Ensure jQuery is available before using it
if (typeof jQuery !== 'undefined') {
	jQuery(document).ready(function ($) {
		try {
			const underageCheckbox = $('#registration_underage_checkbox');
			const statutoryRepresentativeEmailField = $('#statutory_representative_email_field');
			const underageWarning = $('#underage_warning');
			const dateOfBirthField = $('#registration_user_date_of_birth');
			const underageFieldSet = $('#underage_fieldset');
			let underageLimit = 18;

			// Function to show or hide underage related fields based on age
			function updateUnderageFields() {
				const dobValue = dateOfBirthField.val();
				const dobDate = Date.parse(`${dobValue}`);
				const currentDate = Date.now();
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

			if (dateOfBirthField.length && underageCheckbox.length) {
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

			if (dateOfBirthField.length && underageFieldSet.length) {
				dateOfBirthField.on('change', function () {
					updateUnderageFields();
				});
			}

			// Clear validation errors for gender field when it's populated
			const genderField = $('#registration_user_gender');
			if (genderField.length) {
				// Function to clear gender errors
				function clearGenderErrors() {
					const value = genderField.val();
					if (value && value.trim() !== '' && value !== '') {
						// Find the label that contains this select and remove errors from it
						const label = genderField.closest('label');
						if (label.length) {
							label.find('.form-error').hide();
							label.find('small.form-error').hide();
						}

						// Remove invalid class from field
						genderField.removeClass('is-invalid-input');

						// Add a data attribute to track that this field was cleared
						genderField.attr('data-errors-cleared', 'true');
					}
				}

				// Clear errors on change
				genderField.on('change', function () {
					clearGenderErrors();
				});
			}

			// Clear validation errors for phone_number field when it's populated
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
		} catch (error) {
			console.error('Error in extra user fields signup form:', error);
		}
	});
}

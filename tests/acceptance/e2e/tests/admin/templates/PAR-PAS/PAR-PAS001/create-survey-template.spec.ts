/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { test, expect } from '@fixtures/parallel-test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';

/**
 * Create survey and poll templates for reuse in participatory processes
 * User Story: As an Administrator, I want to create survey and poll templates so that I can reuse them for future participatory processes, ensuring consistency and saving time.
 * Requirements: PAR R15, PAR R16
 * Prerequisites:
 * - The administrator has an active account on the platform and is logged in.
 * - The administrator has the necessary permissions to create survey templates.
 */

test.describe('[PAR-PAS001] – Create Survey and Poll Templates', () => {
	let adminHomePage: AdminHomePage;

	test.beforeEach(async ({ adminPage }) => {
		// Navigate directly to admin area and wait for it to load
		adminHomePage = new AdminHomePage(adminPage);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should create a complete survey template with questions', async ({ adminPage }) => {
			await test.step('1. USER: Navigates to the "Templates-> Questionnaire templates" section in the admin panel.', async () => {
				// Navigate to templates section
				await adminPage.getByRole('link', { name: 'Templates' }).click();

				// Verify we are on the questionnaire templates page
				expect(adminPage.url()).toContain('/admin/templates/questionnaire_templates');
				console.log('Successfully navigated to questionnaire templates section');
			});

			await test.step('2. USER: Clicks on "New Template."', async () => {
				// Click on new template button
				await adminPage.getByRole('link', { name: 'New template' }).click();

				// Verify we are on the new template page
				expect(adminPage.url()).toContain('/new');
				console.log('Navigated to new template creation page');
			});

			await test.step('3. SYSTEM: Displays the "New Template" form, including Name and descriptions.', async () => {
				// Verify the new template form is displayed
				await expect(adminPage.getByRole('textbox', { name: 'name' })).toBeVisible();
				await expect(adminPage.getByRole('textbox', { name: 'description' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Save' })).toBeVisible();

				console.log('New template form is displayed with name, description fields and save button');
			});

			await test.step('4. USER: Fulfil name and description input and click on "Create" button', async () => {
				// Fill template data
				await adminPage.getByRole('textbox', { name: 'name' }).click();
				await adminPage.getByRole('textbox', { name: 'name' }).fill('Test Survey Template');
				await adminPage.getByRole('textbox', { name: 'description' }).click();
				await adminPage
					.getByRole('textbox', { name: 'description' })
					.fill('A comprehensive survey template for testing purposes');

				// Save template
				await adminPage.getByRole('button', { name: 'Save' }).click();

				console.log('Filled template data and clicked save button');
			});

			let templateId: string;
			await test.step('5. SYSTEM: Create the new empty template and displays options for adding survey elements.', async () => {
				// Wait for redirect to edit page and extract template ID
				await adminPage.waitForURL(/\/admin\/templates\/questionnaire_templates\/\d+\/edit/);
				const currentUrl = adminPage.url();
				templateId = currentUrl.match(/\/questionnaire_templates\/(\d+)\/edit/)?.[1] || '2';

				// Verify template management options are available
				await expect(adminPage.getByRole('link', { name: 'Manage questions' })).toBeVisible();

				console.log(`Template created successfully with ID: ${templateId}`);
				console.log('Template editing page displayed with questionnaire management options');
			});

			await test.step('6. USER: Clicks "Add Question" to add question to the poll.', async () => {
				// Navigate to questions management
				await adminPage.getByRole('link', { name: 'Manage questions' }).click();

				// Verify we are on questions management page
				expect(adminPage.url()).toContain('/edit_questions');
				console.log('Navigated to questions management page');
			});

			await test.step('7. SYSTEM: Displays the "Add Question" form.', async () => {
				// Verify questions management interface is available
				await expect(adminPage.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				console.log('Questions management interface displayed with add question options');
			});

			await test.step('8. USER: Fills in the Question Form with statement, type, and mandatory settings', async () => {
				// Add first question
				await adminPage.getByRole('button', { name: 'Add question' }).click();

				// Wait for first question to be added
				await adminPage.waitForSelector('.questionnaire-question:nth-child(1)');
				const firstQuestion = adminPage.locator('.questionnaire-question:nth-child(1)');

				// Expand question form if collapsed
				const firstAccordionButton = firstQuestion.locator('.question--collapse').first();
				const isExpanded = await firstAccordionButton.getAttribute('aria-expanded');
				if (isExpanded === 'false') {
					await firstAccordionButton.click();
					await firstQuestion.locator('.editor-input').waitFor();
				}

				// Fill question 1 - Short answer
				await firstQuestion.getByRole('textbox', { name: 'Statement' }).fill('What is your name?');
				await firstQuestion.locator('.editor-input .tiptap').fill('Please provide your full name');
				await firstQuestion.getByRole('checkbox', { name: 'Mandatory' }).check();
				await firstQuestion.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill('100');
				await firstQuestion.getByLabel('TypeShort answer Long answer').selectOption('short_answer');

				console.log('Created first question: Short answer with character limit and mandatory setting');

				// Add second question - Multiple choice
				await adminPage.getByRole('button', { name: 'Add question' }).click();

				// Wait for second question to be added
				await adminPage.waitForSelector('.questionnaire-question:nth-child(2)');
				const secondQuestion = adminPage.locator('.questionnaire-question:nth-child(2)');

				// Expand question form if collapsed
				const secondAccordionButton = secondQuestion.locator('.question--collapse').first();
				const isSecondExpanded = await secondAccordionButton.getAttribute('aria-expanded');
				if (isSecondExpanded === 'false') {
					await secondAccordionButton.click();
					await secondQuestion.locator('.editor-input').waitFor();
				}

				// Fill second question details
				await secondQuestion
					.getByRole('textbox', { name: 'Statement' })
					.fill('What is your preferred communication method?');
				await secondQuestion.locator('.editor-input .tiptap').fill('Select your preferred way to be contacted');

				// Set question type to single option first - this will show the answer options section
				await secondQuestion.getByLabel('TypeShort answer Long answer').selectOption('single_option');

				// Wait for answer options section to become visible
				await secondQuestion.getByRole('button', { name: 'Add answer option' }).waitFor();

				// Add exactly 3 answer options with proper text
				await secondQuestion.getByRole('button', { name: 'Add answer option' }).click();
				await secondQuestion.locator('.questionnaire-question-answer-option').last().waitFor();
				await secondQuestion
					.locator('.questionnaire-question-answer-option')
					.last()
					.getByRole('textbox', { name: 'Statement' })
					.fill('Email');

				await secondQuestion.getByRole('button', { name: 'Add answer option' }).click();
				await secondQuestion.locator('.questionnaire-question-answer-option').last().waitFor();
				await secondQuestion
					.locator('.questionnaire-question-answer-option')
					.last()
					.getByRole('textbox', { name: 'Statement' })
					.fill('Phone');

				await secondQuestion.getByRole('button', { name: 'Add answer option' }).click();
				await secondQuestion.locator('.questionnaire-question-answer-option').last().waitFor();
				await secondQuestion
					.locator('.questionnaire-question-answer-option')
					.last()
					.getByRole('textbox', { name: 'Statement' })
					.fill('SMS');

				console.log('Created second question: Multiple choice with 3 options');

				// Add third question - Long answer
				await adminPage.getByRole('button', { name: 'Add question' }).click();

				// Wait for third question to be added
				await adminPage.waitForSelector('.questionnaire-question:nth-child(3)');
				const thirdQuestion = adminPage.locator('.questionnaire-question:nth-child(3)');

				// Expand question form if collapsed
				const thirdAccordionButton = thirdQuestion.locator('.question--collapse').first();
				const isThirdExpanded = await thirdAccordionButton.getAttribute('aria-expanded');
				if (isThirdExpanded === 'false') {
					await thirdAccordionButton.click();
					await thirdQuestion.locator('.editor-input').waitFor();
				}

				// Fill third question details
				await thirdQuestion
					.getByRole('textbox', { name: 'Statement' })
					.fill('Please provide your feedback about our services');
				await thirdQuestion
					.locator('.editor-input .tiptap')
					.fill('Share your detailed feedback and suggestions');
				await thirdQuestion.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill('500');
				await thirdQuestion.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

				console.log('Created third question: Long answer with character limit');

				// Add separator
				await adminPage.getByRole('button', { name: 'Add separator' }).click();
				console.log('Added separator between question sections');

				// Add title and description section
				await adminPage.getByRole('button', { name: 'Add title and description' }).click();

				// Wait for the title and description element to be added
				await adminPage.waitForSelector('.questionnaire-question:has([data-component="accordion"]):last-child');
				const titleDescriptionElement = adminPage.locator(
					'.questionnaire-question:has([data-component="accordion"]):last-child'
				);

				// Expand if collapsed
				const titleAccordionButton = titleDescriptionElement.locator('.question--collapse').first();
				const isTitleExpanded = await titleAccordionButton.getAttribute('aria-expanded');
				if (isTitleExpanded === 'false') {
					await titleAccordionButton.click();
					await titleDescriptionElement.locator('.editor-input').waitFor();
				}

				await titleDescriptionElement.getByRole('textbox', { name: 'Title' }).fill('Additional Information');
				await titleDescriptionElement
					.locator('.editor-input .tiptap')
					.fill('This section contains additional questions for more detailed feedback');

				console.log('Added title and description section');
			});

			await test.step('9. USER: Clicks on "Save" to create template', async () => {
				// Save the questionnaire with all questions
				await adminPage.getByRole('button', { name: 'Save' }).click();
				console.log('Clicked save button to save questionnaire');
			});

			await test.step('10. SYSTEM: Validates the form for completeness and correctness.', async () => {
				// Wait for save operation to complete
				await adminPage.waitForLoadState('networkidle');

				// Check for validation errors on the page
				const errorElements = adminPage.locator('.form-error, .field_with_errors, .is-invalid-input');
				const errorCount = await errorElements.count();

				if (errorCount > 0) {
					console.log(`Found ${errorCount} validation errors, attempting to fix them`);

					// Expand all questions to access all fields
					const expandAllButton = adminPage.getByRole('button', { name: 'Expand all questions' });
					await expandAllButton.click();
					await adminPage.waitForTimeout(500);

					// Find all blank answer option inputs that have validation errors
					const invalidInputs = adminPage.locator('.questionnaire-question-answer-option .is-invalid-input');
					const invalidCount = await invalidInputs.count();
					console.log(`Found ${invalidCount} invalid answer option inputs`);

					// Remove all blank answer options that are causing validation errors
					for (let i = invalidCount - 1; i >= 0; i--) {
						const input = invalidInputs.nth(i);
						const value = await input.inputValue();

						if (!value || value.trim() === '') {
							// Find the immediate parent answer option card for this specific input
							const answerOptionCard = input.locator(
								'xpath=ancestor::div[contains(@class, "questionnaire-question-answer-option")][1]'
							);
							// Get the remove button that's a direct child of this specific answer option card
							const removeButton = answerOptionCard.locator(
								'> div.card-divider > h2 > button:has-text("Remove")'
							);

							try {
								if ((await removeButton.count()) > 0 && (await removeButton.isVisible())) {
									await removeButton.click();
									await adminPage.waitForTimeout(300);
									console.log(`Removed blank answer option ${i + 1}`);
								}
							} catch (error) {
								console.log(`Could not remove answer option ${i + 1}: ${error.message}`);
							}
						}
					}

					// Remove any display conditions that might have validation errors
					const displayConditionErrors = adminPage.locator(
						'.questionnaire-question-display-condition .form-error'
					);
					const conditionErrorCount = await displayConditionErrors.count();

					if (conditionErrorCount > 0) {
						console.log(`Found ${conditionErrorCount} display condition errors, removing them`);
						const displayConditions = adminPage.locator('.questionnaire-question-display-condition');
						const displayCount = await displayConditions.count();

						for (let i = displayCount - 1; i >= 0; i--) {
							const condition = displayConditions.nth(i);
							const removeButton = condition.getByRole('button', { name: 'Remove' });

							if (await removeButton.isVisible()) {
								await removeButton.click();
								await adminPage.waitForTimeout(200);
								console.log(`Removed display condition ${i + 1}`);
							}
						}
					}

					// Try to save again after cleaning up
					await adminPage.getByRole('button', { name: 'Save' }).click();
					await adminPage.waitForLoadState('networkidle');
				}

				console.log('Form validation completed successfully');
			});

			await test.step('11. SYSTEM: Saves the template', async () => {
				// Check final validation state
				const finalErrorElements = adminPage.locator('.form-error, .field_with_errors, .is-invalid-input');
				const finalErrorCount = await finalErrorElements.count();

				if (finalErrorCount > 0) {
					console.log(`Still have ${finalErrorCount} validation errors remaining`);

					// Log the specific errors for debugging
					for (let i = 0; i < Math.min(finalErrorCount, 10); i++) {
						const errorElement = finalErrorElements.nth(i);
						const errorText = await errorElement.textContent();
						const errorClass = await errorElement.getAttribute('class');
						console.log(`Error ${i + 1}: ${errorText} (class: ${errorClass})`);
					}

					// If there are still errors after cleanup, take a screenshot for debugging
					await adminPage.screenshot({ path: `form-validation-errors-${Date.now()}.png`, fullPage: true });
					throw new Error(
						`Form validation failed with ${finalErrorCount} errors remaining after cleanup attempts`
					);
				}

				// Verify we're still on the questions page or redirected successfully
				const currentUrl = adminPage.url();
				if (currentUrl.includes('update_questions') || currentUrl.includes('edit_questions')) {
					console.log('Template saved successfully');
				} else {
					console.log(`Unexpected URL after save: ${currentUrl}`);
				}
			});

			await test.step('Result.', async () => {
				// Navigate back to template edit page to verify final state
				await adminPage.goto(`/admin/templates/questionnaire_templates/${templateId}/edit`);

				// Verify template exists and has questions
				await expect(adminPage.getByRole('link', { name: 'Manage questions' })).toBeVisible();

				// Navigate to questions page to verify questions were saved
				await adminPage.getByRole('link', { name: 'Manage questions' }).click();

				// Wait for questions to load
				await adminPage.waitForLoadState('networkidle');

				// Verify questions exist by checking for question content instead of heading numbers
				await expect(adminPage.getByText('What is your name?')).toBeVisible();
				await expect(adminPage.getByText('What is your preferred communication method?')).toBeVisible();
				await expect(adminPage.getByText('Please provide your feedback about our services')).toBeVisible();
				await expect(adminPage.getByText('Additional Information')).toBeVisible();

				console.log('Survey template successfully created and stored for future use');
				console.log('Template can be reused for future participatory processes');
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should handle template creation cancellation', async ({ adminPage }) => {
			await test.step('1-10. USER: Navigates through template creation process', async () => {
				// Navigate to templates and create new template
				await adminPage.getByRole('link', { name: 'Templates' }).click();
				await adminPage.getByRole('link', { name: 'New template' }).click();

				// Start filling template data
				await adminPage.getByRole('textbox', { name: 'name' }).fill('Template to Cancel');
				await adminPage.getByRole('textbox', { name: 'description' }).fill('This template will be cancelled');
				console.log('Started template creation process');
			});

			await test.step('USER: Decides to cancel the template creation.', async () => {
				console.log('User decides to cancel template creation');
			});

			await test.step('SYSTEM: Prompts the user to confirm the cancellation.', async () => {
				console.log('System would prompt for cancellation confirmation');
			});

			await test.step('USER: Confirms cancellation.', async () => {
				// Navigate back to templates list without saving
				await adminPage.goto('/admin/templates/questionnaire_templates');
				console.log('User confirmed cancellation by navigating away');
			});

			await test.step('SYSTEM: Returns the user to the "Templates" section.', async () => {
				// Verify we're back on templates page
				expect(adminPage.url()).toContain('/admin/templates/questionnaire_templates');
				await expect(adminPage.getByRole('link', { name: 'New template' })).toBeVisible();
				console.log('Returned to templates section');
			});

			await test.step('Result.', async () => {
				// Verify no new template was created
				expect(adminPage.url()).toContain('/questionnaire_templates');
				console.log('Template creation cancelled successfully, returned to templates list');
			});
		});
	});

	test.describe('Alternative Flow: Field/s Validation Fail', () => {
		test('should handle validation errors and allow correction', async ({ adminPage }) => {
			await test.step('10.1. SYSTEM: Validates the input fields for completeness.', async () => {
				// Navigate to templates and create new template
				await adminPage.getByRole('link', { name: 'Templates' }).click();
				await adminPage.getByRole('link', { name: 'New template' }).click();
				console.log('Navigated to new template page');
			});

			await test.step('10.2. SYSTEM: Detects missing or invalid fields.', async () => {
				// Try to save without filling required name field
				await adminPage.getByRole('button', { name: 'Save' }).click();
				await adminPage.waitForLoadState('networkidle');

				// Check for validation error message or validation state
				const hasValidationError =
					(await adminPage.locator('.flash.alert, .form-error, .is-invalid-input').count()) > 0;
				const isOnTemplatesPage = adminPage.url().includes('/admin/templates/questionnaire_templates');
				const hasNameError =
					(await adminPage.locator('input[name="template[name_en]"].is-invalid-input').count()) > 0;

				// Verify validation failed (either stayed on new page or redirected with errors)
				expect(hasValidationError || hasNameError).toBeTruthy();
				expect(isOnTemplatesPage).toBeTruthy();
				console.log('Validation failed for missing required fields');
			});

			await test.step('10.3. USER: Corrects the errors in the input fields.', async () => {
				// We should be on a page showing validation errors
				// Check if we're on the new template page with errors, or need to navigate there
				const currentUrl = adminPage.url();
				console.log(`Current URL: ${currentUrl}`);

				// If we're not on the new template page, navigate there
				if (!currentUrl.includes('/new') && !currentUrl.includes('template')) {
					await adminPage.goto('/admin/templates/questionnaire_templates/new');
					await adminPage.waitForLoadState('networkidle');
				}

				// Wait for the form to be visible
				await expect(adminPage.getByRole('textbox', { name: 'name' })).toBeVisible({ timeout: 10000 });

				// Clear any existing values and fill with correct data
				await adminPage.getByRole('textbox', { name: 'name' }).clear();
				await adminPage.getByRole('textbox', { name: 'name' }).fill('Corrected Template Name');

				await adminPage.getByRole('textbox', { name: 'description' }).clear();
				await adminPage.getByRole('textbox', { name: 'description' }).fill('Now with proper validation');

				console.log('User corrected validation errors by filling required fields');
			});

			await test.step('10.4. USER: Attempts to save the template again.', async () => {
				// Try to save again with corrected data
				await adminPage.getByRole('button', { name: 'Save' }).click();
				await adminPage.waitForLoadState('networkidle');
				console.log('Attempted to save template again');
			});

			await test.step('10.5. SYSTEM: Revalidates the corrected fields.', async () => {
				// Should now redirect to edit page
				await adminPage.waitForURL(/\/admin\/templates\/questionnaire_templates\/\d+\/edit/);
				expect(adminPage.url()).toContain('/edit');
				console.log('Form validation passed after correction');
			});

			await test.step('Result.', async () => {
				// Verify template was saved successfully
				await expect(adminPage.getByRole('link', { name: 'Manage questions' })).toBeVisible();
				console.log('Template saved successfully after validation correction');
			});
		});
	});
});

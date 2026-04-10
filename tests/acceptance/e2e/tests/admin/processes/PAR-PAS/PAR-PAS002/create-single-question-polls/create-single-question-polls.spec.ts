/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Antonio Abramo Carotenuto
 */

import { test, expect } from '@fixtures/parallel-test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { QuestionnaireTemplatesPage } from '@pages/pages/admin/templates/QuestionnaireTemplatesPage';
import { NewTemplatePage } from '@pages/pages/admin/templates/NewTemplatePage';
import { EditTemplatePage } from '@pages/pages/admin/templates/EditTemplatePage';
import { error } from 'console';

/**
 * Create quick polls for immediate feedback
 * User Story: As a City Administrator, I want to create single-question polls so that I can quickly gather citizens' opinions.
 * Requirements: PAR R15
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The City Administrator has permissions to create polls.
 */

test.describe('[PAR-PAS002] – Create single-question polls', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let surveysManagePage: SurveysManagePage;
	let templatesPage: QuestionnaireTemplatesPage;
	let newTemplatePage: NewTemplatePage;
	let editTemplatePage: EditTemplatePage;
	let validProcessData: any;
	let templateId: string;
	let templateName: string;
	let processEditUrl: string;

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		componentsPage = new ComponentsPage(adminPage);
		surveysManagePage = new SurveysManagePage(adminPage);
		templatesPage = new QuestionnaireTemplatesPage(adminPage);
		newTemplatePage = new NewTemplatePage(adminPage);
		editTemplatePage = new EditTemplatePage(adminPage);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

		// Setup test environment
		await setupTestProcess();
	});

	/**
	 * Setup test environment by creating a new test process as prerequisite
	 */
	async function setupTestProcess() {
		await test.step('Setup: Create new test process as prerequisite', async () => {
			const { processSlug: slug, processEditUrl: url } = await surveysManagePage.setupTestProcess(
				validProcessData,
				adminHomePage,
				processAdminPage,
				false // do not publish the process
			);
			processEditUrl = url;
			console.log('Test process setup completed');
		});
	}

	test.describe('Main Flow', () => {
		test('should create a single-question polls', async ({ adminPage }) => {
			// Get the current URL to extract process slug
			const currentUrl = adminPage.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_${timestamp}`;

			// Track the number of questions added during the test
			let questionsCount = 0;

			await test.step('1. User: Navigates to the "Processes" section.', async () => {
				// Navigate to processes section using admin nav
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('load');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
				console.log('Navigated to Processes section');
			});

			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
				console.log('Processes list displayed with available processes');
			});

			await test.step('3. User: Selects the process that want to update.', async () => {
				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);
				console.log('Selected process to update');
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await adminPage.waitForLoadState('load');

				// Verify we're on the edit page with process information using Page Object
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
				console.log('Process loaded with editable form containing existing information');
			});

			await test.step('5. User: Navigates to the "Components" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToComponents();
				console.log('Navigated to Components section');
			});

			await test.step('6. User: Clicks on "Add Component" and select Survey.', async () => {
				await surveysManagePage.addComponentAndSelectSurvey(componentsPage, processSlug);
				console.log('Selected Survey component type');
			});

			await test.step('7. System: Displays the "Add Survey" form.', async () => {
				// Verify the Add Survey form is displayed with required fields
				await surveysManagePage.verifyAddSurveyFormDisplayed();
				console.log('Add Survey form displayed with name field and add component button');
			});

			await test.step('8. User: Fulfil name and description input and click on "Add component" button.', async () => {
				await surveysManagePage.fulfillSurveyFormAndCreateComponent(componentName, processSlug, false);
				console.log(`Configured component settings and created component: ${componentName}`);
			});

			await test.step('9. System: Displays the survey creation form with Title, Description and Privacy Policy fields.', async () => {
				await surveysManagePage.accessComponentAndCreateNewSurvey(componentsPage, componentName);
				await surveysManagePage.verifyEmptyQuestionnaireDisplayed();
			});

			await test.step('10. User: Fills Title, Description and Privacy Policy fields and saves.', async () => {
				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_${surveyTimestamp}`;
				await surveysManagePage.fillSurveyDetailsAndSave(surveyName, 'description');
			});

			await test.step('11. User: Navigates to the "Questions" tab, selects "Create new form" and clicks Continue.', async () => {
				await surveysManagePage.accessQuestionsManagement();
			});

			await test.step('12. System: Displays the empty questionnaire with options for adding survey elements.', async () => {
				// Verify questions management interface is available
				await expect(adminPage.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add title and description' })).toBeVisible();
				console.log('Questions management interface displayed with add question options');
			});

			await test.step('13. User: Clicks "Add Question" to add question to the poll.', async () => {
				// Add new question
				await adminPage.getByRole('button', { name: 'Add question' }).click();
			});

			await test.step('14. User: Fills in the Question Form: Statement: Adds the main question, Type: select question types, Mandatory: check if must be answered before submitting', async () => {
				// Question 1: Long Answer
				await adminPage.waitForSelector('.questionnaire-question:nth-child(1)');
				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');

				// Expand question form if collapsed
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').first().waitFor();
				}

				// Fill question details
				await surveysManagePage.fillQuestionStatement(
					question1Container,
					'What is your opinion on this topic?'
				);
				await surveysManagePage.fillQuestionDescription(question1Container, 'Please share your thoughts');
				await surveysManagePage.checkMandatory(question1Container);
				await surveysManagePage.fillCharacterLimit(question1Container, '500');
				await surveysManagePage.selectQuestionType(question1Container, 'long_response');

				// Increment questions counter
				questionsCount++;
				console.log(
					`Added question 1: Long Answer with 500 character limit (Total questions: ${questionsCount})`
				);
			});

			await test.step('15. User: Clicks on "Save" to create Single-Question Polls', async () => {
				await surveysManagePage.clickSaveQuestions();
			});

			await test.step('16. System: Validates the form for completeness and correctness.', async () => {
				await surveysManagePage.verifySurveyQuestionsSaved();
			});

			await test.step('17. System: Saves and publishes the poll', async () => {
				// Final step: Publish the survey poll
				await surveysManagePage.publishSurvey();

				// Verify that the survey was actually created with the correct number of questions (dynamic count)
				await surveysManagePage.verifyPublishedQuestionsCount(questionsCount, 'survey creation');

				console.log('single-question poll is successfully created and published');

				// Verify we're back on the surveys management page
				expect(adminPage.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});

	test.describe('Alternative Flow: Select template', () => {
		let templateQuestionsCount = 0;

		test.beforeEach(async ({ adminPage }) => {
			await test.step('Setup: Navigate to Templates section', async () => {
				await templatesPage.navigateToPage();
				await adminPage.waitForLoadState('load');
				console.log('Navigated to Templates section for prerequisite setup');
			});

			await test.step('Setup: Create new template', async () => {
				await templatesPage.navigateToNewTemplate();
				await newTemplatePage.waitForPageToLoad();

				// Create template with simple data
				const templateTimestamp = Date.now().toString();
				templateName = `Survey_Template_${templateTimestamp}`;

				await newTemplatePage.createSimpleTemplate(templateName);
				await adminPage.waitForURL(/\/admin\/templates\/questionnaire_templates\/\d+\/edit/);

				// Extract template ID from URL
				const templateUrl = adminPage.url();
				const templateMatch = templateUrl.match(/\/questionnaire_templates\/(\d+)\/edit/);
				templateId = templateMatch ? templateMatch[1] : '';

				console.log(`Template created with ID: ${templateId} and name: ${templateName}`);
			});

			await test.step('Setup: Add question to template', async () => {
				await editTemplatePage.manageQuestions();
				await adminPage.waitForURL(/\/admin\/templates\/questionnaire_templates\/\d+\/edit_questions/);

				// Verify questions management interface is available
				await expect(adminPage.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(1)');

				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').first().waitFor();
				}

				// Fill question details
				await surveysManagePage.fillQuestionStatement(
					question1Container,
					'What is your opinion on this topic?'
				);
				await surveysManagePage.fillQuestionDescription(question1Container, 'Please share your thoughts');
				await surveysManagePage.checkMandatory(question1Container);
				await surveysManagePage.fillCharacterLimit(question1Container, '500');
				await surveysManagePage.selectQuestionType(question1Container, 'long_response');

				templateQuestionsCount++;

				console.log('Question configured: "What is your opinion on this topic?" with mandatory long answer');
			});

			await test.step('Setup: Save template and return to process', async () => {
				// Save template questions
				await adminPage.getByRole('button', { name: 'Save' }).click();
				await adminPage.waitForLoadState('load');

				console.log('Template questions saved successfully');

				// Navigate back to the process edit page using the stored URL
				console.log('Navigating back to process edit page:', processEditUrl);
				await adminPage.goto(processEditUrl);
				await adminPage.waitForLoadState('load');
				console.log('Template setup completed - ready for template selection test');
			});
		});

		test('should create a single-question polls based on a selected template', async ({ adminPage }) => {
			// Get the current URL to extract process slug
			const currentUrl = adminPage.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_Template_${timestamp}`;

			await test.step('1-9. User: Navigates through process setup and creates Survey component with template selection', async () => {
				// Navigate to processes section using admin nav
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('load');

				// Verify we're on processes page and select our created process
				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);

				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);

				await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await adminPage.waitForLoadState('load');

				// Navigate to Components section and create Survey component
				await updateProcessAdminPage.navigateToComponents();

				// Clicks on "Add Component" and selects Survey
				await surveysManagePage.addComponentAndSelectSurvey(componentsPage, processSlug);
				// Displays the "Add Survey" form
				await surveysManagePage.verifyAddSurveyFormDisplayed();
				// Fulfil name and description input and click on "Add component" button
				await surveysManagePage.fulfillSurveyFormAndCreateComponent(componentName, processSlug, false);

				await expect(adminPage.getByText('Component created successfully')).toBeVisible();

				await surveysManagePage.accessComponentAndCreateNewSurvey(componentsPage, componentName);
				await surveysManagePage.verifyTemplateSelectionDisplayed();

				console.log(
					`Completed steps 1-9: Survey component "${componentName}" created and ready for template selection`
				);
			});

			await test.step('10.1. User: Fill survey form details and save', async () => {
				await surveysManagePage.verifyEmptyQuestionnaireDisplayed();

				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_template_${surveyTimestamp}`;
				await surveysManagePage.fillSurveyDetailsAndSave(surveyName, 'Survey created from template');
				console.log(`Survey form saved: ${surveyName}`);
			});

			await test.step('10.2. System: Create the new questionnaire based on selected template and displays options for adding survey elements', async () => {
				await surveysManagePage.accessQuestionsManagementWithTemplate(templateName);
				await expect(adminPage.getByText('Template applied successfully.')).toBeVisible();

				// Verify the imported question from template is present
				await expect(adminPage.locator('.questionnaire-question:nth-child(1)')).toBeVisible();

				// Verify the question content matches what was configured in the template
				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').first().waitFor();
				}

				// Verify the question statement matches the template
				const statementInput = question1Container
					.locator('[role="tabpanel"][aria-hidden="false"]')
					.locator('input[type="text"]')
					.first();
				await statementInput.waitFor({ state: 'visible' });
				await expect(statementInput).toHaveValue('What is your opinion on this topic?');

				// Verify the question description matches the template
				const descriptionEditor = question1Container
					.locator('[role="tabpanel"][aria-hidden="false"]')
					.locator('.editor-input .tiptap')
					.first();
				await descriptionEditor.waitFor({ state: 'visible' });
				const descriptionText = await descriptionEditor.innerText();
				expect(descriptionText.trim()).toBe('Please share your thoughts');

				// Verify question type is Long Answer as configured in template
				const questionTypeSelect = question1Container.locator('select:not([data-editor-type])').first();
				await questionTypeSelect.waitFor({ state: 'visible' });
				await expect(questionTypeSelect).toHaveValue('long_response');

				// Verify mandatory checkbox is checked as configured in template
				const mandatoryCheckbox = question1Container.locator('input[type="checkbox"]').first();
				await mandatoryCheckbox.waitFor({ state: 'visible' });
				await expect(mandatoryCheckbox).toBeChecked();

				// Verify character limit is set to 500 as configured in template
				const characterLimitInput = question1Container.locator('input[type="number"]').first();
				await characterLimitInput.waitFor({ state: 'visible' });
				await expect(characterLimitInput).toHaveValue('500');

				console.log('Verified template question imported correctly');

				await surveysManagePage.clickSaveQuestions();
				await surveysManagePage.verifySurveyQuestionsSaved();

				// Final step: Publish the survey poll (navigates back to /manage/ first)
				await surveysManagePage.publishSurvey();

				// Verify that the survey was actually created with the correct number of questions (from template)
				await surveysManagePage.verifyPublishedQuestionsCount(
					templateQuestionsCount,
					'template survey creation'
				);
				console.log(`Survey with template configured, saved and published successfully`);

				// Final verification that we're on the management page confirming successful creation
				expect(adminPage.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});

	test.describe('Alternative Flow: Fields Validation Fail', () => {
		test('should detect and handle validation errors during poll creation', async ({ adminPage }) => {
			// Get the current URL to extract process slug
			const currentUrl = adminPage.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_${timestamp}`;

			// Track the number of questions added during validation flow
			let questionsCount = 0;

			await test.step('1-16. User: Navigates through complete poll creation process up to question creation', async () => {
				// Navigate to processes section and select our created process
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('load');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);

				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);

				await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await adminPage.waitForLoadState('load');

				// Navigate to Components section and create Survey component
				await updateProcessAdminPage.navigateToComponents();

				// Clicks on "Add Component" and selects Survey
				await surveysManagePage.addComponentAndSelectSurvey(componentsPage, processSlug);
				// Displays the "Add Survey" form
				await surveysManagePage.verifyAddSurveyFormDisplayed();
				// Fulfil name and description input and click on "Add component" button
				await surveysManagePage.fulfillSurveyFormAndCreateComponent(componentName, processSlug, false);

				await expect(adminPage.getByText('Component created successfully')).toBeVisible();

				await surveysManagePage.accessComponentAndCreateNewSurvey(componentsPage, componentName);
				await surveysManagePage.verifyEmptyQuestionnaireDisplayed();

				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_${surveyTimestamp}`;
				await surveysManagePage.fillSurveyDetailsAndSave(surveyName, 'description');

				await surveysManagePage.accessQuestionsManagement();

				// Verify questions management interface is available
				await expect(adminPage.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				// Add new question
				await adminPage.getByRole('button', { name: 'Add question' }).click();

				// Question 1: Single Option
				await adminPage.waitForSelector('.questionnaire-question:nth-child(1)');
				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');

				// Expand question form if collapsed
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container
						.locator('[role="tabpanel"][aria-hidden="false"]')
						.locator('.editor-input')
						.first()
						.waitFor();
				}

				// Change question type from default to single option
				await question1Container
					.locator('select:not([data-editor-type])')
					.first()
					.selectOption('single_option');

				console.log(`Completed steps 1-16: Survey "${surveyName}" ready for question validation testing`);
			});

			await test.step('17.1. System: Validates the input fields for completeness', async () => {
				// Verify that required fields are empty before attempting to save
				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');

				// Verify that the main question statement field is empty
				const statementInput = question1Container
					.locator('[role="tabpanel"][aria-hidden="false"]')
					.locator('input[type="text"]')
					.first();
				await expect(statementInput).toHaveValue('');

				// Verify that the two response option fields are empty
				await expect(
					question1Container
						.locator('.questionnaire-question-response-option')
						.first()
						.locator('.tabs-panel.is-active')
						.locator('input[type="text"]')
						.first()
				).toHaveValue('');
				await expect(
					question1Container
						.locator('.questionnaire-question-response-option')
						.nth(1)
						.locator('.tabs-panel.is-active')
						.locator('input[type="text"]')
						.first()
				).toHaveValue('');

				console.log('Verified that required fields are empty before attempting validation');

				// Test validation by trying to save empty form
				await adminPage.getByRole('button', { name: 'Save' }).click();
				await adminPage.waitForLoadState('load');
				console.log('System initiated validation check for form completeness');
			});

			await test.step('17.2. System: Detects missing or invalid fields', async () => {
				// Verify validation error messages for required fields
				await expect(adminPage.getByText('There was a problem saving')).toBeVisible();
				await adminPage.waitForTimeout(1000);

				// Verify specific validation errors for the required Statement fields:
				await expect(adminPage.getByText(SurveysManagePage.VALIDATION_ERROR_STATEMENT_BLANK)).toHaveCount(3);

				console.log('System detected missing required Statement fields');
			});

			await test.step('17.3. User: Corrects the errors in the input fields', async () => {
				// Fill question details properly to correct validation errors
				await adminPage.getByRole('button', { name: 'Expand all questions' }).click();
				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');

				// Fill the main question statement and description using Page Object methods
				await surveysManagePage.fillQuestionStatement(question1Container, 'Which option do you prefer?');
				await surveysManagePage.fillQuestionDescription(
					question1Container,
					'Select one of the available options'
				);

				// Set question type to single option
				await surveysManagePage.selectQuestionType(question1Container, 'single_option');

				// Fill the default two response options that are automatically created
				await question1Container.locator('.questionnaire-question-response-option').first().waitFor();
				await question1Container
					.locator('.questionnaire-question-response-option')
					.first()
					.locator('.tabs-panel.is-active')
					.locator('input[type="text"]')
					.first()
					.fill('Option A');
				await question1Container
					.locator('.questionnaire-question-response-option')
					.nth(1)
					.locator('.tabs-panel.is-active')
					.locator('input[type="text"]')
					.first()
					.fill('Option B');

				// Increment questions counter
				questionsCount++;
				console.log(
					`User corrected validation errors by filling required fields (Total questions: ${questionsCount})`
				);
			});

			await test.step('17.4. User: Attempts to save the poll again', async () => {
				// Save questions after corrections
				await surveysManagePage.clickSaveQuestions();
				console.log('User attempted to save the poll again after corrections');
			});

			await test.step('17.5. System: Revalidates the corrected fields', async () => {
				// Verify successful validation and save
				await surveysManagePage.verifySurveyQuestionsSaved();

				// Publish the survey poll to complete the flow
				await surveysManagePage.publishSurvey();

				// Verify that the survey was actually created with the correct number of questions (after validation)
				await surveysManagePage.verifyPublishedQuestionsCount(questionsCount, 'survey creation');

				console.log('System revalidated corrected fields successfully and poll was saved and published');
				expect(adminPage.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});
});

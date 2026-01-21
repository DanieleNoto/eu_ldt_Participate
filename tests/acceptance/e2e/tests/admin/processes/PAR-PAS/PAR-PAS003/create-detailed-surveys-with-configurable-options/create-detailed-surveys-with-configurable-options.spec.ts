/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
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

/**
 * Enables creation of comprehensive surveys with various question types and validations
 * User Story: As a city administrator, I want to create detailed surveys so that I can gather in-depth feedback on diverse topics.
 * Requirements: PAR R16
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The City Administrator has permissions to create surveys.
 */

test.describe('[PAR-PAS003] – Create detailed surveys with configurable options', () => {
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
		test('should create a detailed survey with various question types', async ({ adminPage }) => {
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
				await processAdminPage.waitForLoadState('networkidle');

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
				await adminPage.waitForLoadState('networkidle');

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

			await test.step('9. System: Display the "Edit questionnaire" form and ask to user to select a template or Skip.', async () => {
				await surveysManagePage.accessComponentAndCreateNewSurvey(componentsPage, componentName);
				await surveysManagePage.verifyTemplateSelectionDisplayed();
			});

			await test.step('10. User: Clicks "Skip".', async () => {
				await surveysManagePage.skipTemplateSelection();
			});

			await test.step('11. System: Create the new empty questionnaire and displays options for adding survey elements.', async () => {
				await surveysManagePage.verifyEmptyQuestionnaireDisplayed();
			});

			await test.step('12. User: Fulfil name and description input', async () => {
				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_${surveyTimestamp}`;
				await surveysManagePage.fillSurveyDetailsAndSave(surveyName, 'description');
			});

			await test.step('13. User: Clicks "Add Question" to add question to the poll.', async () => {
				await surveysManagePage.accessQuestionsManagement();

				// Add new question
				await adminPage.getByRole('button', { name: 'Add question' }).click();
			});

			await test.step('14. System: Displays the "Add Question" form.', async () => {
				// Verify questions management interface is available
				await expect(adminPage.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				console.log('Questions management interface displayed with add question options');
			});

			await test.step('15. User: Fills in the Question Form: Statement: Adds the main question, Type: select question types, Mandatory: check if must be answered before submitting', async () => {
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

				await surveysManagePage.fillQuestionStatement(
					question1Container,
					'What is your opinion on this topic?'
				);
				await surveysManagePage.fillQuestionDescription(question1Container, 'Please share your thoughts');
				await surveysManagePage.checkMandatory(question1Container);
				await surveysManagePage.fillCharacterLimit(question1Container, '500');
				await surveysManagePage.selectQuestionType(question1Container, 'long_answer');

				// Increment questions counter
				questionsCount++;
				console.log('Added question 1: Long Answer');

				// Question 2: Short Answer
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(2)');
				const question2Container = adminPage.locator('.questionnaire-question:nth-child(2)');

				// Expand question form if collapsed
				const question2AccordionButton = question2Container.locator('.question--collapse').first();
				const isExpanded2 = await question2AccordionButton.getAttribute('aria-expanded');
				if (isExpanded2 === 'false') {
					await question2AccordionButton.click();
					await question2Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question2Container,
					'What is your opinion on this other topic?'
				);
				await surveysManagePage.fillQuestionDescription(question2Container, 'Please share your thoughts');
				await surveysManagePage.checkMandatory(question2Container);
				await surveysManagePage.fillCharacterLimit(question2Container, '250');
				await surveysManagePage.selectQuestionType(question2Container, 'short_answer');

				// Increment questions counter
				questionsCount++;
				console.log('Added question 2: Short Answer');

				// Question 3: Single Option
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(3)');
				const question3Container = adminPage.locator('.questionnaire-question:nth-child(3)');

				// Expand question form if collapsed
				const question3AccordionButton = question3Container.locator('.question--collapse').first();
				const isExpanded3 = await question3AccordionButton.getAttribute('aria-expanded');
				if (isExpanded3 === 'false') {
					await question3AccordionButton.click();
					await question3Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(question3Container, 'What color do you prefer?');
				await surveysManagePage.fillQuestionDescription(
					question3Container,
					'select one of the available options'
				);
				await surveysManagePage.checkMandatory(question3Container);
				await surveysManagePage.selectQuestionType(question3Container, 'single_option');

				// Fill the default two answer options that are automatically created
				await question3Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question3Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Blue');
				await question3Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Green');

				// Increment questions counter
				questionsCount++;
				console.log('Added question 3: Single Option');

				// Question 4: Multiple Option
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(4)');
				const question4Container = adminPage.locator('.questionnaire-question:nth-child(4)');

				// Expand question form if collapsed
				const question4AccordionButton = question4Container.locator('.question--collapse').first();
				const isExpanded4 = await question4AccordionButton.getAttribute('aria-expanded');
				if (isExpanded4 === 'false') {
					await question4AccordionButton.click();
					await question4Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(question4Container, 'Which pets do you prefer?');
				await surveysManagePage.fillQuestionDescription(
					question4Container,
					'select two of the available options'
				);
				await surveysManagePage.checkMandatory(question4Container);
				await surveysManagePage.selectQuestionType(question4Container, 'multiple_option');

				// Fill the default two answer options that are automatically created
				await question4Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Cat');
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Dog');

				// Add the additional two options
				await question4Container.getByRole('button', { name: 'Add answer option' }).click();
				await question4Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Parrot');

				await question4Container.getByRole('button', { name: 'Add answer option' }).click();
				await question4Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Fish');

				// Set maximum choices to 2
				await question4Container.getByLabel('Maximum number of choices').selectOption('2');

				// Increment questions counter
				questionsCount++;
				console.log('Added question 4: Multiple Option');

				// Question 5: Sorting
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(5)');
				const question5Container = adminPage.locator('.questionnaire-question:nth-child(5)');

				// Expand question form if collapsed
				const question5AccordionButton = question5Container.locator('.question--collapse').first();
				const isExpanded5 = await question5AccordionButton.getAttribute('aria-expanded');
				if (isExpanded5 === 'false') {
					await question5AccordionButton.click();
					await question5Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question5Container,
					'What kind of vehicle do you prefer?'
				);
				await surveysManagePage.fillQuestionDescription(question5Container, 'select an option');
				await surveysManagePage.checkMandatory(question5Container);
				await surveysManagePage.selectQuestionType(question5Container, 'sorting');

				// Fill the default two answer options that are automatically created for sorting
				await question5Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question5Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Car');
				await question5Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Motorcycle');

				// Increment questions counter
				questionsCount++;
				console.log('Added question 5: Sorting');

				// Question 6: Files
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(6)');
				const question6Container = adminPage.locator('.questionnaire-question:nth-child(6)');

				// Expand question form if collapsed
				const question6AccordionButton = question6Container.locator('.question--collapse').first();
				const isExpanded6 = await question6AccordionButton.getAttribute('aria-expanded');
				if (isExpanded6 === 'false') {
					await question6AccordionButton.click();
					await question6Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(question6Container, 'You have a file to share with us?');
				await surveysManagePage.fillQuestionDescription(
					question6Container,
					'Share with us a file, notes, document, photos, that might be relevant for the next assemblies!'
				);
				await surveysManagePage.checkMandatory(question6Container);
				await surveysManagePage.selectQuestionType(question6Container, 'files');

				// Increment questions counter
				questionsCount++;
				console.log('Added question 6: Files');

				// Question 7: Matrix (single option)
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(7)');
				const question7Container = adminPage.locator('.questionnaire-question:nth-child(7)');

				// Expand question form if collapsed
				const question7AccordionButton = question7Container.locator('.question--collapse').first();
				const isExpanded7 = await question7AccordionButton.getAttribute('aria-expanded');
				if (isExpanded7 === 'false') {
					await question7AccordionButton.click();
					await question7Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question7Container,
					'How would you rate your overall experience with the local assemblies?'
				);
				await surveysManagePage.fillQuestionDescription(
					question7Container,
					'Rate your experience regarding different aspects!'
				);
				await surveysManagePage.checkMandatory(question7Container);
				await surveysManagePage.selectQuestionType(question7Container, 'matrix_single');

				// Fill the default two matrix rows that are automatically created
				const allMatrixRows7 = question7Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await allMatrixRows7.first().waitFor();
				await allMatrixRows7.nth(0).fill('Very Positive');
				await allMatrixRows7.nth(1).fill('Positive');

				// Add only 3 additional rows (total 5 rows)
				await question7Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows7.nth(2).fill('Neutral');

				await question7Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows7.nth(3).fill('Negative');

				await question7Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows7.nth(4).fill('Very Negative');

				// Fill the default two answer options that are automatically created
				await question7Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Clarity on how decisions are made');
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Time for everyone to speak');

				// Add only 3 additional answer options (total 5 columns)
				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Clarity on complex issues');

				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Meetings frequency');

				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Follow-up or implementation of decisions');

				// Increment questions counter
				questionsCount++;
				console.log('Added question 7: Matrix (single option)');

				// Question 8: Matrix (Multiple option)
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(8)');
				const question8Container = adminPage.locator('.questionnaire-question:nth-child(8)');

				// Expand question form if collapsed
				const question8AccordionButton = question8Container.locator('.question--collapse').first();
				const isExpanded8 = await question8AccordionButton.getAttribute('aria-expanded');
				if (isExpanded8 === 'false') {
					await question8AccordionButton.click();
					await question8Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question8Container,
					'Which of the following aspects did you find valuable during the community event?'
				);
				await surveysManagePage.fillQuestionDescription(
					question8Container,
					'Select all that apply for each area'
				);
				await surveysManagePage.checkMandatory(question8Container);
				await surveysManagePage.selectQuestionType(question8Container, 'matrix_multiple');

				// Fill the default two matrix rows that are automatically created
				const allMatrixRows8 = question8Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await allMatrixRows8.first().waitFor();
				await allMatrixRows8.nth(0).fill('Networking opportunities');
				await allMatrixRows8.nth(1).fill('Information provided');

				// Add only 2 additional rows (total 4 rows)
				await question8Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows8.nth(2).fill('Event organization');

				await question8Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows8.nth(3).fill('Location and facilities');

				// Fill the default two answer options that are automatically created
				await question8Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Useful contacts');
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Practical knowledge gained');

				// Add only 2 additional answer options (total 4 columns)
				await question8Container.getByRole('button', { name: 'Add answer option' }).click();
				await question8Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Enjoyable atmosphere');

				await question8Container.getByRole('button', { name: 'Add answer option' }).click();
				await question8Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Well-structured sessions');

				// Increment questions counter
				questionsCount++;
				console.log('Added question 8: Matrix (Multiple option)');

				console.log(`Successfully created detailed survey with ${questionsCount} different question types`);
			});

			await test.step('16. User: Clicks on "Save" to create Detailed Survey with Multiple Question Types', async () => {
				await surveysManagePage.clickSaveQuestions();
			});

			await test.step('17. System: Validates the form for completeness and correctness.', async () => {
				await surveysManagePage.verifySurveyQuestionsSaved();
			});

			await test.step('18. System: Saves the template.', async () => {
				// Final step: Publish the survey poll
				await surveysManagePage.publishSurvey();

				// Verify that the survey was actually created with the correct number of questions (dynamic count)
				await surveysManagePage.verifyPublishedQuestionsCount(questionsCount, 'survey creation');

				// Verify we're back on the surveys management page
				expect(adminPage.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});

	test.describe('Alternative Flow: Select template', () => {
		// Declare template questions counter
		let templateQuestionsCount = 0;

		test.beforeEach(async ({ adminPage }) => {
			await test.step('Setup: Navigate to Templates section', async () => {
				await templatesPage.navigateToPage();
				await adminPage.waitForLoadState('networkidle');
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

			await test.step('Setup: Add questions to template', async () => {
				await editTemplatePage.manageQuestions();
				await adminPage.waitForURL(/\/admin\/templates\/questionnaire_templates\/\d+\/edit_questions/);

				// Verify questions management interface is available
				await expect(adminPage.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				// Question 1: Long Answer
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(1)');
				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');

				// Expand question form if collapsed
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question1Container,
					'What is your opinion on this topic?'
				);
				await surveysManagePage.fillQuestionDescription(question1Container, 'Please share your thoughts');
				await surveysManagePage.checkMandatory(question1Container);
				await surveysManagePage.fillCharacterLimit(question1Container, '500');
				await surveysManagePage.selectQuestionType(question1Container, 'long_answer');

				// Increment template questions counter
				templateQuestionsCount++;
				console.log('Added question 1: Long Answer');

				// Question 2: Short Answer
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(2)');
				const question2Container = adminPage.locator('.questionnaire-question:nth-child(2)');

				// Expand question form if collapsed
				const question2AccordionButton = question2Container.locator('.question--collapse').first();
				const isExpanded2 = await question2AccordionButton.getAttribute('aria-expanded');
				if (isExpanded2 === 'false') {
					await question2AccordionButton.click();
					await question2Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question2Container,
					'What is your opinion on this other topic?'
				);
				await surveysManagePage.fillQuestionDescription(question2Container, 'Please share your thoughts');
				await surveysManagePage.checkMandatory(question2Container);
				await surveysManagePage.fillCharacterLimit(question2Container, '250');
				await surveysManagePage.selectQuestionType(question2Container, 'short_answer');

				// Increment template questions counter
				templateQuestionsCount++;
				console.log('Added question 2: Short Answer');

				// Question 3: Single Option
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(3)');
				const question3Container = adminPage.locator('.questionnaire-question:nth-child(3)');

				// Expand question form if collapsed
				const question3AccordionButton = question3Container.locator('.question--collapse').first();
				const isExpanded3 = await question3AccordionButton.getAttribute('aria-expanded');
				if (isExpanded3 === 'false') {
					await question3AccordionButton.click();
					await question3Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(question3Container, 'What color do you prefer?');
				await surveysManagePage.fillQuestionDescription(
					question3Container,
					'select one of the available options'
				);
				await surveysManagePage.checkMandatory(question3Container);
				await surveysManagePage.selectQuestionType(question3Container, 'single_option');

				// Fill the default two answer options that are automatically created
				await question3Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question3Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Blue');
				await question3Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Green');

				// Increment template questions counter
				templateQuestionsCount++;
				console.log('Added question 3: Single Option');

				// Question 4: Multiple Option
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(4)');
				const question4Container = adminPage.locator('.questionnaire-question:nth-child(4)');

				// Expand question form if collapsed
				const question4AccordionButton = question4Container.locator('.question--collapse').first();
				const isExpanded4 = await question4AccordionButton.getAttribute('aria-expanded');
				if (isExpanded4 === 'false') {
					await question4AccordionButton.click();
					await question4Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(question4Container, 'Which pets do you prefer?');
				await surveysManagePage.fillQuestionDescription(
					question4Container,
					'select two of the available options'
				);
				await surveysManagePage.checkMandatory(question4Container);
				await surveysManagePage.selectQuestionType(question4Container, 'multiple_option');

				// Fill the default two answer options that are automatically created
				await question4Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Cat');
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Dog');

				// Add the additional two options
				await question4Container.getByRole('button', { name: 'Add answer option' }).click();
				await question4Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Parrot');

				await question4Container.getByRole('button', { name: 'Add answer option' }).click();
				await question4Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Fish');

				// Set maximum choices to 2
				await question4Container.getByLabel('Maximum number of choices').selectOption('2');

				// Increment template questions counter
				templateQuestionsCount++;
				console.log('Added question 4: Multiple Option');

				// Question 5: Sorting
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(5)');
				const question5Container = adminPage.locator('.questionnaire-question:nth-child(5)');

				// Expand question form if collapsed
				const question5AccordionButton = question5Container.locator('.question--collapse').first();
				const isExpanded5 = await question5AccordionButton.getAttribute('aria-expanded');
				if (isExpanded5 === 'false') {
					await question5AccordionButton.click();
					await question5Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question5Container,
					'What kind of vehicle do you prefer?'
				);
				await surveysManagePage.fillQuestionDescription(question5Container, 'select an option');
				await surveysManagePage.checkMandatory(question5Container);
				await surveysManagePage.selectQuestionType(question5Container, 'sorting');

				// Fill the default two answer options that are automatically created for sorting
				await question5Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question5Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Car');
				await question5Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Motorcycle');

				// Increment template questions counter
				templateQuestionsCount++;
				console.log('Added question 5: Sorting');

				// Question 6: Files
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(6)');
				const question6Container = adminPage.locator('.questionnaire-question:nth-child(6)');

				// Expand question form if collapsed
				const question6AccordionButton = question6Container.locator('.question--collapse').first();
				const isExpanded6 = await question6AccordionButton.getAttribute('aria-expanded');
				if (isExpanded6 === 'false') {
					await question6AccordionButton.click();
					await question6Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(question6Container, 'You have a file to share with us?');
				await surveysManagePage.fillQuestionDescription(
					question6Container,
					'Share with us a file, notes, document, photos, that might be relevant for the next assemblies!'
				);
				await surveysManagePage.checkMandatory(question6Container);
				await surveysManagePage.selectQuestionType(question6Container, 'files');

				// Increment template questions counter
				templateQuestionsCount++;
				console.log('Added question 6: Files');

				// Question 7: Matrix (single option)
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(7)');
				const question7Container = adminPage.locator('.questionnaire-question:nth-child(7)');

				// Expand question form if collapsed
				const question7AccordionButton = question7Container.locator('.question--collapse').first();
				const isExpanded7 = await question7AccordionButton.getAttribute('aria-expanded');
				if (isExpanded7 === 'false') {
					await question7AccordionButton.click();
					await question7Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question7Container,
					'How would you rate your overall experience with the local assemblies?'
				);
				await surveysManagePage.fillQuestionDescription(
					question7Container,
					'Rate your experience regarding different aspects!'
				);
				await surveysManagePage.checkMandatory(question7Container);
				await surveysManagePage.selectQuestionType(question7Container, 'matrix_single');

				// Fill the default two matrix rows that are automatically created
				const allMatrixRows7 = question7Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await allMatrixRows7.first().waitFor();
				await allMatrixRows7.nth(0).fill('Very Positive');
				await allMatrixRows7.nth(1).fill('Positive');

				// Add only 3 additional rows (total 5 rows)
				await question7Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows7.nth(2).fill('Neutral');

				await question7Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows7.nth(3).fill('Negative');

				await question7Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows7.nth(4).fill('Very Negative');

				// Fill the default two answer options that are automatically created
				await question7Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Clarity on how decisions are made');
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Time for everyone to speak');

				// Add only 3 additional answer options (total 5 columns)
				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Clarity on complex issues');

				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Meetings frequency');

				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Follow-up or implementation of decisions');

				// Increment template questions counter
				templateQuestionsCount++;
				console.log('Added question 7: Matrix (single option)');

				// Question 8: Matrix (Multiple option)
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(8)');
				const question8Container = adminPage.locator('.questionnaire-question:nth-child(8)');

				// Expand question form if collapsed
				const question8AccordionButton = question8Container.locator('.question--collapse').first();
				const isExpanded8 = await question8AccordionButton.getAttribute('aria-expanded');
				if (isExpanded8 === 'false') {
					await question8AccordionButton.click();
					await question8Container.locator('.editor-input').first().waitFor();
				}

				await surveysManagePage.fillQuestionStatement(
					question8Container,
					'Which of the following aspects did you find valuable during the community event?'
				);
				await surveysManagePage.fillQuestionDescription(
					question8Container,
					'Select all that apply for each area'
				);
				await surveysManagePage.checkMandatory(question8Container);
				await surveysManagePage.selectQuestionType(question8Container, 'matrix_multiple');

				// Fill the default two matrix rows that are automatically created
				const allMatrixRows8 = question8Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await allMatrixRows8.first().waitFor();
				await allMatrixRows8.nth(0).fill('Networking opportunities');
				await allMatrixRows8.nth(1).fill('Information provided');

				// Add only 2 additional rows (total 4 rows)
				await question8Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows8.nth(2).fill('Event organization');

				await question8Container.getByRole('button', { name: 'Add row' }).click();
				await allMatrixRows8.nth(3).fill('Location and facilities');

				// Fill the default two answer options that are automatically created
				await question8Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Useful contacts');
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Practical knowledge gained');

				// Add only 2 additional answer options (total 4 columns)
				await question8Container.getByRole('button', { name: 'Add answer option' }).click();
				await question8Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Enjoyable atmosphere');

				await question8Container.getByRole('button', { name: 'Add answer option' }).click();
				await question8Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.last()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Well-structured sessions');

				// Increment template questions counter
				templateQuestionsCount++;
				console.log('Added question 8: Matrix (Multiple option)');

				console.log(
					`Successfully created detailed survey with ${templateQuestionsCount} different question types`
				);
			});

			await test.step('Setup: Save template and return to process', async () => {
				// Save template questions
				await adminPage.getByRole('button', { name: 'Save' }).click();
				await adminPage.waitForLoadState('networkidle');

				console.log('Template questions saved successfully');

				// Navigate back to the process edit page using the stored URL
				console.log('Navigating back to process edit page:', processEditUrl);
				await adminPage.goto(processEditUrl);
				await adminPage.waitForLoadState('networkidle');
				console.log('Template setup completed - ready for template selection test');
			});
		});

		test('should create a detailed survey with multiple question types based on a selected template', async ({
			adminPage
		}) => {
			// Get the current URL to extract process slug
			const currentUrl = adminPage.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_Template_${timestamp}`;

			// Track the number of questions expected from template (8 questions were added in beforeEach)
			const expectedQuestionsFromTemplate = 8;

			await test.step('1-9. User: Navigates through process setup and creates Survey component with template selection', async () => {
				// Navigate to processes section using admin nav
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				// Verify we're on processes page and select our created process
				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);

				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);

				await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await adminPage.waitForLoadState('networkidle');

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

			await test.step('10.1. User: Select a specific template', async () => {
				// Use the template created in beforeEach
				await adminPage.getByRole('combobox', { name: 'Choose template' }).click();
				await adminPage.getByRole('combobox', { name: 'Choose template' }).fill(templateName);
				await adminPage.getByRole('button', { name: 'Create from template' }).click();

				// Wait for redirect after template application
				await adminPage.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);
				await adminPage.waitForLoadState('networkidle');
				await expect(adminPage.getByText('Template applied successfully.')).toBeVisible();
				console.log(`Template "${templateName}" applied successfully`);
			});

			await test.step('10.2. System: Create the new questionnaire based on selected template and displays options for adding survey elements', async () => {
				await surveysManagePage.verifyEmptyQuestionnaireDisplayed();

				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_template_${surveyTimestamp}`;
				await surveysManagePage.fillSurveyDetailsAndSave(surveyName, 'Survey created from template');

				await surveysManagePage.accessQuestionsManagement();

				// Verify the imported questions from template are present
				await expect(adminPage.locator('.questionnaire-question:nth-child(1)')).toBeVisible();
				await expect(adminPage.locator('.questionnaire-question:nth-child(2)')).toBeVisible();
				await expect(adminPage.locator('.questionnaire-question:nth-child(3)')).toBeVisible();
				await expect(adminPage.locator('.questionnaire-question:nth-child(4)')).toBeVisible();
				await expect(adminPage.locator('.questionnaire-question:nth-child(5)')).toBeVisible();
				await expect(adminPage.locator('.questionnaire-question:nth-child(6)')).toBeVisible();
				await expect(adminPage.locator('.questionnaire-question:nth-child(7)')).toBeVisible();
				await expect(adminPage.locator('.questionnaire-question:nth-child(8)')).toBeVisible();

				// Verify Question 1: Long Answer
				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').first().waitFor();
				}

				await expect(question1Container.locator('.tabs-panel.is-active input[type="text"]')).toHaveValue(
					'What is your opinion on this topic?'
				);
				const descriptionText1 = await question1Container
					.locator('.tabs-panel.is-active .editor-input .tiptap')
					.innerText();
				expect(descriptionText1.trim()).toBe('Please share your thoughts');
				await expect(question1Container.getByLabel('TypeShort answer Long answer')).toHaveValue('long_answer');
				await expect(question1Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();
				await expect(
					question1Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' })
				).toHaveValue('500');

				// Verify Question 2: Short Answer
				const question2Container = adminPage.locator('.questionnaire-question:nth-child(2)');
				const question2AccordionButton = question2Container.locator('.question--collapse').first();
				const isExpanded2 = await question2AccordionButton.getAttribute('aria-expanded');
				if (isExpanded2 === 'false') {
					await question2AccordionButton.click();
					await question2Container.locator('.editor-input').first().waitFor();
				}

				await expect(question2Container.locator('.tabs-panel.is-active input[type="text"]')).toHaveValue(
					'What is your opinion on this other topic?'
				);
				const descriptionText2 = await question2Container
					.locator('.tabs-panel.is-active .editor-input .tiptap')
					.innerText();
				expect(descriptionText2.trim()).toBe('Please share your thoughts');
				await expect(question2Container.getByLabel('TypeShort answer Long answer')).toHaveValue('short_answer');
				await expect(question2Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();
				await expect(
					question2Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' })
				).toHaveValue('250');

				// Verify Question 3: Single Option
				const question3Container = adminPage.locator('.questionnaire-question:nth-child(3)');
				const question3AccordionButton = question3Container.locator('.question--collapse').first();
				const isExpanded3 = await question3AccordionButton.getAttribute('aria-expanded');
				if (isExpanded3 === 'false') {
					await question3AccordionButton.click();
					await question3Container.locator('.editor-input').first().waitFor();
				}

				await expect(
					question3Container.locator('.tabs-panel.is-active input[type="text"]').first()
				).toHaveValue('What color do you prefer?');
				const descriptionText3 = await question3Container
					.locator('.tabs-panel.is-active .editor-input .tiptap')
					.innerText();
				expect(descriptionText3.trim()).toBe('select one of the available options');
				await expect(question3Container.getByLabel('TypeShort answer Long answer')).toHaveValue(
					'single_option'
				);
				await expect(question3Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();
				// Verify answer options
				await expect(
					question3Container
						.locator('.questionnaire-question-answer-option')
						.first()
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Blue');
				await expect(
					question3Container
						.locator('.questionnaire-question-answer-option')
						.nth(1)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Green');

				// Verify Question 4: Multiple Option
				const question4Container = adminPage.locator('.questionnaire-question:nth-child(4)');
				const question4AccordionButton = question4Container.locator('.question--collapse').first();
				const isExpanded4 = await question4AccordionButton.getAttribute('aria-expanded');
				if (isExpanded4 === 'false') {
					await question4AccordionButton.click();
					await question4Container.locator('.editor-input').first().waitFor();
				}

				await expect(
					question4Container.locator('.tabs-panel.is-active input[type="text"]').first()
				).toHaveValue('Which pets do you prefer?');
				const descriptionText4 = await question4Container
					.locator('.tabs-panel.is-active .editor-input .tiptap')
					.innerText();
				expect(descriptionText4.trim()).toBe('select two of the available options');
				await expect(question4Container.getByLabel('TypeShort answer Long answer')).toHaveValue(
					'multiple_option'
				);
				await expect(question4Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();
				await expect(question4Container.getByLabel('Maximum number of choices')).toHaveValue('2');
				// Verify answer options
				await expect(
					question4Container
						.locator('.questionnaire-question-answer-option')
						.nth(0)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Cat');
				await expect(
					question4Container
						.locator('.questionnaire-question-answer-option')
						.nth(1)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Dog');
				await expect(
					question4Container
						.locator('.questionnaire-question-answer-option')
						.nth(2)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Parrot');
				await expect(
					question4Container
						.locator('.questionnaire-question-answer-option')
						.nth(3)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Fish');

				// Verify Question 5: Sorting
				const question5Container = adminPage.locator('.questionnaire-question:nth-child(5)');
				const question5AccordionButton = question5Container.locator('.question--collapse').first();
				const isExpanded5 = await question5AccordionButton.getAttribute('aria-expanded');
				if (isExpanded5 === 'false') {
					await question5AccordionButton.click();
					await question5Container.locator('.editor-input').first().waitFor();
				}

				await expect(
					question5Container.locator('.tabs-panel.is-active input[type="text"]').first()
				).toHaveValue('What kind of vehicle do you prefer?');
				const descriptionText5 = await question5Container
					.locator('.tabs-panel.is-active .editor-input .tiptap')
					.innerText();
				expect(descriptionText5.trim()).toBe('select an option');
				await expect(question5Container.getByLabel('TypeShort answer Long answer')).toHaveValue('sorting');
				await expect(question5Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();
				// Verify answer options
				await expect(
					question5Container
						.locator('.questionnaire-question-answer-option')
						.first()
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Car');
				await expect(
					question5Container
						.locator('.questionnaire-question-answer-option')
						.nth(1)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Motorcycle');

				// Verify Question 6: Files
				const question6Container = adminPage.locator('.questionnaire-question:nth-child(6)');
				const question6AccordionButton = question6Container.locator('.question--collapse').first();
				const isExpanded6 = await question6AccordionButton.getAttribute('aria-expanded');
				if (isExpanded6 === 'false') {
					await question6AccordionButton.click();
					await question6Container.locator('.editor-input').first().waitFor();
				}

				await expect(question6Container.locator('.tabs-panel.is-active input[type="text"]')).toHaveValue(
					'You have a file to share with us?'
				);
				const descriptionText6 = await question6Container
					.locator('.tabs-panel.is-active .editor-input .tiptap')
					.innerText();
				expect(descriptionText6.trim()).toBe(
					'Share with us a file, notes, document, photos, that might be relevant for the next assemblies!'
				);
				await expect(question6Container.getByLabel('TypeShort answer Long answer')).toHaveValue('files');
				await expect(question6Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();

				// Verify Question 7: Matrix (single option)
				const question7Container = adminPage.locator('.questionnaire-question:nth-child(7)');
				const question7AccordionButton = question7Container.locator('.question--collapse').first();
				const isExpanded7 = await question7AccordionButton.getAttribute('aria-expanded');
				if (isExpanded7 === 'false') {
					await question7AccordionButton.click();
					await question7Container.locator('.editor-input').first().waitFor();
				}

				await expect(
					question7Container.locator('.tabs-panel.is-active input[type="text"]').first()
				).toHaveValue('How would you rate your overall experience with the local assemblies?');
				const descriptionText7 = await question7Container
					.locator('.tabs-panel.is-active .editor-input .tiptap')
					.innerText();
				expect(descriptionText7.trim()).toBe('Rate your experience regarding different aspects!');
				await expect(question7Container.getByLabel('TypeShort answer Long answer')).toHaveValue(
					'matrix_single'
				);
				await expect(question7Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();
				// Verify matrix rows
				const allMatrixRows7 = question7Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await expect(allMatrixRows7.nth(0)).toHaveValue('Very Positive');
				await expect(allMatrixRows7.nth(1)).toHaveValue('Positive');
				await expect(allMatrixRows7.nth(2)).toHaveValue('Neutral');
				await expect(allMatrixRows7.nth(3)).toHaveValue('Negative');
				await expect(allMatrixRows7.nth(4)).toHaveValue('Very Negative');
				// Verify answer options
				await expect(
					question7Container
						.locator('.questionnaire-question-answer-option')
						.nth(0)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Clarity on how decisions are made');
				await expect(
					question7Container
						.locator('.questionnaire-question-answer-option')
						.nth(1)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Time for everyone to speak');
				await expect(
					question7Container
						.locator('.questionnaire-question-answer-option')
						.nth(2)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Clarity on complex issues');
				await expect(
					question7Container
						.locator('.questionnaire-question-answer-option')
						.nth(3)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Meetings frequency');
				await expect(
					question7Container
						.locator('.questionnaire-question-answer-option')
						.nth(4)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Follow-up or implementation of decisions');

				// Verify Question 8: Matrix (Multiple option)
				const question8Container = adminPage.locator('.questionnaire-question:nth-child(8)');
				const question8AccordionButton = question8Container.locator('.question--collapse').first();
				const isExpanded8 = await question8AccordionButton.getAttribute('aria-expanded');
				if (isExpanded8 === 'false') {
					await question8AccordionButton.click();
					await question8Container.locator('.editor-input').first().waitFor();
				}

				await expect(
					question8Container.locator('.tabs-panel.is-active input[type="text"]').first()
				).toHaveValue('Which of the following aspects did you find valuable during the community event?');
				const descriptionText8 = await question8Container
					.locator('.tabs-panel.is-active .editor-input .tiptap')
					.innerText();
				expect(descriptionText8.trim()).toBe('Select all that apply for each area');
				await expect(question8Container.getByLabel('TypeShort answer Long answer')).toHaveValue(
					'matrix_multiple'
				);
				await expect(question8Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();
				// Verify matrix rows
				const allMatrixRows8 = question8Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await expect(allMatrixRows8.nth(0)).toHaveValue('Networking opportunities');
				await expect(allMatrixRows8.nth(1)).toHaveValue('Information provided');
				await expect(allMatrixRows8.nth(2)).toHaveValue('Event organization');
				await expect(allMatrixRows8.nth(3)).toHaveValue('Location and facilities');
				// Verify answer options
				await expect(
					question8Container
						.locator('.questionnaire-question-answer-option')
						.nth(0)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Useful contacts');
				await expect(
					question8Container
						.locator('.questionnaire-question-answer-option')
						.nth(1)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Practical knowledge gained');
				await expect(
					question8Container
						.locator('.questionnaire-question-answer-option')
						.nth(2)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Enjoyable atmosphere');
				await expect(
					question8Container
						.locator('.questionnaire-question-answer-option')
						.nth(3)
						.locator('.tabs-panel.is-active input[type="text"]')
				).toHaveValue('Well-structured sessions');

				console.log('Verified template question imported correctly');

				await surveysManagePage.clickSaveQuestions();
				await surveysManagePage.verifySurveyQuestionsSaved();

				// Verify template questions are pre-populated and publish (Steps 17-18 equivalent)
				await expect(adminPage.getByRole('link', { name: 'Publish' })).toBeVisible();

				// Final step: Publish the survey poll
				await surveysManagePage.publishSurvey();

				// Verify that the survey was actually created with the correct number of questions (from template)
				await surveysManagePage.verifyPublishedQuestionsCount(
					templateQuestionsCount,
					'template survey creation'
				);

				console.log('Detailed survey with template configured, saved and published successfully');

				// Final verification that we're on the management page confirming successful creation
				expect(adminPage.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});

	test.describe('Alternative Flow: Fields Validation Fail', () => {
		// Track the number of questions added during the test
		let questionsCount = 0;

		test('should detect and handle validation errors during poll creation', async ({ adminPage }) => {
			// Get the current URL to extract process slug
			const currentUrl = adminPage.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Reset questions counter
			questionsCount = 0;

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_${timestamp}`;

			await test.step('1-16. User: Navigates through complete poll creation process up to question creation', async () => {
				// Navigate to processes section and select our created process
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);

				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);

				await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await adminPage.waitForLoadState('networkidle');

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
				await surveysManagePage.skipTemplateSelection();
				await surveysManagePage.verifyEmptyQuestionnaireDisplayed();

				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_${surveyTimestamp}`;
				await surveysManagePage.fillSurveyDetailsAndSave(surveyName, 'description');

				await surveysManagePage.accessQuestionsManagement();

				// Verify questions management interface is available
				await expect(adminPage.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(adminPage.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				// Question 1: Long Answer
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(1)');
				const question1Container = adminPage.locator('.questionnaire-question:nth-child(1)');

				// Expand question form if collapsed
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').first().waitFor();
				}

				await question1Container
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('What is your opinion on this topic?');
				await question1Container.locator('.editor-input .tiptap').first().fill('Please share your thoughts');
				await question1Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question1Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill('500');
				await question1Container.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

				questionsCount++;
				console.log('Added question 1: Long Answer');

				// Question 2: Short Answer (without mandatory check)
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(2)');
				const question2Container = adminPage.locator('.questionnaire-question:nth-child(2)');

				// Expand question form if collapsed
				const question2AccordionButton = question2Container.locator('.question--collapse').first();
				const isExpanded2 = await question2AccordionButton.getAttribute('aria-expanded');
				if (isExpanded2 === 'false') {
					await question2AccordionButton.click();
					await question2Container.locator('.editor-input').first().waitFor();
				}

				await question2Container
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('What is your opinion on this other topic?');
				await question2Container.locator('.editor-input .tiptap').first().fill('Please share your thoughts');
				await question2Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill('250');
				await question2Container.getByLabel('TypeShort answer Long answer').selectOption('short_answer');

				questionsCount++;
				console.log('Added question 2: Short Answer');

				// Question 3: Single Option (answers left empty intentionally)
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(3)');
				const question3Container = adminPage.locator('.questionnaire-question:nth-child(3)');

				// Expand question form if collapsed
				const question3AccordionButton = question3Container.locator('.question--collapse').first();
				const isExpanded3 = await question3AccordionButton.getAttribute('aria-expanded');
				if (isExpanded3 === 'false') {
					await question3AccordionButton.click();
					await question3Container.locator('.editor-input').first().waitFor();
				}

				await question3Container
					.locator('.tabs-panel.is-active input[type="text"]')
					.first()
					.fill('What color do you prefer?');
				await question3Container
					.locator('.editor-input .tiptap')
					.first()
					.fill('select one of the available options');
				await question3Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question3Container.getByLabel('TypeShort answer Long answer').selectOption('single_option');

				// Leave the default two answer options empty for validation testing
				await question3Container.locator('.questionnaire-question-answer-option').first().waitFor();

				questionsCount++;
				console.log('Added question 3: Single Option');

				// Question 4: Multiple Option (answers left empty intentionally)
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(4)');
				const question4Container = adminPage.locator('.questionnaire-question:nth-child(4)');

				// Expand question form if collapsed
				const question4AccordionButton = question4Container.locator('.question--collapse').first();
				const isExpanded4 = await question4AccordionButton.getAttribute('aria-expanded');
				if (isExpanded4 === 'false') {
					await question4AccordionButton.click();
					await question4Container.locator('.editor-input').first().waitFor();
				}

				await question4Container
					.locator('.tabs-panel.is-active input[type="text"]')
					.first()
					.fill('Which pets do you prefer?');
				await question4Container
					.locator('.editor-input .tiptap')
					.first()
					.fill('select two of the available options');
				await question4Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question4Container.getByLabel('TypeShort answer Long answer').selectOption('multiple_option');

				// Add additional answer options to have 4 total (leave all empty for validation testing)
				await question4Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question4Container.getByRole('button', { name: 'Add answer option' }).click();
				await question4Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question4Container.getByRole('button', { name: 'Add answer option' }).click();
				await question4Container.locator('.questionnaire-question-answer-option').last().waitFor();

				// Set maximum choices to 2
				await question4Container.getByLabel('Maximum number of choices').selectOption('2');

				questionsCount++;
				console.log('Added question 4: Multiple Option');

				// Question 5: Sorting (answers left empty intentionally)
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(5)');
				const question5Container = adminPage.locator('.questionnaire-question:nth-child(5)');

				// Expand question form if collapsed
				const question5AccordionButton = question5Container.locator('.question--collapse').first();
				const isExpanded5 = await question5AccordionButton.getAttribute('aria-expanded');
				if (isExpanded5 === 'false') {
					await question5AccordionButton.click();
					await question5Container.locator('.editor-input').first().waitFor();
				}

				await question5Container
					.locator('.tabs-panel.is-active input[type="text"]')
					.first()
					.fill('What kind of vehicle do you prefer?');
				await question5Container.locator('.editor-input .tiptap').first().fill('select an option');
				await question5Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question5Container.getByLabel('TypeShort answer Long answer').selectOption('sorting');

				// Leave the default two answer options empty for validation testing
				await question5Container.locator('.questionnaire-question-answer-option').first().waitFor();

				questionsCount++;
				console.log('Added question 5: Sorting');

				// Question 6: Files
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(6)');
				const question6Container = adminPage.locator('.questionnaire-question:nth-child(6)');

				// Expand question form if collapsed
				const question6AccordionButton = question6Container.locator('.question--collapse').first();
				const isExpanded6 = await question6AccordionButton.getAttribute('aria-expanded');
				if (isExpanded6 === 'false') {
					await question6AccordionButton.click();
					await question6Container.locator('.editor-input').first().waitFor();
				}

				await question6Container
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('You have a file to share with us?');
				await question6Container
					.locator('.editor-input .tiptap')
					.first()
					.fill(
						'Share with us a file, notes, document, photos, that might be relevant for the next assemblies!'
					);
				await question6Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question6Container.getByLabel('TypeShort answer Long answer').selectOption('files');

				questionsCount++;
				console.log('Added question 6: Files');

				// Question 7: Matrix (single option) - rows and answers left empty intentionally
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(7)');
				const question7Container = adminPage.locator('.questionnaire-question:nth-child(7)');

				// Expand question form if collapsed
				const question7AccordionButton = question7Container.locator('.question--collapse').first();
				const isExpanded7 = await question7AccordionButton.getAttribute('aria-expanded');
				if (isExpanded7 === 'false') {
					await question7AccordionButton.click();
					await question7Container.locator('.editor-input').first().waitFor();
				}

				await question7Container
					.locator('.tabs-panel.is-active input[type="text"]')
					.first()
					.fill('How would you rate your overall experience with the local assemblies?');
				await question7Container
					.locator('.editor-input .tiptap')
					.first()
					.fill('Rate your experience regarding different aspects!');
				await question7Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question7Container.getByLabel('TypeShort answer Long answer').selectOption('matrix_single');

				// Add matrix rows (leave empty for validation testing) - total 5 rows
				const allMatrixRows7 = question7Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await allMatrixRows7.first().waitFor();

				// Add 3 additional rows to have 5 total (all left empty)
				await question7Container.getByRole('button', { name: 'Add row' }).click();
				await question7Container.getByRole('button', { name: 'Add row' }).click();
				await question7Container.getByRole('button', { name: 'Add row' }).click();

				// Add answer options to have 5 total (leave empty for validation testing)
				await question7Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question7Container.getByRole('button', { name: 'Add answer option' }).click();
				await question7Container.locator('.questionnaire-question-answer-option').last().waitFor();

				questionsCount++;
				console.log('Added question 7: Matrix (single option)');

				// Question 8: Matrix (Multiple option) - rows and answers left empty intentionally
				await adminPage.getByRole('button', { name: 'Add question' }).click();
				await adminPage.waitForSelector('.questionnaire-question:nth-child(8)');
				const question8Container = adminPage.locator('.questionnaire-question:nth-child(8)');

				// Expand question form if collapsed
				const question8AccordionButton = question8Container.locator('.question--collapse').first();
				const isExpanded8 = await question8AccordionButton.getAttribute('aria-expanded');
				if (isExpanded8 === 'false') {
					await question8AccordionButton.click();
					await question8Container.locator('.editor-input').first().waitFor();
				}

				await question8Container
					.locator('.tabs-panel.is-active input[type="text"]')
					.first()
					.fill('Which of the following aspects did you find valuable during the community event?');
				await question8Container
					.locator('.editor-input .tiptap')
					.first()
					.fill('Select all that apply for each area');
				await question8Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question8Container.getByLabel('TypeShort answer Long answer').selectOption('matrix_multiple');

				// Add matrix rows (leave empty for validation testing) - total 4 rows
				const allMatrixRows8 = question8Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await allMatrixRows8.first().waitFor();

				// Add 2 additional rows to have 4 total (all left empty)
				await question8Container.getByRole('button', { name: 'Add row' }).click();
				await question8Container.getByRole('button', { name: 'Add row' }).click();

				// Add answer options to have 4 total (leave empty for validation testing)
				await question8Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question8Container.getByRole('button', { name: 'Add answer option' }).click();
				await question8Container.locator('.questionnaire-question-answer-option').last().waitFor();
				await question8Container.getByRole('button', { name: 'Add answer option' }).click();
				await question8Container.locator('.questionnaire-question-answer-option').last().waitFor();

				questionsCount++;
				console.log('Added question 8: Matrix (Multiple option)');

				console.log(
					`Completed steps 1-16: Survey "${surveyName}" created with ${questionsCount} questions ready for validation testing`
				);
			});

			await test.step('17.1. System: Validates the input fields for completeness', async () => {
				// Test validation by trying to save empty form
				await adminPage.getByRole('button', { name: 'Save' }).click();
				await adminPage.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/update_questions/
				);
				await adminPage.waitForLoadState('load');
				console.log('System initiated validation check for form completeness');
			});

			await test.step('17.2. System: Detects missing or invalid fields', async () => {
				// Verify validation error messages for required fields
				await expect(adminPage.getByText('There was a problem saving')).toBeVisible();
				await adminPage.waitForTimeout(1000);

				// Verify specific validation errors for the required Statement fields:
				await expect(adminPage.getByText(SurveysManagePage.VALIDATION_ERROR_STATEMENT_BLANK)).toHaveCount(26);

				console.log(`System detected missing required Statement fields`);
			});

			await test.step('17.3. User: Corrects the errors in the input fields', async () => {
				// Correct validation errors by filling all empty fields with proper values

				// Question 3: Single Option - Fill the empty answer options
				const question3Container = adminPage.locator('.questionnaire-question:nth-child(3)');
				await question3Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Blue');
				await question3Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Green');
				console.log('Corrected Question 3: Single Option answers');

				// Question 4: Multiple Option - Fill the empty answer options
				const question4Container = adminPage.locator('.questionnaire-question:nth-child(4)');
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.nth(0)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Cat');
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Dog');
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.nth(2)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Parrot');
				await question4Container
					.locator('.questionnaire-question-answer-option')
					.nth(3)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Fish');
				console.log('Corrected Question 4: Multiple Option answers');

				// Question 5: Sorting - Fill the empty answer options
				const question5Container = adminPage.locator('.questionnaire-question:nth-child(5)');
				await question5Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Car');
				await question5Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Motorcycle');
				console.log('Corrected Question 5: Sorting answers');

				// Question 7: Matrix Single - Fill the empty matrix rows and answer options
				const question7Container = adminPage.locator('.questionnaire-question:nth-child(7)');
				const allMatrixRows7 = question7Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await allMatrixRows7.nth(0).fill('Very Positive');
				await allMatrixRows7.nth(1).fill('Positive');
				await allMatrixRows7.nth(2).fill('Neutral');
				await allMatrixRows7.nth(3).fill('Negative');
				await allMatrixRows7.nth(4).fill('Very Negative');

				await question7Container
					.locator('.questionnaire-question-answer-option')
					.nth(0)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Clarity on how decisions are made');
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Time for everyone to speak');
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.nth(2)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Clarity on complex issues');
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.nth(3)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Meetings frequency');
				await question7Container
					.locator('.questionnaire-question-answer-option')
					.nth(4)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Follow-up or implementation of decisions');
				console.log('Corrected Question 7: Matrix Single Option rows and answers');

				// Question 8: Matrix Multiple - Fill the empty matrix rows and answer options
				const question8Container = adminPage.locator('.questionnaire-question:nth-child(8)');
				const allMatrixRows8 = question8Container.locator(
					'.tabs-panel.is-active input[id*="matrix_rows"]:not([type="hidden"]):not([id*="_deleted"])'
				);
				await allMatrixRows8.nth(0).fill('Networking opportunities');
				await allMatrixRows8.nth(1).fill('Information provided');
				await allMatrixRows8.nth(2).fill('Event organization');
				await allMatrixRows8.nth(3).fill('Location and facilities');

				await question8Container
					.locator('.questionnaire-question-answer-option')
					.nth(0)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Useful contacts');
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Practical knowledge gained');
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.nth(2)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Enjoyable atmosphere');
				await question8Container
					.locator('.questionnaire-question-answer-option')
					.nth(3)
					.locator('.tabs-panel.is-active input[type="text"]')
					.fill('Well-structured sessions');
				console.log('Corrected Question 8: Matrix Multiple Option rows and answers');

				console.log(
					'User corrected all validation errors by filling empty fields in questions 3, 4, 5, 7, and 8'
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

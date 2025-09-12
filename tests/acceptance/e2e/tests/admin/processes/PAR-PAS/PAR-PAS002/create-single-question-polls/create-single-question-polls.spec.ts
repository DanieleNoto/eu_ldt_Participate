import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { QuestionnaireTemplatesPage } from '@pages/pages/admin/templates/QuestionnaireTemplatesPage';
import { NewTemplatePage } from '@pages/pages/admin/templates/NewTemplatePage';
import { EditTemplatePage } from '@pages/pages/admin/templates/EditTemplatePage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { LocalizationUtils } from '@utils/localization.utils';

/**
 * Create quick polls for immediate feedback
 * User Story: As a City Administrator, I want to create single-question polls so that I can quickly gather citizens' opinions.
 * Requirements: PAR R15
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The City Administrator has permissions to create polls.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-PAS002] – Create single-question polls', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
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
	let processSlug: string;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		surveysManagePage = new SurveysManagePage(page);
		templatesPage = new QuestionnaireTemplatesPage(page);
		newTemplatePage = new NewTemplatePage(page);
		editTemplatePage = new EditTemplatePage(page);
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
			processSlug = slug;
			processEditUrl = url;
			console.log('Test process setup completed');
		});
	}

	test.describe('Main Flow', () => {
		test('should create a single-question polls', async ({ page }) => {
			// Get the current URL to extract process slug
			const currentUrl = page.url();
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
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await page.waitForLoadState('networkidle');

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
				await page.getByRole('button', { name: 'Add question' }).click();
			});

			await test.step('14. System: Displays the "Add Question" form.', async () => {
				// Verify questions management interface is available
				await expect(page.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(page.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(page.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				console.log('Questions management interface displayed with add question options');
			});

			await test.step('15. User: Fills in the Question Form: Statement: Adds the main question, Type: select question types, Mandatory: check if must be answered before submitting', async () => {
				// Question 1: Long Answer
				await page.waitForSelector('.questionnaire-question:nth-child(1)');
				const question1Container = page.locator('.questionnaire-question:nth-child(1)');

				// Expand question form if collapsed
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').waitFor();
				}

				await question1Container
					.getByRole('textbox', { name: 'Statement' })
					.fill('What is your opinion on this topic?');
				await question1Container.locator('.editor-input .tiptap').fill('Please share your thoughts');
				await question1Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question1Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill('500');
				await question1Container.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

				// Increment questions counter
				questionsCount++;
				console.log(
					`Added question 1: Long Answer with 500 character limit (Total questions: ${questionsCount})`
				);
			});

			await test.step('16. User: Clicks on "Save" to create Single-Question Polls', async () => {
				await surveysManagePage.clickSaveQuestions();
			});

			await test.step('17. System: Validates the form for completeness and correctness.', async () => {
				await surveysManagePage.verifySurveyQuestionsSaved();
			});

			await test.step('18. System: Saves the template', async () => {
				// Final step: Publish the survey poll
				await surveysManagePage.publishSurvey();

				// Verify that the survey was actually created with the correct number of questions (dynamic count)
				await surveysManagePage.verifyPublishedQuestionsCount(questionsCount, 'survey creation');

				console.log('single-question poll is successfully created and published');

				// Verify we're back on the surveys management page
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});

	test.describe('Alternative Flow: Select template', () => {
		let templateQuestionsCount = 0;

		test.beforeEach(async ({ page }) => {
			await test.step('Setup: Navigate to Templates section', async () => {
				await templatesPage.navigateToPage();
				await page.waitForLoadState('networkidle');
				console.log('Navigated to Templates section for prerequisite setup');
			});

			await test.step('Setup: Create new template', async () => {
				await templatesPage.navigateToNewTemplate();
				await newTemplatePage.waitForPageToLoad();

				// Create template with simple data
				const templateTimestamp = Date.now().toString();
				templateName = `Survey_Template_${templateTimestamp}`;

				await newTemplatePage.createSimpleTemplate(templateName);
				await page.waitForURL(/\/admin\/templates\/questionnaire_templates\/\d+\/edit/);

				// Extract template ID from URL
				const templateUrl = page.url();
				const templateMatch = templateUrl.match(/\/questionnaire_templates\/(\d+)\/edit/);
				templateId = templateMatch ? templateMatch[1] : '';

				console.log(`Template created with ID: ${templateId} and name: ${templateName}`);
			});

			await test.step('Setup: Add question to template', async () => {
				await editTemplatePage.manageQuestions();
				await page.waitForURL(/\/admin\/templates\/questionnaire_templates\/\d+\/edit_questions/);

				// Verify questions management interface is available
				await expect(page.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(page.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(page.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				await page.getByRole('button', { name: 'Add question' }).click();
				await page.waitForSelector('.questionnaire-question:nth-child(1)');

				const question1Container = page.locator('.questionnaire-question:nth-child(1)');
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').waitFor();
				}

				// Fill question details using the working selectors
				await question1Container
					.getByRole('textbox', { name: 'Statement' })
					.fill('What is your opinion on this topic?');
				await question1Container.locator('.editor-input .tiptap').fill('Please share your thoughts');
				await question1Container.getByRole('checkbox', { name: 'Mandatory' }).check();
				await question1Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill('500');
				await question1Container.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

				templateQuestionsCount++;

				console.log('Question configured: "What is your opinion on this topic?" with mandatory long answer');
			});

			await test.step('Setup: Save template and return to process', async () => {
				// Save template questions
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForLoadState('networkidle');

				console.log('Template questions saved successfully');

				// Navigate back to the process edit page using the stored URL
				console.log('Navigating back to process edit page:', processEditUrl);
				await page.goto(processEditUrl);
				await page.waitForLoadState('networkidle');
				console.log('Template setup completed - ready for template selection test');
			});
		});

		test('should create a single-question polls based on a selected template', async ({ page }) => {
			// Get the current URL to extract process slug
			const currentUrl = page.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_Template_${timestamp}`;

			await test.step('1-9. User: Navigates through process setup and creates Survey component with template selection', async () => {
				// Navigate to processes section using admin nav
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				// Verify we're on processes page and select our created process
				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);

				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);

				await page.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await page.waitForLoadState('networkidle');

				// Navigate to Components section and create Survey component
				await updateProcessAdminPage.navigateToComponents();

				// Clicks on "Add Component" and selects Survey
				await surveysManagePage.addComponentAndSelectSurvey(componentsPage, processSlug);
				// Displays the "Add Survey" form
				await surveysManagePage.verifyAddSurveyFormDisplayed();
				// Fulfil name and description input and click on "Add component" button
				await surveysManagePage.fulfillSurveyFormAndCreateComponent(componentName, processSlug, false);

				await expect(page.getByText('Component created successfully')).toBeVisible();

				await surveysManagePage.accessComponentAndCreateNewSurvey(componentsPage, componentName);
				await surveysManagePage.verifyTemplateSelectionDisplayed();

				console.log(
					`Completed steps 1-9: Survey component "${componentName}" created and ready for template selection`
				);
			});

			await test.step('10.1. User: Select a specific template', async () => {
				// Use the template created in beforeEach
				await page.getByRole('combobox', { name: 'Choose template' }).click();
				await page.getByRole('combobox', { name: 'Choose template' }).fill(templateName);
				await page.getByRole('button', { name: 'Create from template' }).click();

				// Wait for redirect after template application
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);
				await page.waitForLoadState('networkidle');
				await expect(page.getByText('Template applied successfully.')).toBeVisible();
				console.log(`Template "${templateName}" applied successfully`);
			});

			await test.step('10.2. System: Create the new questionnaire based on selected template and displays options for adding survey elements', async () => {
				await surveysManagePage.verifyEmptyQuestionnaireDisplayed();

				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_template_${surveyTimestamp}`;
				await surveysManagePage.fillSurveyDetailsAndSave(surveyName, 'Survey created from template');

				await surveysManagePage.accessQuestionsManagement();

				// Verify the imported question from template is present
				await expect(page.locator('.questionnaire-question:nth-child(1)')).toBeVisible();

				// Verify the question content matches what was configured in the template
				const question1Container = page.locator('.questionnaire-question:nth-child(1)');
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').waitFor();
				}

				// Verify the question statement matches the template
				await expect(question1Container.getByRole('textbox', { name: 'Statement' })).toHaveValue(
					'What is your opinion on this topic?'
				);

				// Verify the question description matches the template
				const descriptionText = await question1Container.locator('.editor-input .tiptap').innerText();
				expect(descriptionText.trim()).toBe('Please share your thoughts');

				// Verify question type is Long Answer as configured in template
				await expect(question1Container.getByLabel('TypeShort answer Long answer')).toHaveValue('long_answer');

				// Verify mandatory checkbox is checked as configured in template
				await expect(question1Container.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();

				// Verify character limit is set to 500 as configured in template
				await expect(
					question1Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' })
				).toHaveValue('500');

				console.log('Verified template question imported correctly');

				await surveysManagePage.clickSaveQuestions();
				await surveysManagePage.verifySurveyQuestionsSaved();

				// Verify template questions are pre-populated and publish (Steps 17-18 equivalent)
				await expect(page.getByRole('link', { name: 'Publish' })).toBeVisible();

				// Final step: Publish the survey poll
				await surveysManagePage.publishSurvey();

				// Verify that the survey was actually created with the correct number of questions (from template)
				await surveysManagePage.verifyPublishedQuestionsCount(
					templateQuestionsCount,
					'template survey creation'
				);

				console.log(`Survey with template configured, saved and published successfully`);

				// Final verification that we're on the management page confirming successful creation
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});

	test.describe('Alternative Flow: Fields Validation Fail', () => {
		test('should detect and handle validation errors during poll creation', async ({ page }) => {
			// Get the current URL to extract process slug
			const currentUrl = page.url();
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
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);

				// Search for our created process by title and select it
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);

				await page.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await page.waitForLoadState('networkidle');

				// Navigate to Components section and create Survey component
				await updateProcessAdminPage.navigateToComponents();

				// Clicks on "Add Component" and selects Survey
				await surveysManagePage.addComponentAndSelectSurvey(componentsPage, processSlug);
				// Displays the "Add Survey" form
				await surveysManagePage.verifyAddSurveyFormDisplayed();
				// Fulfil name and description input and click on "Add component" button
				await surveysManagePage.fulfillSurveyFormAndCreateComponent(componentName, processSlug, false);

				await expect(page.getByText('Component created successfully')).toBeVisible();

				await surveysManagePage.accessComponentAndCreateNewSurvey(componentsPage, componentName);
				await surveysManagePage.verifyTemplateSelectionDisplayed();
				await surveysManagePage.skipTemplateSelection();
				await surveysManagePage.verifyEmptyQuestionnaireDisplayed();

				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_${surveyTimestamp}`;
				await surveysManagePage.fillSurveyDetailsAndSave(surveyName, 'description');

				await surveysManagePage.accessQuestionsManagement();

				// Verify questions management interface is available
				await expect(page.getByRole('button', { name: 'Add question' })).toBeVisible();
				await expect(page.getByRole('button', { name: 'Add separator' })).toBeVisible();
				await expect(page.getByRole('button', { name: 'Add title and description' })).toBeVisible();

				// Add new question
				await page.getByRole('button', { name: 'Add question' }).click();

				// Question 1: Single Option
				await page.waitForSelector('.questionnaire-question:nth-child(1)');
				const question1Container = page.locator('.questionnaire-question:nth-child(1)');

				// Expand question form if collapsed
				const question1AccordionButton = question1Container.locator('.question--collapse').first();
				const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
				if (isExpanded1 === 'false') {
					await question1AccordionButton.click();
					await question1Container.locator('.editor-input').waitFor();
				}

				// Change question type from default to single option
				await page
					.getByRole('option', { name: 'Question #1 Remove Statement' })
					.getByLabel('TypeShort answer Long answer')
					.selectOption('single_option');

				console.log(`Completed steps 1-16: Survey "${surveyName}" ready for question validation testing`);
			});

			await test.step('17.1. System: Validates the input fields for completeness', async () => {
				// Verify that required fields are empty before attempting to save
				const question1Container = page.locator('.questionnaire-question:nth-child(1)');

				// Verify that the main question statement field is empty
				const allStatementFields = question1Container.getByRole('textbox', { name: 'Statement' });
				await expect(allStatementFields.first()).toHaveValue('');

				// Verify that the two option fields are empty
				await expect(
					question1Container
						.locator('.questionnaire-question-answer-option')
						.first()
						.getByRole('textbox', { name: 'Statement' })
				).toHaveValue('');
				await expect(
					question1Container
						.locator('.questionnaire-question-answer-option')
						.nth(1)
						.getByRole('textbox', { name: 'Statement' })
				).toHaveValue('');

				console.log('Verified that required fields are empty before attempting validation');

				// Test validation by trying to save empty form
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/update_questions/
				);
				console.log('System initiated validation check for form completeness');
			});

			await test.step('17.2. System: Detects missing or invalid fields', async () => {
				// Verify validation error messages for required fields
				await expect(page.getByText('There was a problem saving')).toBeVisible();

				// Verify specific validation errors for the required Statement fields:
				// 1. Question Statement field is required
				await expect(
					page
						.locator('div')
						.filter({ hasText: new RegExp(`^${SurveysManagePage.VALIDATION_ERROR_STATEMENT_BLANK}$`) })
						.first()
				).toBeVisible();

				// 2. Option A Statement field is required
				await expect(
					page
						.locator('div')
						.filter({ hasText: new RegExp(`^${SurveysManagePage.VALIDATION_ERROR_STATEMENT_BLANK}$`) })
						.nth(1)
				).toBeVisible();

				// 3. Option B Statement field is required
				await expect(
					page
						.locator('div')
						.filter({ hasText: new RegExp(`^${SurveysManagePage.VALIDATION_ERROR_STATEMENT_BLANK}$`) })
						.nth(2)
				).toBeVisible();

				console.log('System detected missing required Statement fields');
			});

			await test.step('17.3. User: Corrects the errors in the input fields', async () => {
				// Fill question details properly to correct validation errors
				const question1Container = page.locator('.questionnaire-question:nth-child(1)');

				// Fill the main question statement field
				const allStatementFields = question1Container.getByRole('textbox', { name: 'Statement' });
				await allStatementFields.first().fill('Which option do you prefer?');

				await question1Container.locator('.editor-input .tiptap').fill('Select one of the available options');

				// Set question type to single option
				await question1Container.getByLabel('TypeShort answer Long answer').selectOption('single_option');

				// Fill the default two answer options that are automatically created
				await question1Container.locator('.questionnaire-question-answer-option').first().waitFor();
				await question1Container
					.locator('.questionnaire-question-answer-option')
					.first()
					.getByRole('textbox', { name: 'Statement' })
					.fill('Option A');
				await question1Container
					.locator('.questionnaire-question-answer-option')
					.nth(1)
					.getByRole('textbox', { name: 'Statement' })
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
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});
});

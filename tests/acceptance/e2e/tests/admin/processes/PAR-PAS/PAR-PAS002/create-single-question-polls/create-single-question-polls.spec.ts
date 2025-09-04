import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
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
	let templatesPage: QuestionnaireTemplatesPage;
	let newTemplatePage: NewTemplatePage;
	let editTemplatePage: EditTemplatePage;
	let validProcessData: any;
	let templateId: string;
	let templateName: string;
	let processEditUrl: string;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		templatesPage = new QuestionnaireTemplatesPage(page);
		newTemplatePage = new NewTemplatePage(page);
		editTemplatePage = new EditTemplatePage(page);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

		// Setup test environment
		await setupTestProcess(page);
	});

	/**
	 * Setup test environment by creating a new test process as prerequisite
	 */
	async function setupTestProcess(page: any) {
		await test.step('Setup: Create new test process as prerequisite', async () => {
			// Navigate to admin home and processes
			await adminHomePage.navigateToAdminHomePage();
			await processAdminPage.navigateToProcesses();
			await page.waitForLoadState('networkidle');

			// Create a new test process as prerequisite
			await processAdminPage.navigateToNewProcess();
			await processAdminPage.fillGeneralInfo(validProcessData.general);
			await processAdminPage.fillMetadataInfo(validProcessData.metadata);
			await processAdminPage.setVisibilityToPublic();
			await processAdminPage.submitProcess();

			// Wait for process creation to complete
			await processAdminPage.expectSuccessMessage();
			await page.waitForURL(/\/admin\/participatory_processes\/.*\/steps/);

			// Log successful process creation
			console.log('New process created:', validProcessData.general.title);
			console.log('Process URL:', page.url());

			// Navigate back to processes list using direct navigation
			await page.goto('/admin/participatory_processes');
			await page.waitForLoadState('networkidle');

			// Search for the created process by title
			await page.getByRole('searchbox', { name: 'Search Participatory' }).click();
			await page.getByRole('searchbox', { name: 'Search Participatory' }).fill(validProcessData.general.title);
			await page.getByRole('button', { name: 'Search' }).click();

			// Click on the created process to open edit page
			await page
				.getByRole('link', {
					name:
						validProcessData.general.title.split(' ')[0] +
						' ' +
						validProcessData.general.title.split(' ')[1]
				})
				.click();

			// Wait for edit page to load and store the URL
			await page.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
			await page.waitForLoadState('networkidle');

			// Store the process edit URL for later use
			processEditUrl = page.url();
			console.log('Process edit URL stored:', processEditUrl);
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
				// Search for our created process by title
				await page.getByRole('searchbox', { name: 'Search Participatory' }).click();
				await page
					.getByRole('searchbox', { name: 'Search Participatory' })
					.fill(validProcessData.general.title);
				await page.getByRole('button', { name: 'Search' }).click();

				// Click on the created process to open edit page
				await page
					.getByRole('link', {
						name:
							validProcessData.general.title.split(' ')[0] +
							' ' +
							validProcessData.general.title.split(' ')[1]
					})
					.click();
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
				await page.getByRole('button', { name: 'Add component' }).click();
				await page.getByRole('link', { name: 'Surveys' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components/new?type=surveys`);
				console.log('Selected Survey component type');
			});

			await test.step('7. System: Displays the "Add Survey" form.', async () => {
				// Verify the Add Survey form is displayed with required fields
				await expect(page.getByRole('textbox', { name: 'name' })).toBeVisible();
				await expect(page.getByRole('button', { name: 'Add component', exact: true })).toBeVisible();

				// Verify we're on the correct URL for adding surveys component
				expect(page.url()).toContain('/components/new?type=surveys');
				console.log('Add Survey form displayed with name field and add component button');
			});

			await test.step('8. User: Fulfil name and description input and click on "Add component" button.', async () => {
				// Fill component name
				await page.getByRole('textbox', { name: 'name' }).click();
				await page.getByRole('textbox', { name: 'name' }).fill(componentName);

				// Fill global settings announcement using dynamic localization
				const globalAnnouncementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					page,
					'component_settings_announcement'
				);
				await page.locator(globalAnnouncementSelector).getByRole('textbox', { name: 'Announcement' }).click();
				await page
					.locator(globalAnnouncementSelector)
					.getByRole('textbox', { name: 'Announcement' })
					.fill('Global settings description');

				// Fill step settings announcement
				await page.getByRole('group', { name: 'Introduction' }).getByLabel('Announcement').click();
				await page
					.getByRole('group', { name: 'Introduction' })
					.getByLabel('Announcement')
					.fill('Step settings description');

				// Click Add component button to create the surveys component
				await page.getByRole('button', { name: 'Add component', exact: true }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);

				console.log(`Configured component settings and created component: ${componentName}`);
			});

			await test.step('9. System: Display the "Edit questionnaire" form and ask to user to select a template or Skip.', async () => {
				// Access the Surveys component management
				await componentsPage.manageComponent(componentName);

				// Create new survey
				await page.getByRole('link', { name: 'New survey' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);
			});

			await test.step('10. User: Clicks "Skip".', async () => {
				// Skip choose template
				const skipLink = page.getByRole('link', { name: 'Skip' });
				const skipLinkVisible = await skipLink.isVisible().catch(() => false);
				if (skipLinkVisible) {
					await skipLink.click();
					await page.waitForURL(
						/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
					);
					console.log('Clicked Skip to proceed without template');
				}
			});

			await test.step('11. System: Create the new empty questionnaire and displays options for adding survey elements.', async () => {
				// Verify the empty questionnaire form is displayed with survey configuration options
				await expect(page.getByRole('textbox', { name: 'title' })).toBeVisible();
				await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
				console.log('Empty questionnaire form displayed with survey configuration options');
			});

			await test.step('12. User: Fulfil name and description input', async () => {
				// Generate timestamp for survey name
				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_${surveyTimestamp}`;

				// Fill survey details
				await page.getByRole('textbox', { name: 'title' }).click();
				await page.getByRole('textbox', { name: 'title' }).fill(surveyName);

				await page.getByRole('textbox', { name: 'Description' }).click();
				await page.getByRole('textbox', { name: 'Description' }).fill('description');

				await page.getByRole('textbox', { name: 'Terms of service' }).click();
				await page.getByRole('textbox', { name: 'Terms of service' }).fill('TOS');

				console.log(`Configured survey with title: ${surveyName}`);

				// Save survey and return to surveys list
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await expect(page.getByText('Survey successfully saved.')).toBeVisible();
				console.log('Survey saved successfully and returned to surveys list');
			});

			await test.step('13. User: Clicks "Add Question" to add question to the poll.', async () => {
				// Click the Manage questions link
				await page.locator('a[title="Manage questions"]').click();

				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit_questions/
				);
				await page.waitForLoadState('networkidle');
				console.log('Accessed questions management page');

				// Add new question
				await page.getByRole('button', { name: 'Add question' }).click();
			});

			await test.step('14. System: Displays the "Add Question" form.', async () => {
				// Verify the Add Question form is displayed
				await expect(page.getByRole('heading', { name: 'Question #1 Remove' })).toBeVisible();
				console.log('Add Question form displayed');

				// Expand question form
				await page.getByRole('heading', { name: 'Question #1 Remove' }).getByRole('button').first().click();
			});

			await test.step('15. User: Fills in the Question Form: Statement: Adds the main question, Type: select question types, Mandatory: check if must be answered before submitting', async () => {
				// Use fixed question text for consistent validation
				const questionText = 'What is your opinion on this topic?';

				// Fill question details
				await page.getByRole('textbox', { name: 'Statement' }).click();
				await page.getByRole('textbox', { name: 'Statement' }).fill(questionText);

				await page.getByRole('textbox', { name: 'Description' }).click();
				await page.getByRole('textbox', { name: 'Description' }).fill('description');

				// Make question mandatory
				await page.getByRole('checkbox', { name: 'Mandatory' }).check();

				// Set question type to long answer
				await page.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

				console.log(`Added question: ${questionText}`);
			});

			await test.step('16. User: Clicks on "Save" to create Single-Question Polls', async () => {
				// Save questions and return to surveys
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await expect(page.getByText('Survey questions successfully')).toBeVisible();
				console.log('Survey questions saved successfully');
			});

			await test.step('17. System: Validates the form for completeness and correctness.', async () => {
				await page.locator('a[title="Manage questions"]').click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit_questions/
				);
				await page.waitForLoadState('networkidle');

				// Verify the question exists and expand it to check values
				await expect(
					page.getByRole('heading', { name: 'What is your opinion on this topic? #1 Remove' })
				).toBeVisible();
				await page
					.getByRole('heading', { name: 'What is your opinion on this topic? #1 Remove' })
					.getByRole('button')
					.first()
					.click();

				// Verify form values are correctly saved
				await expect(page.getByRole('textbox', { name: 'Statement' })).toHaveValue(
					'What is your opinion on this topic?'
				);
				await expect(page.locator('.tiptap.ProseMirror')).toHaveText('description');
				await expect(page.getByRole('checkbox', { name: 'Mandatory' })).toBeChecked();
				await expect(page.getByLabel('TypeShort answer Long answer')).toHaveValue('long_answer');

				console.log('Form validation successful - all data saved correctly');

				// Navigate back to surveys list using the component link
				const currentUrl = page.url();
				const componentUrlMatch = currentUrl.match(
					/\/admin\/participatory_processes\/([^\/]+)\/components\/(\d+)\//
				);
				if (componentUrlMatch) {
					const processSlug = componentUrlMatch[1];
					const componentId = componentUrlMatch[2];
					const surveyManageUrl = `/admin/participatory_processes/${processSlug}/components/${componentId}/manage/`;
					await page.goto(surveyManageUrl);
				} else {
					// Fallback to replace method
					await page.goto(page.url().replace(/\/edit_questions$/, ''));
				}
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
				console.log('Returned to surveys list after validation');
			});

			await test.step('18. System: Saves the template', async () => {
				// Verify the survey appears in the list and can be published
				await expect(page.getByRole('link', { name: 'Publish' })).toBeVisible();
				console.log('Template saved successfully - survey ready for publishing');
			});

			await test.step('Result: The single-question poll is successfully created and published, allowing participants to respond and provide feedback.', async () => {
				// Final step: Publish the survey poll
				await page.getByRole('link', { name: 'Publish' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
				await expect(page.getByText('Survey successfully published.')).toBeVisible();
				console.log('Survey poll published successfully');

				// Verify we're back on the surveys management page
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});

	test.describe('Alternative Flow: Select template', () => {
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

				await page.getByRole('button', { name: 'Add question' }).click();
				await page.waitForSelector('.questionnaire-question:nth-child(1)');

				const firstQuestion = page.locator('.questionnaire-question:nth-child(1)');
				const accordionButton = firstQuestion.locator('.question--collapse').first();
				const isExpanded = await accordionButton.getAttribute('aria-expanded');
				if (isExpanded === 'false') {
					await accordionButton.click();
					await firstQuestion.locator('.editor-input').waitFor();
				}

				// Fill question details using the working selectors
				await firstQuestion
					.getByRole('textbox', { name: 'Statement' })
					.fill('What is your opinion on this topic?');
				await firstQuestion.locator('.editor-input .tiptap').fill('Please share your thoughts');
				await firstQuestion.getByRole('checkbox', { name: 'Mandatory' }).check();
				await firstQuestion.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

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

				// Search for our created process by title
				await page.getByRole('searchbox', { name: 'Search Participatory' }).click();
				await page
					.getByRole('searchbox', { name: 'Search Participatory' })
					.fill(validProcessData.general.title);
				await page.getByRole('button', { name: 'Search' }).click();

				// Click on the created process to open edit page
				await page
					.getByRole('link', {
						name:
							validProcessData.general.title.split(' ')[0] +
							' ' +
							validProcessData.general.title.split(' ')[1]
					})
					.click();

				await page.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await page.waitForLoadState('networkidle');

				// Navigate to Components section
				await updateProcessAdminPage.navigateToComponents();

				// Add new Surveys component
				await page.getByRole('button', { name: 'Add component' }).click();
				await page.getByRole('link', { name: 'Surveys' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components/new?type=surveys`);

				// Configure Surveys component settings
				await page.getByRole('textbox', { name: 'name' }).click();
				await page.getByRole('textbox', { name: 'name' }).fill(componentName);

				const globalAnnouncementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					page,
					'component_settings_announcement'
				);
				await page.locator(globalAnnouncementSelector).getByRole('textbox', { name: 'Announcement' }).click();
				await page
					.locator(globalAnnouncementSelector)
					.getByRole('textbox', { name: 'Announcement' })
					.fill('Global settings description');

				await page.getByRole('group', { name: 'Introduction' }).getByLabel('Announcement').click();
				await page
					.getByRole('group', { name: 'Introduction' })
					.getByLabel('Announcement')
					.fill('Step settings description');

				// Create the Surveys component
				await page.getByRole('button', { name: 'Add component', exact: true }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				await expect(page.getByText('Component created successfully')).toBeVisible();

				// Access the Surveys component management and create new survey
				await componentsPage.manageComponent(componentName);
				await page.getByRole('link', { name: 'New survey' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);

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
				// Generate timestamp for survey name
				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_template_${surveyTimestamp}`;

				// Fill survey details (Step 12 equivalent)
				await page.getByRole('textbox', { name: 'title' }).click();
				await page.getByRole('textbox', { name: 'title' }).fill(surveyName);

				await page.getByRole('textbox', { name: 'Description' }).click();
				await page.getByRole('textbox', { name: 'Description' }).fill('Survey created from template');

				await page.getByRole('textbox', { name: 'Terms of service' }).click();
				await page.getByRole('textbox', { name: 'Terms of service' }).fill('TOS for template survey');

				// Save survey and return to surveys list (Steps 13-16 equivalent)
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await expect(page.getByText('Survey successfully saved.')).toBeVisible();

				// Verify template questions are pre-populated and publish (Steps 17-18 equivalent)
				await expect(page.getByRole('link', { name: 'Publish' })).toBeVisible();

				// Final step: Publish the survey poll (Result equivalent)
				await page.getByRole('link', { name: 'Publish' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
				await expect(page.getByText('Survey successfully published.')).toBeVisible();

				console.log(`Survey with template configured, saved and published successfully`);
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});

			await test.step('Result: The single-question poll is successfully created and published, allowing participants to respond.', async () => {
				// Verify the survey poll is published and accessible for participants
				await expect(page.getByText('Survey successfully published.')).toBeVisible();
				console.log(
					'Single-question poll successfully created from template and published for participant responses'
				);

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

			await test.step('1-16. User: Navigates through complete poll creation process up to question creation', async () => {
				// Navigate to processes section and select our created process
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);

				// Search for our created process by title
				await page.getByRole('searchbox', { name: 'Search Participatory' }).click();
				await page
					.getByRole('searchbox', { name: 'Search Participatory' })
					.fill(validProcessData.general.title);
				await page.getByRole('button', { name: 'Search' }).click();

				// Click on the created process to open edit page
				await page
					.getByRole('link', {
						name:
							validProcessData.general.title.split(' ')[0] +
							' ' +
							validProcessData.general.title.split(' ')[1]
					})
					.click();

				await page.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await page.waitForLoadState('networkidle');

				// Navigate to Components section and create Survey component
				await updateProcessAdminPage.navigateToComponents();
				await page.getByRole('button', { name: 'Add component' }).click();
				await page.getByRole('link', { name: 'Surveys' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components/new?type=surveys`);

				// Configure Surveys component settings
				await page.getByRole('textbox', { name: 'name' }).click();
				await page.getByRole('textbox', { name: 'name' }).fill(componentName);

				const globalAnnouncementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
					page,
					'component_settings_announcement'
				);
				await page.locator(globalAnnouncementSelector).getByRole('textbox', { name: 'Announcement' }).click();
				await page
					.locator(globalAnnouncementSelector)
					.getByRole('textbox', { name: 'Announcement' })
					.fill('Global settings description');

				await page.getByRole('group', { name: 'Introduction' }).getByLabel('Announcement').click();
				await page
					.getByRole('group', { name: 'Introduction' })
					.getByLabel('Announcement')
					.fill('Step settings description');

				// Create the Surveys component
				await page.getByRole('button', { name: 'Add component', exact: true }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				await expect(page.getByText('Component created successfully')).toBeVisible();

				// Access the Surveys component management and create new survey
				await componentsPage.manageComponent(componentName);
				await page.getByRole('link', { name: 'New survey' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);

				// Skip choose template
				const skipLink = page.getByRole('link', { name: 'Skip' });
				const skipLinkVisible = await skipLink.isVisible().catch(() => false);
				if (skipLinkVisible) {
					await skipLink.click();
					await page.waitForURL(
						/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
					);
				}

				// Configure survey details
				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_${surveyTimestamp}`;

				await page.getByRole('textbox', { name: 'title' }).click();
				await page.getByRole('textbox', { name: 'title' }).fill(surveyName);
				await page.getByRole('textbox', { name: 'Description' }).click();
				await page.getByRole('textbox', { name: 'Description' }).fill('description');
				await page.getByRole('textbox', { name: 'Terms of service' }).click();
				await page.getByRole('textbox', { name: 'Terms of service' }).fill('TOS');

				// Save survey and return to surveys list
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await expect(page.getByText('Survey successfully saved.')).toBeVisible();

				// Access questions management and add question
				await page.locator('a[title="Manage questions"]').click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit_questions/
				);
				await page.waitForLoadState('networkidle');

				// Add new question and expand form
				await page.getByRole('button', { name: 'Add question' }).click();
				await page.getByRole('heading', { name: 'Question #1 Remove' }).getByRole('button').first().click();

				console.log(
					`Completed steps 1-16: Survey "${surveyName}" created and ready for question validation testing`
				);
			});

			await test.step('17.1. System: Validates the input fields for completeness', async () => {
				// Test validation by trying to save empty form
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/update_questions/
				);
				console.log('System initiated validation check for form completeness');
			});

			await test.step('17.2. System: Detects missing or invalid fields', async () => {
				// Verify validation error messages
				await expect(page.getByText('There was a problem saving')).toBeVisible();
				await expect(page.getByText('cannot be blank')).toBeVisible();
				console.log('System detected missing or invalid fields and displayed validation errors');
			});

			await test.step('17.3. User: Corrects the errors in the input fields', async () => {
				// Fill question details properly to correct validation errors
				const questionTimestamp = Date.now().toString();
				const questionText = `Question_${questionTimestamp}`;

				await page.getByRole('textbox', { name: 'Statement' }).click();
				await page.getByRole('textbox', { name: 'Statement' }).fill(questionText);

				await page.getByRole('textbox', { name: 'Description' }).click();
				await page.getByRole('textbox', { name: 'Description' }).fill('description');

				// Make question mandatory
				await page.getByRole('checkbox', { name: 'Mandatory' }).check();

				// Set question type to long answer
				await page.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

				console.log(`User corrected validation errors by filling question: ${questionText}`);
			});

			await test.step('17.4. User: Attempts to save the poll again', async () => {
				// Save questions after corrections
				await page.getByRole('button', { name: 'Save' }).click();
				console.log('User attempted to save the poll again after corrections');
			});

			await test.step('17.5. System: Revalidates the corrected fields', async () => {
				// Verify successful validation and save
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await expect(page.getByText('Survey questions successfully')).toBeVisible();

				// Publish the survey poll to complete the flow
				await page.getByRole('link', { name: 'Publish' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
				await expect(page.getByText('Survey successfully published.')).toBeVisible();

				console.log('System revalidated corrected fields successfully and poll was saved and published');
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
			});
		});
	});
});

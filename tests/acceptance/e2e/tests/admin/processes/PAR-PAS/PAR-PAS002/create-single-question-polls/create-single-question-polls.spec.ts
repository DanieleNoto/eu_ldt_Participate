import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
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
		templatesPage = new QuestionnaireTemplatesPage(page);
		newTemplatePage = new NewTemplatePage(page);
		editTemplatePage = new EditTemplatePage(page);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

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
				name: validProcessData.general.title.split(' ')[0] + ' ' + validProcessData.general.title.split(' ')[1]
			})
			.click();

		// Wait for edit page to load and store the URL
		await page.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
		await page.waitForLoadState('networkidle');

		// Store the process edit URL for later use
		processEditUrl = page.url();
		console.log('Process edit URL stored:', processEditUrl);
	});

	test.describe('Main Flow', () => {
		test('should create a single-question polls', async ({ page }) => {
			// Get the current URL to extract process slug
			const currentUrl = page.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_${timestamp}`;

			await test.step('Navigate to Components section', async () => {
				await page.getByRole('link', { name: 'Components' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				console.log('Navigated to Components section');
			});

			await test.step('Add new Surveys component', async () => {
				await page.getByRole('button', { name: 'Add component' }).click();
				await page.getByRole('link', { name: 'Surveys' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components/new?type=surveys`);
				console.log('Selected Surveys component type');
			});

			await test.step('Configure Surveys component settings', async () => {
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

				console.log(`Configured component settings with name: ${componentName}`);
			});

			await test.step('Create the Surveys component', async () => {
				await page.getByRole('button', { name: 'Add component', exact: true }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				await page.getByText('Component created successfully').click();
				console.log('Surveys component created successfully');
			});

			await test.step('Access the Surveys component management', async () => {
				// Wait for page to be fully loaded
				await page.waitForLoadState('networkidle');

				console.log('Looking for component link with name:', componentName);

				try {
					// Strategy 1: Try to click the component link by exact name
					await page.getByRole('link', { name: componentName, exact: true }).click();
					console.log('Clicked component link successfully using name');
				} catch (error) {
					console.log('Component link not found by name, trying Manage icon');

					try {
						// Strategy 2: Try to click the Manage icon using title attribute
						await page.locator('a[title="Manage"]').click();
						console.log('Clicked Manage icon successfully');
					} catch (manageError) {
						console.log('Manage icon not found, using direct navigation fallback');

						// Strategy 3: Fallback - look for a link that contains "manage" in the href
						const manageLink = page.locator(`a[href*="/manage/"]`).first();
						const linkExists = await manageLink.count();

						if (linkExists > 0) {
							await manageLink.click();
							console.log('Used fallback manage link');
						} else {
							throw new Error('No manage link found on the page');
						}
					}
				}

				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\//);
				console.log('Accessed Surveys component management page');
			});

			await test.step('Create new survey', async () => {
				await page.getByRole('link', { name: 'New survey' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);
				console.log('Navigated to new survey creation page');
			});

			await test.step('Skip choose template', async () => {
				// Skip choose template
				const skipLink = page.getByRole('link', { name: 'Skip' });
				const skipLinkVisible = await skipLink.isVisible().catch(() => false);
				if (skipLinkVisible) {
					await skipLink.click();
					await page.waitForURL(
						/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
					);
					console.log('Skipped choose template');
				}
			});

			await test.step('Edit survey configuration', async () => {
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
			});

			await test.step('Save survey and return to surveys list', async () => {
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey successfully saved.').click();
				console.log('Survey saved successfully and returned to surveys list');
			});

			await test.step('Access questions management', async () => {
				// Wait for page to be fully loaded
				await page.waitForLoadState('networkidle');

				console.log('Current URL:', page.url());
				console.log('Looking for Manage questions link...');

				try {
					// Try to click the Manage questions link using title attribute
					await page.locator('a[title="Manage questions"]').click();
					console.log('Clicked Manage questions link successfully using title selector');
				} catch (error) {
					console.log('Link not available, using direct navigation fallback');
					console.log('Error details:', error.message);

					// Fallback: construct URL directly
					const currentUrl = page.url();
					let questionsUrl;

					if (currentUrl.includes('/edit')) {
						questionsUrl = currentUrl.replace(/\/edit$/, '/edit_questions');
					} else {
						// If URL doesn't end with /edit, append /edit_questions
						questionsUrl = currentUrl.replace(/\/$/, '') + '/edit_questions';
					}

					console.log('Current URL:', currentUrl);
					console.log('Navigating to questions URL:', questionsUrl);
					await page.goto(questionsUrl);
				}

				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit_questions/
				);
				await page.waitForLoadState('networkidle');
				console.log('Accessed questions management page');
			});

			await test.step('Add question', async () => {
				// Add new question
				await page.getByRole('button', { name: 'Add question' }).click();

				// Expand question form
				await page.getByRole('heading', { name: 'Question #1 Remove' }).getByRole('button').first().click();

				// Generate timestamp for question
				const questionTimestamp = Date.now().toString();
				const questionText = `Question_${questionTimestamp}`;

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

			await test.step('Save questions and return to surveys', async () => {
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey questions successfully').click();
				console.log('Survey questions saved successfully');
			});

			await test.step('Publish the survey poll', async () => {
				await page.getByRole('link', { name: 'Publish' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey successfully published.').click();
				console.log('Survey poll published successfully');
				// Verify we're back on the surveys management page
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
			});
		});
	});

	test.describe('Alternative Flow: Select template', () => {
		test.beforeEach(async ({ page }) => {
			// Navigate to templates and create new template using Page Objects
			await templatesPage.navigateToPage();
			await page.waitForLoadState('networkidle');

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

			// Add a simple question to the template using the edit page
			await editTemplatePage.manageQuestions();
			await page.waitForURL(/\/admin\/templates\/questionnaire_templates\/\d+\/edit_questions/);

			// Add a basic question to the template
			await page.getByRole('button', { name: 'Add question' }).click();
			await page.waitForSelector('.questionnaire-question:nth-child(1)');

			const firstQuestion = page.locator('.questionnaire-question:nth-child(1)');
			const accordionButton = firstQuestion.locator('.question--collapse').first();
			const isExpanded = await accordionButton.getAttribute('aria-expanded');
			if (isExpanded === 'false') {
				await accordionButton.click();
				await firstQuestion.locator('.editor-input').waitFor();
			}

			// Fill question details
			await firstQuestion.getByRole('textbox', { name: 'Statement' }).fill('What is your opinion on this topic?');
			await firstQuestion.locator('.editor-input .tiptap').fill('Please share your thoughts');
			await firstQuestion.getByRole('checkbox', { name: 'Mandatory' }).check();
			await firstQuestion.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

			// Save template questions
			await page.getByRole('button', { name: 'Save' }).click();
			await page.waitForLoadState('networkidle');

			console.log('Template questions saved successfully');

			// Navigate back to the process edit page using the stored URL
			console.log('Navigating back to process edit page:', processEditUrl);
			await page.goto(processEditUrl);
			await page.waitForLoadState('networkidle');
		});

		test('should create a single-question polls based on a selected template', async ({ page }) => {
			// Get the current URL to extract process slug
			const currentUrl = page.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_Template_${timestamp}`;

			await test.step('Navigate to Components section', async () => {
				await page.getByRole('link', { name: 'Components' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				console.log('Navigated to Components section');
			});

			await test.step('Add new Surveys component', async () => {
				await page.getByRole('button', { name: 'Add component' }).click();
				await page.getByRole('link', { name: 'Surveys' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components/new?type=surveys`);
				console.log('Selected Surveys component type');
			});

			await test.step('Configure Surveys component settings', async () => {
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

				console.log(`Configured component settings with name: ${componentName}`);
			});

			await test.step('Create the Surveys component', async () => {
				await page.getByRole('button', { name: 'Add component', exact: true }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				await page.getByText('Component created successfully').click();
				console.log('Surveys component created successfully');
			});

			await test.step('Access the Surveys component management', async () => {
				// Wait for page to be fully loaded
				await page.waitForLoadState('networkidle');

				console.log('Looking for component link with name:', componentName);

				try {
					// Strategy 1: Try to click the component link by exact name
					await page.getByRole('link', { name: componentName, exact: true }).click();
					console.log('Clicked component link successfully using name');
				} catch (error) {
					console.log('Component link not found by name, trying Manage icon');

					try {
						// Strategy 2: Try to click the Manage icon using title attribute
						await page.locator('a[title="Manage"]').click();
						console.log('Clicked Manage icon successfully');
					} catch (manageError) {
						console.log('Manage icon not found, using direct navigation fallback');

						// Strategy 3: Fallback - look for a link that contains "manage" in the href
						const manageLink = page.locator(`a[href*="/manage/"]`).first();
						const linkExists = await manageLink.count();

						if (linkExists > 0) {
							await manageLink.click();
							console.log('Used fallback manage link');
						} else {
							throw new Error('No manage link found on the page');
						}
					}
				}

				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\//);
				console.log('Accessed Surveys component management page');
			});

			await test.step('Create new survey', async () => {
				await page.getByRole('link', { name: 'New survey' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);
				console.log('Navigated to new survey creation page');
			});

			await test.step('Select and apply template', async () => {
				// Use the template created in beforeEach
				await page.getByRole('combobox', { name: 'Choose template' }).click();
				await page.getByRole('combobox', { name: 'Choose template' }).fill(templateName);
				await page.getByRole('button', { name: 'Create from template' }).click();

				// Wait for template to be applied (URL should remain the same)
				await page.waitForLoadState('networkidle');
				await page.getByText('Template applied successfully.').click();
				console.log(`Template "${templateName}" applied successfully`);
			});

			await test.step('Edit survey configuration', async () => {
				// Generate timestamp for survey name
				const surveyTimestamp = Date.now().toString();
				const surveyName = `survey_template_${surveyTimestamp}`;

				// Fill survey details
				await page.getByRole('textbox', { name: 'title' }).click();
				await page.getByRole('textbox', { name: 'title' }).fill(surveyName);

				await page.getByRole('textbox', { name: 'Description' }).click();
				await page.getByRole('textbox', { name: 'Description' }).fill('Survey created from template');

				await page.getByRole('textbox', { name: 'Terms of service' }).click();
				await page.getByRole('textbox', { name: 'Terms of service' }).fill('TOS for template survey');

				console.log(`Configured survey with title: ${surveyName}`);
			});

			await test.step('Save survey with template', async () => {
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey successfully saved.').click();
				console.log('Survey with template saved successfully');
			});

			await test.step('Publish the survey poll', async () => {
				await page.getByRole('link', { name: 'Publish' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey successfully published.').click();
				console.log('Survey poll published successfully');
				// Verify we're back on the surveys management page
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('Cancel the poll creation', async ({ page }) => {
			// Get the current URL to extract process slug
			const currentUrl = page.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_${timestamp}`;

			await test.step('Navigate to Components section', async () => {
				await page.getByRole('link', { name: 'Components' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				console.log('Navigated to Components section');
			});

			await test.step('Add new Surveys component', async () => {
				await page.getByRole('button', { name: 'Add component' }).click();
				await page.getByRole('link', { name: 'Surveys' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components/new?type=surveys`);
				console.log('Selected Surveys component type');
			});

			await test.step('Configure Surveys component settings', async () => {
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

				console.log(`Configured component settings with name: ${componentName}`);
			});

			await test.step('Create the Surveys component', async () => {
				await page.getByRole('button', { name: 'Add component', exact: true }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				await page.getByText('Component created successfully').click();
				console.log('Surveys component created successfully');
			});

			await test.step('Access the Surveys component management', async () => {
				// Wait for page to be fully loaded
				await page.waitForLoadState('networkidle');

				console.log('Looking for component link with name:', componentName);

				try {
					// Strategy 1: Try to click the component link by exact name
					await page.getByRole('link', { name: componentName, exact: true }).click();
					console.log('Clicked component link successfully using name');
				} catch (error) {
					console.log('Component link not found by name, trying Manage icon');

					try {
						// Strategy 2: Try to click the Manage icon using title attribute
						await page.locator('a[title="Manage"]').click();
						console.log('Clicked Manage icon successfully');
					} catch (manageError) {
						console.log('Manage icon not found, using direct navigation fallback');

						// Strategy 3: Fallback - look for a link that contains "manage" in the href
						const manageLink = page.locator(`a[href*="/manage/"]`).first();
						const linkExists = await manageLink.count();

						if (linkExists > 0) {
							await manageLink.click();
							console.log('Used fallback manage link');
						} else {
							throw new Error('No manage link found on the page');
						}
					}
				}

				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\//);
				console.log('Accessed Surveys component management page');
			});

			await test.step('Create new survey', async () => {
				await page.getByRole('link', { name: 'New survey' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);
				console.log('Navigated to new survey creation page');
			});

			await test.step('Skip choose template', async () => {
				// Skip choose template
				const skipLink = page.getByRole('link', { name: 'Skip' });
				const skipLinkVisible = await skipLink.isVisible().catch(() => false);
				if (skipLinkVisible) {
					await skipLink.click();
					await page.waitForURL(
						/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
					);
					console.log('Skipped choose template');
				}
			});

			await test.step('Edit survey configuration', async () => {
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
			});

			await test.step('Save survey and return to surveys list', async () => {
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey successfully saved.').click();
				console.log('Survey saved successfully and returned to surveys list');
			});

			await test.step('Access questions management', async () => {
				// Wait for page to be fully loaded
				await page.waitForLoadState('networkidle');

				console.log('Current URL:', page.url());
				console.log('Looking for Manage questions link...');

				try {
					// Try to click the Manage questions link using title attribute
					await page.locator('a[title="Manage questions"]').click();
					console.log('Clicked Manage questions link successfully using title selector');
				} catch (error) {
					console.log('Link not available, using direct navigation fallback');
					console.log('Error details:', error.message);

					// Fallback: construct URL directly
					const currentUrl = page.url();
					let questionsUrl;

					if (currentUrl.includes('/edit')) {
						questionsUrl = currentUrl.replace(/\/edit$/, '/edit_questions');
					} else {
						// If URL doesn't end with /edit, append /edit_questions
						questionsUrl = currentUrl.replace(/\/$/, '') + '/edit_questions';
					}

					console.log('Current URL:', currentUrl);
					console.log('Navigating to questions URL:', questionsUrl);
					await page.goto(questionsUrl);
				}

				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit_questions/
				);
				await page.waitForLoadState('networkidle');
				console.log('Accessed questions management page');
			});

			await test.step('Add question', async () => {
				// Add new question
				await page.getByRole('button', { name: 'Add question' }).click();

				// Expand question form
				await page.getByRole('heading', { name: 'Question #1 Remove' }).getByRole('button').first().click();

				// Generate timestamp for question
				const questionTimestamp = Date.now().toString();
				const questionText = `Question_${questionTimestamp}`;

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

			await test.step('Save questions and return to surveys', async () => {
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey questions successfully').click();
				console.log('Survey questions saved successfully');
			});

			await test.step('Delete the survey poll', async () => {
				// Wait for page to be fully loaded
				await page.waitForLoadState('networkidle');

				// Click on the Destroy link for the survey using a more stable selector
				await page.locator('a.action-icon--remove[title="Destroy"]').click();

				// Confirm deletion in the popup
				await page.getByRole('heading', { name: 'Confirm' }).click();
				await page.getByRole('button', { name: 'OK' }).click();

				// Wait for deletion to complete and return to surveys page
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey successfully deleted.').click();

				console.log('Survey poll deleted successfully');
			});
		});
	});

	test.describe('Alternative Flow: Fields Validation Fail', () => {
		test('Detects missing or invalid fields in the poll creation', async ({ page }) => {
			// Get the current URL to extract process slug
			const currentUrl = page.url();
			const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
			const processSlug = processSlugMatch ? processSlugMatch[1] : '';

			// Generate timestamp for component name
			const timestamp = Date.now().toString();
			const componentName = `Surveys_${timestamp}`;

			await test.step('Navigate to Components section', async () => {
				await page.getByRole('link', { name: 'Components' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				console.log('Navigated to Components section');
			});

			await test.step('Add new Surveys component', async () => {
				await page.getByRole('button', { name: 'Add component' }).click();
				await page.getByRole('link', { name: 'Surveys' }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components/new?type=surveys`);
				console.log('Selected Surveys component type');
			});

			await test.step('Configure Surveys component settings', async () => {
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

				console.log(`Configured component settings with name: ${componentName}`);
			});

			await test.step('Create the Surveys component', async () => {
				await page.getByRole('button', { name: 'Add component', exact: true }).click();
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				await page.getByText('Component created successfully').click();
				console.log('Surveys component created successfully');
			});

			await test.step('Access the Surveys component management', async () => {
				// Wait for page to be fully loaded
				await page.waitForLoadState('networkidle');

				console.log('Looking for component link with name:', componentName);

				try {
					// Strategy 1: Try to click the component link by exact name
					await page.getByRole('link', { name: componentName, exact: true }).click();
					console.log('Clicked component link successfully using name');
				} catch (error) {
					console.log('Component link not found by name, trying Manage icon');

					try {
						// Strategy 2: Try to click the Manage icon using title attribute
						await page.locator('a[title="Manage"]').click();
						console.log('Clicked Manage icon successfully');
					} catch (manageError) {
						console.log('Manage icon not found, using direct navigation fallback');

						// Strategy 3: Fallback - look for a link that contains "manage" in the href
						const manageLink = page.locator(`a[href*="/manage/"]`).first();
						const linkExists = await manageLink.count();

						if (linkExists > 0) {
							await manageLink.click();
							console.log('Used fallback manage link');
						} else {
							throw new Error('No manage link found on the page');
						}
					}
				}

				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\//);
				console.log('Accessed Surveys component management page');
			});

			await test.step('Create new survey', async () => {
				await page.getByRole('link', { name: 'New survey' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
				);
				console.log('Navigated to new survey creation page');
			});

			await test.step('Skip choose template', async () => {
				// Skip choose template
				const skipLink = page.getByRole('link', { name: 'Skip' });
				const skipLinkVisible = await skipLink.isVisible().catch(() => false);
				if (skipLinkVisible) {
					await skipLink.click();
					await page.waitForURL(
						/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
					);
					console.log('Skipped choose template');
				}
			});

			await test.step('Edit survey configuration', async () => {
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
			});

			await test.step('Save survey and return to surveys list', async () => {
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey successfully saved.').click();
				console.log('Survey saved successfully and returned to surveys list');
			});

			await test.step('Access questions management', async () => {
				// Wait for page to be fully loaded
				await page.waitForLoadState('networkidle');

				console.log('Current URL:', page.url());
				console.log('Looking for Manage questions link...');

				try {
					// Try to click the Manage questions link using title attribute
					await page.locator('a[title="Manage questions"]').click();
					console.log('Clicked Manage questions link successfully using title selector');
				} catch (error) {
					console.log('Link not available, using direct navigation fallback');
					console.log('Error details:', error.message);

					// Fallback: construct URL directly
					const currentUrl = page.url();
					let questionsUrl;

					if (currentUrl.includes('/edit')) {
						questionsUrl = currentUrl.replace(/\/edit$/, '/edit_questions');
					} else {
						// If URL doesn't end with /edit, append /edit_questions
						questionsUrl = currentUrl.replace(/\/$/, '') + '/edit_questions';
					}

					console.log('Current URL:', currentUrl);
					console.log('Navigating to questions URL:', questionsUrl);
					await page.goto(questionsUrl);
				}

				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit_questions/
				);
				await page.waitForLoadState('networkidle');
				console.log('Accessed questions management page');
			});

			await test.step('Add question and test field validation', async () => {
				// Add new question
				await page.getByRole('button', { name: 'Add question' }).click();

				// Expand question form
				await page.getByRole('heading', { name: 'Question #1 Remove' }).getByRole('button').first().click();

				// Test validation by trying to save empty form
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(
					/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/update_questions/
				);

				// Verify validation error messages
				await page.getByText('There was a problem saving').click();
				await page.getByText('cannot be blank').click();
				console.log('Validation errors detected for empty form fields');

				// Now fill question details properly
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

				console.log(`Added question with text: ${questionText} and validation checks`);
			});

			await test.step('Save questions and return to surveys', async () => {
				await page.getByRole('button', { name: 'Save' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey questions successfully').click();
				console.log('Survey questions saved successfully');
			});

			await test.step('Publish the survey poll', async () => {
				await page.getByRole('link', { name: 'Publish' }).click();
				await page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
				await page.getByText('Survey successfully published.').click();
				console.log('Survey poll published successfully');
				// Verify we're back on the surveys management page
				expect(page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
			});
		});
	});
});

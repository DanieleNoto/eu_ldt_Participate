/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Antonio Abramo Carotenuto
 */

import { expect, Locator, Page } from '@playwright/test';
import { BaseAdminPage } from '../../../../BaseAdminPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { LocalizationUtils } from '@utils/localization.utils';
import { pasteTiptapContent } from '@utils/tiptap.utils';

/**
 * Page Object Model for Surveys management functionality.
 * Contains common helper functions used across survey-related tests.
 */
export class SurveysManagePage extends BaseAdminPage {
	static readonly VALIDATION_ERROR_STATEMENT_BLANK = 'cannot be blank';
	static readonly VALIDATION_ERROR_BODY_BLANK = 'cannot be blank';
	static readonly VALIDATION_ERROR_PRIVACY_POLICY_UNCHECKED = 'must be accepted';

	constructor(page: Page) {
		super(page);
	}

	/**
	 * Helper function to search and select a process by title
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts
	 */
	async searchAndSelectProcess(processTitle: string): Promise<void> {
		const processSearchParticipatory = this.page.getByRole('searchbox', { name: 'Search Participatory' });
		await processSearchParticipatory.click();
		await processSearchParticipatory.fill(processTitle);
		await this.page.getByRole('button', { name: 'Search' }).click();

		// Click on the created process to open edit page using the exact title
		await this.page
			.getByRole('link', {
				name: processTitle,
				exact: true
			})
			.click();
	}

	/**
	 * Helper function to configure step settings announcement
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply_to_a_survey.spec.ts
	 */
	async configureStepAnnouncement(announcementText: string): Promise<void> {
		await this.page.locator('div[contenteditable="true"][role="textbox"].tiptap.ProseMirror').nth(4).click();
		await this.page
			.locator('div[contenteditable="true"][role="textbox"].tiptap.ProseMirror')
			.nth(4)
			.fill(announcementText);
	}

	/**
	 * Helper function to verify published survey questions count
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply_to_a_survey.spec.ts
	 */
	async verifyPublishedQuestionsCount(expectedCount: number, flowDescription: string): Promise<void> {
		// Verify the cell with the expected count is visible to confirm the survey was created
		await expect(this.page.getByRole('cell', { name: expectedCount.toString(), exact: true })).toBeVisible();
		console.log(`Verified ${flowDescription}: ${expectedCount} question(s) published as expected`);
	}

	/**
	 * Helper function to setup test process
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply_to_a_survey.spec.ts
	 */
	async setupTestProcess(
		validProcessData: any,
		adminHomePage: any,
		processAdminPage: any,
		publishProcess: boolean = false,
		isPrivateProcess: boolean = false
	): Promise<{ processSlug: string; processEditUrl: string }> {
		// Navigate to admin home and processes
		await adminHomePage.navigateToAdminHomePage();
		await processAdminPage.navigateToProcesses();
		await this.page.waitForLoadState('load');

		// Create a new test process as prerequisite
		await processAdminPage.navigateToNewProcess();
		await processAdminPage.fillGeneralInfo(validProcessData.general);
		await processAdminPage.fillMetadataInfo(validProcessData.metadata);

		// Set visibility based on parameter
		if (isPrivateProcess) {
			await processAdminPage.setVisibilityToPrivate();
		} else {
			await processAdminPage.setVisibilityToPublic();
		}

		await processAdminPage.submitProcess();

		// Wait for process creation to complete
		await processAdminPage.expectSuccessMessage();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/steps/);

		// Log successful process creation
		console.log('New process created:', validProcessData.general.title);
		console.log('Process URL:', this.page.url());

		// Store the process slug for later use (extract from current URL)
		const currentUrl = this.page.url();
		const processSlugMatch = currentUrl.match(/\/admin\/participatory_processes\/([^\/]+)\//);
		const processSlug = processSlugMatch ? processSlugMatch[1] : '';

		// Navigate to the process edit page directly and store URL
		const processEditUrl = `/admin/participatory_processes/${processSlug}/edit`;
		await this.page.goto(processEditUrl);
		await this.page.waitForLoadState('load');

		console.log('Process edit URL stored:', processEditUrl);

		// Optionally publish the process (needed for reply-to-a-survey)
		if (publishProcess) {
			// Navigate to the processes list and publish via the Actions dropdown
			await this.page.goto('/admin/participatory_processes');
			await this.page.waitForLoadState('load');

			// Search for the process by title
			const searchInput = this.page.locator('input[name="q[title_cont]"]');
			await searchInput.fill(validProcessData.general.title);
			await searchInput.press('Enter');
			await this.page.waitForLoadState('load');

			// Open the Actions dropdown for the process row
			const processRow = this.page
				.locator('table tbody tr')
				.filter({ hasText: validProcessData.general.title })
				.first();
			const actionsButton = processRow.locator('button[data-controller="dropdown"]');
			await actionsButton.click();

			// Click Publish inside the dropdown
			const publishLink = processRow.locator('a[href*="/publish"]');
			await publishLink.click();
			await this.page.waitForLoadState('load');

			console.log('Process successfully published from processes list');
		}

		return { processSlug, processEditUrl };
	}

	/**
	 * Helper function to setup a complete published survey as prerequisite
	 * Used in: reply-to-a-survey.spec.ts
	 */
	async setupTestSurvey(
		processSlug: string,
		processEditUrl: string,
		updateProcessAdminPage: any,
		componentsPage: any
	): Promise<{ componentName: string; surveyName: string; surveyUrl: string }> {
		// Generate timestamp for component name
		const timestamp = Date.now().toString();
		const componentName = `Surveys_${timestamp}`;

		// Navigate back to edit page using stored URL
		await this.page.goto(processEditUrl);
		await this.page.waitForLoadState('load');

		// Verify we're on the edit page with process information using Page Object
		await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
		console.log('Process loaded with editable form containing existing information');

		// Navigate to Components section
		await updateProcessAdminPage.navigateToComponents();
		console.log('Navigated to Components section');

		// Create and publish survey component using helper function
		await this.createSurveyComponent(componentName, processSlug, componentsPage, true);

		// Access the Surveys component management
		await componentsPage.manageComponent(componentName);

		// Create survey with specific settings for reply functionality using helper function
		const surveyTimestamp = Date.now().toString();
		const surveyName = `survey_${surveyTimestamp}`;

		// Use createBasicSurvey with allowAnswers=true and get surveyUrl back
		const surveyUrl = await this.createBasicSurvey(surveyName, 'survey description', true);

		// Access questions management using helper function
		await this.accessQuestionsManagement();

		// Create the specific questions for reply-to-a-survey test
		const questionsCount = await this.createReplyTestQuestions();

		// Save survey questions using helper function
		await this.saveSurveyQuestions();

		// Navigate explicitly to the surveys list page before publishing
		const surveysManageUrl = surveyUrl.replace(/\/surveys(\/|$).*$/, '/surveys');
		await this.page.goto(surveysManageUrl);
		await this.page.waitForLoadState('domcontentloaded');
		console.log('Navigated to surveys manage page:', surveysManageUrl);

		// Publish the survey using helper function
		await this.publishSurvey();

		// Verify that the survey was actually created with the correct number of questions
		await this.verifyPublishedQuestionsCount(questionsCount, 'survey setup');

		console.log('Survey successfully created and published');

		// Verify we're back on the surveys management page
		expect(this.page.url()).toMatch(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);

		return { componentName, surveyName, surveyUrl };
	}

	/**
	 * Helper function to create a survey component with basic configuration
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply-to-a-survey.spec.ts
	 */

	/**
	 * User: clicks on "Add Component" and selects Survey
	 */
	async addComponentAndSelectSurvey(componentsPage: any, processSlug: string): Promise<void> {
		await componentsPage.addSurveysComponent();
		await this.page.waitForURL(`/admin/participatory_processes/${processSlug}/components/new?type=surveys`);
		console.log('Selected Survey component type using ComponentsPage');
	}

	/**
	 * System: displays the "Add Survey" form - Verification only
	 */
	async verifyAddSurveyFormDisplayed(): Promise<void> {
		// Verify the Add Survey form is displayed with required fields
		await expect(this.page.getByRole('textbox', { name: 'name' })).toBeVisible();
		await expect(this.page.getByRole('button', { name: 'Add component', exact: true })).toBeVisible();

		// Verify we're on the correct URL for adding surveys component
		expect(this.page.url()).toContain('/components/new?type=surveys');
		console.log('Add Survey form displayed with name field and add component button');
	}

	/**
	 * User: fulfills name and description input and clicks "Add component" button
	 */
	async fulfillSurveyFormAndCreateComponent(
		componentName: string,
		processSlug: string,
		publishComponent: boolean = false
	): Promise<void> {
		// Import LocalizationUtils dynamically
		const { LocalizationUtils } = await import('@utils/localization.utils');

		// Fill component name
		await this.page.getByRole('textbox', { name: 'name' }).click();
		await this.page.getByRole('textbox', { name: 'name' }).fill(componentName);

		// Fill global settings announcement using dynamic localization
		const globalAnnouncementSelector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.page,
			'component_settings_announcement'
		);
		await this.page.locator('div[contenteditable="true"][role="textbox"].tiptap.ProseMirror').first().click();
		await this.page
			.locator('div[contenteditable="true"][role="textbox"].tiptap.ProseMirror')
			.first()
			.fill('Global settings description');

		// Fill step settings announcement
		await this.configureStepAnnouncement('Step settings description');

		// Click Add component button to create the surveys component
		await this.page.getByRole('button', { name: 'Add component', exact: true }).click();
		await this.page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
		console.log(`Survey component "${componentName}" created successfully`);

		// Optionally publish the component (needed for reply-to-a-survey)
		if (publishComponent) {
			// Find the component row by name and open its Actions dropdown
			const componentRow = this.page.locator('table tbody tr').filter({ hasText: componentName }).first();
			const actionsButton = componentRow.locator('button[data-controller="dropdown"]');
			await actionsButton.click();

			// Click Publish inside the dropdown
			const publishLink = componentRow.locator('a[href*="/publish"]');
			await publishLink.click();

			await expect(this.page.getByText('The component has been')).toBeVisible();
			console.log('Component successfully published');
		}
	}

	/**
	 * Helper function to create a survey component with basic configuration
	 * Used in: create-detailed-surveys-with-configurable-options.spec.ts, reply-to-a-survey.spec.ts
	 */
	async createSurveyComponent(
		componentName: string,
		processSlug: string,
		componentsPage: any,
		publishComponent: boolean = false
	): Promise<void> {
		// Use the separated functions for complete component creation
		await this.addComponentAndSelectSurvey(componentsPage, processSlug);
		// Skip verification step for direct component creation
		await this.fulfillSurveyFormAndCreateComponent(componentName, processSlug, publishComponent);
	}

	/**
	 * Helper function to create and configure a new survey
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply-to-a-survey.spec.ts
	 */

	/**
	 * Accesses component and clicks "New survey"
	 */
	async accessComponentAndCreateNewSurvey(componentsPage: any, componentName: string): Promise<void> {
		// Access the Surveys component management
		await componentsPage.manageComponent(componentName);

		// Create new survey
		await this.page.getByRole('link', { name: 'New survey' }).click();
		// Accept both /surveys/new and /surveys/{id}/edit depending on app version
		await this.page.waitForURL(
			/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/(new|\d+\/edit)/
		);
		console.log('Accessed component and created new survey');
	}

	/**
	 * Displays template selection form
	 */
	async verifyTemplateSelectionDisplayed(): Promise<string> {
		// Accept both /surveys/new and /surveys/{id}/edit
		await this.page.waitForURL(
			/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/(new|\d+\/edit)/
		);

		// Save the survey URL for later use
		const surveyUrl = this.page.url();
		console.log('Template selection form displayed, Survey URL saved:', surveyUrl);

		return surveyUrl;
	}

	/**
	 * Clicks "Skip"
	 */
	async skipTemplateSelection(): Promise<void> {
		// Skip choose template
		const skipElement = this.page
			.getByRole('link', { name: 'Skip' })
			.or(this.page.getByRole('button', { name: 'Skip' }));
		if (await skipElement.isVisible().catch(() => false)) {
			await skipElement.click();

			await this.page.waitForLoadState('load');

			await this.page.waitForLoadState('domcontentloaded');

			await this.page.waitForTimeout(500);

			// Check if Skip button is still visible
			// If so, retry clicking it
			const skipStillVisible = await skipElement.isVisible().catch(() => false);
			if (skipStillVisible) {
				console.log('Skip button still visible, retrying click...');
				await skipElement.click();
				await this.page.waitForLoadState('load');
				await this.page.waitForTimeout(500);
			}

			const titleInput = this.page.locator('input[type="text"]').first();
			await titleInput.waitFor({ state: 'visible' });

			console.log('Clicked Skip to proceed without template, form is ready');
		}
	}

	/**
	 *Displays empty questionnaire form
	 */
	async verifyEmptyQuestionnaireDisplayed(): Promise<void> {
		// Verify the survey edit form is displayed with required fields
		const titleInput = this.page
			.locator('input[aria-label="title"]')
			.first()
			.or(this.page.locator('input[type="text"]').first());
		await expect(titleInput).toBeVisible();

		const descriptionEditor = this.page
			.locator('div[contenteditable="true"][role="textbox"].tiptap.ProseMirror')
			.first();
		await expect(descriptionEditor).toBeVisible();

		console.log('Survey edit form displayed with survey configuration options');
	}

	/**
	 * Fills name and description and saves
	 */
	async fillSurveyDetailsAndSave(
		surveyName: string,
		description: string = 'Survey description',
		privacyPolicy: string = 'Privacy policy'
	): Promise<void> {
		// Fill title using aria-label selector (language-independent)
		const titleInput = this.page.locator('input[aria-label="title"]').first();
		await titleInput.waitFor({ state: 'visible' });
		await titleInput.click();
		await titleInput.fill(surveyName);

		// Fill description
		const descriptionEditor = this.page.locator('[id^="survey_description_"] .editor-input .tiptap').first();
		await descriptionEditor.waitFor({ state: 'visible' });
		await pasteTiptapContent(descriptionEditor, description);

		// Fill Privacy Policy (TOS)
		const tosEditor = this.page.locator('[id^="survey_tos_"] .editor-input .tiptap').first();
		await tosEditor.waitFor({ state: 'visible' });
		await pasteTiptapContent(tosEditor, privacyPolicy);

		// Save survey using the specific form submit button
		const saveButton = this.page
			.locator('button[form="survey-form"]')
			.or(this.page.getByRole('button', { name: 'Save' }));
		await saveButton.click();
		// Wait for stabilisation: either a URL change or the success flash message
		await this.page.waitForLoadState('load');
		await expect(this.page.getByText('Survey successfully').first()).toBeVisible();
		console.log(`Survey "${surveyName}" created and saved successfully`);
	}

	/**
	 * Helper function to create and configure a new survey
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply-to-a-survey.spec.ts
	 */
	async createBasicSurvey(
		surveyName: string,
		description: string = 'Survey description',
		allowAnswers: boolean = false
	): Promise<string> {
		// Create new survey and verify template selection form
		await this.page.getByRole('link', { name: 'New survey' }).click();
		const surveyUrl = await this.verifyTemplateSelectionDisplayed();

		// Skip template selection
		await this.skipTemplateSelection();

		// Verify empty questionnaire form is displayed
		await this.verifyEmptyQuestionnaireDisplayed();

		// Fill survey details and save
		await this.fillSurveyDetailsAndSave(surveyName, description);

		// Handle allowAnswers configuration if needed
		if (allowAnswers) {
			// We're already on the survey edit page — navigate to the Settings tab
			await this.page.waitForLoadState('domcontentloaded');
			const settingsTab = this.page.locator('nav.main-nav a[href*="/settings/edit"]');
			await settingsTab.click();
			await this.page.waitForLoadState('load');

			// Enable "Allow responses" checkbox
			const allowResponsesCheckbox = this.page.locator('#survey_settings_allow_responses');
			if (!(await allowResponsesCheckbox.isChecked())) {
				await allowResponsesCheckbox.check();
			}
			console.log('Enabled "Allow responses" setting for survey');

			// Save the updated configuration
			await this.page.getByRole('button', { name: 'Save' }).click();
			await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/, {
				waitUntil: 'domcontentloaded'
			});
			await expect(this.page.getByText('Survey successfully saved.')).toBeVisible();
			console.log('Survey configuration updated with allow answers enabled');
		}

		return surveyUrl;
	}

	/**
	 * Helper function to create the specific questions for reply-to-a-survey test
	 * Used in: reply-to-a-survey.spec.ts (via setupTestSurvey)
	 */
	async createReplyTestQuestions(): Promise<number> {
		let questionsCount = 0;

		// Add new question
		await this.page.getByRole('button', { name: 'Add question' }).click();

		// Verify questions management interface is available
		await expect(this.page.getByRole('button', { name: 'Add question' })).toBeVisible();
		await expect(this.page.getByRole('button', { name: 'Add separator' })).toBeVisible();
		await expect(this.page.getByRole('button', { name: 'Add title and description' })).toBeVisible();
		console.log('Questions management interface displayed with add question options');

		// Add question 1: Long Answer
		await this.page.waitForSelector('.questionnaire-question:nth-child(1)');
		const question1Container = this.page.locator('.questionnaire-question:nth-child(1)');

		// Expand question form if collapsed
		const question1AccordionButton = question1Container.locator('.question--collapse').first();
		const isExpanded1 = await question1AccordionButton.getAttribute('aria-expanded');
		if (isExpanded1 === 'false') {
			await question1AccordionButton.click();
			await question1Container.locator('.editor-input').first().waitFor();
		}

		// await question1Container.locator('.tabs-panel.is-active input[type="text"]').fill('What is your opinion on this topic?');
		await question1Container
			.locator('.tabs-panel.is-active')
			.getByRole('textbox')
			.first()
			.fill('What is your opinion on this topic?');
		await question1Container.locator('.editor-input .tiptap').first().fill('Please share your thoughts');
		await question1Container.getByRole('checkbox', { name: 'Mandatory' }).check();
		await question1Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill('500');
		await question1Container.locator('select[name*="question_type"]').selectOption('long_response');

		questionsCount++;
		console.log('Added question 1: Long Answer');

		// Add question 2: Single Option
		await this.page.getByRole('button', { name: 'Add question' }).click();
		await this.page.waitForSelector('.questionnaire-question:nth-child(2)');
		const question2Container = this.page.locator('.questionnaire-question:nth-child(2)');

		// Expand question form if collapsed
		const question2AccordionButton = question2Container.locator('.question--collapse').first();
		const isExpanded2 = await question2AccordionButton.getAttribute('aria-expanded');
		if (isExpanded2 === 'false') {
			await question2AccordionButton.click();
			await question2Container.locator('.editor-input').first().waitFor();
		}

		await question2Container
			.locator('.tabs-panel.is-active')
			.getByRole('textbox')
			.first()
			.fill('What color do you prefer?');
		await question2Container.locator('.editor-input .tiptap').first().fill('select one of the available options');
		await question2Container.locator('select[name*="question_type"]').selectOption('single_option');

		// Fill the default two answer options that are automatically created
		await question2Container.locator('.questionnaire-question-response-option').first().waitFor();
		await question2Container
			.locator('.questionnaire-question-response-option')
			.first()
			.locator('.tabs-panel.is-active input[type="text"]')
			.fill('Blue');
		await question2Container
			.locator('.questionnaire-question-response-option')
			.nth(1)
			.locator('.tabs-panel.is-active input[type="text"]')
			.fill('Green');

		questionsCount++;
		console.log('Added question 2: Single Option');

		// Add question 3: Multiple Option
		await this.page.getByRole('button', { name: 'Add question' }).click();
		await this.page.waitForSelector('.questionnaire-question:nth-child(3)');
		const question3Container = this.page.locator('.questionnaire-question:nth-child(3)');

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
			.fill('Which pets do you prefer?');
		await question3Container.locator('.editor-input .tiptap').first().fill('select two of the available options');
		await question3Container.locator('select[name*="question_type"]').selectOption('multiple_option');

		// Fill the default two answer options that are automatically created
		await question3Container.locator('.questionnaire-question-response-option').first().waitFor();
		await question3Container
			.locator('.questionnaire-question-response-option')
			.first()
			.locator('.tabs-panel.is-active input[type="text"]')
			.fill('Cat');
		await question3Container
			.locator('.questionnaire-question-response-option')
			.nth(1)
			.locator('.tabs-panel.is-active input[type="text"]')
			.fill('Dog');

		// Add the additional two options
		await question3Container.getByRole('button', { name: 'Add response option' }).click();
		await question3Container.locator('.questionnaire-question-response-option').last().waitFor();
		await question3Container
			.locator('.questionnaire-question-response-option')
			.last()
			.locator('.tabs-panel.is-active input[type="text"]')
			.fill('Parrot');

		await question3Container.getByRole('button', { name: 'Add response option' }).click();
		await question3Container.locator('.questionnaire-question-response-option').last().waitFor();
		await question3Container
			.locator('.questionnaire-question-response-option')
			.last()
			.locator('.tabs-panel.is-active input[type="text"]')
			.fill('Fish');

		// Set maximum choices to 2
		await question3Container.getByLabel('Maximum number of choices').selectOption('2');

		questionsCount++;
		console.log('Added question 3: Multiple Option');

		return questionsCount;
	}

	/**
	 * Helper function to access questions management (creates a new form)
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply-to-a-survey.spec.ts (via setupTestSurvey)
	 */
	async accessQuestionsManagement(): Promise<void> {
		const questionsTab = this.page.locator('nav.main-nav a[href*="/questions/edit_questions"]');
		await questionsTab.click();
		await this.page.waitForLoadState('domcontentloaded');

		// The Questions tab may show a radio selection: "Create new form" or "Select template"
		const createNewFormLabel = this.page.locator('label[for="template_create_new_form"]');
		if (await createNewFormLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
			await createNewFormLabel.click();
			// Click the continue/submit button for "Create new form"
			const continueButton = this.page
				.locator('a[data-create-new-form-button="true"]')
				.or(this.page.getByRole('button', { name: 'Continue' }))
				.or(this.page.getByRole('link', { name: 'Continue' }));
			await continueButton.click();
			await this.page.waitForLoadState('domcontentloaded');
		}

		await this.page.waitForURL(
			/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/questions\/edit_questions/
		);
		await this.page.waitForLoadState('load');
		console.log('Accessed questions management page');
	}

	/**
	 * Navigate to Questions tab and apply a template
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts
	 */
	async accessQuestionsManagementWithTemplate(templateName: string): Promise<void> {
		const questionsTab = this.page.locator('nav.main-nav a[href*="/questions/edit_questions"]');
		await questionsTab.click();
		await this.page.waitForLoadState('domcontentloaded');

		// Click "Select template" radio button
		const selectTemplateLabel = this.page.locator('label[for="template_select_template"]');
		await selectTemplateLabel.waitFor({ state: 'visible' });
		await selectTemplateLabel.click();

		// Wait for the datalist input to appear and fill the template name
		const templateInput = this.page.locator('input[list="template-list"]');
		await templateInput.waitFor({ state: 'visible' });
		await templateInput.fill(templateName);

		// Click the submit button to apply the selected template
		const applyButton = this.page
			.getByRole('button', { name: 'Create from template' })
			.or(this.page.getByRole('button', { name: 'Apply template' }))
			.or(this.page.getByRole('button', { name: 'Continue' }));
		await applyButton.click();

		await this.page.waitForURL(
			/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/questions\/edit_questions/
		);
		await this.page.waitForLoadState('load');
		console.log(`Accessed questions management with template: "${templateName}"`);
	}

	/**
	 * Helper function to access questions management for a specific survey by title
	 * Finds the survey row in the table and clicks the "Manage questions" action
	 * @param surveyTitle - The title of the survey to manage
	 */
	/**
	 * Navigate to the Responses page for a specific survey by title
	 * Used in: export-survey-answers.spec.ts
	 */
	async accessSurveyResponsesBySurveyTitle(surveyTitle: string): Promise<void> {
		const surveyRow = this.page.locator('table.table-list tbody tr').filter({ hasText: surveyTitle }).first();

		// Try the dropdown link first (only present after at least one response exists).
		await surveyRow.locator('button[data-controller="dropdown"]').click();
		const responsesLink = surveyRow.locator('a.dropdown__button[href*="/responses"]');
		const hasResponsesLink = await responsesLink.isVisible({ timeout: 2000 }).catch(() => false);

		if (hasResponsesLink) {
			await responsesLink.click();
		} else {
			// The "Responses" entry is absent from the dropdown when the survey has no
			// responses yet (Decidim hides it). Build the URL directly from any known
			// dropdown href (e.g. the Edit link) and replace the trailing segment.
			const editLink = surveyRow.locator('a.dropdown__button[href*="/edit"]').first();
			const editHref = (await editLink.getAttribute('href')) ?? '';
			// editHref ends with /surveys/{id}/edit  – strip the trailing /edit
			const responsesUrl = editHref.replace(/\/edit$/, '/responses');
			await this.page.goto(responsesUrl);
		}

		await this.page.waitForURL(/\/surveys\/\d+\/responses/);
		await this.page.waitForLoadState('domcontentloaded');
		console.log(`Accessed responses page for survey: "${surveyTitle}"`);
	}

	async accessQuestionsManagementBySurveyTitle(surveyTitle: string): Promise<void> {
		// Find the row containing the survey title, open its dropdown, click Questions
		const surveyRow = this.page.locator('table.table-list tbody tr').filter({ hasText: surveyTitle }).first();
		await surveyRow.locator('button[data-controller="dropdown"]').click();
		await surveyRow.locator('a.dropdown__button[href*="/questions/edit_questions"]').click();
		await this.page.waitForLoadState('domcontentloaded');
		console.log(`Accessed questions management for survey: "${surveyTitle}"`);

		// The Questions tab may show a radio selection: "Create new form" or "Select template"
		const createNewFormLabel = this.page.locator('label[for="template_create_new_form"]');
		if (await createNewFormLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
			await createNewFormLabel.click();
			const continueButton = this.page
				.locator('a[data-create-new-form-button="true"]')
				.or(this.page.getByRole('button', { name: 'Continue' }))
				.or(this.page.getByRole('link', { name: 'Continue' }));
			await continueButton.click();
			await this.page.waitForLoadState('domcontentloaded');
		}

		await this.page.waitForURL(
			/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/questions\/edit_questions/
		);
		await this.page.waitForLoadState('load');
	}

	/**
	 *Clicks "Save" button to save survey questions
	 */
	async clickSaveQuestions(): Promise<void> {
		await this.page.getByRole('button', { name: 'Save' }).click();
		console.log('Clicked Save button to save survey questions');
	}

	/**
	 * Validates and confirms survey questions saved successfully
	 */
	async verifySurveyQuestionsSaved(): Promise<void> {
		// Decidim saves questions in-place (AJAX/Turbo) — no page navigation occurs.
		// Just wait for the flash message to become visible.
		await expect(this.page.getByText('Survey questions successfully')).toBeVisible();
		console.log('Survey questions saved successfully');
	}

	/**
	 * Helper function to save survey questions (complete flow)
	 * Used in: reply-to-a-survey.spec.ts (via setupTestSurvey)
	 */
	async saveSurveyQuestions(): Promise<void> {
		await this.clickSaveQuestions();
		await this.verifySurveyQuestionsSaved();
	}

	/**
	 * Helper function to publish a survey
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply-to-a-survey.spec.ts (via setupTestSurvey)
	 */
	async publishSurvey(): Promise<void> {
		// If we're on a survey sub-page (edit, questions, settings...), navigate up to the component manage page
		const currentUrl = this.page.url();
		if (/\/manage\/surveys\/\d+/.test(currentUrl)) {
			const manageUrl = currentUrl.replace(/\/manage\/surveys\/\d+.*$/, '/manage/');
			await this.page.goto(manageUrl);
			await this.page.waitForLoadState('domcontentloaded');
		}

		// Open the Actions dropdown for the survey row
		const actionsButton = this.page.locator('button[data-controller="dropdown"]').last();
		await actionsButton.click();

		// Click Publish inside the dropdown
		const publishLink = this.page.locator('a[href*="/publish"]').last();
		await publishLink.click();

		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/, {
			waitUntil: 'domcontentloaded'
		});
		await expect(this.page.getByText('Survey successfully published.')).toBeVisible();
		console.log('Survey successfully published');
	}

	/**
	 * Helper function to verify process details are displayed
	 * Used in: reply-to-a-survey.spec.ts
	 */
	async verifyProcessDetailsDisplayed(validProcessData: any, componentName: string): Promise<void> {
		// Verify process title is displayed
		await expect(this.page.getByRole('heading', { name: validProcessData.general.title })).toBeVisible();
		console.log('Process title is visible');

		// Verify process description is displayed
		await expect(this.page.getByText(validProcessData.general.description)).toBeVisible();
		console.log('Process description is visible');

		// Verify survey component is available in the jump navigation
		await expect(this.page.getByText(`Jump to: ${componentName}`)).toBeVisible();
		console.log(`Survey component "${componentName}" is visible`);
	}

	/**
	 * Helper function to select and navigate to a survey
	 * Used in: reply-to-a-survey.spec.ts
	 */
	async selectSurveyToParticipate(componentName: string, surveyName: string): Promise<void> {
		// Click the "Jump to: <componentName>" link on the process page
		const surveyComponentLink = this.page.getByText(`Jump to: ${componentName}`);
		await surveyComponentLink.click();

		// Wait for component page to load
		await this.page.waitForLoadState('load');
		console.log('Navigated to survey component page via direct link');
		console.log('Component page URL:', this.page.url());

		// Now navigate to the specific survey from the component page
		const surveyLink = this.page.getByRole('link', { name: `${surveyName} survey` });
		await surveyLink.click();
	}

	/**
	 * Helper function to verify survey form is displayed with all questions
	 * Used in: reply-to-a-survey.spec.ts
	 */
	async verifySurveyFormDisplayed(): Promise<void> {
		// Wait for survey questions page to load
		await this.page.waitForLoadState('load');
		console.log('Navigated to survey questions page');
		console.log('Survey questions page URL:', this.page.url());

		// Verify Question 1: Long Answer is visible
		await expect(this.page.getByText('What is your opinion on this')).toBeVisible();
		await expect(this.page.locator('#questionnaire_responses_0')).toBeVisible();
		console.log('Question 1 (Long Answer) is visible');

		// Verify Question 2: Single Option is visible with options
		await expect(this.page.getByText('What color do you prefer?')).toBeVisible();
		await expect(this.page.getByRole('radio', { name: 'Blue' })).toBeVisible();
		await expect(this.page.getByRole('radio', { name: 'Green' })).toBeVisible();
		console.log('Question 2 (Single Option) is visible');

		// Verify Question 3: Multiple Option is visible with options
		await expect(this.page.getByText('Which pets do you prefer?')).toBeVisible();
		await expect(this.page.getByRole('checkbox', { name: 'Cat' })).toBeVisible();
		await expect(this.page.getByRole('checkbox', { name: 'Dog' })).toBeVisible();
		await expect(this.page.getByRole('checkbox', { name: 'Parrot' })).toBeVisible();
		await expect(this.page.getByRole('checkbox', { name: 'Fish' })).toBeVisible();
		console.log('Question 3 (Multiple Option) is visible');

		console.log('Survey form is fully displayed with all questions and response fields');
	}

	/**
	 * Helper function to fill survey responses
	 * Used in: reply-to-a-survey.spec.ts
	 */
	async fillSurveyResponses(): Promise<void> {
		// Fill Question 1: Long Answer
		await this.page.locator('#questionnaire_responses_0').click();
		await this.page.locator('#questionnaire_responses_0').fill('I really like this topic.');

		// Fill Question 2: Single Option
		await this.page.getByRole('radio', { name: 'Blue' }).click();

		// Accept terms and conditions
		const termsCheckbox = this.page.locator('#questionnaire_tos_agreement');
		if (!(await termsCheckbox.isChecked())) {
			await termsCheckbox.check();
		}

		console.log('All survey questions completed with responses');
	}

	/**
	 * Helper function to submit survey
	 * Used in: reply-to-a-survey.spec.ts
	 */
	async submitSurvey(): Promise<void> {
		await this.page.getByRole('button', { name: 'Submit' }).click();
		console.log('Clicked Submit button');
	}

	/**
	 * Helper function to validate and confirm survey submission
	 * Used in: reply-to-a-survey.spec.ts
	 */
	async validateAndConfirmSubmission(): Promise<void> {
		// Confirm submission by clicking OK on confirmation dialog
		await this.page.getByRole('button', { name: 'OK', exact: true }).click();
		console.log('Confirmed survey submission by clicking OK');
	}

	/**
	 * Helper function to verify survey submission success
	 * Used in: reply-to-a-survey.spec.ts
	 */
	async verifySurveySubmissionSuccess(): Promise<void> {
		await this.page.waitForLoadState('load');
		// Verify successful submission message is displayed
		await expect(this.page.getByText('Survey successfully responded')).toBeVisible();

		// Verify that the survey shows as already answered
		await expect(this.page.getByText('Already responded', { exact: true })).toBeVisible();
		console.log('Survey successfully submitted and answered');
	}

	/**
	 * Helper function to verify survey validation errors are displayed
	 * Used in: reply-to-a-survey.spec.ts Alternative Flow validation tests
	 */
	async verifySurveyValidationErrors(): Promise<void> {
		// Verify validation error for missing mandatory field is displayed
		await expect(this.page.getByText(SurveysManagePage.VALIDATION_ERROR_BODY_BLANK).first()).toBeVisible();
		await expect(this.page.getByText(SurveysManagePage.VALIDATION_ERROR_PRIVACY_POLICY_UNCHECKED)).toBeVisible();
		console.log('Survey validation errors are displayed for missing mandatory fields');
	}

	/**
	 * Helper function to fill question description field
	 * Automatically detects current locale and fills the correct language editor
	 * @param questionContainer - The locator for the question container
	 * @param descriptionText - The text to fill in the description
	 * @param languageCode - Optional language code
	 */
	async fillQuestionDescription(
		questionContainer: any,
		descriptionText: string,
		languageCode?: string
	): Promise<void> {
		// Auto-detect language if not provided
		const currentLanguage = languageCode || LocalizationUtils.getCurrentLocale(this.page);

		const editorInputs = questionContainer.locator('.editor-input');
		const count = await editorInputs.count();

		// Strategy 1: Match by aria-labelledby containing language code
		for (let i = 0; i < count; i++) {
			const editorDiv = editorInputs.nth(i);
			const tiptapEditor = editorDiv.locator('.tiptap');
			const ariaLabelledBy = await tiptapEditor.getAttribute('aria-labelledby');

			if (ariaLabelledBy && new RegExp(`.*${currentLanguage}.*`, 'i').test(ariaLabelledBy)) {
				await tiptapEditor.click();
				await tiptapEditor.fill(descriptionText);
				console.log(`Filled question description for language '${currentLanguage}' via aria-labelledby`);
				return;
			}
		}

		// Strategy 2 (Fallback): Use first available editor
		const firstEditor = editorInputs.first().locator('.tiptap');
		await firstEditor.click();
		await firstEditor.fill(descriptionText);
		console.log(`Filled question description using first available editor (fallback)`);
	}

	/**
	 * Fills question statement (title) which is in language-specific tab panels
	 */
	async fillQuestionStatement(
		questionContainer: Locator,
		statementText: string,
		languageCode?: string
	): Promise<void> {
		const currentLanguage = languageCode || (await LocalizationUtils.getCurrentLocale(this.page));

		// Find the active tab panel
		const tabPanels = questionContainer.locator('[role="tabpanel"]');
		const count = await tabPanels.count();

		// Strategy 1: Look for the active tab panel
		for (let i = 0; i < count; i++) {
			const panel = tabPanels.nth(i);
			const isHidden = await panel.getAttribute('aria-hidden');
			if (isHidden === 'false') {
				const input = panel.locator('input[type="text"]').first();
				await input.fill(statementText);
				console.log(`Filled question statement in active language tab`);
				return;
			}
		}

		// Strategy 2 (Fallback): Use first input in first panel
		const firstInput = questionContainer.locator('[role="tabpanel"]').first().locator('input[type="text"]').first();
		await firstInput.fill(statementText);
		console.log(`Filled question statement using first available input (fallback)`);
	}

	/**
	 * Checks the Mandatory checkbox for a question
	 */
	async checkMandatory(questionContainer: Locator): Promise<void> {
		await questionContainer.getByRole('checkbox', { name: 'Mandatory' }).check();
		console.log('Checked Mandatory checkbox');
	}

	/**
	 * Fills character limit for a question
	 */
	async fillCharacterLimit(questionContainer: Locator, limit: string): Promise<void> {
		await questionContainer.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill(limit);
		console.log(`Set character limit to ${limit}`);
	}

	/**
	 * Selects question type from dropdown
	 */
	async selectQuestionType(questionContainer: Locator, typeValue: string): Promise<void> {
		await questionContainer.locator('select[name*="question_type"]').selectOption(typeValue);
		console.log(`Selected question type: ${typeValue}`);
	}

	/**
	 * Helper function to reply to a survey as a user
	 * Used in: review-result-of-specific-surveys.spec.ts
	 */
	async replytoSurvey(
		processSlug: string,
		componentName: string,
		surveyName: string,
		validProcessData: any
	): Promise<void> {
		// Initialize PUBLIC Page Objects (assumes USER context is already set)
		const homePage = new HomePage(this.page);
		const processDetailPage = new ProcessDetailPage(this.page);
		const publicSurveysPage = new SurveysManagePage(this.page);

		// Navigate to home and then to specific process
		await homePage.navigateToHomePage();
		await this.page.goto(`/processes/${processSlug}`);
		await processDetailPage.waitForPageLoad();

		// Execute survey reply actions
		await publicSurveysPage.verifyProcessDetailsDisplayed(validProcessData, componentName);
		await publicSurveysPage.selectSurveyToParticipate(componentName, surveyName);
		await publicSurveysPage.verifySurveyFormDisplayed();
		await publicSurveysPage.fillSurveyResponses();
		await publicSurveysPage.submitSurvey();
		await publicSurveysPage.validateAndConfirmSubmission();
		await publicSurveysPage.verifySurveySubmissionSuccess();

		console.log('Survey reply actions completed successfully');
	}
}

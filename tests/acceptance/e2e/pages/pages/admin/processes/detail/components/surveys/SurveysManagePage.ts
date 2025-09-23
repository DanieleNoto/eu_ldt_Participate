import { expect, Page } from '@playwright/test';
import { BaseAdminPage } from '../../../../BaseAdminPage';
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';

/**
 * Page Object Model for Surveys management functionality.
 * Contains common helper functions used across survey-related tests.
 */
export class SurveysManagePage extends BaseAdminPage {
	static readonly VALIDATION_ERROR_STATEMENT_BLANK = 'Statementcannot be blank';
	static readonly VALIDATION_ERROR_BODY_BLANK = 'characters left500 characters leftBody cannot be blank';

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

		// Click on the created process to open edit page
		await this.page
			.getByRole('link', {
				name: processTitle.split(' ')[0] + ' ' + processTitle.split(' ')[1]
			})
			.click();
	}

	/**
	 * Helper function to configure step settings announcement
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply_to_a_survey.spec.ts
	 */
	async configureStepAnnouncement(announcementText: string): Promise<void> {
		await this.page.getByRole('group', { name: 'Introduction' }).getByLabel('Announcement').click();
		await this.page.getByRole('group', { name: 'Introduction' }).getByLabel('Announcement').fill(announcementText);
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
		await this.page.waitForLoadState('networkidle');

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
		await this.page.waitForLoadState('networkidle');

		console.log('Process edit URL stored:', processEditUrl);

		// Optionally publish the process (needed for reply-to-a-survey)
		if (publishProcess) {
			await this.page.getByRole('link', { name: 'Publish' }).click();
			await this.page.goto(processEditUrl);
			console.log('Process successfully published');
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
		await this.page.waitForLoadState('networkidle');

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
		await this.page.locator(globalAnnouncementSelector).getByRole('textbox', { name: 'Announcement' }).click();
		await this.page
			.locator(globalAnnouncementSelector)
			.getByRole('textbox', { name: 'Announcement' })
			.fill('Global settings description');

		// Fill step settings announcement
		await this.configureStepAnnouncement('Step settings description');

		// Click Add component button to create the surveys component
		await this.page.getByRole('button', { name: 'Add component', exact: true }).click();
		await this.page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
		console.log(`Survey component "${componentName}" created successfully`);

		// Optionally publish the component (needed for reply-to-a-survey)
		if (publishComponent) {
			await this.page.getByRole('link', { name: 'Publish' }).click();
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
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/);
		console.log('Accessed component and created new survey');
	}

	/**
	 * Displays template selection form
	 */
	async verifyTemplateSelectionDisplayed(): Promise<string> {
		// Verify we're on the template selection page
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/);

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
		const skipLink = this.page.getByRole('link', { name: 'Skip' });
		const skipLinkVisible = await skipLink.isVisible().catch(() => false);
		if (skipLinkVisible) {
			await skipLink.click();
			await this.page.waitForURL(
				/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit/
			);
			console.log('Clicked Skip to proceed without template');
		}
	}

	/**
	 *Displays empty questionnaire form
	 */
	async verifyEmptyQuestionnaireDisplayed(): Promise<void> {
		// Verify the empty questionnaire form is displayed
		await expect(this.page.getByRole('textbox', { name: 'title' })).toBeVisible();
		await expect(this.page.getByRole('textbox', { name: 'Description' })).toBeVisible();

		// Verify that the fields are empty as expected for a new questionnaire
		await expect(this.page.getByRole('textbox', { name: 'title' })).toHaveValue('');

		const descriptionField = this.page.getByRole('textbox', { name: 'Description' }).first();
		await expect(descriptionField).toHaveText('');

		console.log('Empty questionnaire form displayed with survey configuration options');
	}

	/**
	 * Fills name and description and saves
	 */
	async fillSurveyDetailsAndSave(surveyName: string, description: string = 'Survey description'): Promise<void> {
		// Fill survey details
		await this.page.getByRole('textbox', { name: 'title' }).click();
		await this.page.getByRole('textbox', { name: 'title' }).fill(surveyName);

		await this.page.getByRole('textbox', { name: 'Description' }).click();
		await this.page.getByRole('textbox', { name: 'Description' }).fill(description);

		await this.page.getByRole('textbox', { name: 'Terms of service' }).click();
		await this.page.getByRole('textbox', { name: 'Terms of service' }).fill('TOS');

		// Save survey
		await this.page.getByRole('button', { name: 'Save' }).click();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
		await expect(this.page.getByText('Survey successfully saved.')).toBeVisible();
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
			// Navigate back to survey to configure allow answers setting
			await this.page.goto(surveyUrl);
			await this.page.waitForLoadState('networkidle');

			// Configure allow answers by clicking on the text (which activates the checkbox)
			await this.page.getByText('Allow answers').click();
			console.log('Enabled "Allow answers" setting for survey');

			// Save the updated configuration
			await this.page.getByRole('button', { name: 'Save' }).click();
			await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
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
			await question1Container.locator('.editor-input').waitFor();
		}

		await question1Container
			.getByRole('textbox', { name: 'Statement' })
			.fill('What is your opinion on this topic?');
		await question1Container.locator('.editor-input .tiptap').fill('Please share your thoughts');
		await question1Container.getByRole('checkbox', { name: 'Mandatory' }).check();
		await question1Container.getByRole('spinbutton', { name: 'Character limit (leave to 0' }).fill('500');
		await question1Container.getByLabel('TypeShort answer Long answer').selectOption('long_answer');

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
			await question2Container.locator('.editor-input').waitFor();
		}

		await question2Container.getByRole('textbox', { name: 'Statement' }).fill('What color do you prefer?');
		await question2Container.locator('.editor-input .tiptap').fill('select one of the available options');
		await question2Container.getByLabel('TypeShort answer Long answer').selectOption('single_option');

		// Fill the default two answer options that are automatically created
		await question2Container.locator('.questionnaire-question-answer-option').first().waitFor();
		await question2Container
			.locator('.questionnaire-question-answer-option')
			.first()
			.getByRole('textbox', { name: 'Statement' })
			.fill('Blue');
		await question2Container
			.locator('.questionnaire-question-answer-option')
			.nth(1)
			.getByRole('textbox', { name: 'Statement' })
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
			await question3Container.locator('.editor-input').waitFor();
		}

		await question3Container.getByRole('textbox', { name: 'Statement' }).fill('Which pets do you prefer?');
		await question3Container.locator('.editor-input .tiptap').fill('select two of the available options');
		await question3Container.getByLabel('TypeShort answer Long answer').selectOption('multiple_option');

		// Fill the default two answer options that are automatically created
		await question3Container.locator('.questionnaire-question-answer-option').first().waitFor();
		await question3Container
			.locator('.questionnaire-question-answer-option')
			.first()
			.getByRole('textbox', { name: 'Statement' })
			.fill('Cat');
		await question3Container
			.locator('.questionnaire-question-answer-option')
			.nth(1)
			.getByRole('textbox', { name: 'Statement' })
			.fill('Dog');

		// Add the additional two options
		await question3Container.getByRole('button', { name: 'Add answer option' }).click();
		await question3Container.locator('.questionnaire-question-answer-option').last().waitFor();
		await question3Container
			.locator('.questionnaire-question-answer-option')
			.last()
			.getByRole('textbox', { name: 'Statement' })
			.fill('Parrot');

		await question3Container.getByRole('button', { name: 'Add answer option' }).click();
		await question3Container.locator('.questionnaire-question-answer-option').last().waitFor();
		await question3Container
			.locator('.questionnaire-question-answer-option')
			.last()
			.getByRole('textbox', { name: 'Statement' })
			.fill('Fish');

		// Set maximum choices to 2
		await question3Container.getByLabel('Maximum number of choices').selectOption('2');

		questionsCount++;
		console.log('Added question 3: Multiple Option');

		return questionsCount;
	}

	/**
	 * Helper function to access questions management
	 * Used in: create-single-question-polls.spec.ts, create-detailed-surveys-with-configurable-options.spec.ts, reply-to-a-survey.spec.ts (via setupTestSurvey)
	 */
	async accessQuestionsManagement(): Promise<void> {
		await this.page.locator('a[title="Manage questions"]').click();
		await this.page.waitForURL(
			/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys\/\d+\/edit_questions/
		);
		await this.page.waitForLoadState('networkidle');
		console.log('Accessed questions management page');
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
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage\/surveys/);
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
		await this.page.getByRole('link', { name: 'Publish' }).click();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components\/\d+\/manage/);
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
		// Click directly on the survey component link on the process page
		const surveyComponentLink = this.page.getByRole('link', { name: componentName });
		await surveyComponentLink.click();

		// Wait for component page to load
		await this.page.waitForLoadState('networkidle');
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
		await this.page.waitForLoadState('networkidle');
		console.log('Navigated to survey questions page');
		console.log('Survey questions page URL:', this.page.url());

		// Verify Question 1: Long Answer is visible
		await expect(this.page.getByText('What is your opinion on this')).toBeVisible();
		await expect(this.page.getByRole('textbox', { name: '1 What is your opinion on' })).toBeVisible();
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
		await this.page.getByRole('textbox', { name: '1 What is your opinion on' }).click();
		await this.page.getByRole('textbox', { name: '1 What is your opinion on' }).fill('I really like this topic.');

		// Fill Question 2: Single Option
		await this.page.getByRole('radio', { name: 'Blue' }).click();

		// Accept terms and conditions
		const termsCheckbox = this.page.getByRole('checkbox', { name: 'By participating you accept' });
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
		await this.page.waitForLoadState('networkidle');
		// Verify successful submission message is displayed
		await expect(this.page.getByText('Survey successfully answered.')).toBeVisible();

		// Verify that the survey shows as already answered
		await expect(this.page.getByText('Already answered You have')).toBeVisible();
		console.log('Survey successfully submitted and answered');
	}

	/**
	 * Helper function to verify survey validation errors are displayed
	 * Used in: reply-to-a-survey.spec.ts Alternative Flow validation tests
	 */
	async verifySurveyValidationErrors(): Promise<void> {
		// Verify validation error for missing mandatory field is displayed
		await expect(this.page.getByText(SurveysManagePage.VALIDATION_ERROR_BODY_BLANK)).toBeVisible();
		console.log('Survey validation errors are displayed for missing mandatory fields');
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

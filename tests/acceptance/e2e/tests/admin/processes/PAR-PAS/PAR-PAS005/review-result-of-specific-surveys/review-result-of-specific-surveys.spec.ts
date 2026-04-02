/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test, expect } from '@fixtures/parallel-test-reserved';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';

/**
 * Enables City administrators to see result of specific survey
 * User Story: As a city administrator, I want to review answer provided by Citizen on a specific survey.
 * Requirements: PAR R16
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The City Administrator has permissions to create surveys.
 *
 * @reserved - This test requires both ADMIN and USER accounts and must run sequentially.
 * Uses parallel-test-reserved fixture which provides adminPage and userPage.
 */

test.describe('[PAR-PAS005] – Review result of specific surveys @reserved', () => {
	// Force sequential execution for tests requiring multiple user interactions
	test.describe.configure({ mode: 'serial' });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let surveysManagePage: SurveysManagePage;
	let validProcessData: any;
	let processEditUrl: string;

	// Variables for the setup
	let processSlug: string;
	let componentName: string;
	let surveyName: string;

	// Common setup for both flows (only Page Objects)
	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		componentsPage = new ComponentsPage(adminPage);
		surveysManagePage = new SurveysManagePage(adminPage);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();
	});

	/**
	 * Setup test environment with responses (for Main Flow)
	 * @param userPage - The user page fixture provided by parallel-test-reserved
	 */
	async function setupTestProcessWithResponses(userPage: any) {
		await test.step('Setup: Create new test process as prerequisite', async () => {
			const { processSlug: slug, processEditUrl: url } = await surveysManagePage.setupTestProcess(
				validProcessData,
				adminHomePage,
				processAdminPage,
				true // publish the process
			);
			processSlug = slug;
			processEditUrl = url;
			console.log('Test process setup completed');
		});

		await test.step('Setup: Create a published survey as prerequisite', async () => {
			const surveySetup = await surveysManagePage.setupTestSurvey(
				processSlug,
				processEditUrl,
				updateProcessAdminPage,
				componentsPage
			);

			componentName = surveySetup.componentName;
			surveyName = surveySetup.surveyName;
		});

		await test.step('Setup: Create survey responses as prerequisite', async () => {
			// Use the userPage fixture from parallel-test-reserved (already authenticated)
			const userSurveysPage = new SurveysManagePage(userPage);

			// Execute only the survey actions
			await userSurveysPage.replytoSurvey(processSlug, componentName, surveyName, validProcessData);

			console.log('Survey responses created successfully');
		});
	}

	/**
	 * Setup test environment without responses (for Alternative Flow)
	 */
	async function setupTestProcessWithoutResponses() {
		await test.step('Setup: Create new test process as prerequisite', async () => {
			const { processSlug: slug, processEditUrl: url } = await surveysManagePage.setupTestProcess(
				validProcessData,
				adminHomePage,
				processAdminPage,
				true // publish the process
			);
			processSlug = slug;
			processEditUrl = url;
			console.log('Test process setup completed');
		});

		await test.step('Setup: Create a published survey as prerequisite (without responses)', async () => {
			const surveySetup = await surveysManagePage.setupTestSurvey(
				processSlug,
				processEditUrl,
				updateProcessAdminPage,
				componentsPage
			);

			componentName = surveySetup.componentName;
			surveyName = surveySetup.surveyName;
		});

		console.log('Setup completed: Process and survey created without responses');
	}

	test.describe('Main Flow', () => {
		// Specific setup for Main Flow (with responses)
		test.beforeEach(async ({ userPage }) => {
			await setupTestProcessWithResponses(userPage);
		});

		test('should review results of specific surveys', async ({ adminPage }) => {
			let responsePage: any;
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

			await test.step('3. User: Selects the process related to the specific survey', async () => {
				// Search for the specific process created in setup using its exact title
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);
				console.log(`Selected the specific process created in setup: "${validProcessData.general.title}"`);
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await adminPage.waitForLoadState('load');

				// Verify we're on the edit page with process information using Page Object
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});

			await test.step('5. User: Navigates to the "Components -> Survey Name" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToComponents();
				await componentsPage.manageComponent(componentName);
				console.log('Accessed survey component for results review');

				await surveysManagePage.accessSurveyResponsesBySurveyTitle(surveyName);
				console.log('Navigated to Responses page for survey results review');
			});

			await test.step('6. System: Displays the survey Responses page with individual response rows.', async () => {
				// Verify we're on the responses page
				expect(adminPage.url()).toMatch(/\/surveys\/\d+\/responses$/);

				// Verify the header shows total responses with a number
				const header = adminPage.getByRole('heading');
				await expect(header).toContainText('total responses');
				const headerText = await header.textContent();
				const numberMatch = headerText?.match(/(\d+)\s+total responses/);
				expect(numberMatch).toBeTruthy();
				expect(parseInt(numberMatch![1])).toBeGreaterThan(0);
				console.log(`Header shows ${numberMatch![1]} total responses`);

				// Verify at least one response row is present
				await expect(adminPage.getByRole('cell', { name: '1', exact: true })).toBeVisible();
				await expect(adminPage.getByRole('cell', { name: 'Registered' })).toBeVisible();
				await expect(adminPage.locator('td:has-text("%")')).toBeVisible();
				const totalResponses = await adminPage.locator('tbody tr').count();
				expect(totalResponses).toBeGreaterThan(0);
				console.log(`Responses page loaded with ${totalResponses} response row(s)`);
			});

			await test.step('7. User: Opens the actions dropdown for the first response and clicks "Show responses"', async () => {
				const firstRow = adminPage.locator('tbody tr').first();
				await firstRow.locator('button[data-controller="dropdown"]').click();

				// "Show responses" opens in a new tab (target="_blank"); "Export" does not → use target="_blank" to disambiguate
				const popupPromise = adminPage.waitForEvent('popup');
				await firstRow.locator('a.dropdown__button[target="_blank"]').click();
				responsePage = await popupPromise;
				await responsePage.waitForLoadState('load');
				console.log('Opened individual response in new tab');
			});

			await test.step('8. System: Loads the individual response detail page in a new tab', async () => {
				// Verify we're on the individual response page
				expect(responsePage.url()).toMatch(/\/responses\/\w+$/);
				console.log('Individual response page loaded in new tab');
			});

			await test.step('9. User: Reviews the survey results', async () => {
				// Question 1: Opinion
				await expect(responsePage.getByText('What is your opinion on this topic?')).toBeVisible();
				await expect(responsePage.getByText('I really like this topic')).toBeVisible();

				// Question 2: Color preference
				await expect(responsePage.getByText('What color do you prefer?')).toBeVisible();
				await expect(responsePage.getByText('Blue')).toBeVisible();

				// Question 3: Pet preference
				await expect(responsePage.getByText('Which pets do you prefer?')).toBeVisible();
				const petQuestion = responsePage.getByText('Which pets do you prefer?');
				const petAnswer = petQuestion.locator('xpath=following-sibling::dd[1]');
				await expect(petAnswer).toHaveText('-');

				console.log('Survey questions and responses verified');

				await responsePage.close();
				console.log('Response details tab closed');
			});
		});
	});

	test.describe('Alternative Flow: No Responses Available', () => {
		// Specific Setup for Alternative Flow (without responses)
		test.beforeEach(async () => {
			await setupTestProcessWithoutResponses();
		});

		test('should display appropriate message when no responses are available', async ({ adminPage }) => {
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

			await test.step('3. User: Selects the process related to the specific survey', async () => {
				// Search for the specific process created in setup using its exact title
				await surveysManagePage.searchAndSelectProcess(validProcessData.general.title);
				console.log(`Selected the specific process created in setup: "${validProcessData.general.title}"`);
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				await adminPage.waitForURL(/\/admin\/participatory_processes\/.*\/edit/);
				await adminPage.waitForLoadState('load');

				// Verify we're on the edit page with process information using Page Object
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
			});

			await test.step('5. User: Navigates to the "Components -> Survey Name" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToComponents();
				await componentsPage.manageComponent(componentName);
				console.log('Accessed survey component for results review');

				await surveysManagePage.accessSurveyResponsesBySurveyTitle(surveyName);
				console.log('Navigated to Responses page for survey results review');
			});

			await test.step('6. System: Displays the survey Responses page.', async () => {
				// Verify we're on the responses page
				expect(adminPage.url()).toMatch(/\/surveys\/\d+\/responses$/);
				console.log('Survey Responses page displayed');
			});
			await test.step('7.1. System: Detects that no responses have been submitted yet.', async () => {
				// With no responses, the responses table should be empty (0 rows)
				const responseRows = adminPage.locator('tbody tr');
				const count = await responseRows.count();
				expect(count).toBe(0);
				console.log('System correctly shows empty responses table (no responses submitted yet)');
			});
		});
	});
});

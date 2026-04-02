/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test, expect } from '@fixtures/keycloak-test';
import { AdminHomePage } from '../../../../../../pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '../../../../../../pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '../../../../../../pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '../../../../../../pages/pages/admin/processes/detail/components/ComponentsPage';
import { SurveysManagePage } from '../../../../../../pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { LDTUseCaseScenariosComponentPage } from '../../../../../../pages/pages/admin/processes/detail/components/LDTUseCaseScenariosComponentPage';
import { ProcessDetailPage } from '../../../../../../pages/pages/public/processes/ProcessDetailPage';
import { UseCaseScenariosPage } from '../../../../../../pages/pages/public/processes/UseCaseScenariosPage';

/**
 * Allows City Administrators to configure the display of Use Case information within a specific process
 * User Story: As a City Administrator, I want to configure the display of Use Case information in a specific process so that citizens can understand the context and implications of the linked scenario.
 * Requirements: PAR R8, PAR R20
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The Use Case information is available in the EU LDT Use Cases & Scenarios Tool.
 */

test.describe('@useKeycloak [PAR-PPM007] - Configure use case information in process', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let surveysManagePage: SurveysManagePage;
	let ldtUseCaseScenariosPage: LDTUseCaseScenariosComponentPage;
	let processDetailPage: ProcessDetailPage;
	let useCaseScenariosPage: UseCaseScenariosPage;

	// Use existing process
	const processSlug = 'test';
	const processTitle = 'Update Test0';

	// Variables to track created resources for cleanup
	let selectedExperimentId: string | null = null;
	let componentId: string | null = null;
	let componentName: string | null = null;

	test.beforeEach(async ({ adminPage }) => {
		// Initialize page objects with adminPage from fixture (already authenticated)
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		componentsPage = new ComponentsPage(adminPage);
		surveysManagePage = new SurveysManagePage(adminPage);
		ldtUseCaseScenariosPage = new LDTUseCaseScenariosComponentPage(adminPage);
		processDetailPage = new ProcessDetailPage(adminPage);
		useCaseScenariosPage = new UseCaseScenariosPage(adminPage);

		// Navigate to admin dashboard
		await adminHomePage.goToAdminDashboard();
	});

	test.afterEach(async ({ adminPage }) => {
		if (selectedExperimentId && componentId) {
			try {
				console.log('Starting cleanup: Deleting association...');

				// Navigate to manage page for the component
				await ldtUseCaseScenariosPage.navigateToManagePage(processSlug, componentId);
				console.log(`Navigated to manage page for component ${componentId}`);

				// Delete the association by experiment ID
				await ldtUseCaseScenariosPage.deleteAssociationByExperimentId(selectedExperimentId);
				console.log('Association deleted successfully');

				// Navigate to components page
				await componentsPage.navigateToComponents(processSlug);

				// Hide the component
				await componentsPage.hideComponentByName(componentName);

				// Unpublish component
				await componentsPage.unpublishComponentByName(componentName);

				// Delete component
				await componentsPage.deleteComponentIfExists(componentName);
			} catch (error) {
				if (error instanceof Error) {
					console.error('Cleanup failed:', error.message);
					console.error('Stack trace:', error.stack);
				} else {
					console.error('Cleanup failed with unknown error:', String(error));
				}
			}
		}

		// Reset variables
		selectedExperimentId = null;
		componentId = null;
		componentName = null;
	});

	test.describe('Main Flow', () => {
		test('should configure use case information in process', async () => {
			const timestamp = Date.now();
			componentName = `LDT_Use_Case_Scenarios_${timestamp}`;
			const componentTitle = `Test LDT Use Case Scenarios ${timestamp}`;

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
				// Click "Configure" button for the process (this navigates to /edit page)
				await surveysManagePage.searchAndSelectProcess(processTitle);
				console.log(`Selected process "${processTitle}" for configuration`);
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				const page = updateProcessAdminPage['page'];
				await page.waitForURL(new RegExp(`/admin/participatory_processes/${processSlug}/edit`));
				await page.waitForLoadState('networkidle');

				// Verify we're on the edit page with process information
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
				console.log('Process loaded with editable form containing existing information');
			});

			await test.step('5. User: Navigates to the "Components" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToComponents();
				console.log('Navigated to Components section');
			});

			await test.step('6. User: Clicks on "Add Component" and select LDT Use Case Scenarios', async () => {
				// Select LDT Use Case Scenarios component type
				await ldtUseCaseScenariosPage.addComponentAndSelectLDTUseCaseScenarios(componentsPage, processSlug);
				console.log('Selected LDT Use Case Scenarios component type');

				// Fill the component form
				await ldtUseCaseScenariosPage.fillComponentForm(componentName, componentTitle);
				console.log('Component form filled');

				// Save the component
				await ldtUseCaseScenariosPage.saveComponent();
				console.log('Component saved successfully');

				const page = componentsPage['page'];
				await page.waitForLoadState('networkidle');

				// Verify redirect to components page
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				console.log('Redirected to components page');

				// Verify success message is displayed
				await componentsPage.verifyComponentCreatedSuccessfully();

				// Verify component exists in the table
				await componentsPage.expectComponentExists(componentName);
				console.log(`Component "${componentName}" found in table`);

				// Publish the component
				await componentsPage.publishComponent(componentName);
				console.log(`Published component: ${componentName}`);

				// Verify it was published successfully
				const isPublished = await componentsPage.isComponentPublished(componentName);
				expect(isPublished).toBeTruthy();
				console.log(`Component "${componentName}" is now published`);

				// Click on component name to navigate to detail page
				await componentsPage.clickComponentLink(componentName);
				await page.waitForLoadState('networkidle');

				// Verify navigation to component manage page
				await page.waitForURL(
					new RegExp(`/admin/participatory_processes/${processSlug}/components/\\d+/manage/`)
				);
				console.log(`Navigated to component detail/manage page`);

				const currentUrl = page.url();
				const match = currentUrl.match(/\/components\/(\d+)\//);
				if (match) {
					componentId = match[1];
					console.log(`Component ID extracted for cleanup: ${componentId}`);
				}

				// Click on "Associate experiments results" button
				await ldtUseCaseScenariosPage.clickAssociateExperimentsResults();

				await page.waitForLoadState('networkidle');
				console.log('Clicked on "Associate experiments results"');
			});

			await test.step('7. System: Displays a list of available Use Cases from the EU LDT Use Cases & Scenarios Tool', async () => {
				// Select the first experiment and get its ID
				selectedExperimentId = await ldtUseCaseScenariosPage.selectFirstExperiment();
				console.log(`Selected experiment: ${selectedExperimentId}`);

				// Fill Association Name with experiment ID
				const associationName = `association test ${selectedExperimentId}`;
				await ldtUseCaseScenariosPage.fillAssociationName(associationName);
				console.log(`Filled Association Name: ${associationName}`);
			});

			await test.step('8. User: Clicks on "Save Configuration" to confirm the selection', async () => {
				// Save the association configuration
				await ldtUseCaseScenariosPage.saveAssociationConfiguration();
				console.log('Clicked Save to confirm association configuration');

				// Verify redirect back to component manage page
				const page = componentsPage['page'];
				await page.waitForURL(
					new RegExp(
						`/admin/participatory_processes/${processSlug}/components/\\d+/manage/ldt_use_case_scenarios`
					)
				);
				console.log('Configuration saved and redirected to component manage page');
			});

			await test.step('9. System: Saves the configuration and links the Use Case information to the process', async () => {
				if (!selectedExperimentId) {
					throw new Error('selectedExperimentId is null - test setup failed');
				}

				// Verify success message
				await ldtUseCaseScenariosPage.verifyExperimentSavedSuccessfully();
				console.log('Success message displayed: Experiment saved successfully');

				// Verify the association exists in the table
				const associationName = `association test ${selectedExperimentId}`;
				await ldtUseCaseScenariosPage.verifyAssociationExists(associationName, selectedExperimentId);
				console.log(
					`Verified association exists - Name: "${associationName}", Experiment ID: ${selectedExperimentId}`
				);
			});

			await test.step('Result: Citizens can view the Use Case details directly within the process', async () => {
				if (!selectedExperimentId) {
					throw new Error('selectedExperimentId is null - test setup failed');
				}

				// Navigate to process public page
				await processDetailPage.navigateToProcess(processSlug);
				console.log(`Navigated to process public page: /processes/${processSlug}`);

				await processDetailPage.navigateToComponent(componentName);
				console.log(`Navigated to component "${componentName}"`);

				await useCaseScenariosPage.verifyExperimentIdVisible(selectedExperimentId);
				console.log(`Experiment ID "${selectedExperimentId}" is visible on the public page`);

				// Click on the association link
				await useCaseScenariosPage.clickAssociationLink(selectedExperimentId);

				// Verify experiment details are visible
				const labelType = await useCaseScenariosPage.verifyExperimentIdDetailVisible(selectedExperimentId);
				console.log(`"${labelType} ID ${selectedExperimentId}" is visible on the detail page`);
			});
		});
	});

	test.describe('Alternative Flow: Field/s validation fail', () => {
		test('should show validation error when no experiment is selected', async () => {
			const timestamp = Date.now();
			componentName = `LDT_Use_Case_Scenarios_${timestamp}`;
			const componentTitle = `Test LDT Use Case Scenarios ${timestamp}`;

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
				// Click "Configure" button for the process (this navigates to /edit page)
				await surveysManagePage.searchAndSelectProcess(processTitle);
				console.log(`Selected process "${processTitle}" for configuration`);
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				const page = updateProcessAdminPage['page'];
				await page.waitForURL(new RegExp(`/admin/participatory_processes/${processSlug}/edit`));
				await page.waitForLoadState('networkidle');

				// Verify we're on the edit page with process information
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
				console.log('Process loaded with editable form containing existing information');
			});

			await test.step('5. User: Navigates to the "Components" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToComponents();
				console.log('Navigated to Components section');
			});

			await test.step('6. User: Clicks on "Add Component" and select LDT Use Case Scenarios', async () => {
				// Select LDT Use Case Scenarios component type
				await ldtUseCaseScenariosPage.addComponentAndSelectLDTUseCaseScenarios(componentsPage, processSlug);
				console.log('Selected LDT Use Case Scenarios component type');

				// Fill the component form
				await ldtUseCaseScenariosPage.fillComponentForm(componentName, componentTitle);
				console.log('Component form filled');

				// Save the component
				await ldtUseCaseScenariosPage.saveComponent();
				console.log('Component saved successfully');

				const page = componentsPage['page'];
				await page.waitForLoadState('networkidle');

				// Verify success message is displayed
				await componentsPage.verifyComponentCreatedSuccessfully();

				// Verify component exists in the table
				await componentsPage.expectComponentExists(componentName);
				console.log(`Component "${componentName}" found in table`);

				// Publish the component
				await componentsPage.publishComponent(componentName);
				console.log(`Published component: ${componentName}`);

				// Verify it was published successfully
				const isPublished = await componentsPage.isComponentPublished(componentName);
				expect(isPublished).toBeTruthy();
				console.log(`Component "${componentName}" is now published`);

				// Click on component name to navigate to detail page
				await componentsPage.clickComponentLink(componentName);
				await page.waitForLoadState('networkidle');

				// Verify navigation to component manage page
				await page.waitForURL(
					new RegExp(`/admin/participatory_processes/${processSlug}/components/\\d+/manage/`)
				);
				console.log(`Navigated to component detail/manage page`);

				const currentUrl = page.url();
				const match = currentUrl.match(/\/components\/(\d+)\//);
				if (match) {
					componentId = match[1];
					console.log(`Component ID extracted for cleanup: ${componentId}`);
				}

				// Click on "Associate experiments results" button
				await ldtUseCaseScenariosPage.clickAssociateExperimentsResults();

				await page.waitForLoadState('networkidle');
				console.log('Clicked on "Associate experiments results"');
			});

			await test.step('7. User: Clicks on "Save Configuration" to confirm the selection', async () => {
				const page = ldtUseCaseScenariosPage['page'];
				// Save the association configuration without selecting anything
				await ldtUseCaseScenariosPage.saveAssociationConfiguration();
				console.log('Clicked Save without selecting experiment');

				// Verify that we remain on the same page
				await expect(page).toHaveURL(
					new RegExp(
						`/admin/participatory_processes/${processSlug}/components/\\d+/manage/ldt_use_case_scenarios/new`
					)
				);
			});

			await test.step('8. System: Displays appropriate error messages highlighting the issues', async () => {
				// Verify validation error message is displayed
				await ldtUseCaseScenariosPage.verifyAssociationNameRequiredError();
				console.log('Validation error displayed');
			});

			await test.step('9. User: Corrects the invalid configuration details.', async () => {
				// Select the first experiment and get its ID
				selectedExperimentId = await ldtUseCaseScenariosPage.selectFirstExperiment();
				console.log(`Selected experiment: ${selectedExperimentId}`);

				// Fill Association Name with experiment ID
				const associationName = `association test ${selectedExperimentId}`;
				await ldtUseCaseScenariosPage.fillAssociationName(associationName);
				console.log(`Filled Association Name: ${associationName}`);
			});

			await test.step('10. User: Clicks "Save Configuration" again.', async () => {
				const page = ldtUseCaseScenariosPage['page'];
				// Save the association configuration
				await ldtUseCaseScenariosPage.saveAssociationConfiguration();
				console.log('Clicked Save to confirm association configuration');

				// Verify redirect back to component manage page
				await expect(page).toHaveURL(
					new RegExp(
						`/admin/participatory_processes/${processSlug}/components/\\d+/manage/ldt_use_case_scenarios`
					)
				);
				console.log('Configuration saved and redirected to component manage page');
			});

			await test.step('11. System: Saves the configuration and links the Use Case information to the process', async () => {
				if (!selectedExperimentId) {
					throw new Error('selectedExperimentId is null - test setup failed');
				}

				// Verify success message
				await ldtUseCaseScenariosPage.verifyExperimentSavedSuccessfully();
				console.log('Success message displayed: Experiment saved successfully');

				// Verify the association exists in the table
				const associationName = `association test ${selectedExperimentId}`;
				await ldtUseCaseScenariosPage.verifyAssociationExists(associationName, selectedExperimentId);
				console.log(
					`Verified association exists - Name: "${associationName}", Experiment ID: ${selectedExperimentId}`
				);
			});

			await test.step('Result: Citizens can view the Use Case details directly within the process', async () => {
				if (!selectedExperimentId) {
					throw new Error('selectedExperimentId is null - test setup failed');
				}

				// Navigate to process public page
				await processDetailPage.navigateToProcess(processSlug);
				console.log(`Navigated to process public page: /processes/${processSlug}`);

				await processDetailPage.navigateToComponent(componentName);
				console.log(`Navigated to component "${componentName}"`);

				await useCaseScenariosPage.verifyExperimentIdVisible(selectedExperimentId);
				console.log(`Experiment ID "${selectedExperimentId}" is visible on the public page`);

				// Click on the association link
				await useCaseScenariosPage.clickAssociationLink(selectedExperimentId);

				// Verify that the experiment details are visible
				const labelType = await useCaseScenariosPage.verifyExperimentIdDetailVisible(selectedExperimentId);
				console.log(`"${labelType} ID ${selectedExperimentId}" is visible on the detail page`);
			});
		});
	});
});

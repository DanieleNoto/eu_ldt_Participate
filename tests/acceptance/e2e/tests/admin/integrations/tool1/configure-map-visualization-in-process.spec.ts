/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test, expect } from '@fixtures/keycloak-test';
import { AdminHomePage } from '../../../../pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '../../../../pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '../../../../pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '../../../../pages/pages/admin/processes/detail/components/ComponentsPage';
import { SurveysManagePage } from '../../../../pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { LDTMapVisualizationComponentPage } from '../../../../pages/pages/admin/processes/detail/components/LDTMapVisualizationComponentPage';
import { ProcessDetailPage } from '../../../../pages/pages/public/processes/ProcessDetailPage';
import { MapVisualizationPage } from '../../../../pages/pages/public/processes/MapVisualizationPage';

/**
 * Allows City Administrators to configure the display of Map Visualization within a specific process
 * User Story: As a City Administrator, I want to configure the display of Map Visualization in a specific process so that citizens can understand the context and implications of the linked map.
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The process has already been created.
 * - The Map Visualization is available in the Play & Visualize Tool.
 */

test.describe('@useKeycloak Configure Map Visualization in process', () => {
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let surveysManagePage: SurveysManagePage;
	let ldtMapVisualizationPage: LDTMapVisualizationComponentPage;
	let processDetailPage: ProcessDetailPage;
	let mapVisualizationPage: MapVisualizationPage;

	// Use existing process
	const processSlug = 'test';
	const processTitle = 'Update Test0';

	// Variables to track created resources for cleanup
	let selectedMapId: string | null = null;
	let componentId: string | null = null;
	let componentName: string | null = null;
	let associationName: string | null = null;

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		componentsPage = new ComponentsPage(adminPage);
		surveysManagePage = new SurveysManagePage(adminPage);
		ldtMapVisualizationPage = new LDTMapVisualizationComponentPage(adminPage);
		processDetailPage = new ProcessDetailPage(adminPage);
		mapVisualizationPage = new MapVisualizationPage(adminPage);

		// Navigate to admin dashboard
		await adminHomePage.goToAdminDashboard();
	});

	test.afterEach(async ({ adminPage }) => {
		if (selectedMapId && componentId && componentName) {
			try {
				console.log('Starting cleanup: Deleting association...');

				// Navigate to manage page for the component
				await ldtMapVisualizationPage.navigateToManagePage(processSlug, componentId);
				console.log(`Navigated to manage page for component ${componentId}`);

				// Delete the map visualization by map ID
				await ldtMapVisualizationPage.deleteMapVisualizationByMapId(selectedMapId);
				console.log('Map visualization deleted successfully');

				// Navigate to components page
				await componentsPage.navigateToComponents(processSlug);

				// Unpublish component (handles Hide → Unpublish flow internally)
				await componentsPage.unpublishComponentByName(componentName!);

				// Delete component
				await componentsPage.deleteComponentIfExists(componentName!);
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
		selectedMapId = null;
		componentId = null;
		componentName = null;
		associationName = null;
	});

	test.describe('Main Flow', () => {
		test('should configure map visualization in process', async () => {
			const timestamp = Date.now();
			componentName = `Map_Visualization_${timestamp}`;
			const componentTitle = `Test Map Visualization ${timestamp}`;

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
				// Click "Configure" button for the process (this navigates to /edit page)
				await surveysManagePage.searchAndSelectProcess(processTitle);
				console.log(`Selected process "${processTitle}" for configuration`);
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				const page = updateProcessAdminPage['page'];
				await page.waitForURL(new RegExp(`/admin/participatory_processes/${processSlug}/edit`));
				await page.waitForLoadState('load');

				// Verify we're on the edit page with process information
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
				console.log('Process loaded with editable form containing existing information');
			});

			await test.step('5. User: Navigates to the "Components" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToComponents();
				console.log('Navigated to Components section');
			});

			await test.step('6. User: Clicks on "Add Component" and select LDT Map Visualization', async () => {
				const page = componentsPage['page'];
				// Select LDT Map Visualization component type
				await ldtMapVisualizationPage.addComponentAndSelectLDTMapVisualization(componentsPage, processSlug);
				console.log('Selected LDT Map Visualization component type');

				// Fill the component form
				await ldtMapVisualizationPage.fillComponentForm(componentName!, componentTitle);
				console.log('Component form filled');

				// Save the component
				await ldtMapVisualizationPage.saveComponent();
				console.log('Component saved successfully');

				await page.waitForLoadState('load');
				// Verify redirect to components page
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				console.log('Redirected to components page');

				// Verify success message is displayed
				await componentsPage.verifyComponentCreatedSuccessfully();

				// Verify component exists in the table
				await componentsPage.expectComponentExists(componentName!);
				console.log(`Component "${componentName}" found in table`);

				// Publish the component
				await componentsPage.publishComponent(componentName!);
				console.log(`Published component: ${componentName}`);

				// Verify it was published successfully
				const isPublished = await componentsPage.isComponentPublished(componentName!);
				expect(isPublished).toBeTruthy();
				console.log(`Component "${componentName}" is now published`);

				// Click on component name to navigate to detail page
				await componentsPage.clickComponentLink(componentName!);
				await page.waitForLoadState('load');

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

				// Click on "Add New Map" button
				await ldtMapVisualizationPage.clickAddNewMap();

				await page.waitForLoadState('load');
				console.log('Clicked on "Add New Map"');
			});

			await test.step('7. System: Displays a list of available maps from the EU LDT Map Visualization Tool', async () => {
				// Select the first map and get its ID
				selectedMapId = await ldtMapVisualizationPage.selectFirstMap();
				console.log(`Selected map: ${selectedMapId}`);

				// Fill Name with map ID
				associationName = `association test ${selectedMapId}`;
				await ldtMapVisualizationPage.fillAssociationName(associationName);
				console.log(`Filled Name: ${associationName}`);
			});

			await test.step('8. User: Clicks on "Create" to confirm the selection', async () => {
				const page = ldtMapVisualizationPage['page'];
				await ldtMapVisualizationPage.saveAssociationConfiguration();
				console.log('Clicked Create to confirm association configuration');

				// Verify redirect back to component manage page
				await page.waitForURL(
					new RegExp(
						`/admin/participatory_processes/${processSlug}/components/\\d+/manage/map_visualizations`
					)
				);
				console.log('Map visualization created and redirected to component manage page');
			});

			await test.step('9. System: Create the map visualization and links it to the process', async () => {
				if (!selectedMapId) {
					throw new Error('selectedMapId is null - test setup failed');
				}

				// Verify success message
				await ldtMapVisualizationPage.verifyMapVisualizationCreatedSuccessfully();
				console.log('Success message displayed');

				// Verify the map visualization exists in the table
				await ldtMapVisualizationPage.verifyMapVisualizationExists(associationName!, selectedMapId);
				console.log(`Verified map visualization exists - Name: "${associationName}", Map ID: ${selectedMapId}`);
			});

			await test.step('Result: Citizens can view the Map Visualization details directly within the process', async () => {
				if (!selectedMapId) {
					throw new Error('selectedMapId is null - test setup failed');
				}

				// Navigate to process public page
				await processDetailPage.navigateToProcess(processSlug);
				console.log(`Navigated to process public page: /processes/${processSlug}`);

				await processDetailPage.navigateToComponent(componentName!);
				console.log(`Navigated to component "${componentName}"`);

				await mapVisualizationPage.verifyMapIdVisible(selectedMapId);
				console.log(`Map card with title "${associationName}" is visible on the public page`);

				// Click on the association link
				await mapVisualizationPage.clickMapLink(selectedMapId);
				console.log(`Clicked on map card with title: "${associationName}"`);

				// Verify map details are visible
				await mapVisualizationPage.verifyMapDetailsVisible(selectedMapId);
				console.log(`Map image for "${associationName}" is visible on detail page`);
			});
		});
	});

	test.describe('Alternative Flow: Field/s validation fail', () => {
		test('should show validation error when no map is selected', async () => {
			const timestamp = Date.now();
			componentName = `Map_Visualization_${timestamp}`;
			const componentTitle = `Test Map Visualization ${timestamp}`;

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
				// Click "Configure" button for the process (this navigates to /edit page)
				await surveysManagePage.searchAndSelectProcess(processTitle);
				console.log(`Selected process "${processTitle}" for configuration`);
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
				const page = updateProcessAdminPage['page'];
				await page.waitForURL(new RegExp(`/admin/participatory_processes/${processSlug}/edit`));
				await page.waitForLoadState('load');

				// Verify we're on the edit page with process information
				await updateProcessAdminPage.expectToBeOnUpdateProcessPage();
				console.log('Process loaded with editable form containing existing information');
			});

			await test.step('5. User: Navigates to the "Components" section in the admin panel.', async () => {
				await updateProcessAdminPage.navigateToComponents();
				console.log('Navigated to Components section');
			});

			await test.step('6. User: Clicks on "Add Component" and select LDT Map Visualization', async () => {
				const page = componentsPage['page'];
				// Select LDT Map Visualization component type
				await ldtMapVisualizationPage.addComponentAndSelectLDTMapVisualization(componentsPage, processSlug);
				console.log('Selected LDT Map Visualization component type');

				// Fill the component form
				await ldtMapVisualizationPage.fillComponentForm(componentName!, componentTitle);
				console.log('Component form filled');

				// Save the component
				await ldtMapVisualizationPage.saveComponent();
				console.log('Component saved successfully');

				await page.waitForLoadState('load');
				// Verify redirect to components page
				await page.waitForURL(`/admin/participatory_processes/${processSlug}/components`);
				console.log('Redirected to components page');

				// Verify success message is displayed
				await componentsPage.verifyComponentCreatedSuccessfully();

				// Verify component exists in the table
				await componentsPage.expectComponentExists(componentName!);
				console.log(`Component "${componentName}" found in table`);

				// Publish the component
				await componentsPage.publishComponent(componentName!);
				console.log(`Published component: ${componentName}`);

				// Verify it was published successfully
				const isPublished = await componentsPage.isComponentPublished(componentName!);
				expect(isPublished).toBeTruthy();
				console.log(`Component "${componentName}" is now published`);

				// Click on component name to navigate to detail page
				await componentsPage.clickComponentLink(componentName!);
				await page.waitForLoadState('load');

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

				// Click on "Add New Map" button
				await ldtMapVisualizationPage.clickAddNewMap();

				await page.waitForLoadState('load');
				console.log('Clicked on "Add New Map"');
			});

			await test.step('7. User: Clicks on "Create" to confirm the selection', async () => {
				const page = ldtMapVisualizationPage['page'];
				await ldtMapVisualizationPage.saveAssociationConfiguration();
				console.log('Clicked Create without selecting map');

				// Verify that we remain on the same page
				await expect(page).toHaveURL(
					new RegExp(
						`/admin/participatory_processes/${processSlug}/components/\\d+/manage/map_visualizations/new`
					)
				);
			});

			await test.step('8. System: Displays appropriate error messages highlighting the issues', async () => {
				// Verify validation error message is displayed
				await ldtMapVisualizationPage.verifyAssociationNameRequiredError();
				console.log('Validation error displayed');
			});

			await test.step('9. User: Corrects the invalid configuration details.', async () => {
				// Select the first map and get its ID
				selectedMapId = await ldtMapVisualizationPage.selectFirstMap();
				console.log(`Selected map: ${selectedMapId}`);

				// Fill Name with map ID
				associationName = `association test ${selectedMapId}`;
				await ldtMapVisualizationPage.fillAssociationName(associationName);
				console.log(`Filled Name: ${associationName}`);
			});

			await test.step('10. User: Clicks "Create" again.', async () => {
				const page = ldtMapVisualizationPage['page'];
				await ldtMapVisualizationPage.saveAssociationConfiguration();
				console.log('Clicked Create to confirm association configuration');

				// Verify redirect back to component manage page
				await expect(page).toHaveURL(
					new RegExp(
						`/admin/participatory_processes/${processSlug}/components/\\d+/manage/map_visualizations`
					)
				);
				console.log('Map visualization created and redirected to component manage page');
			});

			await test.step('11. System: Create the map visualization and links it to the process', async () => {
				if (!selectedMapId) {
					throw new Error('selectedMapId is null - test setup failed');
				}

				// Verify success message
				await ldtMapVisualizationPage.verifyMapVisualizationCreatedSuccessfully();
				console.log('Success message displayed');

				// Verify the map visualization exists in the table
				await ldtMapVisualizationPage.verifyMapVisualizationExists(associationName!, selectedMapId);
				console.log(`Verified map visualization exists - Name: "${associationName}", Map ID: ${selectedMapId}`);
			});

			await test.step('Result: Citizens can view the Map Visualization details directly within the process', async () => {
				if (!selectedMapId) {
					throw new Error('selectedMapId is null - test setup failed');
				}

				// Navigate to process public page
				await processDetailPage.navigateToProcess(processSlug);
				console.log(`Navigated to process public page: /processes/${processSlug}`);

				await processDetailPage.navigateToComponent(componentName!);
				console.log(`Navigated to component "${componentName}"`);

				await mapVisualizationPage.verifyMapIdVisible(selectedMapId);
				console.log(`Map card with title "${associationName}" is visible on the public page`);

				// Click on the association link
				await mapVisualizationPage.clickMapLink(selectedMapId);
				console.log(`Clicked on map card with title: "${associationName}"`);

				// Verify map details are visible
				await mapVisualizationPage.verifyMapDetailsVisible(selectedMapId);
				console.log(`Map image for "${associationName}" is visible on detail page`);
			});
		});
	});
});

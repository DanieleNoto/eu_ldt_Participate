/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { expect } from '@playwright/test';
import { test } from '@fixtures/parallel-test-reserved';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { WebmailPage } from '@pages/base/WebmailPage';

/**
 * Allows administrators to export data from debates, including user contributions and discussion summaries, which are then sent to their email address for easy access and analysis.
 * User Story: As an Administrator, I want to export debate data and receive it via email so that I can analyse user contributions and generate reports for informed decision-making.
 * Requirements: PAR R21
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The debates have been conducted, and user contributions are available for export.
 *
 * @reserved - This test uses reserved/fixed admin account (TEST_ADMIN_EMAIL)
 * and must be run sequentially with --workers=1 to avoid session conflicts.
 */
test.describe('@reserved [PAR-DE002] – Export debate data', () => {
	// Force sequential execution to prevent test interference
	test.describe.configure({ mode: 'serial' });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let webmailPage: WebmailPage;

	// Use existing process with debates and responses
	const processSlug = 'test';
	const componentName = 'Test Debates';

	// Common setup for both flows (only Page Objects)
	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessAdminPage = new UpdateProcessAdminPage(adminPage);
		componentsPage = new ComponentsPage(adminPage);
		webmailPage = new WebmailPage(adminPage);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		[
			{ fileFormat: 'CSV', exportType: 'Debates' },
			{ fileFormat: 'JSON', exportType: 'Debates' },
			{ fileFormat: 'Excel', exportType: 'Debates' },
			{ fileFormat: 'CSV', exportType: 'Comments' },
			{ fileFormat: 'JSON', exportType: 'Comments' },
			{ fileFormat: 'Excel', exportType: 'Comments' }
		].forEach(({ fileFormat, exportType }) => {
			test(`should export ${exportType.toLowerCase()} data in ${fileFormat} format`, async ({ adminPage }) => {
				await test.step('1. User: Navigates to the "Processes" section.', async () => {
					// Navigate to processes section
					await processAdminPage.navigateToProcesses();
					console.log('Successfully navigated to Processes section');
				});

				await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
					await adminPage.waitForLoadState('networkidle');

					// Verify we're on the processes page, with fallback navigation
					let isOnProcessesPage = await processAdminPage.isOnProcessesPage();

					if (!isOnProcessesPage) {
						// Try direct navigation if component navigation failed
						await adminPage.goto('/admin/participatory_processes');
						await adminPage.waitForLoadState('networkidle');
						isOnProcessesPage = await processAdminPage.isOnProcessesPage();
					}

					expect(isOnProcessesPage).toBe(true);
					const processCount = await processAdminPage.getProcessCount();
					expect(processCount).toBeGreaterThan(0);

					// Get process titles for verification
					const processTitles = await processAdminPage.processTable.getProcessTitles();
					console.log('Available processes:', processTitles);
					expect(processTitles.length).toBeGreaterThan(0);
				});

				await test.step('3. User: Selects the process that want to update', async () => {
					await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
					await adminPage.waitForLoadState('networkidle');
				});

				await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
					// Wait for edit form to load
					await processAdminPage.waitForEditFormToLoad();

					// Verify we're on the edit page for the correct process
					const isOnEditPage = await processAdminPage.isOnProcessEditPage();
					expect(isOnEditPage).toBe(true);
					expect(adminPage.url()).toContain(`/admin/participatory_processes/${processSlug}/edit`);
					console.log(`Process slug verified: ${processSlug}`);

					// Check if the sidebar is visible and loaded
					await expect(updateProcessAdminPage.sidebarProcessDetail.isSidebarVisible()).resolves.toBe(true);

					// Get and display process title
					const titleTextbox = await processAdminPage.getTitleTextbox();
					await expect(titleTextbox).toBeVisible();

					const currentProcessTitle = await titleTextbox.inputValue();
					console.log(`Process loaded: ${currentProcessTitle}`);
					expect(currentProcessTitle).not.toBe('');
				});

				await test.step('5. User: Navigates to the "Components -> Debates" section in the admin panel.', async () => {
					await updateProcessAdminPage.navigateToComponents();
					console.log(`Accessing debates component: ${componentName}`);

					await componentsPage.manageComponent(componentName);
					console.log('Accessed debates component');
				});

				await test.step('6. System: Displays a list of available debates, including completed debates with user contributions and summaries.', async () => {
					// Verify debates table is visible and has content
					const debatesTable = adminPage.locator('table.table-list tbody tr');
					const debatesCount = await debatesTable.count();
					expect(debatesCount).toBeGreaterThan(0);
					console.log(`Found ${debatesCount} debates in the list`);

					// Verify that the specific debate is present in the list
					const testDebateRow = adminPage
						.locator('table.table-list tbody tr')
						.filter({ hasText: 'Test debate QA' });
					await expect(testDebateRow).toBeVisible();
					console.log('Test debate is visible in the debates list');
				});

				await test.step('7. User: Clicks on the "Export" button and select format', async () => {
					await componentsPage.exportComponentData(fileFormat, exportType);
					console.log(`Selected Export ${exportType} as ${fileFormat} format`);

					await adminPage.waitForLoadState('networkidle');
				});

				await test.step('8. System: Displays a confirmation message on the platform, indicating that the export process has been initiated and that the file will be sent via email', async () => {
					await componentsPage.expectExportConfirmationMessage();
					console.log('Export status message is visible');

					await adminPage.waitForLoadState('networkidle');
				});

				await test.step("9. System: Sends an email to the administrator's registered email address with the export file as an attachment or a secure download link", async () => {
					// Navigate to webmail
					await webmailPage.navigateToWebmail();
					console.log('Navigated to webmail');

					// Login to webmail with admin credentials
					await webmailPage.login(process.env.OVH_ADMIN_EMAIL!, process.env.OVH_ADMIN_PASSWORD!);
					console.log('Logged in to webmail');

					// Check for new messages
					await webmailPage.refreshInbox();
					console.log('Checked for new messages in inbox');

					// Verify and open the debates export email.
					// The email subject uses 'debates' for debate data and 'debate_comments' for comments.
					const emailExportType = exportType === 'Comments' ? 'debate_comments' : 'debates';
					await webmailPage.verifyExportEmail(emailExportType);
					console.log(`Export email for ${exportType} with ${fileFormat} format verified successfully`);

					// Download the export file
					await webmailPage.downloadExportFile();
					console.log('Export file downloaded successfully');

					// Clean up: delete the email
					await webmailPage.deleteCurrentEmail();
					console.log('Export email deleted from inbox');
				});
			});
		});
	});
});

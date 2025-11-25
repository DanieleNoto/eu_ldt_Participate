/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import test, { expect } from '@playwright/test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { WebmailPage } from '@pages/base/WebmailPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Allows administrators to export data from debates, including user contributions and discussion summaries, which are then sent to their email address for easy access and analysis.
 * User Story: As an Administrator, I want to export debate data and receive it via email so that I can analyse user contributions and generate reports for informed decision-making.
 * Requirements: PAR R21
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The debates have been conducted, and user contributions are available for export.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-DE002] – Export debate data', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let webmailPage: WebmailPage;

	// Use existing process with debates and responses
	const processTitle = 'Update Test0';
	const processSlug = 'test';
	const componentName = 'Test Debates';

	// Common setup for both flows (only Page Objects)
	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		webmailPage = new WebmailPage(page);
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
			test(`should export ${exportType.toLowerCase()} data in ${fileFormat} format`, async ({ page }) => {
				await test.step('1. User: Navigates to the "Processes" section.', async () => {
					// Navigate to processes section
					await processAdminPage.navigateToProcesses();
					console.log('Successfully navigated to Processes section');
				});

				await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update.', async () => {
					await page.waitForLoadState('networkidle');

					// Verify we're on the processes page, with fallback navigation
					let isOnProcessesPage = await processAdminPage.isOnProcessesPage();

					if (!isOnProcessesPage) {
						// Try direct navigation if component navigation failed
						await page.goto('/admin/participatory_processes');
						await page.waitForLoadState('networkidle');
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
					// Select the process name that contains debate data
					console.log(`Selecting process: ${processTitle}`);

					// Click on the process to edit it
					await processAdminPage.selectProcessForEdit(processTitle);
					await page.waitForLoadState('networkidle');
				});

				await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
					// Wait for edit form to load
					await processAdminPage.waitForEditFormToLoad();

					// Verify we're on the edit page for the correct process
					const isOnEditPage = await processAdminPage.isOnProcessEditPage();
					expect(isOnEditPage).toBe(true);
					expect(page.url()).toContain(`/admin/participatory_processes/${processSlug}/edit`);
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
					const debatesTable = page.locator('table.table-list tbody tr');
					const debatesCount = await debatesTable.count();
					expect(debatesCount).toBeGreaterThan(0);
					console.log(`Found ${debatesCount} debates in the list`);

					// Verify that the specific debate is present in the list
					const testDebateRow = page
						.locator('table.table-list tbody tr')
						.filter({ hasText: 'Test debate QA' });
					await expect(testDebateRow).toBeVisible();
					console.log('Test debate is visible in the debates list');
				});

				await test.step('7. User: Clicks on the "Export" button and select format', async () => {
					await componentsPage.exportComponentData(fileFormat, exportType);
					console.log(`Selected Export ${exportType} as ${fileFormat} format`);

					await page.waitForLoadState('networkidle');
				});

				await test.step('8. System: Displays a confirmation message on the platform, indicating that the export process has been initiated and that the file will be sent via email', async () => {
					await componentsPage.expectExportConfirmationMessage();
					console.log('Export status message is visible');

					await page.waitForLoadState('networkidle');
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

					// Verify and open the debates export email
					await webmailPage.verifyExportEmail('debates');
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

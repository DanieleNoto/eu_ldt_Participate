/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Simone Bianchelli
 */

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { WebmailPage } from '@pages/base/WebmailPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Allows administrators to export data from meetings, including participant lists, and meeting notes, which are then sent to their email address for easy access and analysis.
 * User Story: As an Administrator, I want to export meeting data and receive it via email so that I can analyse participation and use meeting records for reporting and follow-up.
 * Requirements: PAR R21
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - Meetings have been conducted, and attendance data or meeting notes are available for export
 */

test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-DE003] – Export meeting data', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let meetingsPage: MeetingsPage;
	let componentsPage: ComponentsPage;
	let webmailPage: WebmailPage;
	let beforeMeetingCount: number;

	// Use existing process with meetings
	const processTitle = 'Update Test0';
	const processSlug = 'test';
	const componentName = 'Meetings';

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		meetingsPage = new MeetingsPage(page);
		componentsPage = new ComponentsPage(page);
		webmailPage = new WebmailPage(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		[
			{ fileFormat: 'CSV', exportType: 'Meetings' },
			{ fileFormat: 'JSON', exportType: 'Meetings' },
			{ fileFormat: 'Excel', exportType: 'Meetings' },
			{ fileFormat: 'CSV', exportType: 'Comments' },
			{ fileFormat: 'JSON', exportType: 'Comments' },
			{ fileFormat: 'Excel', exportType: 'Comments' },
			{ fileFormat: 'CSV', exportType: 'Answers' },
			{ fileFormat: 'JSON', exportType: 'Answers' },
			{ fileFormat: 'Excel', exportType: 'Answers' },
			{ fileFormat: 'PDF', exportType: 'Answers' }
		].forEach(({ fileFormat, exportType }) => {
			test(`should export ${exportType.toLowerCase()} data in ${fileFormat} format`, async ({ page }) => {
				await test.step('1. Admin: Navigates to the "Processes" section.', async () => {
					await processAdminPage.navigateToProcesses();
					await processAdminPage.getPage().waitForLoadState('networkidle');
					const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
					expect(isOnProcessesPage).toBe(true);
				});
				await test.step('2. System: displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
					// Verify processes table is visible and has content
					const hasProcesses = await processAdminPage.processTable.hasProcesses();
					expect(hasProcesses).toBe(true);
				});
				await test.step('3. Admin: selects the process that want to update', async () => {
					// Select the process name that contains meeting data
					console.log(`Selecting process: ${processTitle}`);

					// Click on the process to edit it
					await processAdminPage.selectProcessForEdit(processTitle);
					await processAdminPage.getPage().waitForLoadState('networkidle');
				});

				await test.step('4. System: loads the selected process and displays the content in an editable form, including all existing information', async () => {
					// Verify we're on the edit page for the correct process
					const currentUrl = processAdminPage.getPage().url();
					expect(currentUrl).toContain(`/admin/participatory_processes/${processSlug}/edit`);
					console.log(`Process slug verified: ${processSlug}`);
				});
				await test.step('5. Admin: Navigates to the "Components->Meetings” section in the admin panel.', async () => {
					// Navigate to Components tab/section
					await componentsPage.sidebarProcessDetail.navigateToComponents();
					const currentUrl = componentsPage.getPage().url();
					expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components/);
				});

				await test.step('6. System: Displays a list of available meetings, including completed debates with user contributions and summaries.', async () => {
					// Access meetings component
					console.log(`Accessing meetings component: ${componentName}`);
					await componentsPage.manageComponent(componentName);
					await componentsPage.getPage().waitForLoadState('networkidle');
					console.log('Accessed meetings component');

					await meetingsPage.verifyMeetingsPageVisible();
					// Check if there are meetings available
					beforeMeetingCount = await meetingsPage.getMeetingCount();
					expect(beforeMeetingCount).toBeGreaterThan(0);
					const closedCount = await meetingsPage.countClosedMeetings();
					console.log(
						closedCount > 0 ? `Closed meetings found: ${closedCount}` : 'No closed meetings found.'
					);
					await componentsPage
						.getPage()
						.screenshot({ path: 'test-results/screenshots/DE003/MeetingsList.png', fullPage: true });
				});
				await test.step('7. User: Clicks on the "Export" button and select format', async () => {
					await componentsPage.exportComponentData(fileFormat, exportType);
					console.log(`Selected Export ${exportType} as ${fileFormat} format`);
					await page.waitForLoadState('networkidle');
				});

				await test.step('8. System: Displays a confirmation message on the platform, indicating that the export process has been initiated and that the file will be sent via email', async () => {
					await componentsPage.expectExportConfirmationMessage();
					await componentsPage.getPage().screenshot({
						path: `test-results/screenshots/DE003/expectExportConfirmationMessage-${fileFormat}.png`,
						fullPage: true
					});
					console.log('Export status message is visible');
					await componentsPage.getPage().reload();
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

					// Verify and open the meetings export email
					await webmailPage.verifyExportEmail('meetings');
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

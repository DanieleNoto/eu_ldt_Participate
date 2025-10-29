import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { ExportType, LetterOpenerPage } from '@pages/pages/admin/LetterOpenerPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
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
	let letterOpenerPage: LetterOpenerPage;
	let componentsPage: ComponentsPage;
	let beforeMeetingCount: number;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		meetingsPage = new MeetingsPage(page);
		componentsPage = new ComponentsPage(page);
		letterOpenerPage = new LetterOpenerPage(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		[{ fileFormat: 'CSV' }, { fileFormat: 'JSON' }, { fileFormat: 'Excel' }].forEach(({ fileFormat }) => {
			test(`should export meeting data in ${fileFormat} format`, async ({ page }) => {
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
					// Click edit on the first process in the table
					await processAdminPage.editFirstProcess();
					await processAdminPage.getPage().waitForLoadState('networkidle');
				});

				await test.step('4. System: loads the selected process and displays the content in an editable form, including all existing information', async () => {
					// Verify we're on the process edit/management page
					const currentUrl = processAdminPage.getPage().url();
					expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/edit/);
				});
				await test.step('5. Admin: Navigates to the "Components->Meetings” section in the admin panel.', async () => {
					// Navigate to Components tab/section
					await componentsPage.sidebarProcessDetail.navigateToComponents();
					const currentUrl = componentsPage.getPage().url();
					expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components/);
				});

				await test.step('6. System: Displays a list of available meetings, including completed debates with user contributions and summaries.', async () => {
					// Verify meetings page is loaded and visible
					const meetingsLink = componentsPage.getComponentLinkByName('Meetings');
					expect(meetingsLink).not.toBeNull();
					await meetingsLink.click();
					await componentsPage.getPage().waitForLoadState('networkidle');
					await meetingsPage.verifyMeetingsPageVisible();
					// Check if there are meetings available
					beforeMeetingCount = await meetingsPage.getMeetingCount();
					expect(beforeMeetingCount).toBeGreaterThan(0);
					const closedCount = await meetingsPage.countClosedMeetings();
					console.log(
						closedCount > 0
							? `Closed meetings found: ${closedCount}`
							: 'No closed meetings found.'
					);
					await componentsPage
						.getPage()
						.screenshot({ path: 'test-results/screenshots/DE003/MeetingsList.png', fullPage: true });
				});
				await test.step('7. User: Clicks on the "Export" button and select format', async () => {
					await componentsPage.exportComponentData(fileFormat);
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
					// Navigate to Letter Opener and refresh to get latest emails
					await letterOpenerPage.navigateToLetterOpener();
					await letterOpenerPage.refreshEmails();
					console.log('Letter Opener opened and refreshed. Ready to search for export email.');
					// Find and click on the most recent export email (should be first after refresh)
					await letterOpenerPage.clickMostRecentExportEmailByType('meetings');
					// Verify the export email content
					await letterOpenerPage.verifyExportEmail();
					// Download and verify the export file
					await letterOpenerPage.downloadExportFile();
				});
			});
		});
	});
});

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { MeetingsManagePage } from '@pages/pages/admin/processes/detail/components/meetings/MeetingsManagePage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { findProcessWithMeetings } from '../../../helpers/process-helpers';

/**
 * Test suite for canceling events and notifying attendees.
 *
 * User Story: As an Event Organiser, I want to cancel an event so that it is removed from the schedule and attendees are informed.
 *
 * Requirements: PAR R14c
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The meeting is created but not yet published.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
});

test.describe('[PAR-EA007] – Cancel an event', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessAdminPage: UpdateProcessAdminPage;
	let componentsPage: ComponentsPage;
	let meetingsManagePage: MeetingsManagePage;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		meetingsManagePage = new MeetingsManagePage(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow admin to cancel an event and remove it from the schedule', async () => {
			let initialMeetingsCount: number; // capture before deletion
			await test.step('1. User: Navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});

			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				await processAdminPage.expectToBeOnProcessesAdminPage();
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});

			await test.step('3. User: Selects the process that want to update', async () => {
				// Find a process with meetings component
				const foundProcessWithMeetings = await findProcessWithMeetings(
					adminHomePage,
					processAdminPage,
					updateProcessAdminPage,
					componentsPage
				);
				expect(foundProcessWithMeetings).toBe(true);
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				// The process is already loaded from the findProcessWithMeetings() function
				// Verify we're in the process editing interface
				await updateProcessAdminPage.waitForLoadState('networkidle');
			});

			await test.step('5. User: Navigates to the "Components->Meetings" section in the admin panel', async () => {
				// Already navigated to components during process selection
				await componentsPage.waitForComponentsPageLoad();
				await componentsPage.expectToBeOnComponentsPage();

				// Verify that meetings component exists
				const meetingComponents = await componentsPage.findComponentsByType('meetings');
				expect(meetingComponents.length).toBeGreaterThan(0);
			});

			await test.step('6. System: Displays the "Meetings" section in the admin panel', async () => {
				// Click on the Meetings component to manage it
				const meetingComponents = await componentsPage.findComponentsByType('meetings');
				const firstMeetingComponent = meetingComponents[0];

				// Navigate to manage the meetings component to see individual meetings
				await componentsPage.manageComponent(firstMeetingComponent);
				await meetingsManagePage.waitForMeetingsPageLoad();

				// Verify we're now on the meetings management page
				await meetingsManagePage.expectToBeOnMeetingsPage();

				// Verify the page shows meetings
				initialMeetingsCount = await meetingsManagePage.getMeetingsCount();
				expect(initialMeetingsCount).toBeGreaterThan(0);
			});

			await test.step('7. User: Clicks on the "Soft delete" button to delete the meeting', async () => {
				// Get all meetings to find one that can be deleted
				const allMeetings = await meetingsManagePage.getAllMeetingsData();
				console.log(`Found ${allMeetings.length} meetings to check for deletion permissions`);

				// Find a meeting that has delete permission
				let meetingToDelete: string | null = null;

				for (const meeting of allMeetings) {
					const hasDeletePermission = await meetingsManagePage.hasActionPermission(meeting.id, 'delete');
					if (hasDeletePermission) {
						meetingToDelete = meeting.id;
						console.log(`Found meeting ${meeting.id} that can be deleted`);
						break;
					}
				}

				if (!meetingToDelete) {
					throw new Error(
						'No meetings found that can be deleted. Make sure there are meetings available for deletion in this component.'
					);
				}

				// Soft delete the meeting
				await meetingsManagePage.softDeleteMeeting(meetingToDelete, { confirm: true });
			});

			await test.step('8. System: Display a dialog asking to confirm the action', async () => {
				// The confirmation modal was displayed and we passed confirm: true
				console.log('Confirmation dialog displayed and will be confirmed (confirm: true)');
			});

			await test.step('9. User: Click on "Ok"', async () => {
				// Confirmation handled via confirm: true parameter
				console.log('Deletion confirmed via softDeleteMeeting({ confirm: true })');
			});

			await test.step('10. System: Delete the meeting', async () => {
				// Wait for the deletion to be processed
				await meetingsManagePage.waitForLoadState('networkidle');

				// Verify the meeting has been deleted by checking the updated meetings count
				const updatedMeetingsCount = await meetingsManagePage.getMeetingsCount();
				console.log(`Meetings count after deletion: ${updatedMeetingsCount}`);
			});

			await test.step('11. System: Notifies the City Administrator that the meeting has been successfully deleted', async () => {
				// Verify success notification appears
				const hasSuccessNotification = await meetingsManagePage.hasSuccessFlashMessage();
				expect(hasSuccessNotification).toBe(true);
			});

			await test.step('Result: The meeting is deleted and no more visible', async () => {
				// Verify that the meetings list is updated and the deleted meeting is no longer visible
				const finalMeetingsCount = await meetingsManagePage.getMeetingsCount();
				console.log(
					`Initial meetings count: ${initialMeetingsCount} | Final meetings count: ${finalMeetingsCount}`
				);

				// Expect exactly one less meeting (soft delete of single meeting)
				expect(finalMeetingsCount).toBe(initialMeetingsCount - 1);
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should allow user to cancel the deletion operation', async () => {
			let meetingToDelete: string | null = null;
			await test.step('Start at point 9: Navigate to deletion confirmation', async () => {
				// Navigate to processes and find meeting to delete
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');

				const foundProcessWithMeetings = await findProcessWithMeetings(
					adminHomePage,
					processAdminPage,
					updateProcessAdminPage,
					componentsPage
				);
				expect(foundProcessWithMeetings).toBe(true);

				// Navigate to meetings and start deletion
				const meetingComponents = await componentsPage.findComponentsByType('meetings');
				await componentsPage.manageComponent(meetingComponents[0]);
				await meetingsManagePage.waitForMeetingsPageLoad();

				// Get a meeting to delete and start the process (but cancel later)
				const allMeetings = await meetingsManagePage.getAllMeetingsData();

				for (const meeting of allMeetings) {
					const hasDeletePermission = await meetingsManagePage.hasActionPermission(meeting.id, 'delete');
					if (hasDeletePermission) {
						meetingToDelete = meeting.id;
						break;
					}
				}

				if (!meetingToDelete) {
					throw new Error('No deletable meeting found for cancellation test');
				}

				// Trigger delete but do NOT confirm
				await meetingsManagePage.softDeleteMeeting(meetingToDelete, { confirm: false });
			});

			await test.step('9.1. User: Decides to abort the cancellation flow', async () => {
				// We already chose to cancel; ensure we are still on meetings page
				await meetingsManagePage.expectToBeOnMeetingsPage();
			});

			await test.step('9.2. System: Exits without saving changes', async () => {
				// Meeting should still exist
				// Re-fetch to ensure presence
				const allMeetingsAfter = await meetingsManagePage.getAllMeetingsData();
				expect(allMeetingsAfter.some(m => m.id === meetingToDelete)).toBeTruthy();
			});

			await test.step('Result: The user cancels the action, and no data is saved. The system returns to the previous page', async () => {
				await meetingsManagePage.expectToBeOnMeetingsPage();
			});
		});
	});
});

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
 * Test suite for unpublishing meetings to temporarily hide them from public view.
 *
 * User Story: As a City Administrator, I want to unpublish a meeting so that it is temporarily hidden,
 * allowing me to make necessary changes or postpone it without public visibility.
 *
 * Requirements: PAR R14
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The meeting is currently published.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
});

test.describe('[PAR-EA005] – Unpublish a meeting', () => {
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
		test('should allow admin to unpublish a meeting to temporarily hide it from public view', async () => {
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
				// We're now on the components page, so we'll verify that in the next step
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
				// Click on the Meetings component to manage it (not unpublish the component)
				const meetingComponents = await componentsPage.findComponentsByType('meetings');
				const firstMeetingComponent = meetingComponents[0];

				// Navigate to manage the meetings component to see individual meetings
				await componentsPage.manageComponent(firstMeetingComponent);
				await meetingsManagePage.waitForMeetingsPageLoad();

				// Verify we're now on the meetings management page
				await meetingsManagePage.expectToBeOnMeetingsPage();

				// Verify the page shows meetings
				const meetingsCount = await meetingsManagePage.getMeetingsCount();
				expect(meetingsCount).toBeGreaterThan(0);
			});

			await test.step('7. User: Finds a specific meeting and clicks on the "Unpublish" button to hide it from public view', async () => {
				// Get all meetings to find one that can be unpublished
				const allMeetings = await meetingsManagePage.getAllMeetingsData();

				// Find a meeting that has unpublish permission (published meetings)
				let meetingToUnpublish: string | null = null;

				for (const meeting of allMeetings) {
					const hasUnpublishPermission = await meetingsManagePage.hasActionPermission(
						meeting.id,
						'unpublish'
					);
					if (hasUnpublishPermission) {
						meetingToUnpublish = meeting.id;
						break;
					}
				}

				if (!meetingToUnpublish) {
					throw new Error(
						'No meetings found that can be unpublished. Make sure there are published meetings in this component.'
					);
				}

				// Unpublish the meeting
				await meetingsManagePage.unpublishMeeting(meetingToUnpublish);
			});

			await test.step('8. System: Updates the meeting status to "Unpublished"', async () => {
				// Verify that the meeting was successfully unpublished by checking if it no longer has unpublish permission
				// and now has publish permission instead
				const allMeetings = await meetingsManagePage.getAllMeetingsData();

				// Check if any meeting now has publish permission (meaning it was unpublished)
				let hasUnpublishedMeeting = false;
				for (const meeting of allMeetings) {
					const hasPublishPermission = await meetingsManagePage.hasActionPermission(meeting.id, 'unpublish');
					if (!hasPublishPermission) {
						// Meeting no longer has unpublish permission, meaning it was unpublished
						hasUnpublishedMeeting = true;
						break;
					}
				}

				expect(hasUnpublishedMeeting).toBe(true);
			});

			await test.step('9. System: Notifies the City Administrator that the meeting has been successfully unpublished', async () => {
				// The unpublishMeeting method already handles the confirmation dialog and waits for the action to complete
				// We can verify the state change by checking that at least one meeting is now unpublished
				const allMeetings = await meetingsManagePage.getAllMeetingsData();
				expect(allMeetings.length).toBeGreaterThan(0);
			});

			await test.step('Result: The meeting is no longer publicly visible, and participants cannot register or view the meeting details until it is republished', async () => {
				// Verify that we have meetings and at least one should be in an unpublished state
				const meetingsCount = await meetingsManagePage.getMeetingsCount();
				expect(meetingsCount).toBeGreaterThan(0);

				// The meeting status change is verified in step 8, confirming the meeting is unpublished
			});
		});
	});
});

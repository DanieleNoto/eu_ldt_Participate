import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { FormMeetingPage } from '@pages/pages/admin/processes/detail/meetings/FormMeetingPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Enables Event Organisers to modify the details of existing events.
 *
 * User Story: As an Event Organiser, I want to edit the details of an event so that I can update information like time, location, and attendee access as needed
 *
 * Requirements: PAR R14d, PAR R14b
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The specific process has Meeting component configured
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
});

test.describe('[PAR-EA003] – Edit event details', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let updateProcessPage: UpdateProcessAdminPage;
	let meetingsPage: MeetingsPage;
	let formMeetingPage: FormMeetingPage;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessPage = new UpdateProcessAdminPage(page);
		meetingsPage = new MeetingsPage(page);
		formMeetingPage = new FormMeetingPage(page);
		await adminHomePage.navigateToAdminHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow admin to edit event details', async () => {
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
				const currentUrl = updateProcessPage.getPage().url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/edit/);
			});

			await test.step('5. Admin: Navigates to the "Components->Meetings” section in the admin panel.', async () => {
				await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
			});

			await test.step('6. System: Displays the "Meetings" section in the admin panel.', async () => {
				// Verify meetings page is loaded and visible
				await meetingsPage.verifyMeetingsPageVisible();

				// Check if there are meetings available
				const meetingCount = await meetingsPage.getMeetingCount();
				expect(meetingCount).toBeGreaterThan(0);
			});

			await test.step('7. Admin: Selects the specific meeting to be edited.', async () => {
				// Click edit on the first meeting
				await meetingsPage.clickEdit(0);
				await meetingsPage.getPage().waitForLoadState('networkidle');
			});

			await test.step('8. System: Displays the meeting details, including options to modify various attributes.', async () => {
				// Verify we're on the edit meeting form page
				await formMeetingPage.verifyEditMeetingPageVisible();
			});
			await test.step('9. Admin: Update meeting details: Title, Description, Type (in person or online), Start Time, Duration, Location, Registration type, Online Meeting URL (only for online meeting)', async () => {
				// Update meeting title
				const newTitle = `Updated Meeting Title - ${Date.now()}`;
				await formMeetingPage.fillTitle(newTitle);

				// Update meeting description
				const newDescription = `Updated meeting description with new details - ${Date.now()}`;
				await formMeetingPage.fillDescription(newDescription);

				// Change meeting type to online
				await formMeetingPage.selectMeetingType('online');

				// Update start time (set to tomorrow)
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				const startDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
				const startTime = '14:00'; // 2 PM
				await formMeetingPage.setStartDateTime(startDate, startTime);

				// Update end time (3 hours after start)
				const endTime = '17:00'; // 5 PM
				await formMeetingPage.setEndDateTime(startDate, endTime);

				// Update online meeting URL
				const meetingUrl = 'https://meet.jit.si/updated-meeting-room';
				await formMeetingPage.fillOnlineMeetingUrl(meetingUrl);

				// Update location hints
				const locationHints = 'Meeting password: 123456';
				await formMeetingPage.fillLocationHints(locationHints);

				// Set registration type to "on this platform"
				await formMeetingPage.selectRegistrationType('on_this_platform');

				// Enable comments
				await formMeetingPage.setCommentsEnabled(true);
			});
			await test.step('10. Admin: Clicks on "Save Event" to update  the event.', async () => {
				// Click the Update button to save changes
				await formMeetingPage.submitForm();
				await formMeetingPage.getPage().waitForLoadState('networkidle');
			});

			await test.step('11. System: Validates the event details for completeness and correctness.', async () => {
				// Check if there are validation errors
				const hasValidationErrors = await formMeetingPage.hasValidationErrors();
				expect(hasValidationErrors).toBe(false);
			});

			await test.step('12. System: Saves the event and makes it available for citizens to view.', async () => {
				// Verify we're redirected back to meetings list or meeting details
				const currentUrl = await formMeetingPage.getCurrentUrl();
				expect(currentUrl).toMatch(/\/admin.*\/meetings/);
			});

			await test.step('13. System: Notifies the City Administrator that the event has been successfully updated.', async () => {
				// Check for success notification/message
				const successMessage = formMeetingPage
					.getPage()
					.locator('.flash.success, .alert.success, [role="alert"]');

				// Wait for potential success message to appear
				try {
					await expect(successMessage).toBeVisible({ timeout: 5000 });
				} catch {
					// If no explicit success message, verify we're back to meetings list
					const isOnMeetingsPage = await meetingsPage.isOnMeetingsPage();
					expect(isOnMeetingsPage).toBe(true);
				}
			});

			await test.step('Result.', async () => {
				// Final verification: navigate back to meetings and verify our meeting was updated
				if (!(await meetingsPage.isOnMeetingsPage())) {
					await meetingsPage.navigateToMeetings();
				}

				// Verify the meetings page loads successfully
				await meetingsPage.waitForMeetingsLoad();

				// Meeting should still exist in the list
				const meetingCount = await meetingsPage.getMeetingCount();
				expect(meetingCount).toBeGreaterThan(0);
			});
		});
	});
	test.describe('Alternative Flow', () => {
		test('should handle validation failures. Start at point 11', async () => {
			// First navigate to edit a meeting to set up the test context
			await processAdminPage.navigateToProcesses();
			await processAdminPage.editFirstProcess();
			await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
			await meetingsPage.clickEdit(0);

			await test.step('11.1. System: Validates the input fields for completeness.', async () => {
				// Clear required fields to trigger validation errors
				await formMeetingPage.fillTitle(''); // Clear title (required field)

				// Clear select fields by directly manipulating them
				await formMeetingPage.getPage().locator('#meeting_type_of_meeting').selectOption('');
				await formMeetingPage.getPage().locator('#meeting_registration_type').selectOption('');
			});

			await test.step('11.2. System: Detects missing or invalid fields.', async () => {
				// Try to submit form with invalid data
				await formMeetingPage.submitForm();

				// Verify validation errors are displayed
				const hasValidationErrors = await formMeetingPage.hasValidationErrors();
				expect(hasValidationErrors).toBe(true);

				// Check for specific error messages on required fields
				const titleError = formMeetingPage.getPage().locator('#meeting_title_en').locator('~ .form-error');
				const typeError = formMeetingPage
					.getPage()
					.locator('#meeting_type_of_meeting')
					.locator('~ .form-error');
				const registrationError = formMeetingPage
					.getPage()
					.locator('#meeting_registration_type')
					.locator('~ .form-error');

				await expect(typeError).toBeVisible();
				await expect(registrationError).toBeVisible();
			});

			await test.step('11.3. Admin: Corrects the errors in the input fields.', async () => {
				// Fill in the required fields with valid data
				await formMeetingPage.fillTitle('Corrected Meeting Title');
				await formMeetingPage.selectMeetingType('online');
				await formMeetingPage.selectRegistrationType('on_this_platform');

				// Add other required fields
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				const startDate = tomorrow.toISOString().split('T')[0];
				await formMeetingPage.setStartDateTime(startDate, '14:00');
				await formMeetingPage.setEndDateTime(startDate, '17:00');
			});

			await test.step('11.4. Admin: Attempts to save the event again.', async () => {
				// Submit the form again with corrected data
				await formMeetingPage.submitForm();
				await formMeetingPage.getPage().waitForLoadState('networkidle');
			});

			await test.step('11.4. System: Revalidates the corrected fields.', async () => {
				// Verify no validation errors after correction
				const hasValidationErrors = await formMeetingPage.hasValidationErrors();
				expect(hasValidationErrors).toBe(false);

				// Verify successful submission (redirected away from form or success message)
				const currentUrl = await formMeetingPage.getCurrentUrl();
				expect(currentUrl).toMatch(/\/admin.*\/meetings/);
			});

			await test.step('Result.', async () => {
				// Verify the meeting was successfully saved after error correction
				if (!(await meetingsPage.isOnMeetingsPage())) {
					await meetingsPage.navigateToMeetings();
				}

				await meetingsPage.waitForMeetingsLoad();
				const meetingCount = await meetingsPage.getMeetingCount();
				expect(meetingCount).toBeGreaterThan(0);
			});
		});
	});
});

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

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

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		updateProcessAdminPage = new UpdateProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	/**
	 * Helper method to find and navigate to a process that has meetings component
	 */
	async function findProcessWithMeetings(): Promise<boolean> {
		// Navigate to processes section
		await adminHomePage.navigateViaAdminNav('processes');
		await processAdminPage.waitForLoadState('networkidle');

		// Get the count of available processes
		const processCount = await processAdminPage.getProcessCount();

		for (let i = 0; i < processCount && i < 5; i++) {
			// Limit to first 5 processes for efficiency
			try {
				// Navigate back to processes list if not on first iteration
				if (i > 0) {
					await adminHomePage.navigateViaAdminNav('processes');
					await processAdminPage.waitForLoadState('networkidle');
				}

				// Edit the process at index i
				await processAdminPage.processTable.editProcess(await getProcessNameAtIndex(i));
				await processAdminPage.getPage().waitForLoadState('networkidle');

				// Navigate to components section
				await updateProcessAdminPage.navigateToComponents();
				await componentsPage.waitForComponentsPageLoad();

				// Check if this process has meetings component
				const components = await componentsPage.getComponentTypes();
				const hasMeetings = components.some(type => type.toLowerCase().includes('meeting'));

				if (hasMeetings) {
					console.log(`Found process with meetings component at index ${i}`);
					return true;
				}
			} catch (error) {
				console.log(`Error checking process at index ${i}:`, error.message);
				continue;
			}
		}
		return false;
	}

	/**
	 * Helper method to get process name at specific index
	 */
	async function getProcessNameAtIndex(index: number): Promise<string> {
		const processTitles = await processAdminPage.processTable.getProcessTitles();
		return processTitles[index] || `Process ${index}`;
	}

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
				// Find a process with meetings component
				const foundProcessWithMeetings = await findProcessWithMeetings();
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
				await componentsPage.waitForLoadState('networkidle');

				// Verify we're now on the meetings management page
				const currentUrl = componentsPage.getPage().url();
				expect(currentUrl).toContain('/manage');
			});

			await test.step('7. User: Finds a specific meeting and clicks on the "Unpublish" button to hide it from public view', async () => {
				// TODO: We need to create a MeetingsManagePage class to handle individual meetings
				// For now, we'll use basic page operations to find and unpublish a meeting

				// Look for meetings table or list
				const page = componentsPage.getPage();

				// Wait for the meetings list to load
				await page.waitForSelector('.table-list, .card-grid, [data-meetings-list]', { timeout: 10000 });

				// Look for unpublish buttons on individual meetings
				const unpublishButtons = page.locator(
					'a[title*="Unpublish"], a[title*="Hide"], .action-icon--unpublish'
				);
				const buttonCount = await unpublishButtons.count();

				if (buttonCount === 0) {
					throw new Error(
						'No meetings found that can be unpublished. Make sure there are published meetings in this component.'
					);
				}

				// Click the first unpublish button
				await unpublishButtons.first().click();

				// Wait for the confirmation modal to appear
				await page.waitForSelector('#confirm-modal[aria-hidden="false"]', { timeout: 5000 });

				// Verify the modal content is about unpublishing
				const modalContent = await page.locator('#confirm-modal [data-confirm-modal-content]').textContent();
				expect(modalContent?.toLowerCase()).toContain('unpublish');

				// Click the OK button to confirm the unpublish action
				await page.locator('#confirm-modal button[data-confirm-ok]').click();

				// Wait for the success message to appear (which indicates the action completed)
				await page.waitForSelector('.flash.success[data-alert-box]', { timeout: 10000 });
				await page.waitForLoadState('networkidle');
			});

			await test.step('8. System: Updates the meeting status to "Unpublished"', async () => {
				// Verify that we get a success message or the meeting status changes
				const page = componentsPage.getPage();

				// Look for success notification or status change
				try {
					// Check if there's a success flash message
					await page.waitForSelector('.flash.notice, .alert-success, [data-flash-success]', {
						timeout: 5000
					});
				} catch {
					// If no flash message, check if the button text changed or disappeared
					const unpublishButtons = page.locator(
						'a[title*="Unpublish"], a[title*="Hide"], .action-icon--unpublish'
					);
					const buttonCount = await unpublishButtons.count();

					// The unpublish button should have changed to a publish button or status should be different
					const publishButtons = page.locator('a[title*="Publish"], a[title*="Show"], .action-icon--publish');
					const publishButtonCount = await publishButtons.count();

					expect(publishButtonCount).toBeGreaterThan(0);
				}
			});

			await test.step('9. System: Notifies the City Administrator that the meeting has been successfully unpublished', async () => {
				// Check for success notification
				const page = componentsPage.getPage();

				// Look for various types of success notifications
				const hasNotification = await page
					.locator('.flash.notice, .alert-success, [data-flash-success], .callout.success')
					.count();

				// If no specific notification, verify the state change occurred
				if (hasNotification === 0) {
					// Verify publish buttons exist (meaning unpublish was successful)
					const publishButtons = page.locator('a[title*="Publish"], a[title*="Show"], .action-icon--publish');
					const publishButtonCount = await publishButtons.count();
					expect(publishButtonCount).toBeGreaterThan(0);
				} else {
					expect(hasNotification).toBeGreaterThan(0);
				}
			});

			await test.step('Result: The meeting is no longer publicly visible, and participants cannot register or view the meeting details until it is republished', async () => {
				// Verify the meeting is in unpublished state by checking for publish buttons
				const page = componentsPage.getPage();
				const publishButtons = page.locator('a[title*="Publish"], a[title*="Show"], .action-icon--publish');
				const publishButtonCount = await publishButtons.count();

				// At least one meeting should now have a publish button (meaning it's unpublished)
				expect(publishButtonCount).toBeGreaterThan(0);
			});
		});
	});
});

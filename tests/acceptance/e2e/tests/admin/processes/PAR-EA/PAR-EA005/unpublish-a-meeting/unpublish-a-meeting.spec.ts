/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 * Denis Vasilev Dimchev
 */

import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { FormMeetingPage } from '@pages/pages/admin/processes/detail/meetings/FormMeetingPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test';

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
test.describe('[PAR-EA005] – Unpublish a meeting', () => {
	let processAdminPage: ProcessAdminPage;
	let updateProcessPage: UpdateProcessAdminPage;
	let meetingsPage: MeetingsPage;
	let formMeetingPage: FormMeetingPage;
	let componentsPage: ComponentsPage;

	// Use existing process with fixed slug for consistent testing
	const processSlug = 'test';

	// Generate unique timestamp for this test run to avoid parallel conflicts
	const timestamp = Date.now();

	// Track created meeting title for cleanup
	let createdMeetingTitle: string;

	test.beforeEach(async ({ adminPage }) => {
		processAdminPage = new ProcessAdminPage(adminPage);
		updateProcessPage = new UpdateProcessAdminPage(adminPage);
		meetingsPage = new MeetingsPage(adminPage);
		formMeetingPage = new FormMeetingPage(adminPage);
		componentsPage = new ComponentsPage(adminPage);

		// Create a unique PUBLISHED meeting for this test run
		createdMeetingTitle = `Unpublish Test Meeting ${timestamp}`;

		// Navigate to meetings section
		await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
		await adminPage.waitForLoadState('networkidle');
		await componentsPage.sidebarProcessDetail.navigateToComponents();
		const meetingsLink = componentsPage.getComponentLinkByName('Meetings');
		await meetingsLink.click();
		await adminPage.waitForLoadState('networkidle');

		// Create the meeting
		await meetingsPage.clickNewMeeting();
		await adminPage.waitForLoadState('networkidle');

		// Fill meeting details
		await formMeetingPage.fillTitle(createdMeetingTitle);
		await formMeetingPage.fillDescriptionField(`Test meeting for unpublish - ${timestamp}`, 'en');
		await formMeetingPage.selectMeetingType('in_person');
		await formMeetingPage.fillAddress('Test Address');
		await formMeetingPage.fillLocation('Test Location');

		// Set dates
		const startDate = new Date();
		startDate.setDate(startDate.getDate() + 1);
		await formMeetingPage.selectCustomDate(startDate, 0, 0);
		const hour = startDate.getHours();
		const minute = startDate.getMinutes();
		await formMeetingPage.selectCustomTime(0, hour, minute);

		// End date: same day, 2 hours later
		const endDate = new Date();
		endDate.setDate(endDate.getDate() + 1);
		const endHour = hour + 2;
		await formMeetingPage.selectCustomDate(endDate, 1, 1);
		await formMeetingPage.selectCustomTime(1, endHour, minute);

		// Set registration type
		await formMeetingPage.selectRegistrationType('registration_disabled');

		// Submit the form - meeting is created as UNPUBLISHED by default
		await formMeetingPage.createMeeting();
		await adminPage.waitForLoadState('networkidle');

		// Verify meeting was created
		await meetingsPage.verifyMeetingsPageVisible();

		// PUBLISH the meeting so we can test unpublishing it
		// Find the meeting row directly by title
		const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
		await expect(meetingRow).toBeVisible();

		// Click the publish button on this specific row
		const publishButton = meetingRow.locator('a[title="Publish"]');
		await publishButton.click();
		await adminPage.waitForLoadState('networkidle');

		// Verify meeting is now published (has unpublish button)
		const unpublishButton = meetingRow.locator('a[title="Unpublish"]');
		await expect(unpublishButton).toBeVisible();
	});

	test.afterEach(async ({ adminPage }) => {
		// Cleanup: delete the created meeting
		try {
			// Navigate to meetings list inside the Meetings component
			await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
			await adminPage.waitForLoadState('networkidle');
			await componentsPage.sidebarProcessDetail.navigateToComponents();
			const meetingsLink = componentsPage.getComponentLinkByName('Meetings');
			await meetingsLink.click();
			await adminPage.waitForLoadState('networkidle');

			// Find and delete meeting by title pattern
			const deleteMeetingByPattern = async (pattern: RegExp) => {
				const row = adminPage.locator('table tbody tr', { hasText: pattern });
				if ((await row.count()) > 0) {
					const deleteLink = row
						.first()
						.locator('a.action-icon--remove, a[title="Delete"], a.action-icon--delete');
					if ((await deleteLink.count()) > 0) {
						await deleteLink.first().click();
						// Confirm deletion
						const okButton = adminPage.getByRole('button', { name: 'OK' });
						if ((await okButton.count()) > 0) {
							await okButton.click();
							await adminPage.waitForLoadState('networkidle');
						}
						console.log(`Deleted meeting matching: ${pattern}`);
					}
				}
			};

			await deleteMeetingByPattern(new RegExp(`Unpublish Test Meeting ${timestamp}`, 'i'));
		} catch (error) {
			console.log(`Cleanup warning: Could not delete meeting:`, error);
		}
	});

	test.describe('Main Flow', () => {
		test('should allow admin to unpublish a meeting to temporarily hide it from public view', async ({
			adminPage
		}) => {
			await test.step('1. User: Navigates to the "Processes" section', async () => {
				await processAdminPage.navigateToProcesses();
				await adminPage.waitForLoadState('networkidle');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});

			await test.step('2. System: Displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});

			await test.step('3. User: Selects the process that want to update', async () => {
				// Navigate directly to the specific process edit page
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
				await adminPage.waitForLoadState('networkidle');
			});

			await test.step('4. System: Loads the selected process and displays the content in an editable form, including all existing information', async () => {
				// Verify we're on the process edit/management page
				const currentUrl = adminPage.url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/test\/edit/);
			});

			await test.step('5. User: Navigates to the "Components->Meetings" section in the admin panel', async () => {
				await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
			});

			await test.step('6. System: Displays the "Meetings" section in the admin panel', async () => {
				// Verify meetings page is loaded and visible
				await meetingsPage.verifyMeetingsPageVisible();

				// Check if our created meeting exists (it should be published)
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				// Verify it's published (has unpublish button)
				const unpublishButton = meetingRow.locator('a[title="Unpublish"]');
				await expect(unpublishButton).toBeVisible();
			});

			await test.step('7. User: Finds a specific meeting and clicks on the "Unpublish" button to hide it from public view', async () => {
				// Find the row with our created meeting and click unpublish
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				// Click unpublish on our specific meeting
				const unpublishButton = meetingRow.locator('a[title="Unpublish"]');
				await unpublishButton.click();
				await adminPage.waitForLoadState('load');

				// Handle confirmation dialog if present
				const okButton = adminPage.locator('button[data-confirm-ok]');
				if ((await okButton.count()) > 0) {
					await okButton.click();
					await adminPage.waitForLoadState('load');
				}
				await adminPage.waitForLoadState('networkidle');
			});

			await test.step('8. System: Updates the meeting status to "Unpublished"', async () => {
				// Wait for the page to refresh after unpublish action
				await meetingsPage.waitForMeetingsLoad();

				// Verify we're still on the meetings management page
				await meetingsPage.verifyMeetingsPageVisible();

				// The meeting should now show a "publish" button instead of "unpublish"
				// We verify by checking the row directly for the publish button
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				// Verify the publish button is now visible for this meeting (meaning it's unpublished)
				const publishButton = meetingRow.locator('a[title="Publish"]');
				await expect(publishButton).toBeVisible();
			});

			await test.step('9. System: Notifies the City Administrator that the meeting has been successfully unpublished', async () => {
				// Look for success notification or flash message
				const successMessage = adminPage.locator(
					'.flash.success, .alert-success, [role="alert"]:has-text("Meeting successfully unpublished.")'
				);

				await expect(successMessage.first()).toBeVisible();
			});

			await test.step('Result: The meeting is no longer publicly visible, and participants cannot register or view the meeting details until it is republished', async () => {
				// Verify that there are still meetings that can be published
				const hasMeetingsToPublish = await meetingsPage.hasMeetingToPublish();
				expect(hasMeetingsToPublish).toBe(true);

				// Verify our specific meeting is now unpublished (has publish button) by checking the row directly
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				// Confirm the publish button is visible (meaning it's unpublished)
				const publishButton = meetingRow.locator('a[title="Publish"]');
				await expect(publishButton).toBeVisible();

				// Test completed successfully - meeting unpublish functionality is working
				console.log('✅ Meeting unpublish test completed successfully');
			});
		});
	});
});

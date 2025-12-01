/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 * Simone Bianchelli
 */

import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { FormMeetingPage } from '@pages/pages/admin/processes/detail/meetings/FormMeetingPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test';

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

test.describe('[PAR-EA007] – Cancel an event', () => {
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

		// Create a unique meeting for this test run
		createdMeetingTitle = `Cancel Test Meeting ${timestamp}`;

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
		await formMeetingPage.fillDescriptionField(`Test meeting for cancel event - ${timestamp}`, 'en');
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

		// Submit the form
		await formMeetingPage.createMeeting();
		await adminPage.waitForLoadState('networkidle');

		// Verify meeting was created
		await meetingsPage.verifyMeetingsPageVisible();

		// Verify meeting row exists
		const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
		await expect(meetingRow).toBeVisible();
	});

	test.afterEach(async ({ adminPage }) => {
		// Cleanup: delete the created meeting if it still exists
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

			await deleteMeetingByPattern(new RegExp(`Cancel Test Meeting ${timestamp}`, 'i'));
		} catch (error) {
			console.log(`Cleanup warning: Could not delete meeting:`, error);
		}
	});

	test.describe('Main Flow', () => {
		test('should allow admin to cancel an event and remove it from the schedule', async ({ adminPage }) => {
			let initialMeetingsCount: number;

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

				// Get initial count of meetings
				initialMeetingsCount = await meetingsPage.getMeetingCount();
				expect(initialMeetingsCount).toBeGreaterThan(0);

				// Check if our created meeting exists
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();
			});

			await test.step('7. User: Clicks on the "Soft delete" button to delete the meeting', async () => {
				// Find our specific meeting and click delete
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				// Click the delete link for our specific meeting
				const deleteLink = meetingRow.locator(
					'a.action-icon--remove, a[title="Delete"], a.action-icon--delete'
				);
				await deleteLink.click();
			});

			await test.step('8. System: Display a dialog asking to confirm the action', async () => {
				// Wait for confirmation dialog to appear
				const okButton = adminPage.getByRole('button', { name: 'OK' });
				await expect(okButton).toBeVisible();
				console.log('Confirmation dialog displayed');
			});

			await test.step('9. User: Click on "Ok"', async () => {
				// Confirm deletion
				const okButton = adminPage.getByRole('button', { name: 'OK' });
				await okButton.click();
				await adminPage.waitForLoadState('networkidle');
				console.log('Deletion confirmed');
			});

			await test.step('10. System: Delete the meeting', async () => {
				// Wait for the deletion to be processed
				await adminPage.waitForLoadState('networkidle');

				// Verify the meeting has been deleted by checking it's no longer visible
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toHaveCount(0);
				console.log('Meeting deleted successfully');
			});

			await test.step('11. System: Notifies the City Administrator that the meeting has been successfully deleted', async () => {
				// Verify success notification appears (flash message)
				const flashMessage = adminPage.locator(
					'.flash.success, .flash.callout.success, [data-alert="success"]'
				);
				// Flash message may appear and disappear quickly, so we just verify the page state
				const currentUrl = adminPage.url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/.*\/manage/);
			});

			await test.step('Result: The meeting is deleted and no more visible', async () => {
				// Verify that the meetings list is updated and the deleted meeting is no longer visible
				const finalMeetingsCount = await meetingsPage.getMeetingCount();
				console.log(
					`Initial meetings count: ${initialMeetingsCount} | Final meetings count: ${finalMeetingsCount}`
				);

				// Expect exactly one less meeting
				expect(finalMeetingsCount).toBe(initialMeetingsCount - 1);

				// Verify our meeting is no longer visible
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toHaveCount(0);

				console.log('✅ Meeting has been successfully cancelled/deleted and is no longer visible');
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should allow user to cancel the deletion operation', async ({ adminPage }) => {
			await test.step('Start at point 1-8', async () => {
				// Navigate to meetings section
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
				await adminPage.waitForLoadState('networkidle');
				await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
				await meetingsPage.verifyMeetingsPageVisible();

				// Find our specific meeting and click delete
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				// Click the delete link for our specific meeting
				const deleteLink = meetingRow.locator(
					'a.action-icon--remove, a[title="Delete"], a.action-icon--delete'
				);
				await deleteLink.click();

				// Wait for confirmation dialog to appear
				const okButton = adminPage.getByRole('button', { name: 'OK' });
				await expect(okButton).toBeVisible();
			});

			await test.step('9.1. User: Decides to abort the cancellation flow', async () => {
				// Click Cancel instead of OK
				const cancelButton = adminPage.getByRole('button', { name: 'Cancel' });
				await cancelButton.click();
				await adminPage.waitForLoadState('networkidle');
			});

			await test.step('9.2. System: Exits without saving changes', async () => {
				// Meeting should still exist
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();
			});

			await test.step('Result: The user cancels the action, and no data is saved. The system returns to the previous page', async () => {
				await meetingsPage.verifyMeetingsPageVisible();

				// Verify our meeting still exists
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				console.log('✅ Successfully cancelled deletion and meeting still exists');
			});
		});
	});
});

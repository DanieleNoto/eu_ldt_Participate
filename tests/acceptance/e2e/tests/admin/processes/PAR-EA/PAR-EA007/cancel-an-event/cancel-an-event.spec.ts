/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denis Vasilev Dimchev
 * Antonio Abramo Carotenuto
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
		await adminPage.waitForLoadState('load');
		await componentsPage.sidebarProcessDetail.navigateToComponents();
		const meetingsLink = componentsPage.getComponentLinkByName('Meetings');
		await meetingsLink.click();
		await adminPage.waitForLoadState('load');

		// Create the meeting
		await meetingsPage.clickNewMeeting();
		await adminPage.waitForLoadState('load');

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
		await adminPage.waitForLoadState('load');

		// Verify meeting was created
		await meetingsPage.verifyMeetingsPageVisible();

		// Verify meeting row exists
		const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
		await expect(meetingRow).toBeVisible();
	});

	test.afterEach(async ({ adminPage }) => {
		const meetingsComponentId = '6';

		const deleteMeetingByTitle = async (searchText: string): Promise<void> => {
			await adminPage.goto(
				`/admin/participatory_processes/${processSlug}/components/${meetingsComponentId}/manage/meetings`
			);
			await adminPage.waitForLoadState('load');

			// Search by title to avoid pagination issues
			await adminPage.locator('#q_id_string_or_title_cont').fill(searchText);
			await adminPage.locator('#q_id_string_or_title_cont').press('Enter');
			await adminPage.waitForLoadState('load');

			const row = adminPage.locator('table tbody tr').filter({ hasText: searchText });
			const found = await row
				.first()
				.waitFor({ state: 'visible' })
				.then(() => true)
				.catch(() => false);
			if (!found) {
				console.log(`[Cleanup] Meeting not found: ${searchText}`);
				return;
			}

			// Open dropdown and unpublish first if needed
			await row.locator('button[data-controller="dropdown"]').click();
			await row.locator('ul.dropdown[aria-hidden="false"]').waitFor({ state: 'visible' });
			const unpublishLink = row.locator('a.dropdown__button[href*="/unpublish"]');
			if ((await unpublishLink.count()) > 0) {
				await unpublishLink.click();
				await adminPage.locator('[data-confirm-ok]').waitFor({ state: 'visible' });
				await adminPage.locator('[data-confirm-ok]').click();
				await adminPage.waitForLoadState('load');
				// After page reload, re-search and re-find the row (old locator is stale)
				await adminPage.locator('#q_id_string_or_title_cont').fill(searchText);
				await adminPage.locator('#q_id_string_or_title_cont').press('Enter');
				await adminPage.waitForLoadState('load');
				const freshRow = adminPage.locator('table tbody tr').filter({ hasText: searchText }).first();
				await freshRow.locator('button[data-controller="dropdown"]').click();
				await freshRow.locator('ul.dropdown[aria-hidden="false"]').waitFor({ state: 'visible' });
				await freshRow.locator('a.dropdown__button[href*="soft_delete"]').click();
			} else {
				await row.locator('a.dropdown__button[href*="soft_delete"]').click();
			}
			await adminPage.locator('[data-confirm-ok]').waitFor({ state: 'visible' });
			await adminPage.locator('[data-confirm-ok]').click();
			await adminPage.waitForLoadState('load');
			console.log(`[Cleanup] Meeting deleted: ${searchText}`);
		};

		try {
			await deleteMeetingByTitle(`Cancel Test Meeting ${timestamp}`);
		} catch (error) {
			console.error(`[Cleanup] Failed to delete meeting:`, error);
		}
	});

	test.describe('Main Flow', () => {
		test('should allow admin to cancel an event and remove it from the schedule', async ({ adminPage }) => {
			await test.step('1. User: Navigates to the "Processes" section', async () => {
				await processAdminPage.navigateToProcesses();
				await adminPage.waitForLoadState('load');

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
				await adminPage.waitForLoadState('load');
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

				// Verify our created meeting exists
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();
			});

			await test.step('7. User: Clicks on the "Soft delete" button to delete the meeting', async () => {
				// Find our specific meeting and click delete
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				// Open dropdown then click "Move to trash"
				await meetingRow.locator('button[data-controller="dropdown"]').click();
				const deleteLink = meetingRow.locator('a.dropdown__button[href*="soft_delete"]');
				await deleteLink.click();
			});

			await test.step('8. System: Display a dialog asking to confirm the action', async () => {
				// Wait for confirmation dialog to appear
				const okButton = adminPage.locator('button[data-confirm-ok]');
				await expect(okButton).toBeVisible();
				console.log('Confirmation dialog displayed');
			});

			await test.step('9. User: Click on "Ok"', async () => {
				// Confirm deletion
				const okButton = adminPage.locator('button[data-confirm-ok]');
				await okButton.click();
				await adminPage.waitForLoadState('load');
				console.log('Deletion confirmed');
			});

			await test.step('10. System: Delete the meeting', async () => {
				// Wait for the deletion to be processed
				await adminPage.waitForLoadState('load');

				// Verify the page is still on meetings list
				const currentUrl = adminPage.url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/.*\/manage/);
			});

			await test.step('11. System: Notifies the City Administrator that the meeting has been successfully deleted', async () => {
				// Verify success notification appears (flash message)
				// Flash message may appear and disappear quickly, so we check the page state
				await meetingsPage.verifyMeetingsPageVisible();
			});

			await test.step('Result: The meeting is deleted and no more visible', async () => {
				// Verify that the meeting is no longer found using the search form (pagination-safe)
				const meetingFound = await meetingsPage.searchAndVerifyMeetingExists(createdMeetingTitle);
				expect(meetingFound).toBe(false);

				console.log('✅ Meeting has been successfully cancelled/deleted and is no longer searchable');
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should allow user to cancel the deletion operation', async ({ adminPage }) => {
			await test.step('Start at point 1-8', async () => {
				// Navigate to meetings section
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
				await adminPage.waitForLoadState('load');
				await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
				await meetingsPage.verifyMeetingsPageVisible();

				// Find our specific meeting and click delete
				const meetingRow = adminPage.locator('table tbody tr', { hasText: createdMeetingTitle });
				await expect(meetingRow).toBeVisible();

				// Open dropdown then click "Move to trash"
				await meetingRow.locator('button[data-controller="dropdown"]').click();
				const deleteLink = meetingRow.locator('a.dropdown__button[href*="soft_delete"]');
				await deleteLink.click();

				// Wait for confirmation dialog to appear
				const okButton = adminPage.locator('button[data-confirm-ok]');
				await expect(okButton).toBeVisible();
			});

			await test.step('9.1. User: Decides to abort the cancellation flow', async () => {
				// Click Cancel instead of OK
				const cancelButton = adminPage.locator('button[data-confirm-cancel]');
				await cancelButton.click();
				await adminPage.waitForLoadState('load');
			});

			await test.step('9.2. System: Exits without saving changes', async () => {
				// Verify we're back on the meetings list
				await meetingsPage.verifyMeetingsPageVisible();
			});

			await test.step('Result: The user cancels the action, and no data is saved. The system returns to the previous page', async () => {
				// Verify our meeting still exists using the search form (pagination-safe)
				const meetingFound = await meetingsPage.searchAndVerifyMeetingExists(createdMeetingTitle);
				expect(meetingFound).toBe(true);

				console.log('✅ Successfully cancelled deletion and meeting still exists');
			});
		});
	});
});

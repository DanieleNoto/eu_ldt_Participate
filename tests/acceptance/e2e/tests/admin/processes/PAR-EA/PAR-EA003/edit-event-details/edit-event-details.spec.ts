/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { FormMeetingPage } from '@pages/pages/admin/processes/detail/meetings/FormMeetingPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { test, expect } from '@fixtures/parallel-test';

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
test.describe('[PAR-EA003] – Edit event details', () => {
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
		createdMeetingTitle = `Edit Test Meeting ${timestamp}`;

		// Navigate to meetings section
		await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
		await adminPage.waitForLoadState('load');
		await componentsPage.sidebarProcessDetail.navigateToComponents();
		const meetingsLink = componentsPage.getComponentLinkByName('Meetings');
		await meetingsLink.click();
		await adminPage.waitForLoadState('load');

		// Create the meeting to be edited
		await meetingsPage.clickNewMeeting();
		await adminPage.waitForLoadState('load');

		// Fill meeting details
		await formMeetingPage.fillTitle(createdMeetingTitle);
		await formMeetingPage.fillDescriptionField(`Test meeting for edit - ${timestamp}`, 'en');
		await formMeetingPage.selectMeetingType('in_person');
		await formMeetingPage.fillAddress('Test Address');
		await formMeetingPage.fillLocation('Test Location');

		// Set dates using selectCustomDate/selectCustomTime like PAR-EA002
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
			await deleteMeetingByTitle(`Edit Test Meeting ${timestamp}`);
			await deleteMeetingByTitle(`Updated Meeting Title`);
			await deleteMeetingByTitle(`Valid Title ${timestamp}`);
		} catch (error) {
			console.error(`[Cleanup] Failed to delete meeting:`, error);
		}
	});
	test.describe('Main Flow', () => {
		test('should allow admin to edit event details', async ({ adminPage }) => {
			// Variables to store updated values for verification
			let updatedTitle: string;
			let updatedDescription: string;
			let updatedMeetingType: 'online' | 'in_person' | 'hybrid';
			let updatedStartDate: string;
			let updatedStartTime: string;
			let updatedEndTime: string;
			let updatedOnlineMeetingUrl: string;
			let updatedLocationHints: string;
			let updatedRegistrationType: 'on_this_platform' | 'registration_disabled' | 'on_different_platform';
			await test.step('1. Admin: Navigates to the "Processes" section.', async () => {
				await processAdminPage.navigateToProcesses();
				await adminPage.waitForLoadState('load');

				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});

			await test.step('2. System: displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});

			await test.step('3. Admin: selects the process that want to update', async () => {
				// Navigate directly to the specific process edit page
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
				await adminPage.waitForLoadState('load');
			});

			await test.step('4. System: loads the selected process and displays the content in an editable form, including all existing information', async () => {
				// Verify we're on the process edit/management page
				const currentUrl = adminPage.url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/test\/edit/);
			});

			await test.step('5. Admin: Navigates to the "Components->Meetings” section in the admin panel.', async () => {
				await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
			});

			await test.step('6. System: Displays the "Meetings" section in the admin panel.', async () => {
				// Verify meetings page is loaded and visible
				await meetingsPage.verifyMeetingsPageVisible();

				// Check if our created meeting exists
				const meetingIndex = await meetingsPage.findMeetingByTitle(createdMeetingTitle);
				expect(meetingIndex).toBeGreaterThanOrEqual(0);
			});

			await test.step('7. Admin: Selects the specific meeting to be edited.', async () => {
				// Find and click edit on our created meeting
				const meetingIndex = await meetingsPage.findMeetingByTitle(createdMeetingTitle);
				await meetingsPage.clickEdit(meetingIndex);
				await adminPage.waitForLoadState('load');
			});

			await test.step('8. System: Displays the meeting details, including options to modify various attributes.', async () => {
				// Verify we're on the edit meeting form page
				await formMeetingPage.verifyEditMeetingPageVisible();
			});
			await test.step('9. Admin: Update meeting details: Title, Description, Type (in person or online), Start Time, Duration, Location, Registration type, Online Meeting URL (only for online meeting)', async () => {
				// Update meeting title
				updatedTitle = `Updated Meeting Title - ${Date.now()}`;
				await formMeetingPage.fillTitle(updatedTitle);

				// Update meeting description
				updatedDescription = `Updated meeting description with new details - ${Date.now()}`;
				await formMeetingPage.fillDescriptionField(updatedDescription, 'en');

				// Change meeting type to online
				updatedMeetingType = 'online';
				await formMeetingPage.selectMeetingType(updatedMeetingType);

				// Update start time (set to tomorrow)
				const tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				updatedStartDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
				updatedStartTime = '14:00'; // 2 PM
				await formMeetingPage.setStartDateTime(updatedStartDate, updatedStartTime);

				// Update end time (3 hours after start)
				updatedEndTime = '17:00'; // 5 PM
				await formMeetingPage.setEndDateTime(updatedStartDate, updatedEndTime);

				// Update online meeting URL
				updatedOnlineMeetingUrl = 'https://jitsi-part-int.ldttoolbox.app/updated-meeting-room';
				await formMeetingPage.fillOnlineMeetingUrl(updatedOnlineMeetingUrl);

				// Update location hints
				updatedLocationHints = 'Meeting password: 123456';
				await formMeetingPage.fillLocationHints(updatedLocationHints);

				// Set registration type to "on this platform"
				updatedRegistrationType = 'on_this_platform';
				await formMeetingPage.selectRegistrationType(updatedRegistrationType);

				// Enable comments
				await formMeetingPage.setCommentsEnabled(true);
			});
			await test.step('10. Admin: Clicks on "Save Event" to update  the event.', async () => {
				// Click the Update button to save changes
				await formMeetingPage.submitForm();
				await adminPage.waitForLoadState('load');
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
				const successMessage = adminPage.locator('.flash.success, .alert.success, [role="alert"]');

				await expect(successMessage).toBeVisible();
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

				// Find and edit the meeting we just updated by title to verify changes were saved
				const meetingIndex = await meetingsPage.findMeetingByTitle(updatedTitle);
				expect(meetingIndex).toBeGreaterThanOrEqual(0);

				// Click edit on the meeting we just updated
				await meetingsPage.clickEdit(meetingIndex);
				await adminPage.waitForLoadState('load');

				// Verify the edit form loads
				await formMeetingPage.verifyEditMeetingPageVisible();

				// Verify all the updated values are correctly saved in the form
				const currentTitle = await formMeetingPage.getTitle();
				expect(currentTitle).toBe(updatedTitle);

				const currentDescription = await formMeetingPage.getDescriptionField('en');
				expect(currentDescription).toContain(updatedDescription);

				const currentMeetingType = await formMeetingPage.getMeetingType();
				expect(currentMeetingType).toBe(updatedMeetingType);

				const currentRegistrationType = await formMeetingPage.getRegistrationType();
				expect(currentRegistrationType).toBe(updatedRegistrationType);

				const currentOnlineMeetingUrl = await formMeetingPage.getOnlineMeetingUrl();
				expect(currentOnlineMeetingUrl).toBe(updatedOnlineMeetingUrl);

				const currentLocationHints = await formMeetingPage.getLocationHints();
				expect(currentLocationHints).toBe(updatedLocationHints);

				// Verify comments are enabled
				const commentsEnabled = await formMeetingPage.getCommentsEnabledValue();
				expect(commentsEnabled).toBe(true);
			});
		});
	});
	test.describe('Alternative Flow', () => {
		test('should handle validation failures for all meeting types', async ({ adminPage }) => {
			test.slow();
			// Navigate directly to the specific process
			await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
			await adminPage.waitForLoadState('load');
			await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
			await meetingsPage.verifyMeetingsPageVisible();

			// Find and edit the meeting created in beforeEach
			const meetingIndex = await meetingsPage.findMeetingByTitle(createdMeetingTitle);
			expect(meetingIndex).toBeGreaterThanOrEqual(0);
			await meetingsPage.clickEdit(meetingIndex);
			await adminPage.waitForLoadState('load');

			const meetingTypes = [
				{
					type: 'online',
					requiredFields: [
						{
							name: 'title',
							selector: '#meeting_title_en',
							fill: async (v: string) => await formMeetingPage.fillTitle(v),
							clear: async () => await formMeetingPage.fillTitle(''),
							valid: 'Valid Title',
							isSelect: false
						},
						{
							name: 'type_of_meeting',
							selector: '#meeting_type_of_meeting',
							fill: async (v: string) =>
								await adminPage.locator('#meeting_type_of_meeting').selectOption(v),
							clear: async () => await adminPage.locator('#meeting_type_of_meeting').selectOption(''),
							valid: 'online',
							isSelect: true
						},
						{
							name: 'registration_type',
							selector: '#meeting_registration_type',
							fill: async (v: string) =>
								await adminPage.locator('#meeting_registration_type').selectOption(v),
							clear: async () => await adminPage.locator('#meeting_registration_type').selectOption(''),
							valid: 'on_this_platform',
							isSelect: true
						}
					]
				},
				{
					type: 'in_person',
					requiredFields: [
						{
							name: 'title',
							selector: '#meeting_title_en',
							fill: async (v: string) => await formMeetingPage.fillTitle(v),
							clear: async () => await formMeetingPage.fillTitle(''),
							valid: 'Valid Title',
							isSelect: false
						},
						{
							name: 'type_of_meeting',
							selector: '#meeting_type_of_meeting',
							fill: async (v: string) =>
								await adminPage.locator('#meeting_type_of_meeting').selectOption(v),
							clear: async () => await adminPage.locator('#meeting_type_of_meeting').selectOption(''),
							valid: 'in_person',
							isSelect: true
						},
						{
							name: 'registration_type',
							selector: '#meeting_registration_type',
							fill: async (v: string) =>
								await adminPage.locator('#meeting_registration_type').selectOption(v),
							clear: async () => await adminPage.locator('#meeting_registration_type').selectOption(''),
							valid: 'on_this_platform',
							isSelect: true
						}
					]
				},
				{
					type: 'hybrid',
					requiredFields: [
						{
							name: 'title',
							selector: '#meeting_title_en',
							fill: async (v: string) => await formMeetingPage.fillTitle(v),
							clear: async () => await formMeetingPage.fillTitle(''),
							valid: 'Valid Title',
							isSelect: false
						},
						{
							name: 'type_of_meeting',
							selector: '#meeting_type_of_meeting',
							fill: async (v: string) =>
								await adminPage.locator('#meeting_type_of_meeting').selectOption(v),
							clear: async () => await adminPage.locator('#meeting_type_of_meeting').selectOption(''),
							valid: 'hybrid',
							isSelect: true
						},
						{
							name: 'registration_type',
							selector: '#meeting_registration_type',
							fill: async (v: string) =>
								await adminPage.locator('#meeting_registration_type').selectOption(v),
							clear: async () => await adminPage.locator('#meeting_registration_type').selectOption(''),
							valid: 'on_this_platform',
							isSelect: true
						}
					]
				}
			];

			// Use a timestamp-scoped valid title so parallel workers never share the same title.
			const validTitle = `Valid Title ${timestamp}`;

			// Patch the 'valid' value for the 'title' field in every meeting type
			for (const { requiredFields } of meetingTypes) {
				const titleField = requiredFields.find(f => f.name === 'title');
				if (titleField) titleField.valid = validTitle;
			}

			// Track the current title of the meeting under test
			let currentMeetingTitle = createdMeetingTitle;

			for (const { type, requiredFields } of meetingTypes) {
				await test.step(`Alternative flow for meeting type: ${type}`, async () => {
					// First, fill all required fields with valid values
					for (const field of requiredFields) {
						await field.fill(field.valid);
					}
					// Use TypeScript literal values for meeting type
					if (type === 'online') {
						await formMeetingPage.selectMeetingType('online');
					} else if (type === 'in_person') {
						await formMeetingPage.selectMeetingType('in_person');
					} else {
						await formMeetingPage.selectMeetingType('hybrid');
					}
					await formMeetingPage.selectRegistrationType('on_this_platform');

					for (const field of requiredFields) {
						// Clear only the current field using the appropriate method
						await field.clear();
						await formMeetingPage.submitForm();

						// Look for a visible error - can be sibling of field OR inside the label containing the field
						const fieldId = field.selector.replace('#', '');

						// Error as sibling of the field
						const errorSibling = adminPage.locator(`${field.selector} ~ span.form-error.is-visible`);
						// Error inside the label that contains the field (for select elements)
						const errorInsideLabel = adminPage.locator(
							`label[for="${fieldId}"] span.form-error.is-visible`
						);
						// Error inside label with small tag
						const errorSmallInsideLabel = adminPage.locator(
							`label[for="${fieldId}"] small.form-error.is-visible`
						);
						// Generic form error near the field
						const errorGeneric = adminPage.locator(
							`label:has(${field.selector}) span.form-error.is-visible`
						);
						// Check for is-invalid-input class on the field itself
						const fieldIsInvalid = adminPage.locator(`${field.selector}.is-invalid-input`);
						const fieldWrappedInErrors = adminPage.locator(`div.field_with_errors:has(${field.selector})`);
						const errorSmallInPanel = adminPage
							.locator(field.selector)
							.locator('xpath=ancestor::div[contains(@class,"tabs-panel")]')
							.locator('small.form-error.is-visible');

						let errorFound = false;
						if ((await errorSibling.count()) > 0 && (await errorSibling.first().isVisible())) {
							errorFound = true;
						} else if (
							(await errorInsideLabel.count()) > 0 &&
							(await errorInsideLabel.first().isVisible())
						) {
							errorFound = true;
						} else if (
							(await errorSmallInsideLabel.count()) > 0 &&
							(await errorSmallInsideLabel.first().isVisible())
						) {
							errorFound = true;
						} else if ((await errorGeneric.count()) > 0 && (await errorGeneric.first().isVisible())) {
							errorFound = true;
						} else if ((await fieldIsInvalid.count()) > 0) {
							// Field has is-invalid-input class - validation failed
							errorFound = true;
						} else if ((await fieldWrappedInErrors.count()) > 0) {
							// Rails server-side validation: field wrapped in div.field_with_errors
							errorFound = true;
						} else if (
							(await errorSmallInPanel.count()) > 0 &&
							(await errorSmallInPanel.first().isVisible())
						) {
							// small.form-error inside tabs-panel ancestor (title field with language tabs)
							errorFound = true;
						}

						expect(errorFound).toBe(true);
						// Fix the field
						await field.fill(field.valid);
						// If this was the title field, the meeting title just changed
						if (field.name === 'title') {
							currentMeetingTitle = field.valid;
						}
						await formMeetingPage.submitForm();
						// If the page returned to the meetings list, reopen the meeting
						const currentUrl = await formMeetingPage.getCurrentUrl();
						if (/\/admin.*\/meetings/.test(currentUrl)) {
							// Find and edit our meeting using the current title
							const reopenIndex = await meetingsPage.findMeetingByTitle(currentMeetingTitle);
							await meetingsPage.clickEdit(reopenIndex);
							await adminPage.waitForLoadState('load');
							// Re-apply all required field values so the form is in the expected
							// state for the remaining fields of this type's iteration.
							for (const f of requiredFields) {
								await f.fill(f.valid);
							}
							if (type === 'online') {
								await formMeetingPage.selectMeetingType('online');
							} else if (type === 'in_person') {
								await formMeetingPage.selectMeetingType('in_person');
							} else {
								await formMeetingPage.selectMeetingType('hybrid');
							}
							await formMeetingPage.selectRegistrationType('on_this_platform');
						}
						// After fixing, no error should be visible for this field
						const fieldIdCheck = field.selector.replace('#', '');
						const errorSiblingCheck = adminPage.locator(`${field.selector} ~ span.form-error.is-visible`);
						const errorInsideLabelCheck = adminPage.locator(
							`label[for="${fieldIdCheck}"] span.form-error.is-visible`
						);
						const errorSmallInsideLabelCheck = adminPage.locator(
							`label[for="${fieldIdCheck}"] small.form-error.is-visible`
						);
						const errorGenericCheck = adminPage.locator(
							`label:has(${field.selector}) span.form-error.is-visible`
						);

						if ((await errorSiblingCheck.count()) > 0) {
							await expect(errorSiblingCheck.first()).not.toBeVisible();
						}
						if ((await errorInsideLabelCheck.count()) > 0) {
							await expect(errorInsideLabelCheck.first()).not.toBeVisible();
						}
						if ((await errorSmallInsideLabelCheck.count()) > 0) {
							await expect(errorSmallInsideLabelCheck.first()).not.toBeVisible();
						}
						if ((await errorGenericCheck.count()) > 0) {
							await expect(errorGenericCheck.first()).not.toBeVisible();
						}
					}
					// At the end, all fields should be valid
					const hasValidationErrors = await formMeetingPage.hasValidationErrors();
					expect(hasValidationErrors).toBe(false);
				});
			}
		});
	});
});

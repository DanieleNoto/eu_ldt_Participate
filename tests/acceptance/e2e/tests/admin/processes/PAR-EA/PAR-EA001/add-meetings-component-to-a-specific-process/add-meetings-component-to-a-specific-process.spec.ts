/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 * Denise Scarcelli
 */

import { expect } from '@playwright/test';
import { test } from '@fixtures/parallel-test';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { AddMeetingsComponentPage } from '@pages/pages/admin/processes/detail/components/meetings/AddMeetingsComponentPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';

/**
 * Test suite for Allows the City Administrator to add a Meetings component to a specific participatory process, enabling meetings to be organized and associated directly with the process, facilitating citizen engagement.
 *
 * User Story: As a City Administrator, I want to add a Meetings component to a specific process so that meetings can be organized and associated directly with the participatory process, allowing participants to engage in related discussions and events.
 *
 * Requirements: PAR R14, PAR R10
 *
 * Prerequisites:
 * - The City Administrator has an active account on the platform and is logged in.
 * - The City Administrator has permissions to edit participatory processes.
 */

test.describe('[PAR-EA001] – Add meetings component to a specific process', () => {
	let componentsPage: ComponentsPage;
	let addMeetingsComponentPage: AddMeetingsComponentPage;
	let processAdminPage: ProcessAdminPage;

	// Use existing process with fixed slug for consistent testing
	const processSlug = 'test';

	test.beforeEach(async ({ adminPage }) => {
		componentsPage = new ComponentsPage(adminPage);
		addMeetingsComponentPage = new AddMeetingsComponentPage(adminPage);
		processAdminPage = new ProcessAdminPage(adminPage);
	});

	test.describe('Main Flow', () => {
		test('should allow admin to add a Meetings component to a specific participatory process', async ({
			adminPage
		}) => {
			const timestamp = Date.now();
			const newName = `Community Meetings ${timestamp}`;

			await test.step('1. Admin: Navigates to the "Processes" section.', async () => {
				await processAdminPage.navigateToProcesses();
				await adminPage.waitForLoadState('networkidle');
				// Verify we're on the processes page
				const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
				expect(isOnProcessesPage).toBe(true);
			});

			await test.step('2. System: displays a list of all Processes that the City Administrator has created or has permissions to update', async () => {
				// Verify processes table is visible and has content
				const hasProcesses = await processAdminPage.processTable.hasProcesses();
				expect(hasProcesses).toBe(true);
			});

			await test.step('3. Admin: selects the process that want to update', async () => {
				await adminPage.goto(`/admin/participatory_processes/${processSlug}/edit`);
				await adminPage.waitForLoadState('networkidle');
			});

			await test.step('4. System: loads the selected process and displays the content in an editable form, including all existing information', async () => {
				// Verify we're on the process edit/management page
				const currentUrl = adminPage.url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/edit/);
			});

			await test.step('5. Admin: Navigates to the "Components" section in the admin panel.', async () => {
				// Navigate to Components tab/section
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				const currentUrl = adminPage.url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components/);
			});

			await test.step('6. Admin: Clicks on "Add Component" and select Meetings', async () => {
				// Click on "Add Component" button and select Meetings
				await componentsPage.addMeetingsComponent();
				await adminPage.screenshot({
					path: 'test-results/screenshots/EA001/AddComponent.png',
					fullPage: true
				});
			});

			await test.step('7. System: Displays the "Add Meetings Component" form, prompting the City Administrator to provide the component details.', async () => {
				// Verify we're on the new meeting form page
				const currentUrl = adminPage.url();
				expect(currentUrl).toMatch(/\/admin\/participatory_processes\/.*\/components\/new\?type=meetings/);
				await expect(
					adminPage.getByRole('heading', { name: 'Add component: Meetings', level: 1 })
				).toBeVisible();
			});

			await test.step('8. Admin: Fills in the component details • Name: Adds a title for the Meetings component, Announcement (optional): Adds an announcement visible to participants on the .', async () => {
				// Fill in the form fields
				await addMeetingsComponentPage.fillNameEn(newName);
				await addMeetingsComponentPage.fillAnnouncementEn(
					'Announcement visible to participants on the meeting landing page.'
				);
				await adminPage.screenshot({
					path: 'test-results/screenshots/EA001/FilledFields.png',
					fullPage: true
				});
			});

			await test.step('9. Admin: Clicks on "Save Component" to add the Meetings component to the process.', async () => {
				// Submit the form
				await addMeetingsComponentPage.submitForm();
				await adminPage.waitForLoadState('networkidle');
			});

			await test.step('10. System: Validates the component details for completeness and correctness.', async () => {
				// Check if there are validation errors
				const hasValidationErrors = await addMeetingsComponentPage.hasValidationErrors();
				expect(hasValidationErrors).toBe(false);
			});

			await test.step('11. System: Saves the Meetings component and updates the process details.', async () => {
				// Verify we're redirected back to components list
				const currentUrl = await componentsPage.getCurrentUrl();
				expect(currentUrl).toMatch(/\/admin.*\/components/);
			});

			await test.step('12. System: Notifies the City Administrator that the Meetings component has been successfully added to the process.', async () => {
				// Check for success notification/message
				const successMessage = adminPage.locator('.flash.success, .alert.success, [role="alert"]');
				await expect(successMessage).toBeVisible();
				await adminPage.screenshot({
					path: 'test-results/screenshots/EA001/MeetingComponentAdded.png',
					fullPage: true
				});
			});

			await test.step('Result.', async () => {
				// Final verification: check the new component appears in the components list with correct type
				const row = adminPage.getByRole('option', { name: new RegExp(newName, 'i') }).first();
				await expect(row).toBeVisible();
				const typeCell = row.locator('td').nth(2);
				await expect(typeCell).toHaveText(/Meetings/i);
				await componentsPage.deleteComponentIfExists(new RegExp(newName, 'i'));
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should show validation error when mandatory fields are blank and allow successful update after correction', async ({
			adminPage
		}) => {
			const timestamp = Date.now();
			const newNameBlank = ``;
			const newName = `Community Meetings ${timestamp}`;

			// Navigate directly to the process components page
			await adminPage.goto(`/admin/participatory_processes/${processSlug}/components`);
			await adminPage.waitForLoadState('networkidle');

			// Create the component Meetings first with "blank name"
			await componentsPage.addMeetingsComponent();
			await addMeetingsComponentPage.fillNameEn(newNameBlank);
			await adminPage.screenshot({
				path: 'test-results/screenshots/EA001/MissingField.png',
				fullPage: true
			});
			await addMeetingsComponentPage.fillAnnouncementEn('');
			await addMeetingsComponentPage.submitForm();
			await adminPage.waitForLoadState('networkidle');
			await adminPage.screenshot({
				path: 'test-results/screenshots/EA001/ExpectedErrorMissingField.png',
				fullPage: true
			});

			const flashIcon = adminPage.locator('.flash__icon svg[aria-hidden="true"]');
			await expect(flashIcon).toBeVisible();
			const errorMessage = adminPage.locator('small.form-error.is-visible[role="alert"]', {
				hasText: 'cannot be blank'
			});
			await expect(errorMessage).toBeVisible();

			// Now fill in a lowercase name to test that validation
			await addMeetingsComponentPage.fillNameEn('lowercase');
			await adminPage.screenshot({
				path: 'test-results/screenshots/EA001/LowercaseField.png',
				fullPage: true
			});
			await addMeetingsComponentPage.submitForm();
			await adminPage.waitForLoadState('networkidle');
			await adminPage.screenshot({
				path: 'test-results/screenshots/EA001/ExpectedErrorLowercaseField.png',
				fullPage: true
			});
			await expect(flashIcon).toBeVisible();
			await expect(errorMessage).toBeVisible();

			// Finally, fill in the correct name and submit
			await addMeetingsComponentPage.fillNameEn(newName);
			await addMeetingsComponentPage.fillAnnouncementEn(
				'Announcement visible to participants on the meeting landing page.'
			);
			await adminPage.screenshot({
				path: 'test-results/screenshots/EA001/ExpectedFieldFilled.png',
				fullPage: true
			});
			await addMeetingsComponentPage.submitForm();
			await adminPage.waitForLoadState('networkidle');

			// Verify the component was created
			const currentUrl = await componentsPage.getCurrentUrl();
			expect(currentUrl).toMatch(/\/admin.*\/components/);
			const successMessage = adminPage.locator('.flash.success, .alert.success, [role="alert"]');
			await expect(successMessage).toBeVisible();
			await adminPage.screenshot({
				path: 'test-results/screenshots/EA001/MeetingComponentAdded.png',
				fullPage: true
			});
			await componentsPage.deleteComponentIfExists(new RegExp(newName, 'i'));
		});
	});
});

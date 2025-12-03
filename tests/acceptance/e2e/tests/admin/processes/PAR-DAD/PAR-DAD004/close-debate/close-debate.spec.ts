/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { CloseDebatePage } from '@pages/pages/admin/processes/detail/debates/CloseDebatePage';
import { DebatesPage } from '@pages/pages/admin/processes/detail/debates/DebatesPage';
import { NewDebatePage } from '@pages/pages/admin/processes/detail/debates/NewDebatePage';
import { HomePage } from '@pages/pages/public/HomePage';
import { DebatesOverviewPage } from '@pages/pages/public/processes/DebatesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { DebateDetailPage } from '@pages/pages/user/processes/DebateDetailPage';
import { expect } from '@playwright/test';
import { test } from '@fixtures/parallel-test';

/**
 * Test suite for Allows authorized users, such as City Administrators, designated Moderators, or debate creators, to close an ongoing debate. Closing a debate prevents further edits or comments and provides an opportunity to add conclusions summarizing the discussion.
 *
 * User Story: As an authorized user (City Administrator, Moderator, or debate creator), I want to close a debate and add conclusions so that participants are informed of the outcome and further participation is restricted.
 *
 * Requirements: PAR R12
 *
 * Prerequisites:
 * - The user has an active account on the platform and is logged in.
 * - The debate is currently active and open for participation.
 * - If the debate was created by a participant, only that participant has the permissions to close it.
 */
test.describe('[PAR-DAD004] – Close debate', () => {
	let processesOverviewPage: ProcessesOverviewPage;
	let debatesOverviewPage: DebatesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let debateDetailPage: DebateDetailPage;
	let closeDebatePage: CloseDebatePage;
	let debatesPage: DebatesPage;
	let newDebatePage: NewDebatePage;
	let homePage: HomePage;

	// Use fixed process with known debates component
	const processSlug = 'test';
	const debatesComponentId = '3';

	// Track created debate for this test run
	let createdDebateTitle: string;
	let createdDebateId: string | null = null;

	/**
	 * Helper function to create a new debate for testing
	 * Returns the debate title and ID
	 */
	async function createTestDebate(adminPage: any, debateTitle: string): Promise<string | null> {
		console.log(`[Setup] Creating test debate: ${debateTitle}`);

		// Navigate to debates management page
		await adminPage.goto(
			`/admin/participatory_processes/${processSlug}/components/${debatesComponentId}/manage/debates`
		);
		await adminPage.waitForLoadState('networkidle');

		// Click New Debate button
		await debatesPage.createNewDebate();
		await newDebatePage.waitForPageReady();

		// Fill the debate form
		await newDebatePage.fillTitle(debateTitle);
		await newDebatePage.fillDescription('This is a test debate created for close debate testing.');
		await newDebatePage.fillInstructions('Please participate in this debate.');
		await newDebatePage.setDebateTypeOpen();
		await newDebatePage.setCommentsEnabled(true);

		// Submit the form
		await newDebatePage.clickCreateDebate();
		await adminPage.waitForLoadState('networkidle');

		// Extract the debate ID from the URL or find it in the list
		const currentUrl = adminPage.url();
		const debateIdMatch = currentUrl.match(/\/debates\/(\d+)/);

		if (debateIdMatch) {
			console.log(`[Setup] Debate created with ID: ${debateIdMatch[1]}`);
			return debateIdMatch[1];
		}

		// If not in URL, find it in the debates list
		await adminPage.goto(
			`/admin/participatory_processes/${processSlug}/components/${debatesComponentId}/manage/debates`
		);
		await adminPage.waitForLoadState('networkidle');

		const debateIndex = await debatesPage.findDebateIndexByTitle(debateTitle);
		if (debateIndex >= 0) {
			// Get the debate ID from the edit link
			const row = adminPage.locator('table.table-list tbody tr').nth(debateIndex);
			const editLink = row.locator('a.action-icon--edit');
			const href = await editLink.getAttribute('href');
			const idMatch = href?.match(/\/debates\/(\d+)\/edit/);
			if (idMatch) {
				console.log(`[Setup] Debate created with ID: ${idMatch[1]}`);
				return idMatch[1];
			}
		}

		console.log(`[Setup] Could not extract debate ID`);
		return null;
	}

	/**
	 * Helper function to delete a debate (cleanup)
	 */
	async function deleteTestDebate(adminPage: any, debateTitle: string): Promise<void> {
		try {
			console.log(`[Cleanup] Attempting to delete debate: ${debateTitle}`);

			// Navigate to debates management page
			await adminPage.goto(
				`/admin/participatory_processes/${processSlug}/components/${debatesComponentId}/manage/debates`
			);
			await adminPage.waitForLoadState('networkidle');

			// Find the debate by title
			const debateIndex = await debatesPage.findDebateIndexByTitle(debateTitle);

			if (debateIndex >= 0) {
				console.log(`[Cleanup] Found debate at index ${debateIndex}, deleting...`);

				// Click the delete button
				const row = adminPage.locator('table.table-list tbody tr').nth(debateIndex);
				const deleteButton = row.locator('.action-icon--delete');
				await deleteButton.click();

				// Confirm deletion
				const confirmOkButton = adminPage.locator('[data-confirm-ok]');
				await confirmOkButton.waitFor({ state: 'visible' });
				await confirmOkButton.click();

				await adminPage.waitForLoadState('networkidle');
				console.log(`[Cleanup] Debate deleted successfully`);
			} else {
				console.log(`[Cleanup] Debate not found, may have been already deleted`);
			}
		} catch (error) {
			console.error(`[Cleanup] Failed to delete debate:`, error);
		}
	}

	test.beforeEach(async ({ adminPage }) => {
		// Generate unique debate title for this test run
		const timestamp = Date.now();
		createdDebateTitle = `Close_Debate_Test_${timestamp}`;

		// Initialize Page Objects
		homePage = new HomePage(adminPage);
		processesOverviewPage = new ProcessesOverviewPage(adminPage);
		processDetailPage = new ProcessDetailPage(adminPage);
		debatesOverviewPage = new DebatesOverviewPage(adminPage);
		debateDetailPage = new DebateDetailPage(adminPage);
		closeDebatePage = new CloseDebatePage(adminPage);
		debatesPage = new DebatesPage(adminPage);
		newDebatePage = new NewDebatePage(adminPage);

		// Create a fresh debate for this test
		createdDebateId = await createTestDebate(adminPage, createdDebateTitle);
	});

	test.afterEach(async ({ adminPage }) => {
		// Cleanup: delete created debate
		if (createdDebateTitle) {
			await deleteTestDebate(adminPage, createdDebateTitle);
		}
	});

	test.describe('Main Flow', () => {
		const conclusionText = 'This is a test conclusion.';

		test('should allow user to close a debate', async ({ adminPage }) => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate directly to the fixed process with debates
				await adminPage.goto(`/processes/${processSlug}`);
				await adminPage.waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays the details of the selected process', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('3. User: Navigate to the "Debates" section of the process', async () => {
				// Navigate directly to the debates section of the process
				await adminPage.goto(`/processes/${processSlug}/f/${debatesComponentId}/debates`);
				await adminPage.waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads all the debates related to the navigated process', async () => {
				await debatesOverviewPage.expectToBeOnDebatesOverviewPage();
			});
			await test.step('5. User: Selects a debate from the list of available debates.', async () => {
				// Navigate to the debate we just created using its ID
				expect(createdDebateId).not.toBeNull();
				await adminPage.goto(`/processes/${processSlug}/f/${debatesComponentId}/debates/${createdDebateId}`);
				await adminPage.waitForLoadState('networkidle');
			});
			await test.step('6. System: Displays the selected debate, including the title, description, instructions, and current comments or posts.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step('7. User: Clicks on the "Close Debate" button.', async () => {
				await debateDetailPage.clickCloseDebateLink();
			});
			await test.step('8. System: Displays the "Close Debate" form, including the required field for conclusions', async () => {
				await closeDebatePage.expectToBeOnCloseDebatePage();
			});
			await test.step('9. User: Fills in the Conclusions field with a summary of the discussion and outcomes.', async () => {
				await closeDebatePage.fillConclusion(conclusionText);
			});
			await test.step('10. User: Clicks on "Close Debate" to submit the form. ', async () => {
				await closeDebatePage.clickCloseDebate();
			});
			await test.step('11. System: Validates the form input for completeness, correctness, and permission checks.', async () => {
				await debatesPage.expectSuccessFlashMessage('Debate successfully closed.');
			});
			await test.step('12. System: Saves the conclusions, closes the debate, and prevents further edits or comments.', async () => {
				expect(await debatesPage.isDebateClosedByTitle(createdDebateTitle)).toBeTruthy();
			});
			await test.step('13. System: Updates the debate status to "Closed" and displays the conclusions with the date and time it was closed.', async () => {
				expect(await debatesPage.isDebateClosedByTitle(createdDebateTitle)).toBeTruthy();
			});
			await test.step('Result.', async () => {
				const index = await debatesPage.getIndexByTitle(createdDebateTitle);

				// Handle opening of the new tab when clicking on preview
				const [newPage] = await Promise.all([
					debatesPage.getPage().waitForEvent('popup'),
					debatesPage.clickPreviewButtonByIndex(index)
				]);

				// Wait for the new page to be fully loaded
				await newPage.waitForLoadState('networkidle');

				// Verify closure announcement and conclusions in the preview tab
				const successFlashSection = newPage.locator('.flash.success[data-announcement]');
				await expect(successFlashSection).toBeVisible();

				const conclusionHeaderLocator = successFlashSection.locator('.flash__title');
				await expect(conclusionHeaderLocator).toBeVisible();
				await expect(conclusionHeaderLocator).toContainText('conclusions');

				const conclusionMessageLocator = successFlashSection.locator('.flash__message');
				await expect(conclusionMessageLocator).toBeVisible();
				await expect(conclusionMessageLocator).toContainText(conclusionText);

				// Close the new tab
				await newPage.close();
			});
		});
	});

	test.describe('Alternative Flow', () => {
		// Empty conclusion to trigger validation error (required field)
		const invalidConclusionText = '';

		test('should allow system to show validation fail', async ({ adminPage }) => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate directly to the fixed process with debates
				await adminPage.goto(`/processes/${processSlug}`);
				await adminPage.waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays the details of the selected process', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('3. User: Navigate to the "Debates" section of the process', async () => {
				// Navigate directly to the debates section of the process
				await adminPage.goto(`/processes/${processSlug}/f/${debatesComponentId}/debates`);
				await adminPage.waitForLoadState('networkidle');
			});
			await test.step('4. System: Loads all the debates related to the navigated process', async () => {
				await debatesOverviewPage.expectToBeOnDebatesOverviewPage();
			});
			await test.step('5. User: Selects a debate from the list of available debates.', async () => {
				// Navigate to the debate we just created using its ID
				expect(createdDebateId).not.toBeNull();
				await adminPage.goto(`/processes/${processSlug}/f/${debatesComponentId}/debates/${createdDebateId}`);
				await adminPage.waitForLoadState('networkidle');
			});
			await test.step('6. System: Displays the selected debate, including the title, description, instructions, and current comments or posts.', async () => {
				await debateDetailPage.expectToBeOnDebateDetailPage();
			});
			await test.step('7. User: Clicks on the "Close Debate" button.', async () => {
				await debateDetailPage.clickCloseDebateLink();
			});
			await test.step('8. System: Displays the "Close Debate" form, including the required field for conclusions', async () => {
				await closeDebatePage.expectToBeOnCloseDebatePage();
			});
			await test.step('9. User: Leaves the Conclusions field empty (validation test).', async () => {
				// Don't fill any conclusion to trigger validation error
				// The field should remain empty
			});
			await test.step('10. User: Clicks on "Close Debate" to submit the form. ', async () => {
				await closeDebatePage.clickCloseDebate();
				// Wait for validation response
				await adminPage.waitForLoadState('networkidle');
			});
			await test.step('11. System: Detects missing or incorrect data in the Conclusions field.', async () => {
				expect(await closeDebatePage.isConclusionValidationVisible()).toBeTruthy();
			});
			await test.step('12. System: Highlights the invalid field and displays an appropriate error message.', async () => {
				expect(await closeDebatePage.isConclusionValidationVisible()).toBeTruthy();
			});
			await test.step('13. User: Corrects the errors and resubmits the form.', async () => {
				await closeDebatePage.fillConclusion('This is a valid conclusion.');
				await closeDebatePage.clickCloseDebate();
				// After successful submit, should redirect to debates list
				await adminPage.waitForLoadState('networkidle');
				// Verify the success message and that debate is closed
				await debatesPage.expectSuccessFlashMessage('Debate successfully closed.');
				expect(await debatesPage.isDebateClosedByTitle(createdDebateTitle)).toBeTruthy();
			});
		});
	});
});

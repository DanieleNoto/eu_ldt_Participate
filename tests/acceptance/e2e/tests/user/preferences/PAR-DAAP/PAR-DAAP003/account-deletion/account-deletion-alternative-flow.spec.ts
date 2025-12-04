/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { HeaderComponent } from '@pages/components/common/HeaderComponent';
import { HomePage } from '@pages/pages/public/HomePage';
import { AccountDeletionPage } from '@pages/pages/user/account/AccountDeletionPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for Enables citizens to request the deletion of their personal account.
 *
 * User Story: 	
As a Citizen, I want to request the deletion of my personal data so that I can exercise my right to be forgotten.
 *
 * Requirements: PAR R3e
 *
 * Prerequisites:
 * - The citizen has an active account on the platform.
 * - The citizen is logged into the platform.
 */

test.describe('[PAR-DAAP003] – Request deletion of personal account', () => {
	let homePage: HomePage;
	let accountDeletionPage: AccountDeletionPage;
	let headerComponent: HeaderComponent;

	test.beforeEach(async ({ userPage }) => {
		accountDeletionPage = new AccountDeletionPage(userPage);
		headerComponent = new HeaderComponent(userPage);
		homePage = new HomePage(userPage);
		// Navigate to the application
		await homePage.navigateToHomePage();
		// Navigate to account deletion page
	});

	test.describe('Alternative Flow - Abort user deletion', () => {
		test('should cancel deletion request and return to account settings', async ({ page }) => {
			await accountDeletionPage.navigateToMyAccount();
			await accountDeletionPage.navigateToAccountDeletion();
			// Fill deletion reason
			const deletionReason = 'I changed my mind';
			await accountDeletionPage.fillDeleteReason(deletionReason);

			// Click delete account button
			await accountDeletionPage.clickDeleteAccountButton();

			// Wait for confirmation modal and verify it's properly displayed
			await accountDeletionPage.waitForConfirmationModal();
			await accountDeletionPage.verifyModalContent();

			// Cancel deletion
			await accountDeletionPage.cancelDeletion();

			// Verify modal is closed
			await expect(accountDeletionPage.isModalHidden()).resolves.toBe(true);

			// Verify we're still on the account deletion page
			await expect(accountDeletionPage.pageTitle).toBeVisible();
			await expect(accountDeletionPage.deleteAccountButton).toBeVisible();

			// Verify the filled reason is still there
			const filledReason = await accountDeletionPage.deleteReasonTextarea.inputValue();
			expect(filledReason).toBe(deletionReason);

			// Verify user is still logged in
			await expect(headerComponent.isUserLoggedIn()).resolves.toBe(true);
		});
	});
});

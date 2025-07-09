import { HeaderComponent } from '@pages/components/common/HeaderComponent';
import { HomePage } from '@pages/pages/public/HomePage';
import { AccountDeletionPage } from '@pages/pages/user/AccountDeletionPage';
import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

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
	test.use({ storageState: STORAGE_STATE.ACCOUNT_DELETION_USER });
	let homePage: HomePage;
	let accountDeletionPage: AccountDeletionPage;
	let headerComponent: HeaderComponent;

	test.beforeEach(async ({ page }) => {
		accountDeletionPage = new AccountDeletionPage(page);
		headerComponent = new HeaderComponent(page);
		homePage = new HomePage(page);
		// Navigate to the application
		await homePage.navigateToHomePage();
		// Navigate to account deletion page
	});

	test.describe('Main flow', () => {
		test('should successfully delete account with confirmation', async ({ page }) => {
			await test.step('1. User: Navigates to their "Account Settings" section within the platform.', async () => {
				await accountDeletionPage.navigateToMyAccount();
			});
			await test.step('2. System: Displays options related to data management, including data deletion.', async () => {
				await accountDeletionPage.verticalTabsComponent.isTabsListVisible();
				await accountDeletionPage.verticalTabsComponent.isDeleteAccountTabVisible();
			});
			await test.step('3. User: Selects the option labelled "Delete my account”', async () => {
				await accountDeletionPage.navigateToAccountDeletion();
				await accountDeletionPage.waitForPageLoad();
			});
			await test.step('4. System: Presents information explaining the consequences of deleting personal data, including loss of access to the account and services', async () => {
				await accountDeletionPage.verifyPageElements();
				await accountDeletionPage.verifyWarningMessage();
			});
			await test.step('5. User: Reviews the information and confirms the desire to proceed with the deletion request.', async () => {
				const deletionReason = 'I no longer wish to use this account';
				await accountDeletionPage.fillDeleteReason(deletionReason);
				await accountDeletionPage.clickDeleteAccountButton();
			});

			// Wait for confirmation modal and verify its content
			await accountDeletionPage.waitForConfirmationModal();
			await accountDeletionPage.verifyModalContent();
			await accountDeletionPage.verifyModalAccessibility();

			// Add a safety mechanism to prevent actual deletion in tests
			await page.route('**/account**', route => {
				if (route.request().method() === 'DELETE') {
					route.fulfill({
						status: 200,
						body: JSON.stringify({ message: 'Account deletion requested successfully' }),
						headers: { 'content-type': 'application/json' }
					});
				} else {
					route.continue();
				}
			});

			// Confirm deletion
			await accountDeletionPage.confirmDeletion();

			// Clean up route interception
			await page.unroute('**/account**');

			// Verify success message
			await accountDeletionPage.verifySuccessMessage();

			// Verify user contributions are anonymized (check that user is logged out)
			await expect(headerComponent.isUserLoggedIn()).resolves.toBe(false);
		});
	});
});

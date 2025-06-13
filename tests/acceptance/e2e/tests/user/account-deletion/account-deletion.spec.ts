import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';
import { HeaderComponent } from '../../../pages/components/common/HeaderComponent';
import { AccountDeletionPage } from '../../../pages/pages/user/AccountDeletionPage';

test.describe('Account Deletion Tests', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let accountDeletionPage: AccountDeletionPage;
	let headerComponent: HeaderComponent;

	test.beforeEach(async ({ page }) => {
		accountDeletionPage = new AccountDeletionPage(page);
		headerComponent = new HeaderComponent(page);

		// Navigate to the application
		await page.goto('/');
		// Navigate to account deletion page
		await accountDeletionPage.navigateToAccountDeletion();
		await accountDeletionPage.waitForPageLoad();
	});

	test.describe('Scenario principale - Eliminazione account con successo', () => {
		test('should successfully delete account with confirmation', async ({ page }) => {
			// Verify page elements are visible
			await accountDeletionPage.verifyPageElements();
			await accountDeletionPage.verifyWarningMessage();

			// Fill deletion reason
			const deletionReason = 'Non utilizzo più la piattaforma';
			await accountDeletionPage.fillDeleteReason(deletionReason);

			// Click delete account button
			await accountDeletionPage.clickDeleteAccountButton();

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

	test.describe('Scenario alternativo - Cancellazione richiesta eliminazione', () => {
		test('should cancel deletion request and return to account settings', async ({ page }) => {
			// Fill deletion reason
			const deletionReason = 'Ci ho ripensato';
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

	test.describe.skip('Scenario alternativo - Timeout della sessione durante eliminazione', () => {
		test('should handle session timeout during deletion process', async ({ page }) => {
			// Fill deletion reason
			await accountDeletionPage.fillDeleteReason('Test timeout scenario');

			// Simulate session timeout by clearing session storage/cookies
			await page.context().clearCookies();
			await page.evaluate(() => sessionStorage.clear());

			// Try to submit deletion
			await accountDeletionPage.clickDeleteAccountButton();

			// Should be redirected to login page due to session timeout
			await expect(page.locator('form[action*="sign_in"]')).toBeVisible();

			// Verify timeout message is shown
			await expect(page.locator('.flash.alert')).toBeVisible();
		});

		test('should handle session timeout with appropriate error message', async ({ page }) => {
			// Simulate long delay that could cause session timeout
			await accountDeletionPage.fillDeleteReason('Test session timeout');

			// Wait for potential session timeout
			await page.waitForTimeout(1000);

			// Clear session to simulate timeout
			await page.context().clearCookies();

			// Try to proceed with deletion
			await accountDeletionPage.clickDeleteAccountButton();

			// Should be redirected to login with session timeout message
			await page.waitForURL('**/users/sign_in**');
			await expect(page.locator('form[action*="sign_in"]')).toBeVisible();
		});
	});

	test.describe.skip('Scenario alternativo - Errore durante la sottomissione', () => {
		test('should handle server error during submission', async ({ page }) => {
			// Fill deletion reason
			await accountDeletionPage.fillDeleteReason('Test error scenario');

			// Simulate network error
			await accountDeletionPage.simulateNetworkError();

			// Try to submit deletion
			await accountDeletionPage.clickDeleteAccountButton();
			await accountDeletionPage.waitForConfirmationModal();
			await accountDeletionPage.confirmDeletion();

			// Should show error message
			await accountDeletionPage.verifyErrorMessage();

			// Verify user can retry (still on the same page)
			await expect(accountDeletionPage.deleteAccountButton).toBeVisible();
			await expect(accountDeletionPage.deleteReasonTextarea).toBeVisible();

			// Clear network error simulation and retry
			await accountDeletionPage.clearNetworkInterceptions();

			// The form should still be functional for retry
			const isReasonFilled = await accountDeletionPage.isDeleteReasonFilled();
			expect(isReasonFilled).toBe(true);
		});

		test('should allow retry after error', async ({ page }) => {
			// Fill deletion reason
			const deletionReason = 'Test retry after error';
			await accountDeletionPage.fillDeleteReason(deletionReason);

			// Simulate error on first attempt
			await page.route('**/account**', route => {
				if (route.request().method() === 'DELETE') {
					route.fulfill({ status: 500, body: 'Internal Server Error' });
				} else {
					route.continue();
				}
			});

			// First attempt should fail
			await accountDeletionPage.clickDeleteAccountButton();
			await accountDeletionPage.waitForConfirmationModal();
			await accountDeletionPage.confirmDeletion();

			// Wait for error message
			await expect(page.locator('.flash.error')).toBeVisible();

			// Remove the route interception for retry
			await page.unroute('**/account**');

			// Second attempt should work (assuming normal functionality)
			await accountDeletionPage.clickDeleteAccountButton();
			await accountDeletionPage.waitForConfirmationModal();
			await accountDeletionPage.confirmDeletion();

			// Should either succeed or show appropriate message
			await expect(page.locator('.flash')).toBeVisible();
		});
	});
});

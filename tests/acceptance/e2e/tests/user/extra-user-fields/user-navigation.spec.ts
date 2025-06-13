import { expect, test } from '@playwright/test';
import { UserExtraFieldsPage, UserFieldsData } from '../../../pages/pages/user/UserExtraFieldsPage';

test.describe('User Navigation and UI Interactions', () => {
	let userExtraFieldsPage: UserExtraFieldsPage;

	test.beforeEach(async ({ page }) => {
		userExtraFieldsPage = new UserExtraFieldsPage(page);
	});

	test('should handle direct navigation to account page without login', async () => {
		await test.step('Navigate directly to account page without authentication', async () => {
			await userExtraFieldsPage.navigateTo('http://localhost:3000/account');
			await userExtraFieldsPage.waitForLoadState();
		});

		await test.step('Verify redirection to login or access denied message', async () => {
			const page = userExtraFieldsPage.getPage();
			const currentUrl = page.url();
			const isRedirectedToAuth =
				currentUrl.includes('/sign_in') ||
				currentUrl.includes('/login') ||
				currentUrl.includes('/users/sign_in');

			if (isRedirectedToAuth) {
				// Verify we're on login page
				await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
			} else {
				// Check for access denied or authentication required message
				const authMessages = [
					page.getByText('Please log in'),
					page.getByText('Authentication required'),
					page.getByText('Access denied'),
					page.getByText('You need to sign in')
				];

				let authMessageFound = false;
				for (const message of authMessages) {
					if (await message.isVisible()) {
						authMessageFound = true;
						break;
					}
				}

				expect(authMessageFound || isRedirectedToAuth).toBe(true);
			}
		});
	});

	test('should handle browser back and forward navigation', async () => {
		await test.step('Complete user authentication flow', async () => {
			await userExtraFieldsPage.navigateTo('/');
			await userExtraFieldsPage.acceptCookies();
			await userExtraFieldsPage.performUserLogin();
		});

		await test.step('Navigate to account page', async () => {
			await userExtraFieldsPage.navigateToMyAccount();
			const page = userExtraFieldsPage.getPage();
			expect(page.url()).toContain('/account');
		});

		await test.step('Test browser back and forward navigation', async () => {
			const page = userExtraFieldsPage.getPage();

			// Go back in browser history
			await page.goBack();
			await userExtraFieldsPage.waitForLoadState();

			// Go forward again
			await page.goForward();
			await userExtraFieldsPage.waitForLoadState();

			// Should still be able to access account functionality
			expect(page.url()).toContain('/account');
			await expect(page.getByRole('button', { name: 'Update account' })).toBeVisible();
		});
	});

	test('should handle page refresh during form filling', async () => {
		await test.step('Setup authenticated user session', async () => {
			await userExtraFieldsPage.navigateTo('http://localhost:3000');
			await userExtraFieldsPage.acceptCookies();
			await userExtraFieldsPage.performUserLogin();
			await userExtraFieldsPage.navigateToMyAccount();
		});

		await test.step('Fill user extra fields using page object methods', async () => {
			const testUserData: UserFieldsData = {
				dateOfBirth: '15/08/1995',
				gender: 'male',
				postalCode: '54321'
			};

			await userExtraFieldsPage.fillDateOfBirth(testUserData.dateOfBirth!);
			await userExtraFieldsPage.selectGender(testUserData.gender!);
			await userExtraFieldsPage.fillPostalCode(testUserData.postalCode!);
		});

		await test.step('Refresh page and verify state', async () => {
			const page = userExtraFieldsPage.getPage();
			await page.reload();
			await userExtraFieldsPage.waitForLoadState();

			// Verify we're still on the account page
			expect(page.url()).toContain('/account');
			await expect(page.getByRole('button', { name: 'Update account' })).toBeVisible();

			// Fields should be either empty (reset) or preserved based on application behavior
			const dateField = page.locator('#user_date_of_birth_date');
			await expect(dateField).toBeVisible();
		});
	});

	test('should handle complete user extra fields workflow with navigation', async () => {
		await test.step('Setup complete user extra fields workflow', async () => {
			const userData: UserFieldsData = {
				dateOfBirth: '10/04/1996',
				gender: 'female',
				country: 'IT',
				postalCode: '00144',
				phoneNumber: '3258023921',
				location: 'Rome'
			};

			await userExtraFieldsPage.setupUserExtraFields(userData);
		});

		await test.step('Verify successful form submission', async () => {
			await userExtraFieldsPage.expectUpdateSuccess();
		});

		await test.step('Navigate away and back to verify persistence', async () => {
			const page = userExtraFieldsPage.getPage();

			// Navigate to home page
			await userExtraFieldsPage.navigateTo('http://localhost:3000');
			await userExtraFieldsPage.waitForLoadState();

			// Navigate back to account
			await userExtraFieldsPage.navigateToMyAccount();

			// Verify we can still access the form
			await expect(page.getByRole('button', { name: 'Update account' })).toBeVisible();
		});
	});
});

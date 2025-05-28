// import { test, expect } from '@playwright/test';
// import { UserConfigPage } from '../pages/UserConfigPage';

// test.describe('User Extra Fields Configuration - Error Handling', () => {
// 	let userConfigPage: UserConfigPage;

// 	test.beforeEach(async ({ page }) => {
// 		userConfigPage = new UserConfigPage(page);
// 	});

// 	test('should handle server error when updating user profile', async ({ page }) => {
// 		// Navigate to home and login
// 		await userConfigPage.navigateToHomePage();
// 		await userConfigPage.clickLoginLink();
// 		await userConfigPage.navigateToSignIn();
// 		await userConfigPage.acceptCookies();
// 		await userConfigPage.loginAsAdmin();

// 		// Navigate to user account
// 		await userConfigPage.navigateToMyAccount();

// 		// Simulate server error on form submission
// 		await page.route('**/account', route => {
// 			const method = route.request().method();
// 			const resourceType = route.request().resourceType();

// 			if (
// 				(method === 'POST' || method === 'PUT' || method === 'PATCH') &&
// 				(resourceType === 'xhr' || resourceType === 'fetch' || resourceType === 'document')
// 			) {
// 				route.fulfill({
// 					status: 500,
// 					contentType: 'application/json',
// 					body: JSON.stringify({ error: 'Internal Server Error' })
// 				});
// 			} else {
// 				route.continue();
// 			}
// 		});

// 		// Fill and submit the form
// 		await userConfigPage.modifyUserFields();

// 		// Verify error message is displayed
// 		const errorSelectors = [
// 			'[role="alert"]',
// 			'.alert-danger',
// 			'.error-message',
// 			'.notification.is-danger',
// 			'.flash.flash-error'
// 		];

// 		let errorFound = false;
// 		for (const selector of errorSelectors) {
// 			const errorElement = page.locator(selector);
// 			if (await errorElement.isVisible()) {
// 				const errorText = await errorElement.textContent();
// 				expect(errorText?.toLowerCase()).toMatch(/error|failed|server/i);
// 				errorFound = true;
// 				break;
// 			}
// 		}

// 		// If no specific error element found, check for any error indication
// 		if (!errorFound) {
// 			// Check if the success message is NOT visible (indicating error)
// 			const successMessage = page.getByText('Your account was successfully updated');
// 			await expect(successMessage).not.toBeVisible();
// 		}
// 	});

// 	test('should handle network failure when updating user profile', async ({ page }) => {
// 		// Navigate to home and login
// 		await userConfigPage.navigateToHomePage();
// 		await userConfigPage.clickLoginLink();
// 		await userConfigPage.navigateToSignIn();
// 		await userConfigPage.acceptCookies();
// 		await userConfigPage.loginAsAdmin();

// 		// Navigate to user account
// 		await userConfigPage.navigateToMyAccount();

// 		// Simulate network failure
// 		await page.route('**/account', route => {
// 			const method = route.request().method();
// 			if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
// 				route.abort('failed');
// 			} else {
// 				route.continue();
// 			}
// 		});

// 		// Fill and submit the form
// 		await userConfigPage.modifyUserFields();

// 		// Verify network error handling
// 		const networkErrorSelectors = [
// 			'.network-error',
// 			'.connection-error',
// 			'[role="alert"]',
// 			'.alert-danger'
// 		];

// 		let networkErrorFound = false;
// 		for (const selector of networkErrorSelectors) {
// 			const errorElement = page.locator(selector);
// 			if (await errorElement.isVisible()) {
// 				const errorText = await errorElement.textContent();
// 				expect(errorText?.toLowerCase()).toMatch(/network|connection|failed/i);
// 				networkErrorFound = true;
// 				break;
// 			}
// 		}

// 		// If no specific network error element found, verify form didn't submit successfully
// 		if (!networkErrorFound) {
// 			const successMessage = page.getByText('Your account was successfully updated');
// 			await expect(successMessage).not.toBeVisible();
// 		}
// 	});

// 	test('should handle session timeout during form submission', async ({ page }) => {
// 		// Navigate to home and login
// 		await userConfigPage.navigateToHomePage();
// 		await userConfigPage.clickLoginLink();
// 		await userConfigPage.navigateToSignIn();
// 		await userConfigPage.acceptCookies();
// 		await userConfigPage.loginAsAdmin();

// 		// Navigate to user account
// 		await userConfigPage.navigateToMyAccount();

// 		// Simulate session timeout (401 Unauthorized)
// 		await page.route('**/account', route => {
// 			const method = route.request().method();
// 			if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
// 				route.fulfill({
// 					status: 401,
// 					contentType: 'application/json',
// 					body: JSON.stringify({ error: 'Unauthorized - Session expired' })
// 				});
// 			} else {
// 				route.continue();
// 			}
// 		});

// 		// Fill and submit the form
// 		await userConfigPage.modifyUserFields();

// 		// Verify session timeout handling
// 		// This could redirect to login page or show an error message
// 		const currentUrl = page.url();
// 		const isRedirectedToLogin = currentUrl.includes('/sign_in') || currentUrl.includes('/login');

// 		if (isRedirectedToLogin) {
// 			// Verify we're on the login page
// 			await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
// 		} else {
// 			// Check for session timeout error message
// 			const authErrorSelectors = [
// 				'.auth-error',
// 				'.session-expired',
// 				'[role="alert"]',
// 				'.alert-danger'
// 			];

// 			let authErrorFound = false;
// 			for (const selector of authErrorSelectors) {
// 				const errorElement = page.locator(selector);
// 				if (await errorElement.isVisible()) {
// 					const errorText = await errorElement.textContent();
// 					expect(errorText?.toLowerCase()).toMatch(/unauthorized|session|expired|login/i);
// 					authErrorFound = true;
// 					break;
// 				}
// 			}

// 			if (!authErrorFound) {
// 				// Verify form didn't submit successfully
// 				const successMessage = page.getByText('Your account was successfully updated');
// 				await expect(successMessage).not.toBeVisible();
// 			}
// 		}
// 	});

// 	test('should handle validation errors from server', async ({ page }) => {
// 		// Navigate to home and login
// 		await userConfigPage.navigateToHomePage();
// 		await userConfigPage.clickLoginLink();
// 		await userConfigPage.navigateToSignIn();
// 		await userConfigPage.acceptCookies();
// 		await userConfigPage.loginAsAdmin();

// 		// Navigate to user account
// 		await userConfigPage.navigateToMyAccount();

// 		// Simulate server validation error (422 Unprocessable Entity)
// 		await page.route('**/account', route => {
// 			const method = route.request().method();
// 			if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
// 				route.fulfill({
// 					status: 422,
// 					contentType: 'application/json',
// 					body: JSON.stringify({
// 						errors: {
// 							date_of_birth: ['Date of birth is invalid'],
// 							phone_number: ['Phone number format is incorrect'],
// 							postal_code: ['Postal code is too short']
// 						}
// 					})
// 				});
// 			} else {
// 				route.continue();
// 			}
// 		});

// 		// Fill and submit the form
// 		await userConfigPage.modifyUserFields();

// 		// Verify validation errors are displayed
// 		const validationErrorSelectors = [
// 			'.field-error',
// 			'.validation-error',
// 			'.form-error',
// 			'[role="alert"]',
// 			'.alert-danger',
// 			'.error'
// 		];

// 		let validationErrorFound = false;
// 		for (const selector of validationErrorSelectors) {
// 			const errorElements = page.locator(selector);
// 			const count = await errorElements.count();
// 			if (count > 0) {
// 				for (let i = 0; i < count; i++) {
// 					const errorElement = errorElements.nth(i);
// 					if (await errorElement.isVisible()) {
// 						const errorText = await errorElement.textContent();
// 						if (errorText?.toLowerCase().match(/invalid|incorrect|format|short/i)) {
// 							validationErrorFound = true;
// 							break;
// 						}
// 					}
// 				}
// 				if (validationErrorFound) break;
// 			}
// 		}

// 		// If no specific validation error found, verify form didn't submit successfully
// 		if (!validationErrorFound) {
// 			const successMessage = page.getByText('Your account was successfully updated');
// 			await expect(successMessage).not.toBeVisible();
// 		}
// 	});

// 	test('should handle concurrent modification conflicts', async ({ page }) => {
// 		// Navigate to home and login
// 		await userConfigPage.navigateToHomePage();
// 		await userConfigPage.clickLoginLink();
// 		await userConfigPage.navigateToSignIn();
// 		await userConfigPage.acceptCookies();
// 		await userConfigPage.loginAsAdmin();

// 		// Navigate to user account
// 		await userConfigPage.navigateToMyAccount();

// 		// Simulate conflict error (409 Conflict)
// 		await page.route('**/account', route => {
// 			const method = route.request().method();
// 			if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
// 				route.fulfill({
// 					status: 409,
// 					contentType: 'application/json',
// 					body: JSON.stringify({
// 						error: 'Conflict: The record has been modified by another user'
// 					})
// 				});
// 			} else {
// 				route.continue();
// 			}
// 		});

// 		// Fill and submit the form
// 		await userConfigPage.modifyUserFields();

// 		// Verify conflict error handling
// 		const conflictErrorSelectors = [
// 			'.conflict-error',
// 			'.concurrent-modification',
// 			'[role="alert"]',
// 			'.alert-warning',
// 			'.alert-danger'
// 		];

// 		let conflictErrorFound = false;
// 		for (const selector of conflictErrorSelectors) {
// 			const errorElement = page.locator(selector);
// 			if (await errorElement.isVisible()) {
// 				const errorText = await errorElement.textContent();
// 				expect(errorText?.toLowerCase()).toMatch(/conflict|modified|another user/i);
// 				conflictErrorFound = true;
// 				break;
// 			}
// 		}

// 		// If no specific conflict error found, verify form didn't submit successfully
// 		if (!conflictErrorFound) {
// 			const successMessage = page.getByText('Your account was successfully updated');
// 			await expect(successMessage).not.toBeVisible();
// 		}
// 	});

// 	test('should retry form submission after network error', async ({ page }) => {
// 		// Navigate to home and login
// 		await userConfigPage.navigateToHomePage();
// 		await userConfigPage.clickLoginLink();
// 		await userConfigPage.navigateToSignIn();
// 		await userConfigPage.acceptCookies();
// 		await userConfigPage.loginAsAdmin();

// 		// Navigate to user account
// 		await userConfigPage.navigateToMyAccount();

// 		let requestCount = 0;
// 		// Simulate network failure on first attempt, success on second
// 		await page.route('**/account', route => {
// 			const method = route.request().method();
// 			if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
// 				requestCount++;
// 				if (requestCount === 1) {
// 					route.abort('failed');
// 				} else {
// 					route.continue();
// 				}
// 			} else {
// 				route.continue();
// 			}
// 		});

// 		// Fill and submit the form (first attempt - should fail)
// 		await userConfigPage.modifyUserFields();

// 		// Wait a moment and try again (simulate user retry)
// 		await page.waitForTimeout(1000);
// 		await page.getByRole('button', { name: 'Update account' }).click();

// 		// Verify the retry was successful
// 		await expect(page.getByText('Your account was successfully updated')).toBeVisible();
// 	});
// });

import { test, expect } from '@playwright/test';
import { CookieSettingsPage } from '../pages/CookieSettingsPage';

test.describe('Cookie Settings Integration Tests', () => {
	let cookieSettingsPage: CookieSettingsPage;

	test.beforeEach(async ({ page }) => {
		cookieSettingsPage = new CookieSettingsPage(page);
	});

	test.describe('Integration with User Authentication', () => {
		test('should sync cookie preferences with user profile', async ({ page }) => {
			await cookieSettingsPage.navigateToHomePage();
			await cookieSettingsPage.clickLoginLink();
			await cookieSettingsPage.navigateToSignIn();
			await cookieSettingsPage.acceptCookies();
			await cookieSettingsPage.loginAsAdmin();

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.waitForCookieSettingsToLoad();
			await cookieSettingsPage.togglePreferences();
			await cookieSettingsPage.saveSettings();

			const userMenu = page.getByRole('button', { name: 'A', exact: true });
			if (await userMenu.isVisible()) {
				await userMenu.click();
				const logoutLink = page.getByRole('link', { name: 'Log out' });
				if (await logoutLink.isVisible()) {
					await logoutLink.click();

					await cookieSettingsPage.navigateToSignIn();
					await cookieSettingsPage.loginAsAdmin();

					await cookieSettingsPage.openCookieSettings();
					await cookieSettingsPage.verifyPreferencesToggleState(false);
				}
			}
		});
	});
});

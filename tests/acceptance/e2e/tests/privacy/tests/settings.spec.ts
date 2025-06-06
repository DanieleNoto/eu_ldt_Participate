import { test, expect } from '@playwright/test';
import { CookieSettingsPage } from '../pages/CookieSettingsPage';

test.describe('Cookie Settings Management', () => {
	let cookieSettingsPage: CookieSettingsPage;

	test.beforeEach(async ({ page }) => {
		cookieSettingsPage = new CookieSettingsPage(page);
		await cookieSettingsPage.navigateToHomePage();
	});

	test.describe('Cookie Banner and Initial State', () => {
		test('should display cookie banner on first visit', async ({ page }) => {
			await cookieSettingsPage.verifyCookieBannerPresent();
			await expect(page.getByRole('button', { name: 'Cookie settings' })).toBeVisible();
			await expect(page.getByRole('button', { name: 'Accept all' })).toBeVisible();
			await expect(page.getByRole('button', { name: 'Accept only essential' })).toBeVisible();
		});
	});

	test.describe('Quick Action Buttons', () => {
		test('should accept only essential cookies when clicking Accept only essential', async ({ page }) => {
			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.acceptOnlyEssential();

			await cookieSettingsPage.verifyCookieBannerHidden();

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.verifyPreferencesToggleState(false);
			await cookieSettingsPage.verifyAnalyticsToggleState(false);
			await cookieSettingsPage.verifyMarketingToggleState(false);
		});

		test('should accept all cookies when clicking Accept all', async ({ page }) => {
			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.acceptAllCookies();

			await cookieSettingsPage.verifyCookieBannerHidden();

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.verifyPreferencesToggleState(true);
			await cookieSettingsPage.verifyAnalyticsToggleState(true);
			await cookieSettingsPage.verifyMarketingToggleState(true);
		});

		test('should handle sequential quick actions correctly', async ({ page }) => {
			await cookieSettingsPage.acceptAllCookies();
			await cookieSettingsPage.verifyCookieBannerHidden();

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.acceptOnlyEssential();

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.verifyPreferencesToggleState(false);
			await cookieSettingsPage.verifyAnalyticsToggleState(false);
			await cookieSettingsPage.verifyMarketingToggleState(false);

			await cookieSettingsPage.acceptAllCookies();

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.verifyPreferencesToggleState(true);
			await cookieSettingsPage.verifyAnalyticsToggleState(true);
			await cookieSettingsPage.verifyMarketingToggleState(true);
		});
	});
});

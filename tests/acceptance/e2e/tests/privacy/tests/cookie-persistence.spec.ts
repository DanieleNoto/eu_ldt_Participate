import { test, expect } from '@playwright/test';
import { CookieSettingsPage } from '../pages/CookieSettingsPage';

test.describe('Cookie Settings Persistence and Storage', () => {
	let cookieSettingsPage: CookieSettingsPage;

	test.beforeEach(async ({ page }) => {
		cookieSettingsPage = new CookieSettingsPage(page);
	});

	test.describe('Local Storage Persistence', () => {
		test('should create cookie with exact URL-encoded JSON structure', async ({ page }) => {
			await cookieSettingsPage.navigateToHomePage();

			await cookieSettingsPage.acceptAllCookies();
			await page.waitForTimeout(1000);

			const cookies = await page.context().cookies();
			const preferenceCookie = cookies.find(cookie => cookie.name.toLowerCase().includes('decidim-consent'));

			expect(preferenceCookie).toBeTruthy();

			if (preferenceCookie) {
				const decodedValue = decodeURIComponent(preferenceCookie.value);
				const parsed = JSON.parse(decodedValue);

				expect(parsed).toEqual({
					essential: true,
					preferences: true,
					analytics: true,
					marketing: true
				});
				const reDecoded = decodeURIComponent(preferenceCookie.value);
				const reParsed = JSON.parse(reDecoded);
				expect(reParsed).toEqual({
					essential: true,
					preferences: true,
					analytics: true,
					marketing: true
				});
			}
		});
		test('should persist cookie preferences in cookie with correct structure', async ({ page }) => {
			await cookieSettingsPage.navigateToHomePage();

			await cookieSettingsPage.verifyCookieBannerPresent();
			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.waitForCookieSettingsToLoad();

			await cookieSettingsPage.togglePreferences();
			await cookieSettingsPage.toggleAnalytics();
			await cookieSettingsPage.saveSettings();
			await cookieSettingsPage.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: false
			});
		});
		test('should handle pre-existing cookie with provided structure', async ({ page }) => {
			const providedCookieValue =
				'{%22essential%22:true%2C%22preferences%22:true%2C%22analytics%22:true%2C%22marketing%22:true}';

			await page.context().addCookies([
				{
					name: 'decidim-consent',
					value: providedCookieValue,
					domain: 'localhost',
					path: '/'
				}
			]);

			await cookieSettingsPage.navigateToHomePage();
			await page.waitForLoadState('networkidle');

			await cookieSettingsPage.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: true
			});

			await cookieSettingsPage.verifyCookieBannerHidden();

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.verifyPreferencesToggleState(true);
			await cookieSettingsPage.verifyAnalyticsToggleState(true);
			await cookieSettingsPage.verifyMarketingToggleState(true);
		});
		test('should restore preferences from cookie on page load', async ({ page }) => {
			await cookieSettingsPage.navigateToHomePage();

			await cookieSettingsPage.verifyCookieBannerPresent();
			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.waitForCookieSettingsToLoad();
			await cookieSettingsPage.toggleMarketing();
			await cookieSettingsPage.saveSettings();

			await cookieSettingsPage.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: false,
				marketing: true
			});

			await page.reload();
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			await cookieSettingsPage.verifyCookieBannerHidden();

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.verifyMarketingToggleState(true);
			await cookieSettingsPage.verifyPreferencesToggleState(false);
			await cookieSettingsPage.verifyAnalyticsToggleState(false);
		});

		test('should handle accept all cookies correctly', async ({ page }) => {
			await cookieSettingsPage.navigateToHomePage();

			await cookieSettingsPage.acceptAllCookies();

			await cookieSettingsPage.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: true
			});
		});
		test('should handle accept only essential cookies correctly', async ({ page }) => {
			await cookieSettingsPage.navigateToHomePage();

			await cookieSettingsPage.verifyCookieBannerPresent();
			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.waitForCookieSettingsToLoad();
			await cookieSettingsPage.acceptOnlyEssential();

			await cookieSettingsPage.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: false,
				marketing: false
			});
		});

		test('should update cookie when individual preferences change', async ({ page }) => {
			await cookieSettingsPage.navigateToHomePage();

			await cookieSettingsPage.acceptAllCookies();

			await cookieSettingsPage.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: true
			});

			await cookieSettingsPage.openCookieSettings();
			await cookieSettingsPage.togglePreferences();
			await cookieSettingsPage.toggleMarketing();
			await cookieSettingsPage.saveSettings();

			await cookieSettingsPage.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: true,
				marketing: false
			});
		});
	});
});

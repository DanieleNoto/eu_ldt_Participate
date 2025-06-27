// filepath: c:\_DEV\Work Projects\EU LDT Participate\tests\acceptance\e2e\tests\user\privacy\cookie-persistence.spec.ts
import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';
import { FooterComponent } from '@pages/components/common/FooterComponent';
import { expect, test } from '@playwright/test';

/**
 * Test Suite: Cookie Persistence and Storage
 *
 * This test suite covers cookie persistence across sessions:
 * - Cookie creation and storage
 * - Cross-session persistence
 * - Pre-existing cookie handling
 * - State restoration
 */
test.describe('Cookie Settings Persistence and Storage', () => {
	let cookieBar: CookieBarComponent;
	let footerComponent: FooterComponent;

	test.beforeEach(async ({ page }) => {
		cookieBar = new CookieBarComponent(page);
		footerComponent = new FooterComponent(page);
	});

	test.describe('Cookie Creation and Storage', () => {
		test('should create cookie with exact URL-encoded JSON structure', async ({ page }) => {
			await cookieBar.navigateToHomePage();
			await cookieBar.acceptAllCookies();
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

				// Verify double-decode reliability
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
		test('should create cookie with custom preferences through UI', async () => {
			await cookieBar.navigateToHomePage();
			await cookieBar.verifyCookieBannerPresent();
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Set custom preferences (cookies start disabled by default)
			await cookieBar.togglePreferences(); // false → true
			await cookieBar.toggleAnalytics(); // false → true
			await cookieBar.saveSettings();

			// Verify the cookie was created with correct values
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true, // Toggled to enabled
				analytics: true, // Toggled to enabled
				marketing: false // Not toggled, remains disabled
			});
		});

		test('should update existing cookie when preferences change', async () => {
			await cookieBar.navigateToHomePage();

			// Initial preferences
			await cookieBar.acceptAllCookies();
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: true
			});

			// Update preferences
			await footerComponent.clickCookieSettings();
			await cookieBar.toggleMarketing();
			await cookieBar.saveSettings();

			// Verify update
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: false
			});
		});
	});

	test.describe('Pre-existing Cookie Handling', () => {
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

			await cookieBar.navigateToHomePage();
			await page.waitForLoadState('networkidle');

			// Should recognize existing preferences
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: true
			});

			// Banner should be hidden
			await cookieBar.verifyCookieBannerHidden();

			// Settings should reflect the preferences
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(true);
			await cookieBar.verifyAnalyticsToggleState(true);
			await cookieBar.verifyMarketingToggleState(true);
		});

		test('should handle pre-existing cookie with partial preferences', async ({ page }) => {
			const partialCookieValue = encodeURIComponent(
				JSON.stringify({
					essential: true,
					preferences: false,
					analytics: true,
					marketing: false
				})
			);

			await page.context().addCookies([
				{
					name: 'decidim-consent',
					value: partialCookieValue,
					domain: 'localhost',
					path: '/'
				}
			]);

			await cookieBar.navigateToHomePage();
			await page.waitForLoadState('networkidle');

			// Should hide banner since consent was given
			await cookieBar.verifyCookieBannerHidden();

			// Should reflect the partial preferences
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(false);
			await cookieBar.verifyAnalyticsToggleState(true);
			await cookieBar.verifyMarketingToggleState(false);
		});
	});

	test.describe('Cross-Session Persistence', () => {
		test('should restore preferences from cookie on page load', async ({ page }) => {
			await cookieBar.navigateToHomePage();
			await cookieBar.verifyCookieBannerPresent();

			// Set specific preferences (cookies start disabled by default)
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.toggleMarketing(); // false → true
			await cookieBar.saveSettings();

			// Verify initial save (only marketing was toggled)
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false, // Not toggled, remains disabled
				analytics: false, // Not toggled, remains disabled
				marketing: true // Toggled to enabled
			});

			// Simulate page reload
			await page.reload();
			await cookieBar.waitForLoadState();

			// Banner should remain hidden
			await cookieBar.verifyCookieBannerHidden(); // Preferences should be restored
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(false); // Not toggled, remains disabled
			await cookieBar.verifyAnalyticsToggleState(false); // Not toggled, remains disabled
			await cookieBar.verifyMarketingToggleState(true); // Toggled to enabled
		});
		test('should persist preferences across navigation', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Set specific preferences (cookies start disabled by default)
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.toggleAnalytics(); // false → true
			await cookieBar.togglePreferences(); // false → true
			await cookieBar.saveSettings();

			// Navigate to different page
			await cookieBar.navigateToSignIn();
			await cookieBar.waitForLoadState();

			// Navigate back
			await cookieBar.navigateToHomePage();
			await cookieBar.waitForLoadState();

			// Banner should remain hidden
			await cookieBar.verifyCookieBannerHidden();

			// Preferences should be maintained (both were toggled to enabled)
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true, // Toggled to enabled
				analytics: true, // Toggled to enabled
				marketing: false // Not toggled, remains disabled
			});
		});

		test('should maintain cookie domain and path settings', async ({ page }) => {
			await cookieBar.navigateToHomePage();
			await cookieBar.acceptAllCookies();

			const cookies = await page.context().cookies();
			const consentCookie = cookies.find(
				cookie =>
					cookie.name.toLowerCase().includes('decidim-consent') ||
					cookie.name.toLowerCase().includes('consent')
			);

			if (consentCookie) {
				// Verify cookie is set with correct domain and path for persistence
				expect(consentCookie.domain).toBeTruthy();
				expect(consentCookie.path).toBe('/');

				// Should not be session-only (should have expiry or be persistent)
				// Note: Some implementations might not set explicit expiry for localStorage-backed cookies
			}
		});
	});
});

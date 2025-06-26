import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';
import { FooterComponent } from '@pages/components/common/FooterComponent';
import { test } from '@playwright/test';

/**
 * Test Suite: Cookie Settings Admin Integration
 *
 * This test suite covers admin-specific integration scenarios:
 * - Admin workflow integration
 * - Cross-system cookie behavior
 * - Admin session management with cookies
 * - Integration between cookie preferences and admin functions
 *
 * Note: Tests handle authentication inline rather than using stored state
 */
test.describe('Cookie Settings Admin Integration', () => {
	let cookieBar: CookieBarComponent;
	let footerComponent: FooterComponent;

	test.beforeEach(async ({ page }) => {
		cookieBar = new CookieBarComponent(page);
		footerComponent = new FooterComponent(page);
	});
	test.describe('Admin Authentication Integration', () => {
		test('should handle cookie consent with admin permissions', async ({ page }) => {
			await cookieBar.navigateToHomePage();
			await cookieBar.verifyCookieBannerPresent();

			// Accept cookies (admin is already authenticated via stored state)
			await cookieBar.acceptAllCookies();
			await cookieBar.verifyCookieBannerHidden();

			// Verify consent persists for admin user
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: true
			});
		});
		test('should maintain cookie preferences across admin session lifecycle', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Set specific preferences (admin is already authenticated)
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.toggleMarketing();
			await cookieBar.toggleAnalytics();
			await cookieBar.saveSettings();

			// Verify initial preferences
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: true,
				marketing: true
			});

			// Navigate to different pages and verify preferences persist
			await cookieBar.navigateToSignIn();
			await cookieBar.navigateToHomePage();

			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(false);
			await cookieBar.verifyAnalyticsToggleState(true);
			await cookieBar.verifyMarketingToggleState(true);
		});
		test('should handle admin preference changes in integrated workflow', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Accept cookies first (admin is already authenticated)
			await cookieBar.acceptCookies();

			// Admin should be able to modify cookie preferences
			await footerComponent.clickCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Change preferences as admin
			await cookieBar.togglePreferences();
			await cookieBar.toggleAnalytics();
			await cookieBar.saveSettings();

			// Verify admin changes were applied
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: false,
				marketing: true
			});

			// Navigate to different pages and verify persistence
			await cookieBar.navigateToSignIn();
			await cookieBar.navigateToHomePage();

			// Preferences should persist across navigation
			await cookieBar.verifyCookieBannerHidden();
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: false,
				marketing: true
			});
		});
	});
	test.describe('Integration Error Handling', () => {
		test('should handle authentication errors gracefully while maintaining cookie state', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Set preferences (admin is already authenticated, cookies start disabled by default)
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.togglePreferences(); // false → true
			await cookieBar.saveSettings();

			// Cookie state should be preserved
			await cookieBar.navigateToHomePage();
			await cookieBar.verifyCookieBannerHidden();

			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true, // Toggled to enabled
				analytics: false, // Not toggled, remains disabled
				marketing: false // Not toggled, remains disabled
			});
		});
	});
});

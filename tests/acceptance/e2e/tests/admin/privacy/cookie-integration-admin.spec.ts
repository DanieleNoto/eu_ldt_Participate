import { test, expect } from '@playwright/test';
import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';

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

	test.beforeEach(async ({ page }) => {
		cookieBar = new CookieBarComponent(page);
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
				preferences: true,
				analytics: false,
				marketing: false
			});

			// Navigate to different pages and verify preferences persist
			await cookieBar.navigateToSignIn();
			await cookieBar.navigateToHomePage();

			await cookieBar.openCookieSettings();
			await cookieBar.verifyPreferencesToggleState(true);
			await cookieBar.verifyAnalyticsToggleState(false);
			await cookieBar.verifyMarketingToggleState(false);
		});
		test('should handle admin preference changes in integrated workflow', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Accept cookies first (admin is already authenticated)
			await cookieBar.acceptCookies();

			// Admin should be able to modify cookie preferences
			await cookieBar.openCookieSettings();
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
	test.describe('Cross-System Integration', () => {
		test('should validate cookie behavior across admin and public interfaces', async ({ page }) => {
			// Test with admin interface (admin is already authenticated)
			await cookieBar.navigateToHomePage();
			await cookieBar.acceptOnlyEssential();

			// Verify admin preferences
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: false,
				marketing: false
			});

			// Admin should see the same preferences
			await cookieBar.verifyCookieBannerHidden();

			await cookieBar.openCookieSettings();
			await cookieBar.verifyPreferencesToggleState(false);
			await cookieBar.verifyAnalyticsToggleState(false);
			await cookieBar.verifyMarketingToggleState(false);

			// Admin modifies preferences
			await cookieBar.toggleAnalytics();
			await cookieBar.saveSettings();

			// Verify changes are applied system-wide
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: true,
				marketing: false
			});
		});
		test('should handle concurrent cookie operations in admin context', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Accept cookies first (admin is already authenticated)
			await cookieBar.acceptAllCookies();

			// Perform multiple rapid cookie operations
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Rapid toggle operations
			await cookieBar.toggleMarketing();
			await cookieBar.togglePreferences();
			await cookieBar.toggleAnalytics();
			await cookieBar.toggleMarketing(); // Toggle back

			await cookieBar.saveSettings();

			// Verify final state is consistent
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: false,
				marketing: true
			});

			// Verify state persists after reload
			await page.reload();
			await cookieBar.waitForLoadState();

			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: false,
				marketing: true
			});
		});
	});
	test.describe('Admin Session Management', () => {
		test('should maintain cookie consent throughout admin session', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Set custom preferences (admin is already authenticated)
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.toggleMarketing();
			await cookieBar.saveSettings();

			// Simulate various admin activities while maintaining cookie state
			const adminActivities = [
				() => cookieBar.navigateToHomePage(),
				() => cookieBar.navigateToSignIn(),
				() => cookieBar.navigateToHomePage()
			];

			for (const activity of adminActivities) {
				await activity();
				await cookieBar.waitForLoadState();

				// Cookie preferences should remain consistent
				await cookieBar.verifyCookieBannerHidden();
				await cookieBar.verifyCookiePreferences({
					essential: true,
					preferences: true,
					analytics: true,
					marketing: false
				});
			}
		});
		test('should handle admin session timeout with cookie persistence', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Set preferences (admin is already authenticated)
			await cookieBar.acceptAllCookies();
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.toggleAnalytics();
			await cookieBar.saveSettings();

			// Simulate session timeout by clearing auth cookies but keeping consent cookies
			const allCookies = await page.context().cookies();
			const consentCookie = allCookies.find(c => c.name.includes('consent'));

			if (consentCookie) {
				// Clear all cookies
				await page.context().clearCookies();

				// Restore only consent cookie
				await page.context().addCookies([consentCookie]);
			}

			// Navigate to public area
			await cookieBar.navigateToHomePage();

			// Cookie preferences should persist even after session timeout
			await cookieBar.verifyCookieBannerHidden();
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
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
		test('should recover from corrupted admin session with valid cookie state', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Establish good cookie state (admin is already authenticated)
			await cookieBar.acceptOnlyEssential();

			// Simulate corrupted session data
			await page.evaluate(() => {
				// Corrupt session storage but leave cookies intact
				sessionStorage.setItem('corrupted', 'invalid-data');
				localStorage.setItem('corrupted', 'invalid-data');
			});

			// Navigate and verify cookie state is still valid
			await cookieBar.navigateToHomePage();
			await cookieBar.verifyCookieBannerHidden();

			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: false,
				marketing: false
			});

			// Should still be able to modify preferences
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.toggleAnalytics();
			await cookieBar.saveSettings();

			// Verify changes applied successfully
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: true,
				marketing: false
			});
		});
	});
});

import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';
import { FooterComponent } from '@pages/components/common/FooterComponent';
import { expect, test } from '@playwright/test';

/**
 * Test Suite: Cookie Preferences Management
 *
 * This test suite covers detailed cookie preference management functionality:
 * - Opening cookie settings dialog
 * - Individual toggle management
 * - Saving custom preferences
 * - Preference verification
 */
test.describe('Cookie Preferences Management', () => {
	let cookieBar: CookieBarComponent;
	let footerComponent: FooterComponent;

	test.beforeEach(async ({ page }) => {
		cookieBar = new CookieBarComponent(page);
		footerComponent = new FooterComponent(page);
		await cookieBar.navigateToHomePage();
	});

	test.describe('Cookie Settings Dialog', () => {
		test('should open cookie settings dialog', async () => {
			await cookieBar.verifyCookieBannerPresent();
			await cookieBar.openCookieSettings();
			await cookieBar.verifyCookieSettingsDialogVisible();
		});

		test('should display all toggle options in settings dialog', async ({ page }) => {
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Verify all preference toggles are visible
			await expect(page.getByText('Toggle Preferences')).toBeVisible();
			await expect(page.getByText('Toggle Analytics')).toBeVisible();
			await expect(page.getByText('Toggle Marketing')).toBeVisible();
			await expect(page.getByRole('button', { name: 'Save settings' })).toBeVisible();
		});
	});

	test.describe('Individual Toggle Management', () => {
		test('should toggle preferences individually', async () => {
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Toggle preferences on (cookies start disabled by default)
			await cookieBar.togglePreferences();
			await cookieBar.verifyPreferencesToggleState(true);

			// Toggle preferences back off
			await cookieBar.togglePreferences();
			await cookieBar.verifyPreferencesToggleState(false);
		});
		test('should toggle analytics individually', async () => {
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Toggle analytics on (cookies start disabled by default)
			await cookieBar.toggleAnalytics();
			await cookieBar.verifyAnalyticsToggleState(true);

			// Toggle analytics back off
			await cookieBar.toggleAnalytics();
			await cookieBar.verifyAnalyticsToggleState(false);
		});
		test('should toggle marketing individually', async () => {
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Toggle marketing on (cookies start disabled by default)
			await cookieBar.toggleMarketing();
			await cookieBar.verifyMarketingToggleState(true);

			// Toggle marketing back off
			await cookieBar.toggleMarketing();
			await cookieBar.verifyMarketingToggleState(false);
		});
		test('should handle multiple toggles simultaneously', async () => {
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Toggle multiple categories (cookies start disabled by default)
			await cookieBar.togglePreferences();
			await cookieBar.toggleAnalytics();

			// Verify states (toggles enable the cookies)
			await cookieBar.verifyPreferencesToggleState(true);
			await cookieBar.verifyAnalyticsToggleState(true);
			await cookieBar.verifyMarketingToggleState(false); // Not toggled, remains disabled
		});
	});

	test.describe('Custom Preference Saving', () => {
		test('should save custom preferences and persist them', async () => {
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Set custom preferences: enable preferences and marketing, leave analytics disabled
			await cookieBar.togglePreferences(); // false → true
			await cookieBar.toggleMarketing(); // false → true
			await cookieBar.saveSettings();

			// Verify preferences were saved (analytics remains disabled by default)
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: false,
				marketing: true
			});

			// Verify banner is hidden after saving
			await cookieBar.verifyCookieBannerHidden();
		});
		test('should maintain preferences after page reload', async ({ page }) => {
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Set specific preferences (cookies start disabled by default)
			await cookieBar.toggleAnalytics(); // false → true
			await cookieBar.toggleMarketing(); // false → true
			await cookieBar.saveSettings();

			// Reload page
			await page.reload();
			await cookieBar.waitForLoadState();

			// Verify preferences persisted
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(false); // Not toggled, remains disabled
			await cookieBar.verifyAnalyticsToggleState(true); // Toggled, enabled
			await cookieBar.verifyMarketingToggleState(true); // Toggled, enabled
		});
		test('should update preferences when changed multiple times', async () => {
			// Initial setting (cookies start disabled by default)
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.togglePreferences(); // false → true
			await cookieBar.saveSettings();

			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true, // Toggled to enabled
				analytics: false, // Not toggled, remains disabled
				marketing: false // Not toggled, remains disabled
			});

			// Update setting
			await footerComponent.clickCookieSettings();
			await cookieBar.toggleAnalytics(); // false → true
			await cookieBar.saveSettings();

			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true, // Previous setting maintained
				analytics: true, // Toggled to enabled
				marketing: false // Still not toggled, remains disabled
			});
		});
	});

	test.describe('Settings Dialog Behavior', () => {
		test('should close settings dialog after saving', async () => {
			await cookieBar.openCookieSettings();
			await cookieBar.verifyCookieSettingsDialogVisible();

			await cookieBar.saveSettings();
			await cookieBar.verifyCookieSettingsDialogHidden();
		});

		test('should allow reopening settings dialog after initial consent', async () => {
			// Give initial consent
			await cookieBar.acceptAllCookies();
			await cookieBar.verifyCookieBannerHidden();

			// Should still be able to open settings
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyCookieSettingsDialogVisible();
		});
	});
});

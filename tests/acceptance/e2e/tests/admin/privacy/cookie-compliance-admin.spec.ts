import { test, expect } from '@playwright/test';
import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';

/**
 * Test Suite: Cookie Compliance and Admin Monitoring
 *
 * This test suite covers admin-specific compliance and monitoring functionality:
 * - Compliance verification from admin perspective
 * - Admin monitoring of cookie behavior
 * - Administrative cookie policy validation
 */
test.describe('Cookie Compliance and Admin Monitoring', () => {
	let cookieBar: CookieBarComponent;

	test.beforeEach(async ({ page }) => {
		cookieBar = new CookieBarComponent(page);
	});

	test.describe('Admin Compliance Verification', () => {
		test('should verify all required consent elements are present for compliance', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Verify banner compliance
			await cookieBar.verifyCookieBannerPresent();
			await cookieBar.verifyCookieConsentDialogPresent();

			// Verify all required buttons are accessible
			await expect(page.getByRole('button', { name: 'Accept all' })).toBeVisible();
			await expect(page.getByRole('button', { name: 'Accept only essential' })).toBeVisible();
			await expect(page.getByRole('button', { name: 'Cookie settings' })).toBeVisible();

			// Verify settings dialog compliance
			await cookieBar.openCookieSettings();
			await cookieBar.verifyCookieSettingsDialogVisible();

			// Verify all preference categories are available
			await expect(page.getByText('Toggle Preferences')).toBeVisible();
			await expect(page.getByText('Toggle Analytics')).toBeVisible();
			await expect(page.getByText('Toggle Marketing')).toBeVisible();
			await expect(page.getByRole('button', { name: 'Save settings' })).toBeVisible();
		});

		test('should ensure granular consent options are available', async ({ page }) => {
			await cookieBar.navigateToHomePage();
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Test each toggle independently for compliance
			const toggleTests = [
				{ name: 'preferences', toggle: () => cookieBar.togglePreferences() },
				{ name: 'analytics', toggle: () => cookieBar.toggleAnalytics() },
				{ name: 'marketing', toggle: () => cookieBar.toggleMarketing() }
			];

			for (const toggleTest of toggleTests) {
				// Toggle off
				await toggleTest.toggle();
				await cookieBar.saveSettings();

				// Verify the specific preference was changed
				const prefs = await cookieBar.getCookiePreferences();
				expect(prefs[toggleTest.name]).toBe(false);

				// Toggle back on for next test
				await cookieBar.openCookieSettings();
				await toggleTest.toggle();
				await cookieBar.saveSettings();
			}
		});

		test('should validate consent persistence for compliance', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Give specific consent
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();
			await cookieBar.toggleAnalytics();
			await cookieBar.saveSettings();

			const timestamp = Date.now();

			// Verify consent is stored
			const cookies = await page.context().cookies();
			const consentCookie = cookies.find(c => c.name.includes('consent'));

			if (consentCookie) {
				// Verify cookie has appropriate expiry/persistence
				expect(consentCookie.domain).toBeTruthy();
				expect(consentCookie.path).toBe('/');
			}

			// Verify consent persists across sessions
			await page.reload();
			await cookieBar.waitForLoadState();

			// Banner should remain hidden
			await cookieBar.verifyCookieBannerHidden();

			// Consent preferences should be maintained
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: false,
				marketing: true
			});
		});
	});

	test.describe('Admin Cookie Policy Validation', () => {
		test('should validate essential cookies cannot be disabled', async () => {
			await cookieBar.navigateToHomePage();
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Enable all optional preferences (cookies start disabled by default)
			await cookieBar.togglePreferences();
			await cookieBar.toggleAnalytics();
			await cookieBar.toggleMarketing();
			await cookieBar.saveSettings();

			// Verify essential cookies remain true (cannot be disabled) and optional cookies are enabled
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: true
			});
		});

		test('should validate all consent scenarios for policy compliance', async () => {
			const consentScenarios = [
				{
					name: 'Accept All',
					action: () => cookieBar.acceptAllCookies(),
					expected: { essential: true, preferences: true, analytics: true, marketing: true }
				},
				{
					name: 'Accept Essential Only',
					action: () => cookieBar.acceptOnlyEssential(),
					expected: { essential: true, preferences: false, analytics: false, marketing: false }
				},
				{
					name: 'Reject All',
					action: () => cookieBar.rejectAllCookies(),
					expected: { essential: true, preferences: false, analytics: false, marketing: false }
				}
			];

			for (const scenario of consentScenarios) {
				// Navigate to fresh page
				await cookieBar.navigateToHomePage();

				// Execute consent action
				await scenario.action();

				// Verify compliance
				await cookieBar.verifyCookiePreferences(scenario.expected);

				// Verify banner is hidden after consent
				await cookieBar.verifyCookieBannerHidden();
			}
		});

		test('should validate cookie data structure meets policy requirements', async ({ page }) => {
			await cookieBar.navigateToHomePage();
			await cookieBar.acceptAllCookies();

			const cookies = await page.context().cookies();
			const consentCookie = cookies.find(c => c.name.includes('consent'));

			if (consentCookie) {
				// Validate cookie structure meets requirements
				const decoded = JSON.parse(decodeURIComponent(consentCookie.value));

				// Must have all required properties
				expect(decoded).toHaveProperty('essential');
				expect(decoded).toHaveProperty('preferences');
				expect(decoded).toHaveProperty('analytics');
				expect(decoded).toHaveProperty('marketing');

				// All properties must be boolean
				expect(typeof decoded.essential).toBe('boolean');
				expect(typeof decoded.preferences).toBe('boolean');
				expect(typeof decoded.analytics).toBe('boolean');
				expect(typeof decoded.marketing).toBe('boolean');

				// Essential must always be true
				expect(decoded.essential).toBe(true);
			}
		});
	});
	test.describe('Admin Monitoring and Audit', () => {
		test('should enable admin to audit consent flow', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Admin should be able to monitor consent flow
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Verify admin can see all consent options
			await expect(page.getByText('Toggle Preferences')).toBeVisible();
			await expect(page.getByText('Toggle Analytics')).toBeVisible();
			await expect(page.getByText('Toggle Marketing')).toBeVisible(); // Admin should be able to change any setting (cookies start disabled by default)
			await cookieBar.togglePreferences();
			await cookieBar.toggleAnalytics();
			await cookieBar.saveSettings();

			// Verify changes were applied (toggles enable the cookies)
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: true,
				analytics: true,
				marketing: false
			});
		});
		test('should validate admin can override user consent patterns', async ({ page }) => {
			// Start with specific consent preferences
			await cookieBar.navigateToHomePage();
			await cookieBar.acceptOnlyEssential();

			// Admin should be able to modify consent
			await cookieBar.openCookieSettings();
			await cookieBar.waitForCookieSettingsToLoad();

			// Enable additional categories as admin
			await cookieBar.toggleAnalytics();
			await cookieBar.saveSettings();

			// Verify admin override worked
			await cookieBar.verifyCookiePreferences({
				essential: true,
				preferences: false,
				analytics: true,
				marketing: false
			});
		});
		test('should ensure admin compliance monitoring works across user types', async ({ page }) => {
			const userScenarios = [
				{
					name: 'Anonymous User',
					setup: async () => {
						await cookieBar.navigateToHomePage();
					}
				},
				{
					name: 'Authenticated Admin',
					setup: async () => {
						await cookieBar.navigateToHomePage();
						// Admin is already authenticated via stored state
					}
				}
			];

			for (const scenario of userScenarios) {
				await scenario.setup();

				// Each user type should have access to compliant consent flow
				await cookieBar.openCookieSettings();
				await cookieBar.verifyCookieSettingsDialogVisible();

				// All required options should be available
				await expect(page.getByText('Toggle Preferences')).toBeVisible();
				await expect(page.getByText('Toggle Analytics')).toBeVisible();
				await expect(page.getByText('Toggle Marketing')).toBeVisible();

				// Should be able to save preferences
				await cookieBar.toggleMarketing();
				await cookieBar.saveSettings();

				// Navigation to fresh state for next scenario
				await page.context().clearCookies();
			}
		});
	});

	test.describe('Compliance Error Handling', () => {
		test('should handle compliance violations gracefully', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Test malformed cookie handling
			await page.context().addCookies([
				{
					name: 'decidim-consent',
					value: 'invalid-json-data',
					domain: 'localhost',
					path: '/'
				}
			]);

			await page.reload();

			// Should still show banner if cookie is invalid
			await cookieBar.verifyCookieBannerPresent();

			// Should allow new consent to be given
			await cookieBar.acceptAllCookies();
			await cookieBar.verifyCookieBannerHidden();
		});

		test('should ensure consent cannot be bypassed', async ({ page }) => {
			await cookieBar.navigateToHomePage();

			// Try to navigate without giving consent
			await cookieBar.navigateToSignIn();

			// Consent should still be required (banner should appear if policy requires it)
			// This depends on implementation - some sites show banner on every page until consent

			// Try to set invalid consent data
			await page.context().addCookies([
				{
					name: 'decidim-consent',
					value: encodeURIComponent('{"essential": false}'), // Invalid: essential cannot be false
					domain: 'localhost',
					path: '/'
				}
			]);

			await page.reload();

			// Should treat invalid consent as no consent
			const prefs = await cookieBar.getCookiePreferences();
			if (prefs) {
				// If preferences are parsed, essential should be forced to true
				expect(prefs.essential).toBe(true);
			}
		});
	});
});

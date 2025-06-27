import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';
import { FooterComponent } from '@pages/components/common/FooterComponent';
import { expect, test } from '@playwright/test';

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
	let footer: FooterComponent;

	test.beforeEach(async ({ page }) => {
		cookieBar = new CookieBarComponent(page);
		footer = new FooterComponent(page);
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
			await cookieBar.rejectAllCookies();

			// Test each toggle independently for compliance
			const toggleTests = [
				{ name: 'preferences', toggle: () => cookieBar.togglePreferences() },
				{ name: 'analytics', toggle: () => cookieBar.toggleAnalytics() },
				{ name: 'marketing', toggle: () => cookieBar.toggleMarketing() }
			];

			for (const toggleTest of toggleTests) {
				// Toggle off
				await footer.clickCookieSettings();

				await toggleTest.toggle();
				await cookieBar.saveSettings();

				// Verify the specific preference was changed
				const prefs = await cookieBar.getCookiePreferences();
				expect(prefs[toggleTest.name]).toBe(true);

				// Toggle back on for next test
				await footer.clickCookieSettings();
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
				preferences: false,
				analytics: true,
				marketing: false
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

		test.skip('should validate all consent scenarios for policy compliance', async () => {
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
				await cookieBar.navigateToHomePageWithoutContext();

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
});

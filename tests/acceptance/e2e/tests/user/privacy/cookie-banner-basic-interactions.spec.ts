import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';
import { FooterComponent } from '@pages/components/common/FooterComponent';
import { expect, test } from '@playwright/test';

/**
 * Test Suite: Cookie Banner Basic Interactions
 *
 * This test suite covers the basic cookie banner functionality that regular users interact with:
 * - Initial banner display
 * - Quick action buttons (Accept All, Accept Essential, Reject All)
 * - Basic banner state management
 */
test.describe('Cookie Banner Basic Interactions', () => {
	let cookieBar: CookieBarComponent;
	let footerComponent: FooterComponent;

	test.beforeEach(async ({ page }) => {
		cookieBar = new CookieBarComponent(page);
		footerComponent = new FooterComponent(page);
		await cookieBar.navigateToHomePage();
	});

	test.describe('Initial Banner Display', () => {
		test('should display cookie banner on first visit', async ({ page }) => {
			await cookieBar.verifyCookieBannerPresent();
			await expect(page.getByRole('button', { name: 'Cookie settings' })).toBeVisible();
			await expect(page.getByRole('button', { name: 'Accept all' })).toBeVisible();
			await expect(page.getByRole('button', { name: 'Accept only essential' })).toBeVisible();
		});

		test('should display all required consent dialog elements', async () => {
			await cookieBar.verifyCookieConsentDialogPresent();
		});
	});

	test.describe('Quick Action Buttons', () => {
		test('should accept only essential cookies when clicking Accept only essential', async () => {
			await cookieBar.acceptOnlyEssential();
			await cookieBar.verifyCookieBannerHidden();

			// Verify that only essential cookies are enabled
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(false);
			await cookieBar.verifyAnalyticsToggleState(false);
			await cookieBar.verifyMarketingToggleState(false);
		});

		test('should accept all cookies when clicking Accept all', async () => {
			await cookieBar.acceptAllCookies();
			await cookieBar.verifyCookieBannerHidden();

			// Verify that all cookie categories are enabled
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(true);
			await cookieBar.verifyAnalyticsToggleState(true);
			await cookieBar.verifyMarketingToggleState(true);
		});

		test('should reject all non-essential cookies when clicking Reject all', async () => {
			await cookieBar.rejectAllCookies();
			await cookieBar.verifyCookieBannerHidden();

			// Verify that only essential cookies remain
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(false);
			await cookieBar.verifyAnalyticsToggleState(false);
			await cookieBar.verifyMarketingToggleState(false);
		});

		test('should handle sequential quick actions correctly', async () => {
			// First accept all

			await cookieBar.acceptAllCookies();
			await cookieBar.verifyCookieBannerHidden();

			// Then accept only essential
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyModalButtonsVisible();
			await cookieBar.rejectAllInModal();

			// Verify the change took effect
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(false);
			await cookieBar.verifyAnalyticsToggleState(false);
			await cookieBar.verifyMarketingToggleState(false);

			// Then accept all again
			await cookieBar.acceptAllInModal();

			// Verify all are enabled again
			await footerComponent.clickCookieSettings();
			await cookieBar.verifyPreferencesToggleState(true);
			await cookieBar.verifyAnalyticsToggleState(true);
			await cookieBar.verifyMarketingToggleState(true);
		});
	});

	test.describe('Banner State Management', () => {
		test('should hide banner after any consent action', async () => {
			await cookieBar.verifyCookieBannerPresent();
			await cookieBar.acceptAllCookies();
			await cookieBar.verifyCookieBannerHidden();
		});

		test('should not show banner again after consent given', async ({ page }) => {
			await cookieBar.acceptAllCookies();
			await cookieBar.verifyCookieBannerHidden();

			// Navigate away and back
			await cookieBar.navigateToSignIn();
			await cookieBar.navigateToHomePage();

			// Banner should still be hidden
			await cookieBar.verifyCookieBannerHidden();
		});
	});
});

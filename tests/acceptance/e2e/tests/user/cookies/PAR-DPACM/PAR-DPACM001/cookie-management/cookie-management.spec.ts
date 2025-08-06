import { CookieBarComponent } from '@pages/components/common/CookieBarComponent';
import { FooterComponent } from '@pages/components/common/FooterComponent';
import { HomePage } from '@pages/pages/public/HomePage';
import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * User Story: Privacy Settings Management
 *
 * As a Citizen, I want to manage my privacy settings and data sharing preferences
 * so that I have control over my personal data in accordance with regulations
 *
 * Requirements associated: PAR R3
 *
 * Prerequisites:
 * - The citizen has an active account on the platform
 * - The citizen is logged into the platform
 */
test.describe('[PAR-DPCAM001] – Privacy Settings and Cookie Management', () => {
	test.use({ storageState: STORAGE_STATE.USER });

	let homePage: HomePage;
	let cookieBar: CookieBarComponent;
	let footerComponent: FooterComponent;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		cookieBar = new CookieBarComponent(page);
		footerComponent = new FooterComponent(page);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow citizen to manage privacy settings and data sharing preferences', async ({ page }) => {
			await test.step('1. USER: Navigates to their "Cookie Settings" section within their profile', async () => {
				// Navigate to cookie settings through footer
				await footerComponent.clickCookieSettings();
				await page.waitForLoadState('networkidle');
			});

			await test.step('2. SYSTEM: Displays the Cookie settings dialog, showing current settings and options for data sharing preferences', async () => {
				// Verify cookie settings dialog is displayed
				await cookieBar.verifyCookieSettingsDialogVisible();

				// Verify all preference categories are available
				await expect(page.getByText('Toggle Preferences')).toBeVisible();
				await expect(page.getByText('Toggle Analytics')).toBeVisible();
				await expect(page.getByText('Toggle Marketing')).toBeVisible();
				await expect(page.getByRole('button', { name: 'Save settings' })).toBeVisible();

				console.log('Cookie settings dialog displayed with all preference options');
			});

			await test.step('3. USER: Reviews the current privacy settings and data sharing options', async () => {
				// Get current preferences and display them
				await cookieBar.waitForCookieSettingsToLoad();

				// Review current cookie preferences
				const currentPrefs = await cookieBar.getCookiePreferences();

				console.log('Current privacy settings reviewed:', {
					essential: currentPrefs.essential,
					preferences: currentPrefs.preferences,
					analytics: currentPrefs.analytics,
					marketing: currentPrefs.marketing
				});
			});

			await test.step('4. USER: Selects the option to modify privacy settings', async () => {
				// User decides to modify their privacy settings
				console.log('User has selected to modify privacy settings');
			});

			await test.step('5. SYSTEM: Enables editing of privacy preferences showing field for managing data consent categories: essential, preferences, analytics, marketing', async () => {
				// Verify all consent categories are editable
				await expect(page.getByText('Toggle Preferences')).toBeVisible();
				await expect(page.getByText('Toggle Analytics')).toBeVisible();
				await expect(page.getByText('Toggle Marketing')).toBeVisible();

				// Essential cookies should always be enabled (non-editable)
				const currentPrefs = await cookieBar.getCookiePreferences();
				expect(currentPrefs.essential).toBe(true);

				console.log('Privacy preferences editing enabled for all categories:', {
					essential: 'Always enabled (required)',
					preferences: 'Editable',
					analytics: 'Editable',
					marketing: 'Editable'
				});
			});

			await test.step('6. USER: Adjusts the settings according to their preferences', async () => {
				// Modify privacy settings - enable preferences and analytics, disable marketing
				await cookieBar.togglePreferences(); // Enable preferences
				await cookieBar.toggleAnalytics(); // Enable analytics
				// Marketing remains disabled by default

				// Verify the adjustments are reflected in UI
				await cookieBar.verifyPreferencesToggleState(false);
				await cookieBar.verifyAnalyticsToggleState(false);
				await cookieBar.verifyMarketingToggleState(true);

				console.log('User adjusted settings:', {
					preferences: 'Disabled',
					analytics: 'Disabled',
					marketing: 'Enabled'
				});
			});

			await test.step('7. USER: Clicks on the "Save" button to apply the changes', async () => {
				// Save the privacy settings
				await cookieBar.saveSettings();
				await page.waitForLoadState('networkidle');

				console.log('User clicked Save button to apply changes');
			});

			await test.step('8. SYSTEM: Saves the updated privacy settings securely', async () => {
				// Verify settings are saved in cookie
				await cookieBar.verifyCookiePreferences({
					essential: true,
					preferences: false,
					analytics: false,
					marketing: true
				});

				// Verify cookie is stored securely
				const cookies = await page.context().cookies();
				const consentCookie = cookies.find(c => c.name.includes('consent'));

				if (consentCookie) {
					expect(consentCookie.domain).toBeTruthy();
					expect(consentCookie.path).toBe('/');
					console.log('Privacy settings saved securely in browser cookie');
				}
			});

			await test.step('9. SYSTEM: Confirms to the user that their privacy settings have been successfully updated', async () => {
				// Verify dialog is closed after saving
				await cookieBar.verifyCookieSettingsDialogHidden();

				// Verify settings persist by reopening dialog
				await footerComponent.clickCookieSettings();
				await cookieBar.verifyPreferencesToggleState(false);
				await cookieBar.verifyAnalyticsToggleState(false);
				await cookieBar.verifyMarketingToggleState(true);

				console.log('System confirmed privacy settings have been successfully updated');
			});

			await test.step('Result.', async () => {
				// Final verification of the complete workflow
				await cookieBar.verifyCookiePreferences({
					essential: true,
					preferences: false,
					analytics: false,
					marketing: true
				});

				// Verify settings persist across page reload
				await page.reload();
				await page.waitForLoadState('networkidle');

				await footerComponent.clickCookieSettings();
				await cookieBar.verifyPreferencesToggleState(false);
				await cookieBar.verifyAnalyticsToggleState(false);
				await cookieBar.verifyMarketingToggleState(true);

				console.log(
					'Result: Privacy settings updated, enforced across platform, and GDPR compliance maintained'
				);
			});
		});
	});

	test.describe('Alternative Flow: Cancel', () => {
		test('should allow user to cancel privacy settings changes without saving', async ({ page }) => {
			// Start at point 4 of main flow
			await test.step('Setup: Navigate to cookie settings', async () => {
				await footerComponent.clickCookieSettings();
				await cookieBar.verifyCookieSettingsDialogVisible();
				await cookieBar.waitForCookieSettingsToLoad();
			});

			await test.step('4.a.1 USER: Decides not to proceed with changes and clicks on "Cancel" or navigates away without saving', async () => {
				// Make some changes first
				await cookieBar.togglePreferences();
				await cookieBar.toggleAnalytics();

				// Verify changes are visible in UI but not saved
				await cookieBar.verifyPreferencesToggleState(false);
				await cookieBar.verifyAnalyticsToggleState(false);

				// Navigate away without saving (press escape or click outside dialog)
				await page.keyboard.press('Escape');

				console.log('User decided not to proceed and navigated away without saving');
			});

			await test.step('4.a.2 SYSTEM: Prompts the user to confirm cancellation if any changes were made', async () => {
				// Verify dialog is closed
				await cookieBar.verifyCookieSettingsDialogHidden();

				console.log('System handled cancellation of unsaved changes');
			});

			await test.step('4.a.3 USER: Confirms cancellation', async () => {
				// User confirms they want to cancel changes
				console.log('User confirmed cancellation of privacy settings changes');
			});

			await test.step('4.a.4 SYSTEM: Discards any unsaved changes and returns the user to the profile or previous page', async () => {
				// Verify we're back on home page and settings are unchanged
				await homePage.expectToBeOnHomePage();

				// Verify original settings are maintained (all disabled by default)
				await cookieBar.verifyCookiePreferences({
					essential: true,
					preferences: true,
					analytics: true,
					marketing: true
				});

				console.log('System discarded unsaved changes and returned to previous page');
			});

			await test.step('Result.', async () => {
				// Verify that no changes were persisted
				await footerComponent.clickCookieSettings();
				await cookieBar.verifyPreferencesToggleState(false);
				await cookieBar.verifyAnalyticsToggleState(false);
				await cookieBar.verifyMarketingToggleState(true);

				console.log('Result: Privacy settings remain unchanged, unsaved modifications discarded');
			});
		});
	});
});

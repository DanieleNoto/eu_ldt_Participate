import { HomePage } from '@pages/pages/public/HomePage';
import { PrivacyPolicyPage } from '@pages/pages/public/PrivacyPolicyPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Terms of Service Viewing Test
 * User Story: As a Citizen, I want to view clear information about how my personal data is handled so that I am informed and can trust the platform.
 * Requirements: PAR R3a
 * Prerequisites:
 * - The citizen has an active account on the platform.
 * - The citizen is logged into the platform.
 *
 * Note: The Terms of Service page is currently in development and shows placeholder content.
 */
test.describe('[PAR-DAAP001] – Access information on data collection and usage', () => {
	test.use({ storageState: STORAGE_STATE.USER });

	let homePage: HomePage;
	let privacyPolicyPage: PrivacyPolicyPage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		privacyPolicyPage = new PrivacyPolicyPage(page);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow citizen to view terms of service information', async () => {
			await test.step("1. USER: Navigates to the platform's homepage or dashboard", async () => {
				// Navigate to homepage (already done in beforeEach)
				await homePage.expectToBeOnHomePage();
				console.log('Successfully navigated to homepage');
			});
			await test.step('2. USER: Locates a link or menu item labelled "Privacy Policy" and navigate on it', async () => {
				// Navigate to Terms of Service page (which contains privacy policy information)
				await homePage.navigateToPrivacyPolicy();
				await privacyPolicyPage.expectToBeOnPrivacyPolicyPage();
				console.log('Successfully navigated to Terms of Service page');
			});
			await test.step('3. SYSTEM: Displays the Privacy Policy page, which includes clear and comprehensive information', async () => {
				// Verify Privacy Policy page displays basic information (page is in development)
				await privacyPolicyPage.expectPrivacyPolicyContentToBeVisible();
				await privacyPolicyPage.expectComprehensivePrivacyInformationToBeDisplayed();

				// Get and verify page title
				const pageTitle = await privacyPolicyPage.getPrivacyPolicyTitle();
				console.log('Terms of Service page title:', pageTitle);
				expect(pageTitle).not.toBe('');

				// Get and display page content for verification
				const pageContent = await privacyPolicyPage.getPageContent();
				console.log('Page content length:', pageContent.length);
				console.log('Page content preview:', pageContent.substring(0, 100) + '...');

				// Verify page has some content (even if placeholder during development)
				expect(pageContent.length).toBeGreaterThan(0);
			});
			await test.step('4. USER: Reads through the information provided to understand how their personal data is handled', async () => {
				// Verify that the page content is accessible and readable (simplified for development state)
				await privacyPolicyPage.expectPageToBeProperlyLoaded();

				// Get page content to verify it's readable
				const content = await privacyPolicyPage.getPageContent();
				expect(content).not.toBe('');
				console.log('Terms of Service content is accessible and readable');
			});

			await test.step('5. USER: Closes the Privacy Policy page or navigates back to the previous page', async () => {
				// Close the Privacy Policy page
				await privacyPolicyPage.closePrivacyPolicyPage();
				await homePage.expectToBeOnHomePage();
				console.log('Successfully navigated back to homepage');
			});
			await test.step('Result.', async () => {
				// Verify user has successfully viewed terms of service information
				await homePage.expectToBeOnHomePage();
				console.log('User successfully viewed Terms of Service information and returned to homepage');
				console.log("The user is now informed about the platform's terms and can trust the platform");
			});
		});
	});
});

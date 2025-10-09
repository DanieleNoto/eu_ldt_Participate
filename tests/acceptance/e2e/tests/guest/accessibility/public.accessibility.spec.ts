import test, { expect } from '@playwright/test';
import { HomePage } from '@pages/pages/public/HomePage';
import { LoginPage } from '@pages/pages/auth/LoginPage';
import { ROUTES } from '@utils/routes';
import { analyzeAccessibility } from '@utils/accessibility-helper';

/**
 * [PAR-USA02] - QA tests execution for W3C WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * Accessibility tests for Public Section (Guest - not authenticated)
 * Minimum requirement: WCAG 2.1 Level AA (test fails only for 2.0/2.1 violations)
 * WCAG 2.2 violations are reported as warnings only
 * The tool must comply with accessibility guidelines for people with disabilities using WAI-ARIA
 */

test.describe('[PAR-USA02] Accessibility - Public Section (Guest)', () => {
	// No storageState - we want to test as a guest (not authenticated)
	let homePage: HomePage;
	let loginPage: LoginPage;

	test.beforeEach(async ({ page, context }) => {
		// Clear any existing authentication
		await context.clearCookies();

		homePage = new HomePage(page);
		loginPage = new LoginPage(page);
	});

	test('should have a minimum of a WCAG 2.1 AA level on public homepage', async ({ page }) => {
		await test.step('Navigate to public homepage (guest)', async () => {
			await homePage.navigateToHomePage();

			await page.waitForLoadState('networkidle');

			await homePage.expectToBeOnHomePage();
		});

		await test.step('Run accessibility analysis on public homepage', async () => {
			await analyzeAccessibility(page);
		});
	});

	test('should have a minimum of a WCAG 2.1 AA level on login page', async ({ page }) => {
		await test.step('Navigate to login page', async () => {
			await page.goto(ROUTES.loginPage.pattern);

			await page.waitForLoadState('networkidle');

			await expect(page).toHaveURL(/\/users\/sign_in/);
		});

		await test.step('Run accessibility analysis on login page', async () => {
			await analyzeAccessibility(page);
		});
	});

	test('should have a minimum of a WCAG 2.1 AA level on registration page', async ({ page }) => {
		await test.step('Navigate to registration page', async () => {
			await page.goto(ROUTES.signupPage.pattern);

			await page.waitForLoadState('networkidle');

			await expect(page).toHaveURL(/\/users\/sign_up/);
		});

		await test.step('Run accessibility analysis on registration page', async () => {
			await analyzeAccessibility(page);
		});
	});

	test('should have a minimum of a WCAG 2.1 AA level on password reset page', async ({ page }) => {
		await test.step('Navigate to password reset page', async () => {
			await page.goto(ROUTES.passwordNewPage.pattern);

			await page.waitForLoadState('networkidle');

			await expect(page).toHaveURL(/\/users\/password\/new/);
		});

		await test.step('Run accessibility analysis on password reset page', async () => {
			await analyzeAccessibility(page);
		});
	});
});

import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { analyzeAccessibility } from '@utils/accessibility-helper';
import { ROUTES } from '@utils/routes';

/**
 * [PAR-USA02] - QA tests execution for W3C WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * Accessibility tests for User Section
 * Minimum requirement: WCAG 2.1 Level AA (test fails only for 2.0/2.1 violations)
 * WCAG 2.2 violations are reported as warnings only
 * The tool must comply with accessibility guidelines for people with disabilities using WAI-ARIA
 */

test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
	await page.close();
	await context.close();
});

test.describe('[PAR-USA02] Accessibility - User Section', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let homePage: HomePage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
	});

	test('should have a minimum of a WCAG 2.1 AA level on user homepage', async ({ page }) => {
		await test.step('Navigate to user homepage', async () => {
			await homePage.navigateToHomePage();

			await page.waitForLoadState('networkidle');

			// Verify we're on the homepage
			await homePage.expectToBeOnHomePage();
		});

		await test.step('Run accessibility analysis on user homepage', async () => {
			await analyzeAccessibility(page);
		});
	});

	test('should have a minimum of a WCAG 2.1 AA level on processes pages', async ({ page, browser }) => {
		let processSlug: string;
		let validProcessData: any;

		await test.step('Setup: Create new published test process as prerequisite', async () => {
			const adminContext = await browser.newContext({
				storageState: STORAGE_STATE.ADMIN
			});
			const adminPage = await adminContext.newPage();

			// Verify is logged in as admin
			await ensureLoggedIn(adminPage, 'ADMIN');

			const adminHomePage = new AdminHomePage(adminPage);
			const processAdminPage = new ProcessAdminPage(adminPage);
			const surveysManagePage = new SurveysManagePage(adminPage);

			validProcessData = ProcessTestDataGenerator.generateValidProcessData();

			const { processSlug: slug } = await surveysManagePage.setupTestProcess(
				validProcessData,
				adminHomePage,
				processAdminPage,
				true // publish the process
			);
			processSlug = slug;
			console.log(`Test process setup completed - Published process created with slug: ${processSlug}`);

			// Close ADMIN context
			await adminPage.close();
			await adminContext.close();
		});

		await test.step('Navigate to processes list page', async () => {
			await processesOverviewPage.navigateToProcessesOverview();

			await expect(page).toHaveURL(/\/processes$/);
		});

		await test.step('Run accessibility analysis on processes list page', async () => {
			await analyzeAccessibility(page);
		});

		await test.step('Navigate to process detail page', async () => {
			await page.goto(`/processes/${processSlug}`);
			await processDetailPage.waitForPageLoad();

			await expect(page).toHaveURL(new RegExp(`/processes/${processSlug}`));
		});

		await test.step('Run accessibility analysis on process detail page', async () => {
			await analyzeAccessibility(page);
		});
	});

	test('should have a minimum of a WCAG 2.1 AA level on user account page', async ({ page }) => {
		await test.step('Navigate to user account page', async () => {
			await page.goto(ROUTES.accountPage.pattern);
			await page.waitForLoadState('networkidle');

			await expect(page).toHaveURL(/\/account/);
		});

		await test.step('Run accessibility analysis on user account page', async () => {
			await analyzeAccessibility(page);
		});
	});

	test('should have a minimum of a WCAG 2.1 AA level on notifications settings page', async ({ page }) => {
		await test.step('Navigate to notifications settings page', async () => {
			await page.goto(ROUTES.notificationsSettingsPage.pattern);
			await page.waitForLoadState('networkidle');

			await expect(page).toHaveURL(/\/notifications_settings/);
		});

		await test.step('Run accessibility analysis on notifications settings page', async () => {
			await analyzeAccessibility(page);
		});
	});
});

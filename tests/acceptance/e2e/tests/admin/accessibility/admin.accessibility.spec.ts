import test, { expect } from '@playwright/test';
import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { analyzeAccessibility } from '@utils/accessibility-helper';

/**
 * [PAR-USA02] - QA tests execution for W3C WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * Accessibility tests for Admin Section
 * Minimum requirement: WCAG 2.1 Level AA (test fails only for 2.0/2.1 violations)
 * WCAG 2.2 violations are reported as warnings only
 * The tool must comply with accessibility guidelines for people with disabilities using WAI-ARIA
 */

test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-USA02] Accessibility - Admin Section', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let processAdminPage: ProcessAdminPage;
	let surveysManagePage: SurveysManagePage;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		surveysManagePage = new SurveysManagePage(page);
	});

	test('should have a minimum of a WCAG 2.1 AA level on admin homepage', async ({ page }) => {
		await test.step('Navigate to admin homepage', async () => {
			await adminHomePage.navigateToAdminHomePage();

			await page.waitForLoadState('networkidle');

			await expect(page).toHaveURL(/\/admin/);
		});

		await test.step('Run accessibility analysis on admin homepage', async () => {
			await analyzeAccessibility(page);
		});
	});

	test('should have a minimum of a WCAG 2.1 AA level on processes list page', async ({ page }) => {
		let validProcessData: any;
		let processEditUrl: string;

		await test.step('Setup: Create new published test process as prerequisite', async () => {
			validProcessData = ProcessTestDataGenerator.generateValidProcessData();

			const { processSlug: slug, processEditUrl: url } = await surveysManagePage.setupTestProcess(
				validProcessData,
				adminHomePage,
				processAdminPage,
				true // publish the process
			);
			processEditUrl = url;
			console.log('Test process setup completed - Published process created');
		});

		await test.step('Navigate to processes page', async () => {
			await adminHomePage.navigateViaAdminNav('processes');
			await processAdminPage.waitForLoadState('networkidle');

			const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
			expect(isOnProcessesPage).toBe(true);
		});

		await test.step('Run accessibility analysis on processes list page', async () => {
			await analyzeAccessibility(page);
		});

		await test.step('Navigate to process edit page', async () => {
			await page.goto(processEditUrl);
			await page.waitForLoadState('networkidle');

			await expect(page).toHaveURL(processEditUrl);
		});

		await test.step('Run accessibility analysis on process edit page', async () => {
			await analyzeAccessibility(page);
		});
	});
});

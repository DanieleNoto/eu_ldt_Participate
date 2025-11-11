import test, { expect } from '@playwright/test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { SurveysManagePage } from '@pages/pages/admin/processes/detail/components/surveys/SurveysManagePage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { analyzeAccessibility, saveAccessibilityResults } from '@utils/accessibility-helper';

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

	// Use existing process
	const processSlug = 'test';
	const processTitle = 'Update Test0';

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		processAdminPage = new ProcessAdminPage(page);
		surveysManagePage = new SurveysManagePage(page);

		// Navigate to admin homepage
		await adminHomePage.navigateToAdminHomePage();
		await page.waitForLoadState('networkidle');
	});

	// Save accessibility results after each test
	test.afterEach(async () => {
		await saveAccessibilityResults();
	});

	test('should have a minimum of a WCAG 2.1 AA level on admin homepage', async ({ page }) => {
		await test.step('Verify to be on admin homepage', async () => {
			await expect(page).toHaveURL(/\/admin/);

			await analyzeAccessibility(page, 'Verify to be on admin homepage');
		});
	});

	test('should have a minimum of a WCAG 2.1 AA level on processes list page', async ({ page }) => {
		await test.step('Navigate to processes page', async () => {
			await adminHomePage.navigateViaAdminNav('processes');
			await processAdminPage.waitForLoadState('networkidle');

			const isOnProcessesPage = await processAdminPage.isOnProcessesPage();
			expect(isOnProcessesPage).toBe(true);
			console.log('Navigated to Processes section');

			await analyzeAccessibility(page, 'Navigate to processes page');
		});

		await test.step('Verify processes list is displayed', async () => {
			await processAdminPage.expectToBeOnProcessesAdminPage();
			const hasProcesses = await processAdminPage.processTable.hasProcesses();
			expect(hasProcesses).toBe(true);
			console.log('Processes list displayed with available processes');

			await analyzeAccessibility(page, 'Verify processes list is displayed');
		});

		await test.step('Select process for editing', async () => {
			await surveysManagePage.searchAndSelectProcess(processTitle);
			console.log(`Selected process "${processTitle}" for configuration`);

			await analyzeAccessibility(page, 'Select process for editing');
		});

		await test.step('Loads the selected process and displays the content in an editable form, including all existing information.', async () => {
			await page.waitForURL(new RegExp(`/admin/participatory_processes/${processSlug}/edit`));
			await page.waitForLoadState('networkidle');

			console.log('Process loaded with editable form containing existing information');

			await analyzeAccessibility(
				page,
				'Loads the selected process and displays the content in an editable form, including all existing information'
			);
		});
	});
});

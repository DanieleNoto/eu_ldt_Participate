import test, { expect } from '@playwright/test';
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { MeetingsPage } from '@pages/pages/user/processes/MeetingsPage';
import { ROUTES } from '@utils/routes';
import { tryAnalyze, saveAccessibilityResults } from '@utils/helpers';

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
	let meetingsPage: MeetingsPage;

	// Use existing process
	const processSlug = 'test';

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		meetingsPage = new MeetingsPage(page);
	});

	test('should have a minimum of a WCAG 2.1 AA level on user homepage, processes_overview, process_detail, account_page, notifications_settings_page, meetings_page, meetings_detail, calendar_page', async ({
		page
	}) => {
		await test.step('Visit homepage and accessibility check', async () => {
			await homePage.navigateToHomePage();
			await page.waitForLoadState('networkidle');
			await homePage.expectToBeOnHomePage();
			await tryAnalyze(homePage.getPage(), 'user_homepage');
		});

		await test.step('Visit processes overview and accessibility check', async () => {
			await processesOverviewPage.navigateToProcessesOverview();
			await expect(page).toHaveURL(/\/processes$/);
			await tryAnalyze(processesOverviewPage.getPage(), 'processes_overview');
		});

		await test.step('Open process detail and accessibility check', async () => {
			await page.goto(`/processes/${processSlug}`);
			await processDetailPage.waitForPageLoad();
			await expect(page).toHaveURL(new RegExp(`/processes/${processSlug}`));
			await tryAnalyze(processDetailPage.getPage(), 'process_detail');
		});

		await test.step('Open account page and accessibility check', async () => {
			await page.goto(ROUTES.accountPage.pattern);
			await page.waitForLoadState('networkidle');
			await expect(page).toHaveURL(/\/account/);
			await tryAnalyze(page, 'user_account_page');
		});

		await test.step('Open notifications settings and accessibility check', async () => {
			await page.goto(ROUTES.notificationsSettingsPage.pattern);
			await page.waitForLoadState('networkidle');
			await expect(page).toHaveURL(/\/notifications_settings/);
			await tryAnalyze(page, 'notifications_settings_page');
		});

		await test.step('Open meetings list and accessibility check', async () => {
			await page.goto(ROUTES.meetingsPage.pattern);
			await page.waitForLoadState('networkidle');
			await expect(page).toHaveURL(/\/meetings/);
			await tryAnalyze(page, 'meetings_page');
		});

		await test.step('Open meeting detail and accessibility check', async () => {
			await meetingsPage.expectOnMeetingsPage();
			await meetingsPage.clickMeetingCardByIndex(0);
			await page.waitForLoadState('networkidle');
			await tryAnalyze(page, 'meetings_detail');
		});

		await test.step('Open calendar and accessibility check', async () => {
			await homePage.navigateToHomePage();
			await homePage.goToCalendarFromHomeMenu();
			await page.waitForLoadState('networkidle');
			await tryAnalyze(page, 'calendar_page');
		});
	});

	test.afterAll(async () => {
		// writes summary.json and removes older scans, keeping only the latest for stepName
		await saveAccessibilityResults();
	});
});

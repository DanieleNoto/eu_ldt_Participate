import { expect, Page, test } from '@playwright/test';
import { HomePage } from '../../../pages/pages/public/HomePage';

import { ConvocationPage } from '@pages/pages/public/processes/ConvocationPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';

/**
 * Public Convocation Page Test Suite
 *
 * Tests the public user story:
 * As a citizen, I want to access the updated convocation page after the process is completed
 * to view the final information and outcomes of the participatory process.
 */
test.describe('Public Convocation Page Access', () => {
	let page: Page;
	let homePage: HomePage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let convocationPage: ConvocationPage;

	test.beforeEach(async ({ page: testPage }) => {
		page = testPage;
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		convocationPage = new ConvocationPage(page);
	});

	test('should allow citizen to access updated convocation page after process completion', async () => {
		await test.step('Navigate to the home page', async () => {
			await homePage.navigateToHomePage();
			const isEnglish = (await homePage.getCurrentLanguage()) === 'en';
			if (!isEnglish) {
				await homePage.changeLanguageFromFooter('en');
			}
		});

		await test.step('Verify home menu section is visible', async () => {
			await expect(await homePage.isHomeMenuSectionVisible()).toBe(true);
		});

		await test.step('Navigate to processes overview from home menu', async () => {
			await homePage.goToProcessesFromHomeMenu();
		});

		await test.step('Wait for processes overview page to load', async () => {
			await processesOverviewPage.waitForPageLoad();
		});

		await test.step('Select and navigate to the first available process', async () => {
			await processesOverviewPage.navigateToProcessByIndex(0);
		});

		await test.step('Wait for process detail page to load', async () => {
			await processDetailPage.waitForPageLoad();
		});

		await test.step('Navigate to the convocation page from process navigation', async () => {
			await processDetailPage.navigateToConvocationPage();
		});

		await test.step('Wait for convocation page to load', async () => {
			await convocationPage.waitForPageLoad();
		});

		await test.step('Verify convocation page title is correct', async () => {
			await convocationPage.expectTitleToBeConvocationPage();
		});

		await test.step('Verify convocation page has content', async () => {
			await convocationPage.expectPageToHaveContent();
		});

		await test.step('Verify the page contains convocation-related content', async () => {
			await expect(page.locator('body')).toContainText(/convocation/i);
		});
	});
});

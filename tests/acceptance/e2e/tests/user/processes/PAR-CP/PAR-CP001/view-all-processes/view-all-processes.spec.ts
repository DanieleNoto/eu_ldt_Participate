import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for view and explore all the available processes in the system, providing an overview of ongoing, upcoming, and past processes.
 *
 * User Story: As a Citizen, I want to visualize all the processes available in the system so that I can understand which processes are ongoing, upcoming, or completed and decide which ones I am interested in participating in.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The citizen has an active account on the platform and is logged in (optional for public processes).
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
});
test.describe('[PAR-CP001] – Visualize all processes in the system', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);

		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allows citizens to visualize all processes in the system', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays a list of all processes, categorized as ongoing, upcoming, or completed. The list includes basic information, such as title, short description, and status.', async () => {
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();

				// Verify that there are processes displayed
				const count = await processesOverviewPage.getProcessesCount();
				expect(count).toBeGreaterThan(0);

				// Get process titles for debug
				const titles = await processesOverviewPage.getAllProcessTitles();
				console.log('Available processes:', titles);
			});
			await test.step('3. System: Provides filtering options for citizens to easily find processes of interest.', async () => {
				await processesOverviewPage.expectProcessesFilterToBeVisible();
			});
			await test.step('4. System: Allows the citizen to click on a specific process for more details', async () => {
				// Select the first available process
				await processesOverviewPage.navigateToProcessByIndex(0);

				// Verify being on the process detail page
				await expect(processDetailPage.getPage()).toHaveURL(/\/processes\/.*$/);
			});
			await test.step('Result. The citizen has an overview of all available processes and can easily navigate to more detailed information about a specific process.', async () => {
				// Verify that the process detail page shows process information
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should allows citizens to filter processes in the "Processes" section', async () => {
			let countBeforeFilter: number;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays a list of all processes, categorized as ongoing, upcoming, or completed. The list includes basic information, such as title, short description, and status.', async () => {
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
			});
			await test.step('3. System: Provides filtering options for citizens to easily find processes of interest.', async () => {
				await processesOverviewPage.expectProcessesFilterToBeVisible();
			});
			await test.step('3.1 User: Applies filters to narrow down the list of processes.', async () => {
				// Record the number of processes before filtering
				countBeforeFilter = await processesOverviewPage.getProcessesCount();
				console.log('Number of processes before filtering:', countBeforeFilter);

				// Apply a date filter (e.g., active processes)
				await processesOverviewPage.filterByDate('active');

				// Wait for the results to update
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('3.2 System: Displays an updated list of processes based on the filters.', async () => {
				// Verify that the filter was applied
				const currentFilter = await processesOverviewPage.getSelectedDateFilter();
				expect(currentFilter).toBe('active');

				// Verify if there are processes shown after filtering
				const countAfter = await processesOverviewPage.getProcessesCount();
				console.log('Number of processes after filtering:', countAfter);

				// Get the titles of filtered processes
				if (countAfter > 0) {
					const filteredTitles = await processesOverviewPage.getAllProcessTitles();
					console.log('Active processes:', filteredTitles);
				}
			});
			await test.step('Result. The citizen can easily find relevant processes based on their preferences.', async () => {
				// Reset filters
				await processesOverviewPage.resetAllFilters();

				// Verify that the filter was reset
				const currentFilter = await processesOverviewPage.getSelectedDateFilter();
				expect(currentFilter).toBe('all');

				// Verify that all processes are shown again
				const countAfterReset = await processesOverviewPage.getProcessesCount();
    			expect(countAfterReset).toBe(countBeforeFilter);
				//const countAfterReset = await processesOverviewPage.getProcessesCount();
				console.log('Number of processes after resetting filters:', countAfterReset);
			});
		});
	});
});

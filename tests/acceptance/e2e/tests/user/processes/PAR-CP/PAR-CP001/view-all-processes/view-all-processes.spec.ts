/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { test, expect } from '@fixtures/parallel-test';

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

test.describe('[PAR-CP001] – Visualize all processes in the system', () => {
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let homePage: HomePage;

	test.beforeEach(async ({ userPage }) => {
		homePage = new HomePage(userPage);
		processesOverviewPage = new ProcessesOverviewPage(userPage);
		processDetailPage = new ProcessDetailPage(userPage);

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

				const dateFilters: ('all' | 'upcoming' | 'past' | 'active')[] = ['all', 'upcoming', 'past', 'active'];

				for (const filter of dateFilters) {
					await test.step(`Applying and verifying filter: ${filter}`, async () => {
						await processesOverviewPage.filterByStatus(filter);
						await processesOverviewPage.getPage().waitForLoadState('networkidle');
						const processes = await processesOverviewPage.getAllProcesses();
						if (processes.length === 0) {
							console.log(`No processes found for filter: ${filter}`);
							return;
						}

						console.log(`Processes for filter '${filter}':`, processes);

						for (const process of processes) {
							expect(process.id).toBeTruthy();
							expect(process.href).toBeTruthy();
							expect(process.title).toBeTruthy();
							expect(process.status).toBeTruthy();
							if (process.timeRemaining) expect(process.timeRemaining).toBeTruthy();
							if (process.phase) expect(process.phase).toBeTruthy();
						}
					});
				}
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
				await processesOverviewPage.filterByStatus('active');

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
				expect(countAfter).toBeLessThanOrEqual(countBeforeFilter);
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
				console.log('Number of processes after resetting filters:', countAfterReset);
			});
		});
	});
});

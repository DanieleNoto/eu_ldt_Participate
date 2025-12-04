/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for citizens to view the details of a specific process and participate by reviewing, commenting, and providing feedback.
 *
 * User Story: As a Citizen, I want to view and engage with the details of a specific process so that I can provide my feedback and contribute to its development.
 *
 * Requirements: PAR R8, PAR R6
 *
 * Prerequisites:
 * - The citizen has an active account on the platform and is logged in (optional for public processes).
 * - The process is published and accessible to citizens.
 */

test.describe('[PAR-CP002] – View and participate in a specific process', () => {
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
		test('should allows citizens to view and participate in a specific process', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');

				// Verify that we are on the processes page
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();

				// Select the first available process
				await processesOverviewPage.navigateToProcessByIndex(0);
			});

			await test.step('2. System: Displays the details of the selected process, including the title, description, phases, key objectives.', async () => {
				// Verify that we are on the process detail page
				await processDetailPage.expectToBeOnProcessDetailPage();

				// Get and verify the process title
				const processTitle = await processDetailPage.getProcessTitle();
				console.log('Process title:', processTitle);
				expect(processTitle).not.toBe('');

				// Verify that the page shows process information
				const isPageLoaded = await processDetailPage.isPageLayoutLoaded();
				expect(isPageLoaded).toBe(true);

				// Get and show available components
				const components = await processDetailPage.getAvailableComponents();
				console.log('Available components:', components);
				expect(components.length).toBeGreaterThan(0);
			});

			await test.step('3. User: Scrolls through the process details to understand the context and purpose of the process.', async () => {
				await processDetailPage.footer.scrollToFooter();
			});

			await test.step('4. System: Provides options for interaction, such as adding comments, joining debates, or responding to surveys linked to the process.', async () => {
				await processDetailPage.expectParticipatoryContainerToBeVisible();
			});

			await test.step('Result.', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
		});
	});
});

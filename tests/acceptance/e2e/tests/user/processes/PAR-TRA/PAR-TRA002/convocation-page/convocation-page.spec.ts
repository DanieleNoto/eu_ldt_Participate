/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { test } from '@fixtures/parallel-test';

import { ConvocationPage } from '@pages/pages/public/processes/ConvocationPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';

/**
 * Test suite for Allows citizens to access updated information on the convocation page once a participatory process is completed.
 *
 * User Story: As a Citizen, I want to access the updated convocation page after the process is over so that I am informed about the outcomes and any subsequent actions
 *
 * Requirements: PAR R7
 *
 * Prerequisites:
 * - The citizen has an active account on the platform (optional for public access).
 * - The participatory process has been completed, and the convocation page has been updated by the City Administrator
 */
test.describe('[PAR-TRA002] – Access updated convocation page after process completion', () => {
	let homePage: HomePage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let convocationPage: ConvocationPage;

	test.beforeEach(async ({ userPage }) => {
		homePage = new HomePage(userPage);
		processesOverviewPage = new ProcessesOverviewPage(userPage);
		processDetailPage = new ProcessDetailPage(userPage);
		convocationPage = new ConvocationPage(userPage);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow citizen to access updated convocation page after process completion', async () => {
			await test.step('1. User: Navigate to processes overview from home menu', async () => {
				await homePage.goToProcessesFromHomeMenu();
			});

			await test.step('2. User: Selects the specific process that has been completed.', async () => {
				await processesOverviewPage.waitForPageLoad();
				await processesOverviewPage.navigateToProcessByIndex(0);
			});

			await test.step('3. System: Displays the main page for the completed process, including the option to view the updated convocation page.', async () => {
				await processDetailPage.waitForPageLoad();
			});

			await test.step('4. User: Clicks on "Convocation Page."', async () => {
				await processDetailPage.navigateToConvocationPage();
			});

			await test.step('5. System: Displays the updated convocation page', async () => {
				await convocationPage.waitForPageLoad();
			});

			await test.step('Result', async () => {
				await convocationPage.expectTitleToBeConvocationPage();
				await convocationPage.expectPageToHaveContent();
			});
		});
	});
});

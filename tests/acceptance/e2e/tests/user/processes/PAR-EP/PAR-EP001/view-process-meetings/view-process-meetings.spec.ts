/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { MeetingsPage } from '@pages/pages/user/processes/MeetingsPage';
import test from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows citizens to view all events related to a specific process.
 *
 * User Story: As a Citizen, I want to view all events related to a specific process so that I can participate in community activities.
 *
 * Requirements: PAR R14
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 * - Meetings are created and published by the City Administrator.
 *
 */

test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
});
test.describe('[PAR-EP001] – View all meetings related to specific process', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let meetingsPage: MeetingsPage;
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		meetingsPage = new MeetingsPage(page);
		homePage = new HomePage(page);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('Should allow user to view all events related to a specific process', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				await processesOverviewPage.applyDateFilterAndEnsureGridLoaded('all');
				await processesOverviewPage.checkProcessVisibility('Update Test0');
				await processesOverviewPage.navigateToProcess('Update Test0', 'test');
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays the details of the selected process, including the title, description, phases.', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
				await processDetailPage.verifyProcessDescriptionSection();
				await processDetailPage.collectAndVerifyParticipatoryMenuItems();
				await processDetailPage.openProcessSteps();
				await processDetailPage.getProcessPhaseInfo();
			});
			await test.step('3. User: Navigate to the “Meetings” section of the process', async () => {
				await processDetailPage.navigateToMeetingsPage();
			});
			await test.step('4. System: Displays a list of available meetings, including relevant details such as title, date, time, location, and availability.', async () => {
				await processDetailPage.enhancedVerifyMeetingsCardListVisible();
			});
			await test.step('Result.', async () => {
				await meetingsPage.expectOnMeetingsPage();
			});
		});
	});
});

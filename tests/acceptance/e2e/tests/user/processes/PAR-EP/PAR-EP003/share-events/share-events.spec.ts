/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { MeetingDetailPage } from '@pages/pages/user/processes/MeetingDetailPage';
import { MeetingsPage } from '@pages/pages/user/processes/MeetingsPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows citizens to share events.
 *
 * User Story: 	As a Citizen, I want to share meetings so that I can help promote community activities and increase participation.
 *
 * Requirements: PAR R14e
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
test.describe('[PAR-EP003] – Share events', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let meetingsPage: MeetingsPage;
	let meetingDetailPage: MeetingDetailPage;
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		meetingsPage = new MeetingsPage(page);
		meetingDetailPage = new MeetingDetailPage(page);
		homePage = new HomePage(page);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('Should allows citizens to share events', async () => {
			let step9Passed = false;
			let step10Passed = false;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				await processesOverviewPage.applyDateFilterAndEnsureGridLoaded('all');
				await processesOverviewPage.checkProcessVisibility('Update Test0');
				await processesOverviewPage.navigateToProcess('Update Test0', 'test');
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays the details of the selected process, including the title, description, phases, key objectives.', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
				await processDetailPage.verifyProcessDescriptionSection();
				await processDetailPage.collectAndVerifyParticipatoryMenuItems();
			});
			await test.step('3. User: Navigate to the “Meetings” section of the process', async () => {
				await processDetailPage.navigateToMeetingsPage();
			});
			await test.step('4. System: Displays a list of available meetings, including relevant details such as title, date, time, location, and availability.', async () => {
				await processDetailPage.enhancedVerifyMeetingsCardListVisible();
			});
			await test.step('5. User: Selects a specific meeting to view more details.', async () => {
				await meetingsPage.clickMeetingCardByIndex(0);
			});
			await test.step('6. System: Displays the meeting details, including the agenda, location, date, time, and access settings.', async () => {
				await meetingDetailPage.verifyMeetingDetails();
			});
			await test.step('7. User: Clicks on the "Share" button to share the meeting.', async () => {
				await meetingDetailPage.clickShareButton();
			});
			await test.step('8. System: Displays sharing options for social media platforms and provides a shareable link.', async () => {
				await meetingDetailPage.shareModalComponent.verifyAllSocialSharingUrls();
			});
			await test.step('9. User: Selects a social media platform or copies the link to share the meeting details.', async () => {
				await meetingDetailPage.shareModalComponent.copyShareLink();
				step9Passed = true;
			});
			await test.step('10. System: Redirects to the chosen social media platform or copies the shareable link for the user.', async () => {
				await meetingDetailPage.shareModalComponent.verifySocialShareRedirects();
				step10Passed = true;
			});

			await test.step('Result.', async () => {
				expect(step9Passed).toBeTruthy();
				expect(step10Passed).toBeTruthy();
			});
		});
	});
});

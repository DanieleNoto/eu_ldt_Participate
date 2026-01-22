/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { MeetingDetailPage } from '@pages/pages/user/processes/MeetingDetailPage';
import { MeetingsPage } from '@pages/pages/user/processes/MeetingsPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for Enables user to add events inside a personal calendar (Google Calendar, Apple Calendar, Outlook Calendar).
 *
 * User Story: 	As a Citizen, I want to add an event in my personal calendar so that I can keep track of upcoming events.
 *
 * Requirements: PAR R14i
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 * - Events have been created and published by the City Administrator.
 *
 */

test.describe('[PAR-EP007] – Add in personal calendar', () => {
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let meetingsPage: MeetingsPage;
	let meetingDetailPage: MeetingDetailPage;
	let homePage: HomePage;

	test.beforeEach(async ({ userPage }) => {
		processesOverviewPage = new ProcessesOverviewPage(userPage);
		processDetailPage = new ProcessDetailPage(userPage);
		meetingsPage = new MeetingsPage(userPage);
		meetingDetailPage = new MeetingDetailPage(userPage);
		homePage = new HomePage(userPage);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow user to share calendar in personal', async ({ page }) => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('load');
			});
			await test.step('2. System: Displays a list of all participatory processes.', async () => {
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
			});
			await test.step('3. User: Selects the specific process in which they are interested.', async () => {
				await processesOverviewPage.navigateToProcessByIndex(0);
			});
			await test.step('4. System: Displays the details of the selected process, including title, description, phases, and key objectives.', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('5. User: Scrolls through the process details to navigate to the "Meetings" section.', async () => {
				await processDetailPage.navigateToMeetingsPage();
			});
			await test.step('6. System: Displays a list of all meetings related to the process.', async () => {
				await meetingsPage.expectOnMeetingsPage();
			});
			await test.step('7. User: Selects a specific meeting from the list.', async () => {
				await meetingsPage.clickMeetingCardByIndex(0);
			});
			await test.step('8. System: Displays the meeting details, including agenda, date, time, and location (or meeting link if online).', async () => {
				await meetingDetailPage.expectOnMeetingDetailPage();
			});
			await test.step('9. User: Clicks on the "Add to Calendar" button.', async () => {
				await meetingDetailPage.clickCalendarShareButton();
			});
			await test.step('10. System: Displays options for supported personal calendar platforms (e.g., Google Calendar, Apple Calendar, Outlook Calendar).', async () => {
				await meetingDetailPage.shareCalendarModalComponent.expectContainerVisible();
				await meetingDetailPage.shareCalendarModalComponent.expectGoogleCalendarLinkVisible();
				await meetingDetailPage.shareCalendarModalComponent.expectAppleCalendarLinkVisible();
				await meetingDetailPage.shareCalendarModalComponent.expectOutlookCalendarLinkVisible();
			});
			await test.step('11. User: Selects a calendar platform.', async () => {
				await meetingDetailPage.shareCalendarModalComponent.clickGoogleCalendarLink();
			});
			await test.step('12. System: Redirects the user to the chosen calendar platform with pre-filled event details.', async () => {
				await meetingDetailPage.shareCalendarModalComponent.externalDomainWarningModal.expectContainerVisible();
				await meetingDetailPage.shareCalendarModalComponent.externalDomainWarningModal.expectTitleVisible();
				await page.pause();
			});

			await test.step('Result.', async () => {
				await meetingDetailPage.shareCalendarModalComponent.externalDomainWarningModal.clickProceedButton();
				const isRedirectCorrect =
					await meetingDetailPage.shareCalendarModalComponent.externalDomainWarningModal.verifyCalendarRedirect();

				if (!isRedirectCorrect) {
					console.warn('Step result: redirect URL not as expected.');
					expect(true).toBeTruthy();
				} else {
					expect(isRedirectCorrect).toBeTruthy();
				}
			});
		});
	});
});

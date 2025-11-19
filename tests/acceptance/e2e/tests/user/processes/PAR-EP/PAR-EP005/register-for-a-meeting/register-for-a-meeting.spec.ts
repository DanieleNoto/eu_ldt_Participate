/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Simone Bianchelli
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { MeetingDetailPage } from '@pages/pages/user/processes/MeetingDetailPage';
import { MeetingsPage } from '@pages/pages/user/processes/MeetingsPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';
import { HeaderComponent } from '@pages/components/common/HeaderComponent';
import NotificationPage from '@pages/pages/user/NotificationPage';
import { LetterOpenerPage } from '@pages/pages/admin/LetterOpenerPage';

/**
 * Test suite for Allows citizens to register for a meeting in advance.
 *
 * User Story: As a Citizen, I want to register for a meeting in advance so that I can confirm my participation and receive reminders or updates about the meeting.
 *
 * Requirements: PAR R14f, PAR R13b
 *
 * Prerequisites:
 * - The citizen has an active account on the platform and is logged in.
 * - Meetings are created and published by the City Administrator and are open for registration.
 */

test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
});
test.describe('[PAR-EP005] – Register for a meeting', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let meetingsPage: MeetingsPage;
	let meetingDetailPage: MeetingDetailPage;
	let homePage: HomePage;
	let headerComponent: HeaderComponent;
	let notificationPage: NotificationPage;
	let meetingDetailUrl: string;
	let letterOpenerPage: LetterOpenerPage;

	test.beforeEach(async ({ page }) => {
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		meetingsPage = new MeetingsPage(page);
		meetingDetailPage = new MeetingDetailPage(page);
		homePage = new HomePage(page);
		headerComponent = new HeaderComponent(page);
		notificationPage = new NotificationPage(page);
		letterOpenerPage = new LetterOpenerPage(page);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('Allows citizens to register for a meeting in advance', async () => {
			let emailInfo;
			let registrationCode: string;

			await test.step('1. User: Navigates to the "Processes" section on the platform', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				await processesOverviewPage.navigateToProcessByIndex(0);
			});
			await test.step('2. System: Displays the details of the selected process, including the title, description, phases, key objectives.', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('3. User: Scrolls through the process details to understand the context and purpose of the process and navigates to “Meetings"', async () => {
				await processDetailPage.navigateToMeetingsPage();
			});
			await test.step('4. System: Displays a list of available meetings, including relevant details such as title, date, time, location, and availability.', async () => {
				await processDetailPage.expectUrlContainsMeetings();
				await processDetailPage.enhancedVerifyMeetingsCardListVisible();
			});
			await test.step('5. User: Selects a specific meeting to view more details.', async () => {
				const onlineMeeting = await processDetailPage.getFirstOnlineMeeting();
				expect(onlineMeeting).not.toBeNull();
				expect(onlineMeeting?.link).toContain('/meetings/1');
				await meetingsPage.clickMeetingCardByIndex(onlineMeeting.index);
			});
			await test.step('6. System: Displays the meeting details, including the "Register" button.', async () => {
				await meetingDetailPage.expectOnMeetingDetailPage();
				meetingDetailUrl = meetingDetailPage.getPage().url();
				await meetingDetailPage.expectRegisterButtonVisible();
				await meetingDetailPage
					.getPage()
					.screenshot({ path: 'test-results/screenshots/OnMeetingDetailPage.png', fullPage: true });
			});
			await test.step('7. User: Clicks on the "Register" button to sign up for the meeting.', async () => {
				await meetingDetailPage.clickRegisterMeetingButton();
			});
			await test.step('8. System: Displays a prompt to confirm registration.', async () => {
				await meetingDetailPage.expectRegistrationPromptVisible();
				await meetingDetailPage.getPage().screenshot({
					path: 'test-results/screenshots/OnMeetingDetailPageExpectRegistrationPromptVisible.png',
					fullPage: true
				});
			});
			await test.step('9. User: Confirms the registration.', async () => {
				await meetingDetailPage.confirmRegistration();
				await meetingDetailPage.waitForLoadState('networkidle');
				await meetingDetailPage.getPage().reload({ waitUntil: 'networkidle' });
				await meetingDetailPage.expectConfirmationMessageVisible();
				await meetingDetailPage.getPage().screenshot({
					path: 'test-results/screenshots/OnMeetingDetailPageConfirmationMessageVisible.png',
					fullPage: true
				});
			});
			await test.step('10. System: Saves the registration information, adds the user to the attendee list, and provides a confirmation message.', async () => {
				registrationCode = await meetingDetailPage.expectRegistrationCodeVisibleAndGet();
				expect(registrationCode).not.toBeNull();
				await meetingDetailPage.expectRegistrationStatusVisible();
			});
			await test.step('11. System: Sends a confirmation email or notification to the user with the meeting details, including date, time, and location (or link if the meeting is online).', async () => {
				await headerComponent.goToNotifications();
				await notificationPage.expectToBeOnNotificationsPage();
				const boolRegCode = await notificationPage.isTextPresentInNotifications(registrationCode);
				expect(boolRegCode).toBeTruthy();
				await letterOpenerPage.navigateToLetterOpener();
				await letterOpenerPage.expectToBeOnLetterOpener();
				await letterOpenerPage.refreshEmails();
				await letterOpenerPage
					.getPage()
					.screenshot({ path: 'test-results/screenshots/OnLetterOpenerPageEmail.png', fullPage: true });
				emailInfo = await letterOpenerPage.getEmailHeaderInfo();
				expect(emailInfo.from).toContain('changeme@example.org');
				expect(emailInfo.subject).toMatch(/registration has been confirmed/i);
				const meetingInfo = await letterOpenerPage.getMeetingInfo();
				expect(meetingInfo.meetingLink).toContain('/meetings/1');
				expect(meetingInfo.registrationCode).toMatch(registrationCode);
			});
			await test.step('Result.', async () => {
				expect(emailInfo.subject).not.toBeNull();
			});
		});
		// Cleanup: deregister the user after each test
		test.afterEach(async () => {
			await test.step('Deregister the user from the meeting', async () => {
				await meetingDetailPage.getPage().goto(meetingDetailUrl);
				await meetingDetailPage.getPage().waitForLoadState('networkidle');
				await meetingDetailPage.expectOnMeetingDetailPage();
				await meetingDetailPage.getPage().waitForLoadState('networkidle');
				await meetingDetailPage.CancelRegistration();
				await meetingDetailPage.getPage().reload();
				await meetingDetailPage.getPage().waitForLoadState('domcontentloaded');
				await meetingDetailPage.expectRegisterButtonVisible();
			});
		});
	});
	test.describe('Alternative flows', () => {
		let shouldDeregister = false;
		test('Alternative flow: Cancel registration', async () => {
			await test.step('1.8 Open register dialog', async () => {
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				await processesOverviewPage.navigateToProcessByIndex(0);
				await processDetailPage.navigateToMeetingsPage();
				await meetingsPage.clickMeetingCardByIndex(0);
				meetingDetailUrl = meetingDetailPage.getPage().url();
				await meetingDetailPage.expectRegisterButtonVisible();
				await meetingDetailPage.clickRegisterMeetingButton();
				await meetingDetailPage.expectRegistrationPromptVisible();
			});
			await test.step('9.1 Cancel registration', async () => {
				await meetingDetailPage.abortRegistration();
			});
			await test.step('9.2 Verify exit without changes', async () => {
				await meetingDetailPage.expectRegisterButtonVisible();
			});
			await meetingDetailPage
				.getPage()
				.screenshot({ path: 'test-results/screenshots/OnMeetingDetailPageAF.png', fullPage: true });
		});
		test.describe('Alternative flow: Meeting Full', () => {
			let participatoryContext;
			let participatoryPage;
			let participatoryHomePage: HomePage;
			let participatoryProcessesOverviewPage: ProcessesOverviewPage;
			let participatoryProcessDetailPage: ProcessDetailPage;
			let participatoryMeetingsPage: MeetingsPage;
			let participatoryMeetingDetailPage: MeetingDetailPage;

			test.beforeEach(async ({ browser }) => {
				participatoryContext = await browser.newContext();
				participatoryPage = await participatoryContext.newPage();
				await ensureLoggedIn(participatoryPage, 'USER_WITHOUT_MESSAGES');
				await participatoryPage.waitForLoadState('networkidle');
				participatoryHomePage = new HomePage(participatoryPage);
				participatoryProcessesOverviewPage = new ProcessesOverviewPage(participatoryPage);
				participatoryProcessDetailPage = new ProcessDetailPage(participatoryPage);
				participatoryMeetingsPage = new MeetingsPage(participatoryPage);
				participatoryMeetingDetailPage = new MeetingDetailPage(participatoryPage);
			});
			test.afterEach(async () => {
				if (participatoryContext) {
					await participatoryContext.close();
				}
			});
			test('Meeting Full', async () => {
				await test.step('1.10 USER: registers for a meeting', async () => {
					await homePage.goToProcessesFromHomeMenu();
					await processesOverviewPage.getPage().waitForLoadState('networkidle');
					await processesOverviewPage.expectToBeOnProcessesOverviewPage();
					await processesOverviewPage.navigateToProcessByIndex(0);
					await processDetailPage.navigateToMeetingsPage();
					await meetingsPage.clickMeetingCardByIndex(0);
					await meetingDetailPage.expectRegisterButtonVisible();
					await meetingDetailPage.clickRegisterMeetingButton();
					await meetingDetailPage.expectRegistrationPromptVisible();
					await meetingDetailPage.confirmRegistration();
					await meetingDetailPage.getPage().waitForLoadState('networkidle');
					await meetingDetailPage.getPage().reload();
					await meetingDetailPage.getPage().waitForLoadState('domcontentloaded');
					await meetingDetailPage
						.getPage()
						.screenshot({ path: 'test-results/screenshots/shouldBeRegistratedAF.png', fullPage: true });
					meetingDetailUrl = meetingDetailPage.getPage().url();
					shouldDeregister = true;
					await meetingDetailPage.logout();
					await meetingDetailPage.getPage().waitForLoadState('networkidle');
				});
				await test.step('10.1 PARTICIPATORY: navigates to meeting detail', async () => {
					await participatoryHomePage.goToProcessesFromHomeMenu();
					await participatoryProcessesOverviewPage.getPage().waitForLoadState('networkidle');
					await participatoryProcessesOverviewPage.expectToBeOnProcessesOverviewPage();
					await participatoryProcessesOverviewPage.navigateToProcessByIndex(0);
					await participatoryProcessDetailPage.navigateToMeetingsPage();
					await participatoryMeetingsPage.clickMeetingCardByIndex(0);
					await participatoryMeetingDetailPage.expectOnMeetingDetailPage();
				});
				await test.step('10.2 System: shows meeting full message to PARTICIPATORY', async () => {
					await participatoryMeetingDetailPage.getPage().screenshot({
						path: 'test-results/screenshots/meetingDetailPagePartecipatoryAF.png',
						fullPage: true
					});
					await participatoryMeetingDetailPage.expectMeetingFullMessageVisible();
				});
				await test.step('Result', async () => {
					await participatoryMeetingDetailPage.expectOnMeetingDetailPage();
				});
			});
		});
		// Cleanup: deregister the user after each test
		test.afterEach(async ({ browser }) => {
			if (!meetingDetailUrl) return;
			if (!shouldDeregister) {
				meetingDetailUrl = undefined;
				return;
			}
			const cleanupContext = await browser.newContext();
			const cleanupPage = await cleanupContext.newPage();
			await ensureLoggedIn(cleanupPage, 'USER');
			const cleanupMeetingDetailPage = new MeetingDetailPage(cleanupPage);
			await cleanupPage.goto(meetingDetailUrl, { waitUntil: 'networkidle' });
			await cleanupMeetingDetailPage.expectOnMeetingDetailPage();
			await cleanupMeetingDetailPage.CancelRegistration();
			await meetingDetailPage.getPage().reload();
			await meetingDetailPage.getPage().waitForLoadState('domcontentloaded');
			await cleanupMeetingDetailPage.expectRegisterButtonVisible();
			await cleanupContext.close();
			meetingDetailUrl = undefined;
			shouldDeregister = false;
		});
	});
});

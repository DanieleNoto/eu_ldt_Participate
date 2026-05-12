/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 * Antonio Abramo Carotenuto
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { MeetingDetailPage } from '@pages/pages/user/processes/MeetingDetailPage';
import { MeetingsPage } from '@pages/pages/user/processes/MeetingsPage';
import { test, expect } from '@fixtures/parallel-test-reserved';
import { HeaderComponent } from '@pages/components/common/HeaderComponent';
import NotificationPage from '@pages/pages/user/NotificationPage';
import { WebmailPage } from '@pages/base/WebmailPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { MeetingsPage as MeetingsPageAdmin } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { RegistrationsPage } from '@pages/pages/admin/processes/detail/meetings/RegistrationsPage';

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

test.describe.configure({ mode: 'serial' });

test.describe('[PAR-EP005] – Register for a meeting @reserved', () => {
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let meetingsPage: MeetingsPage;
	let meetingDetailPage: MeetingDetailPage;
	let homePage: HomePage;
	let headerComponent: HeaderComponent;
	let notificationPage: NotificationPage;
	let meetingDetailUrl: string | undefined;
	let webmailPage: WebmailPage;

	// Use existing process with meetings and registrations
	const processTitle = 'Update Test0';
	const processSlug = 'test';
	const meetingTitle = 'New meeting test';

	test.beforeEach(async ({ userPage }) => {
		processesOverviewPage = new ProcessesOverviewPage(userPage);
		processDetailPage = new ProcessDetailPage(userPage);
		meetingsPage = new MeetingsPage(userPage);
		meetingDetailPage = new MeetingDetailPage(userPage);
		homePage = new HomePage(userPage);
		headerComponent = new HeaderComponent(userPage);
		notificationPage = new NotificationPage(userPage);
		webmailPage = new WebmailPage(userPage);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('Allows citizens to register for a meeting in advance', async () => {
			let registrationCode: string;

			await test.step('1. User: Navigates to the "Processes" section on the platform', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('load');
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();

				// Apply "All" filter and ensure grid is fully loaded (with refresh)
				await processesOverviewPage.applyDateFilterAndEnsureGridLoaded('all');

				// Check if the private process is visible in the grid
				await processesOverviewPage.checkProcessVisibility(processTitle);

				// Navigate to the process: grid click first, then direct navigation fallback
				await processesOverviewPage.navigateToProcess(processTitle, processSlug);
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
				const index = await processDetailPage.findMeetingCardIndexByTitle(meetingTitle);
				await meetingsPage.clickMeetingCardByIndex(index);
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
				await meetingDetailPage.waitForLoadState('load');
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
				if (boolRegCode) {
					console.log('Registration code found in notifications');
				} else {
					console.warn('Registration code not found in notifications, but email will be verified');
				}

				// Navigate to webmail
				await webmailPage.navigateToWebmail();
				console.log('Navigated to webmail');

				// Login to webmail with user credentials
				await webmailPage.login(process.env.OVH_USER_EMAIL!, process.env.OVH_USER_PASSWORD!);
				console.log('Logged in to webmail');

				// Check for new messages
				await webmailPage.refreshInbox();
				console.log('Checked for new messages in inbox');

				// Verify the registration confirmation email
				await webmailPage.verifyRegistrationConfirmationEmail();
				console.log('Registration confirmation email verified successfully');

				await webmailPage
					.getPage()
					.screenshot({ path: 'test-results/screenshots/OnRoundcubeWebmail.png', fullPage: true });

				// Extract and verify meeting details from email
				const meetingInfo = await webmailPage.getMeetingInfo();
				console.log('Meeting info extracted from email:', meetingInfo);

				// Verify meeting link contains '/meetings/' path
				expect(meetingInfo.meetingLink).toContain('/meetings/');

				// Verify registration code from email matches the one from notification
				expect(meetingInfo.registrationCode).toBe(registrationCode);

				// Clean up: delete the email
				await webmailPage.deleteCurrentEmail();
				console.log('Export email deleted from inbox');
			});
			await test.step('Result.', async () => {
				expect(registrationCode).not.toBeNull();
			});
		});
		// Cleanup: deregister the user after each test
		test.afterEach(async () => {
			await test.step('Deregister the user from the meeting', async () => {
				if (!meetingDetailUrl) return;
				await meetingDetailPage.getPage().goto(meetingDetailUrl);
				await meetingDetailPage.getPage().waitForLoadState('load');
				await meetingDetailPage.expectOnMeetingDetailPage();
				await meetingDetailPage.getPage().waitForLoadState('load');
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
				await processesOverviewPage.getPage().waitForLoadState('load');
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				await processesOverviewPage.navigateToProcess(processTitle, processSlug);
				await processDetailPage.navigateToMeetingsPage();
				const index = await processDetailPage.findMeetingCardIndexByTitle(meetingTitle);
				await meetingsPage.clickMeetingCardByIndex(index);
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
			test.beforeEach(async ({ adminPage, browser }) => {
				// Setup: Set available slots to 1 for this test
				const adminHomePage = new AdminHomePage(adminPage);
				const processAdminPage = new ProcessAdminPage(adminPage);
				const updateProcessPage = new UpdateProcessAdminPage(adminPage);
				const meetingsPageAdmin = new MeetingsPageAdmin(adminPage);
				const registrationsPage = new RegistrationsPage(adminPage);

				await test.step('Setup: Admin sets available slots to 1 and second user occupies the slot', async () => {
					await adminHomePage.navigateToAdminHomePage();
					await processAdminPage.navigateToProcesses();
					await processAdminPage.getPage().waitForLoadState('load');

					await processAdminPage.editProcess(processTitle);
					await processAdminPage.getPage().waitForLoadState('load');

					await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
					await meetingsPageAdmin.verifyMeetingsPageVisible();

					const meetingFound = await meetingsPageAdmin.searchAndVerifyMeetingExists(meetingTitle);
					if (!meetingFound) {
						throw new Error(`Meeting "${meetingTitle}" not found in ${processTitle} process`);
					}

					const meetingId = await meetingsPageAdmin.getMeetingIdByTitle(meetingTitle);
					expect(meetingId).toBeGreaterThan(0);

					// First reset to unlimited to avoid Decidim's validation:
					// available_slots cannot be < current registrations count.
					// This guards against leftover registrations from previous failed runs.
					await registrationsPage.navigateToRegistrations(processSlug, 6, meetingId);
					await registrationsPage.setAvailableSlotsAndSave(0);

					// Set slots = 1. Decidim accepts this even if there's already 1 registration (1 >= 1).
					// If the meeting already has ≥ 1 registration it becomes full immediately.
					// If it has 0, user will register below to fill the slot.
					await registrationsPage.navigateToRegistrations(processSlug, 6, meetingId);
					await registrationsPage.setAvailableSlotsAndSave(1);

					// Have user register if the slot is still free.
					const user10Context = await browser.newContext({
						baseURL: process.env.FE_BASE_URL,
						storageState: undefined
					});
					const user10Page = await user10Context.newPage();
					await user10Page.goto('/users/sign_in');
					await user10Page.waitForLoadState('load');
					await user10Page.getByRole('textbox', { name: 'Email' }).fill(process.env.TEST_USER10_EMAIL!);
					await user10Page.getByRole('textbox', { name: 'Password' }).fill(process.env.TEST_USER10_PASSWORD!);
					await user10Page.getByRole('button', { name: 'Log in' }).click();
					await user10Page.waitForLoadState('load');
					const user10MeetingPage = new MeetingDetailPage(user10Page);
					await user10Page.goto(`/processes/${processSlug}/f/6/meetings/${meetingId}`);
					await user10Page.waitForLoadState('load');
					if (!(await user10MeetingPage.isCancelRegistrationButtonVisible())) {
						// Slot is free: register. If already full (another user registered), skip.
						const registerVisible = await user10Page
							.getByRole('button', { name: 'Register' })
							.isVisible()
							.catch(() => false);
						if (registerVisible) {
							await user10MeetingPage.clickRegisterMeetingButton();
							await user10MeetingPage.confirmRegistration();
							await user10Page.waitForLoadState('load');
						}
					}
					await user10Context.close();
					// Meeting is now full.
				});
			});
			test.afterEach(async ({ adminPage, browser }) => {
				// Cleanup: Reset available slots to 0 and deregister second user
				const adminHomePage = new AdminHomePage(adminPage);
				const processAdminPage = new ProcessAdminPage(adminPage);
				const updateProcessPage = new UpdateProcessAdminPage(adminPage);
				const meetingsPageAdmin = new MeetingsPageAdmin(adminPage);
				const registrationsPage = new RegistrationsPage(adminPage);

				await test.step('Cleanup: Admin resets available slots to 0 and cancels second user registration', async () => {
					await adminHomePage.navigateToAdminHomePage();
					await processAdminPage.navigateToProcesses();
					await processAdminPage.getPage().waitForLoadState('load');

					await processAdminPage.editProcess(processTitle);
					await processAdminPage.getPage().waitForLoadState('load');

					await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
					await meetingsPageAdmin.verifyMeetingsPageVisible();

					const meetingFound = await meetingsPageAdmin.searchAndVerifyMeetingExists(meetingTitle);
					if (meetingFound) {
						const meetingId = await meetingsPageAdmin.getMeetingIdByTitle(meetingTitle);
						if (meetingId > 0) {
							// Reset slots to unlimited.
							await registrationsPage.navigateToRegistrations(processSlug, 6, meetingId);
							await registrationsPage.setAvailableSlotsAndSave(0);

							// Cancel user registration if present (only needed when existingCount was 0).
							const user10Context = await browser.newContext({
								baseURL: process.env.FE_BASE_URL,
								storageState: undefined
							});
							const user10Page = await user10Context.newPage();
							await user10Page.goto('/users/sign_in');
							await user10Page.waitForLoadState('load');
							await user10Page
								.getByRole('textbox', { name: 'Email' })
								.fill(process.env.TEST_USER10_EMAIL!);
							await user10Page
								.getByRole('textbox', { name: 'Password' })
								.fill(process.env.TEST_USER10_PASSWORD!);
							await user10Page.getByRole('button', { name: 'Log in' }).click();
							await user10Page.waitForLoadState('load');
							const user10MeetingPage = new MeetingDetailPage(user10Page);
							await user10Page.goto(`/processes/${processSlug}/f/6/meetings/${meetingId}`);
							await user10Page.waitForLoadState('load');
							if (await user10MeetingPage.isCancelRegistrationButtonVisible()) {
								await user10MeetingPage.CancelRegistration();
							}
							await user10Context.close();
						}
					}
				});
			});
			test('Meeting Full', async () => {
				await test.step('1.10 USER: registers for a meeting', async () => {
					await homePage.navigateToHomePage();
					await homePage.goToProcessesFromHomeMenu();
					await processesOverviewPage.getPage().waitForLoadState('load');
					await processesOverviewPage.expectToBeOnProcessesOverviewPage();
					await processesOverviewPage.navigateToProcess(processTitle, processSlug);
					await processDetailPage.navigateToMeetingsPage();
					const index = await processDetailPage.findMeetingCardIndexByTitle(meetingTitle);
					await meetingsPage.clickMeetingCardByIndex(index);
					meetingDetailUrl = meetingDetailPage.getPage().url();
				});
				await test.step('10.1 PARTICIPATORY: navigates to meeting detail', async () => {
					// User is already on meeting detail page from step 1.10
					// Verify we're on the correct page
					await meetingDetailPage.expectOnMeetingDetailPage();
				});
				await test.step('10.2 System: shows meeting full message to PARTICIPATORY', async () => {
					await meetingDetailPage.getPage().screenshot({
						path: 'test-results/screenshots/meetingDetailPageUserMeetingFullAF.png',
						fullPage: true
					});
					await meetingDetailPage.expectMeetingFullMessageVisible();
				});
				await test.step('Result', async () => {
					await meetingDetailPage.expectOnMeetingDetailPage();
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
			await cleanupPage.goto(meetingDetailUrl, { waitUntil: 'load' });
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

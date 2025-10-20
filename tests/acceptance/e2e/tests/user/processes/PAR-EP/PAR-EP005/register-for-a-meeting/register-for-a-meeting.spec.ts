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
//import { LetterOpenerPage } from '@pages/pages/admin/LetterOpenerPage';

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
    //let letterOpenerPage: LetterOpenerPage;

	test.beforeEach(async ({ page }) => {
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		meetingsPage = new MeetingsPage(page);
		meetingDetailPage = new MeetingDetailPage(page);
		homePage = new HomePage(page);
        headerComponent = new HeaderComponent(page);
        notificationPage = new NotificationPage(page);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('Allows citizens to register for a meeting in advance', async () => {
			let confirmationMessage: string;
			let registrationCode: string;

			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
				await processesOverviewPage.navigateToProcessByIndex(0);
			});
			await test.step('2. System: Displays the details of the selected process, including the title, description, phases, key objectives.', async () => {
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
			await test.step('3. User: Navigate to the “Meetings” section of the process', async () => {
				await processDetailPage.navigateToMeetingsPage();
			});
			await test.step('4. System: Displays a list of available meetings, including relevant details such as title, date, time, location, and availability.', async () => {
				await meetingsPage.expectOnMeetingsPage();
			});
			await test.step('5. User: Selects a specific meeting to view more details.', async () => {
				await meetingsPage.clickMeetingCardByIndex(0);
			});
			await test.step('6. System: Displays the meeting details...', async () => {
			  	await meetingDetailPage.expectOnMeetingDetailPage();
			  	meetingDetailUrl = meetingDetailPage.getPage().url();
			  	await meetingDetailPage.getPage().screenshot({ path: 'test-results/screenshots/OnMeetingDetailPage.png', fullPage: true });
			});
			await test.step('7. User: Clicks on the "Register" button to sign up for the meeting.', async () => {
				await meetingDetailPage.expectRegisterButtonVisible();
				await meetingDetailPage.clickRegisterMeetingButton();
			});
			await test.step('8. System: Displays a confirmation dialog to confirm the registration.', async () => {
				await meetingDetailPage.expectRegistrationPromptVisible();
			});
			await test.step('9. User: Confirms the registration by clicking the "Confirm" button in the dialog.', async () => {
				await meetingDetailPage.confirmRegistration();
                await meetingDetailPage.getPage().waitForLoadState('networkidle');
                await meetingDetailPage.getPage().reload({ waitUntil: 'networkidle' });
				await meetingDetailPage.getPage().waitForLoadState('networkidle');
				await meetingDetailPage.getPage().reload({ waitUntil: 'networkidle' });
			});
			await test.step('10. System: Saves the registration information, adds the user to the attendee list, and provides a confirmation message.', async () => {
				registrationCode = await meetingDetailPage.expectRegistrationCodeVisibleAndGet();
				expect(registrationCode).not.toBeNull();
				await meetingDetailPage.expectRegistrationStatusVisible();
				confirmationMessage = await meetingDetailPage.expectConfirmationMessageVisibleAndGet('You have joined the meeting successfully.');
			});
			await test.step('11. System: Sends a confirmation email or notification to the user with the meeting details, including date, time, and location (or link if the meeting is online).', async () => {
				await headerComponent.goToNotifications();
				await notificationPage.expectToBeOnNotificationsPage();
                const boolRegCode = await notificationPage.isTextPresentInNotifications(registrationCode);
                expect(boolRegCode).toBeTruthy(); // Se non presente, fallisce il test
				const inboxRes = await fetch('https://api.mailslurp.com/inboxes', {
				  method: 'POST',
				  headers: { 'x-api-key': process.env.MAILSLURP_API_KEY }
				});
				const inbox = await inboxRes.json();
				const emailRes = await fetch(`https://api.mailslurp.com/waitForLatestEmail?inboxId=${inbox.id}&timeout=30000`, {
				  headers: { 'x-api-key': process.env.MAILSLURP_API_KEY }
				});
				const email = await emailRes.json();
				expect(email.subject).toContain('Registrazione confermata');
				expect(email.body).toContain('Grazie per esserti registrato al meeting');





                // Navigate to Letter Opener and refresh to get latest emails
				// await letterOpenerPage.navigateToLetterOpener();
                // await letterOpenerPage.expectToBeOnLetterOpener();
				// await letterOpenerPage.refreshEmails();
                // await letterOpenerPage.clickMostRecentInvitationEmail();
                // const emailContentFrame =  await letterOpenerPage.getEmailContentFrame();
                // const emailBodyText = await emailContentFrame?.innerText() || '';
                // expect(emailBodyText).toContain(registrationCode);
			});

			await test.step('Result.', async () => {
				expect(confirmationMessage).not.toBeNull();
				//await meetingDetailPage.expectOnMeetingDetailPage();

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
				await meetingDetailPage.getPage().waitForLoadState('networkidle');
				await meetingDetailPage.getPage().reload({ waitUntil: 'networkidle' });
				await meetingDetailPage.expectRegisterButtonVisible();
	        });
	    });		
	});
});

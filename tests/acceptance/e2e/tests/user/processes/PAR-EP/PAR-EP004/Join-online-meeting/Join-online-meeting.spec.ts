import { test } from '@playwright/test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { FormMeetingPage } from '@pages/pages/admin/processes/detail/meetings/FormMeetingPage';
import { MeetingsPage } from '@pages/pages/admin/processes/detail/meetings/MeetingsPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { STORAGE_STATE } from '@utils/constants';
import { ensureLoggedIn } from '@utils/auth-helper';
import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { MeetingDetailPage } from '@pages/pages/user/processes/MeetingDetailPage';

/**
 * Test suite for Allows citizens to join an online meeting by accessing the provided link, enabling them to participate in community discussions and activities remotely.
 *
 * User Story: As a Citizen, I want to join an online meeting using a provided link so that I can participate in community discussions from a remote location.
 *
 * Requirements: PAR R14, PAR R13b, PAR R8
 *
 * Prerequisites:
 * - The citizen has an active account on the platform and is logged in.
 * - The meeting is scheduled and hosted online
 */

test.describe('[PAR-EP004] – Flow meeting admin + user', () => {
	// All tests run as USER
	test.use({ storageState: STORAGE_STATE.USER });

	// Variables for USER-side objects
	let homePage: HomePage;
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let meetingDetailPage: MeetingDetailPage;

	test.beforeEach(async ({ page, browser }, testInfo) => {
		// --- ADMIN PRE-REQUISITE ---
		const adminContext = await browser.newContext({ storageState: STORAGE_STATE.ADMIN });
		const adminPage = await adminContext.newPage();

		await ensureLoggedIn(adminPage, 'ADMIN');

		const adminHomePage = new AdminHomePage(adminPage);
		const processAdminPage = new ProcessAdminPage(adminPage);
		const updateProcessPage = new UpdateProcessAdminPage(adminPage);
		const meetingsPageAdmin = new MeetingsPage(adminPage);
		const formMeetingPage = new FormMeetingPage(adminPage);

		await test.step('Setup: Admin edits an existing meeting', async () => {
			await adminHomePage.navigateToAdminHomePage();
			await processAdminPage.navigateToProcesses();
			await processAdminPage.getPage().waitForLoadState('networkidle');

			await processAdminPage.editProcess('Officia aut dolor aut eos.');
			await processAdminPage.getPage().waitForLoadState('networkidle');

			await updateProcessPage.sidebarProcessDetail.navigateToMeetings();
			await meetingsPageAdmin.verifyMeetingsPageVisible();
			const index = await meetingsPageAdmin.findMeetingByTitle('Exercitationem dolorem.');
			await meetingsPageAdmin.clickEdit(index);
			await meetingsPageAdmin.getPage().waitForLoadState('networkidle');

			// Conditional: Main flow vs alternate flow
			if (testInfo.title.includes('Main Flow')) {
				// Start date: 3 days before today
				const startDate = new Date();
				startDate.setDate(startDate.getDate() - 3);
				await formMeetingPage.selectCustomDate(startDate, 0, 0);
				// End date: 3 weeks later today
				const endDate = new Date();
				endDate.setDate(endDate.getDate() + 21);
				await formMeetingPage.selectCustomDate(endDate, 1, 1);
			} else {
				//Start data to date start time + 5 minutes
				const startDate = new Date();
				await formMeetingPage.selectCustomDate(startDate, 0, 0);
				const hour = startDate.getHours();
				const minute = startDate.getMinutes();
				await formMeetingPage.selectCustomTime(0, hour, minute, 5);
				const endDate = new Date(startDate);
				endDate.setDate(endDate.getDate() + 21);
				await formMeetingPage.selectCustomDate(endDate, 1, 1);
			}

			await formMeetingPage.submitForm();
			await formMeetingPage.getPage().waitForLoadState('networkidle');
		});

		// Close context admin
		await adminPage.close();
		await adminContext.close();

		// --- USER INIT ---
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);
		meetingDetailPage = new MeetingDetailPage(page);
		await homePage.navigateToHomePage();
	});

	test('Main Flow: Join online meeting', async () => {
		await test.step('USER joins the meeting', async () => {
			let joined: any;
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});

			await test.step('2. System: Displays the details of the selected process, including the title, description, phases, key objectives.', async () => {
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
			});
			await test.step('3. User: Scrolls through the process details to understand the context and purpose of the process and navigates to “Meetings', async () => {
				await processesOverviewPage.navigateToProcessByTitle('Officia aut dolor aut eos.');
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
				await processDetailPage.navigateToMeetingsPage();
			});
			await test.step('4. System: Displays a list of available meetings, including relevant details such as title, date, time, location, and availability.', async () => {
				await processDetailPage.expectUrlContainsMeetings();
				await processDetailPage.enhancedVerifyMeetingsCardListVisible();
			});
			await test.step('5. User: Selects a specific meeting to view more details.', async () => {
				const index = await processDetailPage.findMeetingCardIndexByTitle('Exercitationem dolorem.');
				await processDetailPage.clickMeetingCardByIndex(index);
			});

			await test.step('6. System: Displays the meeting details page, including a button labelled "Join Online Meeting."', async () => {
				await meetingDetailPage.expectOnMeetingDetailPage();
				await meetingDetailPage.expectJoinLinkVisible();
				meetingDetailPage.takeScreenshot('JoinLinkVisible');
			});

			await test.step('7. User: Clicks on the "Join Online Meeting" button to join the online meeting.', async () => {
				const [newPage] = await Promise.all([
					meetingDetailPage.getPage().context().waitForEvent('page'),
					meetingDetailPage.clickJoinMeetingButton()
				]);
				await newPage.waitForLoadState('domcontentloaded');
				await newPage.screenshot({
					path: `test-results/screenshots/join-meeting-${Date.now()}.png`,
					fullPage: true
				});
			});

			await test.step('8. System: Redirects the citizen to the meeting link using the provided video conferencing tool.', async () => {
				joined = await meetingDetailPage.verifyJoinMeetingResult();
			});

			await test.step('Result: The citizen successfully joins the online meeting and can participate in discussions and activities.', async () => {
				if (joined.success) {
					console.log(`Join successful: scenario = ${joined.outcome}`);
				} else {
					throw new Error(`Join KO: outcome = ${joined.outcome}`);
				}
			});
		});
	});

	test('Alternative flow: Meeting Link Not Yet Available', async () => {
		await test.step('', async () => {
			// Navigate to processes section
			await homePage.goToProcessesFromHomeMenu();
			await processesOverviewPage.getPage().waitForLoadState('networkidle');
			await processesOverviewPage.expectToBeOnProcessesOverviewPage();
			await processesOverviewPage.navigateToProcessByTitle('Officia aut dolor aut eos.');
			await processesOverviewPage.getPage().waitForLoadState('networkidle');
			await processDetailPage.navigateToMeetingsPage();
			await processDetailPage.expectUrlContainsMeetings();
			const index = await processDetailPage.findMeetingCardIndexByTitle('Exercitationem dolorem.');
			await processDetailPage.clickMeetingCardByIndex(index);
			await meetingDetailPage.expectOnMeetingDetailPage();
			await meetingDetailPage.expectLinkToJoinMeetingNotYetAvailable();
			meetingDetailPage.takeScreenshot('LinkToJoinMeetingNotYetAvailable');
			await meetingDetailPage.joinMeetingWhenAvailable(10);
		});
	});
});

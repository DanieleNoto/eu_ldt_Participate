import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import { MeetingDetailPage } from '@pages/pages/user/processes/MeetingDetailPage';
import { MeetingsPage } from '@pages/pages/user/processes/MeetingsPage';
import test from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows citizens to view detailed information about meetings, including the agenda, location, date, time, and access settings, to ensure they are informed and can decide whether to participate.
 *
 * User Story: 	As a Citizen, I want to view meeting details so that I can understand what the meeting is about and decide if I want to participate.
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
test.describe('[PAR-EP002] – View meeting details', () => {
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
		test('should allow user to endorse a debate', async () => {
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
			await test.step('6. System: Displays the meeting details, including the agenda, location, date, time, and access settings.', async () => {
				await meetingDetailPage.expectOnMeetingDetailPage();
			});

			await test.step('Result.', async () => {
				await meetingDetailPage.expectOnMeetingDetailPage();
			});
		});
	});
});

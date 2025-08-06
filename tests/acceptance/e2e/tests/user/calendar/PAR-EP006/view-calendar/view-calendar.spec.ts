import { HomePage } from '@pages/pages/public/HomePage';
import { CalendarPage } from '@pages/pages/user/CalendarPage';
import test from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Enables user to view events inside a calendar.
 *
 * User Story: 	As a Citizen, I want to view all event in a calendar so that I can keep track of upcoming events.
 *
 * Requirements: PAR R14h
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 *
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
});
test.describe('[PAR-EP006] – View calendar', () => {
	test.use({ storageState: STORAGE_STATE.USER });

	let calendarPage: CalendarPage;
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		calendarPage = new CalendarPage(page);
		homePage = new HomePage(page);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow user to view the calendar', async () => {
			await test.step('1. User: Navigates to the "Calendar" section on the platform.', async () => {
				// Navigate to calendar section
				await homePage.goToCalendarFromHomeMenu();
				await calendarPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays the details of the selected process, including the title, description, phases, key objectives.', async () => {
				await calendarPage.expectCalendarVisible();
			});
			await test.step('3. User: Views events displayed on the calendar, including the title, date, time, and location.', async () => {
				await calendarPage.filterByDebate();
				await calendarPage.filterByDebate();
				await calendarPage.filterByMeeting();
			});
			await test.step('4. System: Highlights events on their respective dates within the calendar view', async () => {
				await calendarPage.expectCalendarVisible();
			});

			await test.step('Result.', async () => {
				await calendarPage.expectCalendarVisible();
				await calendarPage.expectCalendarTabVisible();
				await calendarPage.expectDebateFilterVisible();
			});
		});
	});
});

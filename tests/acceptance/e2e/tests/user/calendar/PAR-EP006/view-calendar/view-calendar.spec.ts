/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { CalendarPage } from '@pages/pages/user/CalendarPage';
import { test, expect } from '@fixtures/parallel-test';

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

test.describe('[PAR-EP006] – View calendar', () => {
	let calendarPage: CalendarPage;
	let homePage: HomePage;

	test.beforeEach(async ({ userPage }) => {
		calendarPage = new CalendarPage(userPage);
		homePage = new HomePage(userPage);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow user to view the calendar', async () => {
			await test.step('1. User: Navigates to the "Calendar" section on the platform.', async () => {
				// Navigate to calendar section
				await homePage.goToCalendarFromHomeMenu();
				await calendarPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays an interactive calendar interface showing all events associated with processes.', async () => {
				await calendarPage.expectCalendarVisible();
				const isInterfaceVisible = await calendarPage.verifyCalendarInterface();
				expect(isInterfaceVisible).toBeTruthy();
			});
			await test.step('3. User: Views events displayed on the calendar, including the title, date, time, and location.', async () => {
				const events = await calendarPage.getCalendarEvents();
				expect(events.length).toBeGreaterThan(0); // fail if no events
				console.log('Events found on calendar with details:', events);
				await calendarPage.filterByDebate();
				await calendarPage.filterByMeeting();
			});
			await test.step('4. System: Highlights events on their respective dates within the calendar view', async () => {
				await calendarPage.expectCalendarVisible();
				const hasEvents = await calendarPage.verifyAnyEventHighlighted();
				expect(hasEvents).toBeTruthy(); // step result confirmation
			});

			await test.step('Result.', async () => {
				await calendarPage.expectCalendarVisible();
				await calendarPage.expectCalendarTabVisible();
				await calendarPage.expectDebateFilterVisible();
			});
		});
	});
});

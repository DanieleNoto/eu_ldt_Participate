/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denise Scarcelli
 * Gianfranco Cedro
 */

import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { Locator, Page, expect } from '@playwright/test';

export class CalendarPage extends AuthenticatedPage {
	readonly calendarTab: Locator;
	readonly ganttGraphTab: Locator;
	readonly participatoryStepFilter: Locator;
	readonly meetingFilter: Locator;
	readonly externalEventFilter: Locator;
	readonly debateFilter: Locator;
	readonly exportCalendarButton: Locator;
	readonly calendar: Locator;

	constructor(page: Page) {
		super(page);
		this.calendarTab = page.getByLabel('Decidim').getByRole('link', { name: 'Calendar' });
		this.ganttGraphTab = page.locator('a[href="/calendar/gantt"]');
		this.participatoryStepFilter = page.locator('#participatory_step');
		this.meetingFilter = page.locator('#meeting');
		this.externalEventFilter = page.locator('#external_event');
		this.debateFilter = page.locator('#debate');
		this.exportCalendarButton = page.locator('[data-dialog-open="calendarShare"]');
		this.calendar = page.locator('#calendar');
	}

	async navigateToCalendarTab() {
		await this.calendarTab.click();
	}

	async navigateToGanttGraphTab() {
		await this.ganttGraphTab.click();
	}

	async filterByParticipatoryStep() {
		await this.participatoryStepFilter.click();
	}

	async filterByMeeting() {
		await this.meetingFilter.click();
	}

	async filterByExternalEvent() {
		await this.externalEventFilter.click();
	}

	async filterByDebate() {
		await this.debateFilter.click();
	}

	async exportCalendar() {
		await this.exportCalendarButton.click();
	}

	async expectCalendarTabVisible() {
		await expect(this.calendarTab).toBeVisible();
	}

	async expectGanttGraphTabVisible() {
		await expect(this.ganttGraphTab).toBeVisible();
	}

	async expectParticipatoryStepFilterVisible() {
		await expect(this.participatoryStepFilter).toBeVisible();
	}

	async expectMeetingFilterVisible() {
		await expect(this.meetingFilter).toBeVisible();
	}

	async expectExternalEventFilterVisible() {
		await expect(this.externalEventFilter).toBeVisible();
	}

	async expectDebateFilterVisible() {
		await expect(this.debateFilter).toBeVisible();
	}

	async expectExportCalendarButtonVisible() {
		await expect(this.exportCalendarButton).toBeVisible();
	}

	async expectCalendarVisible() {
		await expect(this.calendar).toBeVisible();
	}

	/**
	 * Verify that at least one event is highlighted in the calendar view.
	 * Does not fail if no events are found, but logs a warning.
	 * @returns true if at least one event is visible, false otherwise
	 */

	async verifyAnyEventHighlighted(): Promise<boolean> {
		try {
			const events = this.page.locator('.fc-daygrid-day .fc-event');
			const count = await events.count();

			if (count === 0) {
				console.warn('No events found in the calendar view.');
				return false;
			}

			return true;
		} catch (error) {
			console.warn('Calendar event highlight check failed:', error);
			return false;
		}
	}

	/**
	 * Verify that the interactive calendar filters are visible
	 * and therefore the system displays an interactive calendar interface.
	 * @returns true if filters and export button are visible, false otherwise
	 */

	async verifyCalendarInterface(): Promise<boolean> {
		try {
			// Check filters
			const participatoryVisible = await this.page.locator('#participatory_step').isVisible();
			const meetingVisible = await this.page.locator('#meeting').isVisible();
			const externalVisible = await this.page.locator('#external_event').isVisible();
			const debateVisible = await this.page.locator('#debate').isVisible();

			// Check export button
			const exportVisible = await this.page.locator('[data-dialog-open="calendarShare"]').isVisible();

			const allVisible =
				participatoryVisible && meetingVisible && externalVisible && debateVisible && exportVisible;

			if (!allVisible) {
				console.warn('Calendar interface elements not fully visible.');
			}

			return allVisible;
		} catch (error) {
			console.warn('Calendar interface verification failed:', error);
			return false;
		}
	}

	/**
	 * Collects all calendar events, including those hidden behind "+1 more" links.
	 * Expands popovers sequentially, closes them, and returns the list of events.
	 */

	async getCalendarEvents(): Promise<{ date: string | null; title: string; href?: string }[]> {
		const eventsData: { date: string | null; title: string; href?: string }[] = [];

		const moreLinks = this.page.locator('.fc-more-link');
		const moreCount = await moreLinks.count();

		for (let i = 0; i < moreCount; i++) {
			const link = moreLinks.nth(i);
			await link.click({ force: true });
			await this.page.waitForSelector('.fc-popover', { state: 'visible' });

			const popoverEvents = this.page.locator('.fc-popover .fc-event');
			const popCount = await popoverEvents.count();

			for (let j = 0; j < popCount; j++) {
				const event = popoverEvents.nth(j);
				const title = (
					await event
						.locator('.fc-title')
						.innerText()
						.catch(() => '')
				).trim();
				const href = await event.getAttribute('href');

				const popover = event.locator('xpath=ancestor::div[contains(@class,"fc-more-popover")]').first();
				const date = await popover.getAttribute('data-date');

				eventsData.push({ date, title, href: href ?? undefined });
			}

			if (await this.page.locator('.fc-popover').isVisible()) {
				await this.page.keyboard.press('Escape');
				await this.page.waitForSelector('.fc-popover', { state: 'hidden' });
			}
		}

		const dayCells = this.page.locator('td.fc-daygrid-day');
		const dayCount = await dayCells.count();

		for (let i = 0; i < dayCount; i++) {
			const dayCell = dayCells.nth(i);
			const date = await dayCell.getAttribute('data-date');

			const events = dayCell.locator('.fc-event');
			const eventCount = await events.count();

			for (let j = 0; j < eventCount; j++) {
				const event = events.nth(j);
				const title = (
					await event
						.locator('.fc-title')
						.innerText()
						.catch(() => '')
				).trim();
				const href = await event.getAttribute('href');
				eventsData.push({ date, title, href: href ?? undefined });
			}
		}

		return eventsData;
	}
}

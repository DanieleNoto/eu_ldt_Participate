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
 * Extract events displayed on the calendar, including title and date.
 * (Time and location can be parsed if present in the event text/attributes.)
 * @returns array of objects with event details
 */
async getCalendarEvents(): Promise<{ date: string; title: string }[]> {
  const eventsData: { date: string; title: string }[] = [];

  // Locate all day cells
  const dayCells = this.page.locator('td.fc-daygrid-day');
  const dayCount = await dayCells.count();

  for (let i = 0; i < dayCount; i++) {
    const dayCell = dayCells.nth(i);
    const date = await dayCell.getAttribute('data-date');

    // Find events inside this day
    const events = dayCell.locator('.fc-event .fc-title');
    const eventCount = await events.count();

    for (let j = 0; j < eventCount; j++) {
      const title = await events.nth(j).innerText();
      eventsData.push({ date: date ?? '', title });
    }
  }

  return eventsData;
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

    const allVisible = participatoryVisible && meetingVisible && externalVisible && debateVisible && exportVisible;

    if (!allVisible) {
      console.warn('Calendar interface elements not fully visible.');
    }

    return allVisible;
  } catch (error) {
    console.warn('Calendar interface verification failed:', error);
    return false;
  }
}

}

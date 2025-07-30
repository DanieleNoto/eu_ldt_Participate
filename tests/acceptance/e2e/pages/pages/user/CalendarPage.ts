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
}

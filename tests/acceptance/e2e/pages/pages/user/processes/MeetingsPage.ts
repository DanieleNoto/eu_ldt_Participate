/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 */

import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { expect, Locator, Page } from '@playwright/test';

export class MeetingsPage extends AuthenticatedPage {
	private meetingsSection: Locator;
	private meetingCards: Locator;
	private seeAllWithdrawnMeetingsButton: Locator;
	private searchField: Locator;
	private searchButton: Locator;

	constructor(page: Page) {
		super(page);
		this.meetingsSection = this.page.locator('#meetings');
		this.meetingCards = this.page.locator('.card__list-list .card__list');
		this.seeAllWithdrawnMeetingsButton = this.page.locator('a.button__text-secondary[href*="withdrawn"]');
		this.searchField = this.page.getByRole('searchbox', { name: 'Search among Meetings' });
		this.searchButton = this.page.getByRole('button', { name: 'Search among Meetings' });
	}

	// Methods

	/**
	 * Navigate to the meetings page
	 */
	async navigateToMeetingsPage(): Promise<void> {
		await this.page.goto('/processes/judge-transfer/f/5/meetings');
	}

	/**
	 * Verify that the user is on the meetings page
	 */
	async expectOnMeetingsPage(): Promise<void> {
		await expect(this.meetingsSection).toBeVisible();
	}

	/**
	 * Get the list of meeting cards
	 */
	async getMeetingCards(): Promise<string[]> {
		return await this.meetingCards.evaluateAll(elements => elements.map(el => el.textContent?.trim() || ''));
	}

	/**
	 * Click on the "See all withdrawn meetings" button
	 */
	async clickSeeAllWithdrawnMeetings(): Promise<void> {
		await this.seeAllWithdrawnMeetingsButton.click();
	}

	/**
	 * Click on a meeting card by index
	 * @param index - The index of the meeting card to click (0-based)
	 */
	async clickMeetingCardByIndex(index: number): Promise<void> {
		const meetingCard = this.meetingCards.nth(index);
		await meetingCard.click();
	}

	/**
	 * Search for a meeting card by title and verify its existence
	 * @param name - The title of the meeting card to search
	 */
	async searchAndVerifyMeetingExists(title: string) {
		await expect(this.searchField).toBeVisible();
		await this.searchField.click();
		await this.searchField.fill(title);
		await expect(this.searchButton).toBeVisible();
		await this.searchButton.click();
		const meetingCard = this.meetingCards.nth(0);
		await expect(meetingCard).toBeVisible();
		await expect(meetingCard).toContainText(title);
	}
}

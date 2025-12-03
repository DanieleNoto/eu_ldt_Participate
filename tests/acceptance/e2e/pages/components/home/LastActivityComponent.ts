/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 * Gianfranco Cedro
 */

import { Locator, Page } from '@playwright/test';

export class LastActivityComponent {
	readonly page: Page;
	readonly lastActivitySection: Locator;
	readonly sectionTitle: Locator;
	readonly viewAllButton: Locator;
	readonly activityContainers: Locator;
	readonly activityItems: Locator;
	readonly activityTimes: Locator;
	readonly activityContents: Locator;
	readonly activityAuthors: Locator;
	readonly authorAvatars: Locator;
	readonly authorAvatarLinks: Locator;

	constructor(page: Page) {
		this.page = page;
		this.lastActivitySection = page.locator('#last_activity');
		this.sectionTitle = page.locator('.home__section-title:has-text("Last activity")');
		this.viewAllButton = page.locator('a[href="/last_activities"]');
		this.activityContainers = page.locator('.activity__container');
		this.activityItems = page.locator('.activity[data-activity]');
		this.activityTimes = page.locator('.activity__time');
		this.activityContents = page.locator('.activity__content');
		this.activityAuthors = page.locator('.activity__author');
		this.authorAvatars = page.locator('.author__avatar');
		this.authorAvatarLinks = page.locator('.author__avatar-container a');
	}

	/**
	 * Get the number of activity items displayed
	 */
	async getActivityCount(): Promise<number> {
		return await this.activityItems.count();
	}

	/**
	 * Get the time text of a specific activity by index
	 * @param index - The index of the activity (0-based)
	 */
	async getActivityTime(index: number): Promise<string> {
		const activityTime = this.activityTimes.nth(index);
		return (await activityTime.textContent()) || '';
	}

	/**
	 * Get the content text of a specific activity by index
	 * @param index - The index of the activity (0-based)
	 */
	async getActivityContent(index: number): Promise<string> {
		const activityContent = this.activityContents.nth(index);
		return (await activityContent.textContent()) || '';
	}

	/**
	 * Get the activity type (e.g., "New survey:", "New comment:", "New proposal:") by index
	 * @param index - The index of the activity (0-based)
	 */
	async getActivityType(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const typeElement = activity.locator('.activity__content span:first-child span:first-child');
		return (await typeElement.textContent()) || '';
	}

	/**
	 * Get the main activity link text by index
	 * @param index - The index of the activity (0-based)
	 */
	async getActivityLinkText(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const linkElement = activity.locator('.activity__content a:first-of-type');
		return (await linkElement.textContent()) || '';
	}

	/**
	 * Get the activity link URL by index
	 * @param index - The index of the activity (0-based)
	 */
	async getActivityLinkUrl(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const linkElement = activity.locator('.activity__content a:first-of-type');
		return (await linkElement.getAttribute('href')) || '';
	}

	/**
	 * Get the secondary link text (e.g., assembly name) by index
	 * @param index - The index of the activity (0-based)
	 */
	async getActivitySecondaryLinkText(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const secondaryLink = activity.locator('.activity__content span:last-child a');

		if ((await secondaryLink.count()) > 0) {
			return (await secondaryLink.textContent()) || '';
		}
		return '';
	}

	/**
	 * Click on a specific activity's main link by index
	 * @param index - The index of the activity (0-based)
	 */
	async clickActivityLink(index: number) {
		const activity = this.activityItems.nth(index);
		const linkElement = activity.locator('.activity__content a:first-of-type');
		await linkElement.click();
	}

	/**
	 * Click on a specific activity's secondary link by index
	 * @param index - The index of the activity (0-based)
	 */
	async clickActivitySecondaryLink(index: number) {
		const activity = this.activityItems.nth(index);
		const secondaryLink = activity.locator('.activity__content span:last-child a');

		if ((await secondaryLink.count()) > 0) {
			await secondaryLink.click();
		}
	}

	/**
	 * Check if an activity has an author avatar by index
	 * @param index - The index of the activity (0-based)
	 */
	async hasAuthorAvatar(index: number): Promise<boolean> {
		const activity = this.activityItems.nth(index);
		const authorSection = activity.locator('.activity__author');
		const avatar = authorSection.locator('.author__avatar');
		return (await avatar.count()) > 0;
	}

	/**
	 * Get the author avatar alt text by activity index
	 * @param index - The index of the activity (0-based)
	 */
	async getAuthorAvatarAltText(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const avatar = activity.locator('.activity__author .author__avatar');

		if ((await avatar.count()) > 0) {
			return (await avatar.getAttribute('alt')) || '';
		}
		return '';
	}

	/**
	 * Get the author profile URL by activity index
	 * @param index - The index of the activity (0-based)
	 */
	async getAuthorProfileUrl(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const authorLink = activity.locator('.activity__author .author__avatar-container a');

		if ((await authorLink.count()) > 0) {
			return (await authorLink.getAttribute('href')) || '';
		}
		return '';
	}

	/**
	 * Click on the author avatar to navigate to their profile by activity index
	 * @param index - The index of the activity (0-based)
	 */
	async clickAuthorAvatar(index: number) {
		const activity = this.activityItems.nth(index);
		const authorLink = activity.locator('.author__avatar-container a[href*="profiles/"]');

		// Wait for the author link to be available with a reasonable timeout
		try {
			await authorLink.waitFor({ state: 'attached', timeout: 5000 });

			const linkCount = await authorLink.count();
			if (linkCount > 0) {
				// Get the href before clicking for debugging
				const href = await authorLink.getAttribute('href');
				console.log(`Attempting to click author link with href: ${href}`);

				// Use force click to handle any visibility/overlay issues
				await authorLink.click({ force: true, timeout: 10000 });
			} else {
				throw new Error(`No author avatar found for activity at index ${index}`);
			}
		} catch (error) {
			throw new Error(`Failed to click author avatar at index ${index}: ${error}`);
		}
	}

	/**
	 * Click on the "View all" button to see all activities
	 */
	async clickViewAllButton() {
		await this.viewAllButton.click();
	}

	/**
	 * Get the number of activity containers
	 */
	async getActivityContainerCount(): Promise<number> {
		return await this.activityContainers.count();
	}

	/**
	 * Check if the last activity section is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.lastActivitySection.isVisible();
	}

	/**
	 * Get the section title text
	 */
	async getSectionTitle(): Promise<string> {
		return (await this.sectionTitle.textContent()) || '';
	}

	/**
	 * Find activities by type (e.g., "New survey", "New comment", "New proposal")
	 * @param activityType - The type of activity to search for
	 */
	async getActivitiesByType(activityType: string): Promise<number[]> {
		const activityCount = await this.getActivityCount();
		const matchingIndices: number[] = [];

		for (let i = 0; i < activityCount; i++) {
			const type = await this.getActivityType(i);
			if (type.toLowerCase().includes(activityType.toLowerCase())) {
				matchingIndices.push(i);
			}
		}

		return matchingIndices;
	}

	/**
	 * Get all activities that have authors
	 */
	async getActivitiesWithAuthors(): Promise<number[]> {
		const activityCount = await this.getActivityCount();
		const activitiesWithAuthors: number[] = [];

		console.log(`Checking ${activityCount} activities for author avatars...`);

		for (let i = 0; i < activityCount; i++) {
			const hasAuthor = await this.hasAuthorAvatar(i);
			console.log(`Activity ${i}: has author avatar = ${hasAuthor}`);

			if (hasAuthor) {
				// Additional check to ensure the author link is actually clickable
				const activity = this.activityItems.nth(i);
				const authorLink = activity.locator('.author__avatar-container a[href*="profiles/"]');
				const linkCount = await authorLink.count();

				if (linkCount > 0) {
					const href = await authorLink.getAttribute('href');
					console.log(`Activity ${i}: author link found with href = ${href}`);
					activitiesWithAuthors.push(i);
				} else {
					console.log(`Activity ${i}: has avatar but no clickable link`);
				}
			}
		}

		console.log(
			`Found ${activitiesWithAuthors.length} activities with clickable author avatars: [${activitiesWithAuthors.join(', ')}]`
		);
		return activitiesWithAuthors;
	}

	/**
	 * Get the tooltip URL for an author by activity index
	 * @param index - The index of the activity (0-based)
	 */
	async getAuthorTooltipUrl(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const authorSpan = activity.locator('.activity__author span.author[data-tooltip-url]');

		if ((await authorSpan.count()) > 0) {
			return (await authorSpan.getAttribute('data-tooltip-url')) || '';
		}
		return '';
	}

	/**
	 * Wait for the last activity section to load
	 */
	async waitForActivityToLoad() {
		await this.lastActivitySection.waitFor({ state: 'visible' });
		await this.sectionTitle.waitFor({ state: 'visible' });
	}

	async scrollToSection() {
		await this.lastActivitySection.scrollIntoViewIfNeeded();
	}
}

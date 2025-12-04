/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Locator, Page } from '@playwright/test';

/**
 * Component representing the content details section on the Moderation Reports page
 */
export class ModerationReportsContentDetailsComponent {
	readonly page: Page;
	readonly contentDetailsContainer: Locator;
	readonly contentUrl: Locator;
	readonly contentId: Locator;
	readonly contentLanguage: Locator;
	readonly contentBody: Locator;
	readonly contentAuthors: Locator;
	readonly contentCreatedAt: Locator;
	readonly contentUpdatedAt: Locator;

	constructor(page: Page) {
		this.page = page;
		this.contentDetailsContainer = page.locator('.row.column').first();
		this.contentUrl = this.contentDetailsContainer.locator('strong').filter({ hasText: 'URL' }).locator('+ span');
		this.contentId = this.contentDetailsContainer.locator('strong').filter({ hasText: 'ID' }).locator('+ span');
		this.contentLanguage = this.contentDetailsContainer
			.locator('strong')
			.filter({ hasText: 'Language' })
			.locator('+ span');
		this.contentBody = this.contentDetailsContainer
			.locator('strong')
			.filter({ hasText: 'Content' })
			.locator('+ div');
		this.contentAuthors = this.contentDetailsContainer
			.locator('strong')
			.filter({ hasText: 'Authors' })
			.locator('+ span');
		this.contentCreatedAt = this.contentDetailsContainer
			.locator('strong')
			.filter({ hasText: 'Created at' })
			.locator('+ span');
		this.contentUpdatedAt = this.contentDetailsContainer
			.locator('strong')
			.filter({ hasText: 'Updated at' })
			.locator('+ span');
	}

	/**
	 * Get the content URL
	 */
	async getContentUrl(): Promise<string> {
		return (await this.contentUrl.textContent()) || '';
	}

	/**
	 * Get the content ID
	 */
	async getContentId(): Promise<string> {
		return (await this.contentId.textContent()) || '';
	}

	/**
	 * Get the content language
	 */
	async getContentLanguage(): Promise<string> {
		return (await this.contentLanguage.textContent()) || '';
	}

	/**
	 * Get the content body text
	 */
	async getContentBody(): Promise<string> {
		return (await this.contentBody.textContent()) || '';
	}

	/**
	 * Get the content authors
	 */
	async getContentAuthors(): Promise<string> {
		return (await this.contentAuthors.textContent()) || '';
	}

	/**
	 * Get the content created date
	 */
	async getContentCreatedAt(): Promise<string> {
		return (await this.contentCreatedAt.textContent()) || '';
	}

	/**
	 * Get the content updated date
	 */
	async getContentUpdatedAt(): Promise<string> {
		return (await this.contentUpdatedAt.textContent()) || '';
	}

	/**
	 * Verify the content details section is visible
	 */
	async isVisible(): Promise<boolean> {
		return await this.contentDetailsContainer.isVisible();
	}

	/**
	 * Click on the content URL link if it's clickable
	 */
	async clickContentUrl(): Promise<void> {
		const urlLink = this.contentUrl.locator('a').first();
		if (await urlLink.isVisible()) {
			await urlLink.click();
		}
	}

	/**
	 * Verify all content details are present
	 */
	async hasAllContentDetails(): Promise<boolean> {
		const hasUrl = await this.contentUrl.isVisible();
		const hasId = await this.contentId.isVisible();
		const hasLanguage = await this.contentLanguage.isVisible();
		const hasBody = await this.contentBody.isVisible();
		const hasAuthors = await this.contentAuthors.isVisible();
		const hasCreatedAt = await this.contentCreatedAt.isVisible();
		const hasUpdatedAt = await this.contentUpdatedAt.isVisible();

		return hasUrl && hasId && hasLanguage && hasBody && hasAuthors && hasCreatedAt && hasUpdatedAt;
	}
}

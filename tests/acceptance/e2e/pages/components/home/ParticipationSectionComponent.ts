/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { Page } from '@playwright/test';

export class ParticipationSectionComponent {
	constructor(private page: Page) {}

	// Selectors for the "How to participate" section
	private get participationSection() {
		return this.page.locator('#how_to_participate');
	}

	private get sectionTitle() {
		return this.page.locator('#how_to_participate .home__section-title');
	}

	private get participationGrid() {
		return this.page.locator('.home__section-participate-grid');
	}

	private get meetingsBlock() {
		return this.page.locator('.home__section-participate-grid__block').filter({ hasText: 'Meetings' });
	}

	private get debatesBlock() {
		return this.page.locator('.home__section-participate-grid__block').filter({ hasText: 'Debates' });
	}

	private get proposalsBlock() {
		return this.page.locator('.home__section-participate-grid__block').filter({ hasText: 'Proposals' });
	}

	private get moreInfoButton() {
		return this.page.locator('#how_to_participate .button');
	}

	// Methods to check visibility
	async isParticipationSectionVisible(): Promise<boolean> {
		return await this.participationSection.isVisible();
	}

	async getSectionTitle(): Promise<string> {
		return (await this.sectionTitle.textContent()) || '';
	}

	// Methods to get information about the blocks
	async getMeetingsInfo(): Promise<{ title: string; description: string }> {
		const title = (await this.meetingsBlock.locator('.home__section-participate-grid__title').textContent()) || '';
		const description =
			(await this.meetingsBlock.locator('.home__section-participate-grid__text').textContent()) || '';
		return { title, description };
	}

	async getDebatesInfo(): Promise<{ title: string; description: string }> {
		const title = (await this.debatesBlock.locator('.home__section-participate-grid__title').textContent()) || '';
		const description =
			(await this.debatesBlock.locator('.home__section-participate-grid__text').textContent()) || '';
		return { title, description };
	}

	async getProposalsInfo(): Promise<{ title: string; description: string }> {
		const title = (await this.proposalsBlock.locator('.home__section-participate-grid__title').textContent()) || '';
		const description =
			(await this.proposalsBlock.locator('.home__section-participate-grid__text').textContent()) || '';
		return { title, description };
	}

	// Action methods
	async clickMoreInfo() {
		await this.moreInfoButton.click();
	}

	async getMoreInfoButtonText(): Promise<string> {
		return (await this.moreInfoButton.textContent()) || '';
	}

	// Methods to check the presence of icons
	async hasIcons(): Promise<boolean> {
		const meetingsIcon = await this.meetingsBlock.locator('svg').isVisible();
		const debatesIcon = await this.debatesBlock.locator('svg').isVisible();
		const proposalsIcon = await this.proposalsBlock.locator('svg').isVisible();
		return meetingsIcon && debatesIcon && proposalsIcon;
	}

	// Utility methods
	async waitForSectionToLoad() {
		await this.participationSection.waitFor({ state: 'visible' });
	}

	async scrollToSection() {
		await this.participationSection.scrollIntoViewIfNeeded();
	}

	async getAllParticipationOptions(): Promise<Array<{ title: string; description: string }>> {
		const meetings = await this.getMeetingsInfo();
		const debates = await this.getDebatesInfo();
		const proposals = await this.getProposalsInfo();
		return [meetings, debates, proposals];
	}
}

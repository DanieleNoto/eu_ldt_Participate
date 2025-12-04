/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { Page } from '@playwright/test';

export class HeroSectionComponent {
	constructor(private page: Page) {}

	// Selectors for the hero section
	private get heroSection() {
		return this.page.locator('.hero__container');
	}

	private get heroTitle() {
		return this.page.locator('.hero__title');
	}

	private get heroCTA() {
		return this.page.locator('#hero-cta');
	}

	// Methods to check visibility
	async isHeroVisible(): Promise<boolean> {
		return await this.heroSection.isVisible();
	}

	async getHeroTitle(): Promise<string> {
		return (await this.heroTitle.textContent()) || '';
	}

	async getHeroCTAText(): Promise<string> {
		return (await this.heroCTA.locator('span').textContent()) || '';
	}

	// Action methods
	async clickParticipateButton() {
		await this.heroCTA.click();
	}

	async isParticipateButtonVisible(): Promise<boolean> {
		return await this.heroCTA.isVisible();
	}

	// Utility methods
	async waitForHeroToLoad() {
		await this.heroSection.waitFor({ state: 'visible' });
	}

	async scrollToHero() {
		await this.heroSection.scrollIntoViewIfNeeded();
	}
}

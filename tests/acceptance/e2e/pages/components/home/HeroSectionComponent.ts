import { Page } from '@playwright/test';

export class HeroSectionComponent {
	constructor(private page: Page) {}

	// Selettori per la sezione hero
	private get heroSection() {
		return this.page.locator('#hero-2.hero__container');
	}

	private get heroTitle() {
		return this.page.locator('.hero__title');
	}

	private get heroCTA() {
		return this.page.locator('#hero-cta');
	}

	// Metodi per verificare la visibilità
	async isHeroVisible(): Promise<boolean> {
		return await this.heroSection.isVisible();
	}

	async getHeroTitle(): Promise<string> {
		return (await this.heroTitle.textContent()) || '';
	}

	async getHeroCTAText(): Promise<string> {
		return (await this.heroCTA.locator('span').textContent()) || '';
	}

	// Metodi per le azioni
	async clickParticipateButton() {
		await this.heroCTA.click();
	}

	async isParticipateButtonVisible(): Promise<boolean> {
		return await this.heroCTA.isVisible();
	}

	// Metodi di utilità
	async waitForHeroToLoad() {
		await this.heroSection.waitFor({ state: 'visible' });
	}

	async scrollToHero() {
		await this.heroSection.scrollIntoViewIfNeeded();
	}
}

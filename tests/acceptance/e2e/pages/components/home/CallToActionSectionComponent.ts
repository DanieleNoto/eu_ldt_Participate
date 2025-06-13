import { Page } from '@playwright/test';

export class CallToActionSectionComponent {
	constructor(private page: Page) {}

	// Selettori per la sezione CTA finale
	private get ctaSection() {
		return this.page.locator('#footer_sub_hero');
	}

	private get ctaTitle() {
		return this.page.locator('#footer_sub_hero .title-decorator');
	}

	private get ctaDescription() {
		return this.page.locator('#footer_sub_hero p.text-lg');
	}

	private get registerButton() {
		return this.page.locator('#footer_sub_hero .button');
	}

	// Metodi per verificare la visibilità
	async isCTASectionVisible(): Promise<boolean> {
		return await this.ctaSection.isVisible();
	}

	async getCTATitle(): Promise<string> {
		return (await this.ctaTitle.textContent()) || '';
	}

	async getCTADescription(): Promise<string> {
		return (await this.ctaDescription.textContent()) || '';
	}

	async getRegisterButtonText(): Promise<string> {
		return (await this.registerButton.textContent()) || '';
	}

	// Metodi per le azioni
	async clickRegisterButton() {
		await this.registerButton.click();
	}

	async isRegisterButtonVisible(): Promise<boolean> {
		return await this.registerButton.isVisible();
	}

	async hasRegisterButtonIcon(): Promise<boolean> {
		return await this.registerButton.locator('svg').isVisible();
	}

	// Metodi di utilità
	async waitForSectionToLoad() {
		await this.ctaSection.waitFor({ state: 'visible' });
	}

	async scrollToSection() {
		await this.ctaSection.scrollIntoViewIfNeeded();
	}

	async isCompletelyLoaded(): Promise<boolean> {
		const sectionVisible = await this.isCTASectionVisible();
		const titleVisible = await this.ctaTitle.isVisible();
		const descriptionVisible = await this.ctaDescription.isVisible();
		const buttonVisible = await this.isRegisterButtonVisible();

		return sectionVisible && titleVisible && descriptionVisible && buttonVisible;
	}
}

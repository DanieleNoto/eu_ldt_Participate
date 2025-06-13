import { Page } from '@playwright/test';

export class ParticipationSectionComponent {
	constructor(private page: Page) {}

	// Selettori per la sezione "Come partecipare"
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
		return this.page.locator('.home__section-participate-grid__block').filter({ hasText: 'Incontri' });
	}

	private get debatesBlock() {
		return this.page.locator('.home__section-participate-grid__block').filter({ hasText: 'Dibattiti' });
	}

	private get proposalsBlock() {
		return this.page.locator('.home__section-participate-grid__block').filter({ hasText: 'proposte' });
	}

	private get moreInfoButton() {
		return this.page.locator('#how_to_participate .button');
	}

	// Metodi per verificare la visibilità
	async isParticipationSectionVisible(): Promise<boolean> {
		return await this.participationSection.isVisible();
	}

	async getSectionTitle(): Promise<string> {
		return (await this.sectionTitle.textContent()) || '';
	}

	// Metodi per ottenere informazioni sui blocchi
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

	// Metodi per le azioni
	async clickMoreInfo() {
		await this.moreInfoButton.click();
	}

	async getMoreInfoButtonText(): Promise<string> {
		return (await this.moreInfoButton.textContent()) || '';
	}

	// Metodi per verificare la presenza delle icone
	async hasIcons(): Promise<boolean> {
		const meetingsIcon = await this.meetingsBlock.locator('svg').isVisible();
		const debatesIcon = await this.debatesBlock.locator('svg').isVisible();
		const proposalsIcon = await this.proposalsBlock.locator('svg').isVisible();
		return meetingsIcon && debatesIcon && proposalsIcon;
	}

	// Metodi di utilità
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

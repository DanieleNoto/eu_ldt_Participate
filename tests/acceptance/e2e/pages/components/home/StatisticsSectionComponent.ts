import { Page } from '@playwright/test';

export class StatisticsSectionComponent {
	constructor(private page: Page) {}

	// Selettori per la sezione statistiche
	private get statisticsSection() {
		return this.page.locator('#statistics');
	}

	private get sectionTitle() {
		return this.page.locator('#statistics .home__section-title');
	}

	private get statisticsContainer() {
		return this.page.locator('.statistic__container');
	}

	private get participantsStatistic() {
		return this.page.locator('.statistic.users_count');
	}

	private get participantsTitle() {
		return this.page.locator('.statistic.users_count .statistic__title');
	}

	private get participantsNumber() {
		return this.page.locator('.statistic.users_count .statistic__number');
	}

	// Metodi per verificare la visibilità
	async isStatisticsSectionVisible(): Promise<boolean> {
		return await this.statisticsSection.isVisible();
	}

	async getSectionTitle(): Promise<string> {
		return (await this.sectionTitle.textContent()) || '';
	}

	// Metodi per ottenere le statistiche
	async getParticipantsCount(): Promise<number> {
		const text = (await this.participantsNumber.textContent()) || '0';
		return parseInt(text.trim(), 10) || 0;
	}

	async getParticipantsTitle(): Promise<string> {
		return (await this.participantsTitle.textContent()) || '';
	}

	async isParticipantsStatisticVisible(): Promise<boolean> {
		return await this.participantsStatistic.isVisible();
	}

	// Metodi per ottenere tutte le statistiche disponibili
	async getAllStatistics(): Promise<Array<{ title: string; value: string }>> {
		const statistics = await this.statisticsContainer.locator('.statistic').all();
		const results: Array<{ title: string; value: string }> = [];

		for (const stat of statistics) {
			const title = (await stat.locator('.statistic__title').textContent()) || '';
			const value = (await stat.locator('.statistic__number').textContent()) || '';
			results.push({ title, value });
		}

		return results;
	}

	// Metodi di utilità
	async waitForSectionToLoad() {
		await this.statisticsSection.waitFor({ state: 'visible' });
	}

	async scrollToSection() {
		await this.statisticsSection.scrollIntoViewIfNeeded();
	}

	async getStatisticsCount(): Promise<number> {
		return await this.statisticsContainer.locator('.statistic').count();
	}
}

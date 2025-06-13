import { Page } from '@playwright/test';

/**
 * Component per la card del registro di amministrazione nella dashboard admin.
 * Gestisce la visualizzazione dei log e le azioni correlate.
 */
export class AdminLogsCardComponent {
	constructor(private page: Page) {}

	// Selettori principali
	private get logsCard() {
		return this.page.locator('.card').filter({ hasText: 'Registro di amministrazione' });
	}

	private get cardTitle() {
		return this.logsCard.locator('.card-title');
	}

	private get logsContainer() {
		return this.logsCard.locator('.logs.table');
	}

	private get logEntries() {
		return this.logsContainer.locator('.logs__log');
	}

	private get viewMoreLogsButton() {
		return this.page.locator('a[href*="/admin/logs"]').filter({ hasText: 'Visualizza più registri' });
	}

	// Selettori per i singoli log
	private get logDates() {
		return this.logEntries.locator('.logs__log__date');
	}

	private get logExplanations() {
		return this.logEntries.locator('.logs__log__explanation');
	}

	private get logAuthors() {
		return this.logEntries.locator('.logs__log__author');
	}

	private get logActions() {
		return this.logEntries.locator('.logs__log__actions');
	}

	// Metodi di verifica
	async isLogsCardVisible(): Promise<boolean> {
		return await this.logsCard.isVisible();
	}

	async isLogsContainerVisible(): Promise<boolean> {
		return await this.logsContainer.isVisible();
	}

	async isViewMoreButtonVisible(): Promise<boolean> {
		return await this.viewMoreLogsButton.isVisible();
	}

	async getCardTitle(): Promise<string> {
		return (await this.cardTitle.textContent()) || '';
	}

	// Metodi per i log entries
	async getLogEntriesCount(): Promise<number> {
		return await this.logEntries.count();
	}

	async hasLogEntries(): Promise<boolean> {
		const count = await this.getLogEntriesCount();
		return count > 0;
	}

	// Metodi per ottenere dati dei log
	async getLogDates(): Promise<string[]> {
		const dates = await this.logDates.all();
		const dateTexts: string[] = [];

		for (const date of dates) {
			const text = await date.textContent();
			if (text) {
				dateTexts.push(text.trim());
			}
		}

		return dateTexts;
	}

	async getLogExplanations(): Promise<string[]> {
		const explanations = await this.logExplanations.all();
		const explanationTexts: string[] = [];

		for (const explanation of explanations) {
			const text = await explanation.textContent();
			if (text) {
				explanationTexts.push(text.trim());
			}
		}

		return explanationTexts;
	}

	async getLogAuthors(): Promise<string[]> {
		const authors = await this.logAuthors.all();
		const authorTexts: string[] = [];

		for (const author of authors) {
			const text = await author.textContent();
			if (text) {
				authorTexts.push(text.trim());
			}
		}

		return authorTexts;
	}

	// Metodi per ottenere dati di un log specifico
	async getLogEntryByIndex(index: number): Promise<{
		date: string;
		explanation: string;
		author: string;
	}> {
		const logEntry = this.logEntries.nth(index);

		return {
			date: (await logEntry.locator('.logs__log__date').textContent()) || '',
			explanation: (await logEntry.locator('.logs__log__explanation').textContent()) || '',
			author: (await logEntry.locator('.logs__log__author').textContent()) || ''
		};
	}

	// Metodi per l'interazione
	async clickViewMoreLogs(): Promise<void> {
		await this.viewMoreLogsButton.click();
	}

	async clickLogEntry(index: number): Promise<void> {
		const logEntry = this.logEntries.nth(index);
		await logEntry.click();
	}

	async expandLogEntry(index: number): Promise<void> {
		const logEntry = this.logEntries.nth(index);
		const actionsButton = logEntry.locator('.logs__log__actions-dropdown');

		if (await actionsButton.isVisible()) {
			await actionsButton.click();
		}
	}

	// Metodi per verificare lo stato dei log
	async isLogEntryExpanded(index: number): Promise<boolean> {
		const logEntry = this.logEntries.nth(index);
		const diffPanel = logEntry.locator('.logs__log__diff');

		return await diffPanel.isVisible();
	}

	async hasLogEntryActions(index: number): Promise<boolean> {
		const logEntry = this.logEntries.nth(index);
		const actionsButton = logEntry.locator('.logs__log__actions-dropdown');

		return await actionsButton.isVisible();
	}

	// Metodi per ottenere informazioni specifiche
	async getMostRecentLogDate(): Promise<string> {
		const dates = await this.getLogDates();
		return dates.length > 0 ? dates[0] : '';
	}

	async getMostRecentLogAuthor(): Promise<string> {
		const authors = await this.getLogAuthors();
		return authors.length > 0 ? authors[0] : '';
	}

	async getViewMoreButtonText(): Promise<string> {
		return (await this.viewMoreLogsButton.textContent()) || '';
	}

	// Verifica se la card è completamente caricata
	async isCardFullyLoaded(): Promise<boolean> {
		const cardVisible = await this.isLogsCardVisible();
		const containerVisible = await this.isLogsContainerVisible();
		const buttonVisible = await this.isViewMoreButtonVisible();
		const hasLogs = await this.hasLogEntries();

		return cardVisible && containerVisible && buttonVisible && hasLogs;
	}
}

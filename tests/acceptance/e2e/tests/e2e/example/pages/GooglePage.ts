import { Page } from '@playwright/test';

export class SearchPage {
	readonly page: Page;
	readonly searchInput = 'input[name="q"]';

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Navigate to Google homepage
	 */
	async goto() {
		await this.page.goto('https://www.google.com');
	}

	/**
	 * Perform a search for the given term
	 * @param term - The search query
	 */
	async search(term: string) {
		await this.page.fill(this.searchInput, term);
		await this.page.keyboard.press('Enter');
	}
}

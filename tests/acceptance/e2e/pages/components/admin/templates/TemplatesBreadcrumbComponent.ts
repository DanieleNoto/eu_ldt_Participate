import { Page } from '@playwright/test';

/**
 * Component for the breadcrumb navigation in the Templates area.
 * Manages breadcrumb navigation showing Templates > Questionnaires path.
 */
export class TemplatesBreadcrumbComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get breadcrumbContainer() {
		return this.page.locator('.process-title-content');
	}

	private get homeLink() {
		return this.page.locator('.process-title-content-icon-home');
	}

	private get templatesButton() {
		return this.breadcrumbContainer.locator('a.process-title-content-breadcrumb').filter({ hasText: 'Templates' });
	}

	private get questionnairesButton() {
		return this.breadcrumbContainer
			.locator('a.process-title-content-breadcrumb')
			.filter({ hasText: 'Questionnaires' });
	}

	private get breadcrumbSeparators() {
		return this.breadcrumbContainer.locator('span.text-white');
	}

	// Verification methods
	async isBreadcrumbVisible(): Promise<boolean> {
		return await this.breadcrumbContainer.isVisible();
	}

	async isHomeIconVisible(): Promise<boolean> {
		return await this.homeLink.isVisible();
	}

	async isTemplatesVisible(): Promise<boolean> {
		return await this.templatesButton.isVisible();
	}

	async isQuestionnairesVisible(): Promise<boolean> {
		return await this.questionnairesButton.isVisible();
	}

	// Methods to get text
	async getTemplatesText(): Promise<string> {
		return (await this.templatesButton.textContent()) || '';
	}

	async getQuestionnairesText(): Promise<string> {
		return (await this.questionnairesButton.textContent()) || '';
	}

	async getHomeIconAriaLabel(): Promise<string> {
		return (await this.homeLink.getAttribute('aria-label')) || '';
	}

	// Interaction methods
	async clickHomeIcon(): Promise<void> {
		await this.homeLink.click();
	}

	async clickTemplates(): Promise<void> {
		await this.templatesButton.click();
	}

	async clickQuestionnaires(): Promise<void> {
		await this.questionnairesButton.click();
	}

	// Check breadcrumb path structure
	async getBreadcrumbPath(): Promise<string[]> {
		const path: string[] = [];

		if (await this.isTemplatesVisible()) {
			path.push(await this.getTemplatesText());
		}

		if (await this.isQuestionnairesVisible()) {
			path.push(await this.getQuestionnairesText());
		}

		return path;
	}

	// Get number of breadcrumb separators (should be 2 for "/ Templates / Questionnaires")
	async getSeparatorCount(): Promise<number> {
		return await this.breadcrumbSeparators.count();
	}

	// Check if the breadcrumb is fully loaded
	async isBreadcrumbFullyLoaded(): Promise<boolean> {
		const homeVisible = await this.isHomeIconVisible();
		const templatesVisible = await this.isTemplatesVisible();
		const questionnairesVisible = await this.isQuestionnairesVisible();
		const separatorCount = await this.getSeparatorCount();

		return homeVisible && templatesVisible && questionnairesVisible && separatorCount === 2;
	}
}

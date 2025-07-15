import { Page } from '@playwright/test';

/**
 * Component for the New Template form in the Templates area.
 * Manages template creation form with multilingual name and description fields.
 */
export class NewTemplateFormComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get formContainer() {
		return this.page.locator('.item__edit-form');
	}

	private get form() {
		return this.page.locator('form.new_questionnaire_template');
	}

	private get pageHeader() {
		return this.page.locator('.item_show__header');
	}

	private get pageTitle() {
		return this.pageHeader.locator('.item_show__header-title');
	}

	// Form card
	private get formCard() {
		return this.page.locator('.card.pt-4');
	}

	// Name field selectors
	private get nameLabel() {
		return this.page.locator('label[for="template_name"]');
	}

	private get nameTabsContainer() {
		return this.page.locator('#template-name-tabs');
	}

	private get nameEnglishTab() {
		return this.page.locator('#template-name-tabs-name-panel-0-label');
	}

	private get nameCatalanTab() {
		return this.page.locator('#template-name-tabs-name-panel-1-label');
	}

	private get nameSpanishTab() {
		return this.page.locator('#template-name-tabs-name-panel-2-label');
	}

	private get nameEnglishInput() {
		return this.page.locator('#template_name_en');
	}

	private get nameCatalanInput() {
		return this.page.locator('#template_name_ca');
	}

	private get nameSpanishInput() {
		return this.page.locator('#template_name_es');
	}

	// Description field selectors
	private get descriptionLabel() {
		return this.page.locator('label[for="template_description"]');
	}

	private get descriptionTabsContainer() {
		return this.page.locator('#template-description-tabs');
	}

	private get descriptionEnglishTab() {
		return this.page.locator('#template-description-tabs-description-panel-0-label');
	}

	private get descriptionCatalanTab() {
		return this.page.locator('#template-description-tabs-description-panel-1-label');
	}

	private get descriptionSpanishTab() {
		return this.page.locator('#template-description-tabs-description-panel-2-label');
	}

	private get descriptionEnglishTextarea() {
		return this.page.locator('#template_description_en');
	}

	private get descriptionCatalanTextarea() {
		return this.page.locator('#template_description_ca');
	}

	private get descriptionSpanishTextarea() {
		return this.page.locator('#template_description_es');
	}

	// Save button
	private get saveButton() {
		return this.page.locator('button[type="submit"]').filter({ hasText: 'Save' });
	}

	private get stickyContainer() {
		return this.page.locator('.item__edit-sticky');
	}

	// Required field indicator
	private get requiredFieldIndicator() {
		return this.page.locator('.label-required');
	}

	// Verification methods
	async isFormVisible(): Promise<boolean> {
		return await this.formContainer.isVisible();
	}

	async isPageHeaderVisible(): Promise<boolean> {
		return await this.pageHeader.isVisible();
	}

	async isFormCardVisible(): Promise<boolean> {
		return await this.formCard.isVisible();
	}

	async isSaveButtonVisible(): Promise<boolean> {
		return await this.saveButton.isVisible();
	}

	// Get page title
	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	// Name field interactions
	async isNameFieldVisible(): Promise<boolean> {
		return await this.nameLabel.isVisible();
	}

	async isNameRequiredFieldIndicatorVisible(): Promise<boolean> {
		const nameSection = this.nameLabel.locator('..');
		const requiredIndicator = nameSection.locator('.label-required');
		return await requiredIndicator.isVisible();
	}

	async clickNameEnglishTab(): Promise<void> {
		await this.nameEnglishTab.click();
	}

	async clickNameCatalanTab(): Promise<void> {
		await this.nameCatalanTab.click();
	}

	async clickNameSpanishTab(): Promise<void> {
		await this.nameSpanishTab.click();
	}

	async fillNameEnglish(name: string): Promise<void> {
		await this.nameEnglishInput.fill(name);
	}

	async fillNameCatalan(name: string): Promise<void> {
		await this.nameCatalanInput.fill(name);
	}

	async fillNameSpanish(name: string): Promise<void> {
		await this.nameSpanishInput.fill(name);
	}

	async getNameEnglish(): Promise<string> {
		return (await this.nameEnglishInput.inputValue()) || '';
	}

	async getNameCatalan(): Promise<string> {
		return (await this.nameCatalanInput.inputValue()) || '';
	}

	async getNameSpanish(): Promise<string> {
		return (await this.nameSpanishInput.inputValue()) || '';
	}

	// Description field interactions
	async isDescriptionFieldVisible(): Promise<boolean> {
		return await this.descriptionLabel.isVisible();
	}

	async clickDescriptionEnglishTab(): Promise<void> {
		await this.descriptionEnglishTab.click();
	}

	async clickDescriptionCatalanTab(): Promise<void> {
		await this.descriptionCatalanTab.click();
	}

	async clickDescriptionSpanishTab(): Promise<void> {
		await this.descriptionSpanishTab.click();
	}

	async fillDescriptionEnglish(description: string): Promise<void> {
		await this.descriptionEnglishTextarea.fill(description);
	}

	async fillDescriptionCatalan(description: string): Promise<void> {
		await this.descriptionCatalanTextarea.fill(description);
	}

	async fillDescriptionSpanish(description: string): Promise<void> {
		await this.descriptionSpanishTextarea.fill(description);
	}

	async getDescriptionEnglish(): Promise<string> {
		return (await this.descriptionEnglishTextarea.inputValue()) || '';
	}

	async getDescriptionCatalan(): Promise<string> {
		return (await this.descriptionCatalanTextarea.inputValue()) || '';
	}

	async getDescriptionSpanish(): Promise<string> {
		return (await this.descriptionSpanishTextarea.inputValue()) || '';
	}

	// Form submission
	async clickSave(): Promise<void> {
		await this.saveButton.click();
	}

	async getSaveButtonText(): Promise<string> {
		return (await this.saveButton.textContent()) || '';
	}

	// Check which language tab is active
	async isNameEnglishTabActive(): Promise<boolean> {
		const tab = this.page.locator('#template-name-tabs-name-panel-0');
		return (await tab.getAttribute('aria-hidden')) === 'false';
	}

	async isNameCatalanTabActive(): Promise<boolean> {
		const tab = this.page.locator('#template-name-tabs-name-panel-1');
		return (await tab.getAttribute('aria-hidden')) === 'false';
	}

	async isNameSpanishTabActive(): Promise<boolean> {
		const tab = this.page.locator('#template-name-tabs-name-panel-2');
		return (await tab.getAttribute('aria-hidden')) === 'false';
	}

	async isDescriptionEnglishTabActive(): Promise<boolean> {
		const tab = this.page.locator('#template-description-tabs-description-panel-0');
		return (await tab.getAttribute('aria-hidden')) === 'false';
	}

	async isDescriptionCatalanTabActive(): Promise<boolean> {
		const tab = this.page.locator('#template-description-tabs-description-panel-1');
		return (await tab.getAttribute('aria-hidden')) === 'false';
	}

	async isDescriptionSpanishTabActive(): Promise<boolean> {
		const tab = this.page.locator('#template-description-tabs-description-panel-2');
		return (await tab.getAttribute('aria-hidden')) === 'false';
	}

	// Fill template data for all languages
	async fillTemplateData(data: {
		name: { en?: string; ca?: string; es?: string };
		description?: { en?: string; ca?: string; es?: string };
	}): Promise<void> {
		// Fill name fields
		if (data.name.en) {
			await this.clickNameEnglishTab();
			await this.fillNameEnglish(data.name.en);
		}
		if (data.name.ca) {
			await this.clickNameCatalanTab();
			await this.fillNameCatalan(data.name.ca);
		}
		if (data.name.es) {
			await this.clickNameSpanishTab();
			await this.fillNameSpanish(data.name.es);
		}

		// Fill description fields if provided
		if (data.description) {
			if (data.description.en) {
				await this.clickDescriptionEnglishTab();
				await this.fillDescriptionEnglish(data.description.en);
			}
			if (data.description.ca) {
				await this.clickDescriptionCatalanTab();
				await this.fillDescriptionCatalan(data.description.ca);
			}
			if (data.description.es) {
				await this.clickDescriptionSpanishTab();
				await this.fillDescriptionSpanish(data.description.es);
			}
		}
	}

	// Get all template data
	async getTemplateData(): Promise<{
		name: { en: string; ca: string; es: string };
		description: { en: string; ca: string; es: string };
	}> {
		return {
			name: {
				en: await this.getNameEnglish(),
				ca: await this.getNameCatalan(),
				es: await this.getNameSpanish()
			},
			description: {
				en: await this.getDescriptionEnglish(),
				ca: await this.getDescriptionCatalan(),
				es: await this.getDescriptionSpanish()
			}
		};
	}

	// Validation methods
	async isFormValid(): Promise<boolean> {
		// At minimum, English name is required
		const englishName = await this.getNameEnglish();
		return englishName.trim().length > 0;
	}

	// Check if form is fully loaded
	async isFormFullyLoaded(): Promise<boolean> {
		const formVisible = await this.isFormVisible();
		const headerVisible = await this.isPageHeaderVisible();
		const cardVisible = await this.isFormCardVisible();
		const saveVisible = await this.isSaveButtonVisible();
		const nameVisible = await this.isNameFieldVisible();
		const descriptionVisible = await this.isDescriptionFieldVisible();

		return formVisible && headerVisible && cardVisible && saveVisible && nameVisible && descriptionVisible;
	}
}

import { Page } from '@playwright/test';

/**
 * Component for the Edit Template form and questionnaire management.
 * Manages template editing form with multilingual fields and questionnaire preview/management.
 */
export class EditTemplateFormComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get formContainer() {
		return this.page.locator('.item__edit-form');
	}

	private get form() {
		return this.page.locator('form.edit_questionnaire_template');
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

	// Name field selectors (same as new template)
	private get nameLabel() {
		return this.page.locator('label[for="template_name"]');
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

	// Description field selectors (same as new template)
	private get descriptionLabel() {
		return this.page.locator('label[for="template_description"]');
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

	// Questionnaire management section
	private get questionnaireCard() {
		return this.page.locator('.card.mt-4');
	}

	private get questionnaireHeader() {
		return this.questionnaireCard.locator('.card-divider h2');
	}

	private get editQuestionnaireButton() {
		return this.page.locator('a[href*="/questionnaire/edit"]').filter({ hasText: 'Edit' });
	}

	private get manageQuestionsButton() {
		return this.page.locator('a[href*="/edit_questions"]').filter({ hasText: 'Manage questions' });
	}

	private get questionnairePreview() {
		return this.page.locator('.questionnaire-template-preview');
	}

	private get noQuestionsMessage() {
		return this.questionnairePreview.locator('.row.columns.pb-4');
	}

	// Verification methods
	async isFormVisible(): Promise<boolean> {
		return await this.formContainer.isVisible();
	}

	async isPageHeaderVisible(): Promise<boolean> {
		return await this.pageHeader.isVisible();
	}

	async isQuestionnaireCardVisible(): Promise<boolean> {
		return await this.questionnaireCard.isVisible();
	}

	async isSaveButtonVisible(): Promise<boolean> {
		return await this.saveButton.isVisible();
	}

	// Get page title
	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	// Name field interactions (same as new template)
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

	// Description field interactions (same as new template)
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

	// Questionnaire management interactions
	async isEditQuestionnaireButtonVisible(): Promise<boolean> {
		return await this.editQuestionnaireButton.isVisible();
	}

	async isManageQuestionsButtonVisible(): Promise<boolean> {
		return await this.manageQuestionsButton.isVisible();
	}

	async clickEditQuestionnaire(): Promise<void> {
		await this.editQuestionnaireButton.click();
	}

	async clickManageQuestions(): Promise<void> {
		await this.manageQuestionsButton.click();
	}

	async getEditQuestionnaireButtonText(): Promise<string> {
		return (await this.editQuestionnaireButton.textContent()) || '';
	}

	async getManageQuestionsButtonText(): Promise<string> {
		return (await this.manageQuestionsButton.textContent()) || '';
	}

	// Questionnaire status
	async hasQuestions(): Promise<boolean> {
		const noQuestionsText = await this.noQuestionsMessage.textContent();
		return !noQuestionsText?.includes('There are no questions yet');
	}

	async getNoQuestionsMessage(): Promise<string> {
		return (await this.noQuestionsMessage.textContent()) || '';
	}

	async getQuestionnaireHeaderText(): Promise<string> {
		return (await this.questionnaireHeader.textContent()) || '';
	}

	// Update template data for all languages
	async updateTemplateData(data: {
		name?: { en?: string; ca?: string; es?: string };
		description?: { en?: string; ca?: string; es?: string };
	}): Promise<void> {
		// Update name fields if provided
		if (data.name) {
			if (data.name.en !== undefined) {
				await this.fillNameEnglish(data.name.en);
			}
			if (data.name.ca !== undefined) {
				await this.fillNameCatalan(data.name.ca);
			}
			if (data.name.es !== undefined) {
				await this.fillNameSpanish(data.name.es);
			}
		}

		// Update description fields if provided
		if (data.description) {
			if (data.description.en !== undefined) {
				await this.fillDescriptionEnglish(data.description.en);
			}
			if (data.description.ca !== undefined) {
				await this.fillDescriptionCatalan(data.description.ca);
			}
			if (data.description.es !== undefined) {
				await this.fillDescriptionSpanish(data.description.es);
			}
		}
	}

	// Get all current template data
	async getCurrentTemplateData(): Promise<{
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
		const questionnaireCardVisible = await this.isQuestionnaireCardVisible();
		const saveVisible = await this.isSaveButtonVisible();
		const editButtonVisible = await this.isEditQuestionnaireButtonVisible();
		const manageButtonVisible = await this.isManageQuestionsButtonVisible();

		return (
			formVisible &&
			headerVisible &&
			questionnaireCardVisible &&
			saveVisible &&
			editButtonVisible &&
			manageButtonVisible
		);
	}

	// Get template ID from form action
	async getTemplateId(): Promise<string> {
		const formAction = await this.form.getAttribute('action');
		const match = formAction?.match(/\/templates\/questionnaire_templates\/(\d+)/);
		return match?.[1] || '';
	}

	// Check if this is an edit form (vs new form)
	async isEditForm(): Promise<boolean> {
		const pageTitle = await this.getPageTitle();
		return pageTitle.includes('Edit questionnaire template');
	}
}

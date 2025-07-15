import { Page } from '@playwright/test';

/**
 * Component for the Questionnaire Templates list view.
 * Manages the table listing templates with actions like edit, duplicate, and delete.
 */
export class QuestionnaireTemplatesListComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get listCard() {
		return this.page.locator('.card');
	}

	private get headerSection() {
		return this.page.locator('.item_show__header');
	}

	private get pageTitle() {
		return this.headerSection.locator('.item_show__header-title');
	}

	private get newTemplateButton() {
		return this.page.locator('a.button.new[href*="/admin/templates/questionnaire_templates/new"]');
	}

	private get templatesTable() {
		return this.page.locator('.table-list.questionnaire-templates');
	}

	private get tableHeaders() {
		return this.templatesTable.locator('thead th');
	}

	private get tableRows() {
		return this.templatesTable.locator('tbody tr[data-questionnaire_template-id]');
	}

	// Verification methods
	async isListVisible(): Promise<boolean> {
		return await this.listCard.isVisible();
	}

	async isHeaderVisible(): Promise<boolean> {
		return await this.headerSection.isVisible();
	}

	async isTableVisible(): Promise<boolean> {
		return await this.templatesTable.isVisible();
	}

	async isNewTemplateButtonVisible(): Promise<boolean> {
		return await this.newTemplateButton.isVisible();
	}

	// Header methods
	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	async getNewTemplateButtonText(): Promise<string> {
		return (await this.newTemplateButton.textContent()) || '';
	}

	// Table structure methods
	async getTableHeaders(): Promise<string[]> {
		const headers = await this.tableHeaders.all();
		const headerTexts: string[] = [];

		for (const header of headers) {
			const text = await header.textContent();
			if (text?.trim()) {
				headerTexts.push(text.trim());
			}
		}

		return headerTexts;
	}

	async getTemplateCount(): Promise<number> {
		return await this.tableRows.count();
	}

	async hasTemplates(): Promise<boolean> {
		const count = await this.getTemplateCount();
		return count > 0;
	}

	// Template row methods
	async getTemplateDataByIndex(index: number): Promise<{
		id: string;
		templateName: string;
		questionnaireTitle: string;
		numberOfQuestions: string;
		createdAt: string;
	}> {
		const row = this.tableRows.nth(index);
		const cells = row.locator('td');

		return {
			id: (await row.getAttribute('data-questionnaire_template-id')) || '',
			templateName: (await cells.nth(0).textContent()) || '',
			questionnaireTitle: (await cells.nth(1).textContent()) || '',
			numberOfQuestions: (await cells.nth(2).textContent()) || '',
			createdAt: (await cells.nth(3).textContent()) || ''
		};
	}

	async getAllTemplatesData(): Promise<
		Array<{
			id: string;
			templateName: string;
			questionnaireTitle: string;
			numberOfQuestions: string;
			createdAt: string;
		}>
	> {
		const count = await this.getTemplateCount();
		const templates = [];

		for (let i = 0; i < count; i++) {
			templates.push(await this.getTemplateDataByIndex(i));
		}

		return templates;
	}

	// Template actions methods
	async editTemplate(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const editButton = row.locator('a.action-icon.edit');
		await editButton.click();
	}

	async editTemplateById(templateId: string): Promise<void> {
		const row = this.page.locator(`tr[data-questionnaire_template-id="${templateId}"]`);
		const editButton = row.locator('a.action-icon.edit');
		await editButton.click();
	}

	async duplicateTemplate(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const duplicateButton = row.locator('a[href*="/copy"]');
		await duplicateButton.click();
	}

	async duplicateTemplateById(templateId: string): Promise<void> {
		const row = this.page.locator(`tr[data-questionnaire_template-id="${templateId}"]`);
		const duplicateButton = row.locator('a[href*="/copy"]');
		await duplicateButton.click();
	}

	async deleteTemplate(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const deleteButton = row.locator('a.action-icon--remove');
		await deleteButton.click();
	}

	async deleteTemplateById(templateId: string): Promise<void> {
		const row = this.page.locator(`tr[data-questionnaire_template-id="${templateId}"]`);
		const deleteButton = row.locator('a.action-icon--remove');
		await deleteButton.click();
	}

	// Template link navigation
	async clickTemplateNameLink(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const templateLink = row.locator('td:first-child a');
		await templateLink.click();
	}

	async clickQuestionnaireLink(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const questionnaireLink = row.locator('td:nth-child(2) a');
		await questionnaireLink.click();
	}

	// Search for templates
	async findTemplateByName(templateName: string): Promise<number> {
		const count = await this.getTemplateCount();

		for (let i = 0; i < count; i++) {
			const data = await this.getTemplateDataByIndex(i);
			if (data.templateName.includes(templateName)) {
				return i;
			}
		}

		return -1; // Not found
	}

	async findTemplateById(templateId: string): Promise<number> {
		const count = await this.getTemplateCount();

		for (let i = 0; i < count; i++) {
			const data = await this.getTemplateDataByIndex(i);
			if (data.id === templateId) {
				return i;
			}
		}

		return -1; // Not found
	}

	// Action button availability checks
	async isEditButtonVisibleForTemplate(index: number): Promise<boolean> {
		const row = this.tableRows.nth(index);
		const editButton = row.locator('a.action-icon.edit');
		return await editButton.isVisible();
	}

	async isDuplicateButtonVisibleForTemplate(index: number): Promise<boolean> {
		const row = this.tableRows.nth(index);
		const duplicateButton = row.locator('a[href*="/copy"]');
		return await duplicateButton.isVisible();
	}

	async isDeleteButtonVisibleForTemplate(index: number): Promise<boolean> {
		const row = this.tableRows.nth(index);
		const deleteButton = row.locator('a.action-icon--remove');
		return await deleteButton.isVisible();
	}

	// Interaction methods
	async clickNewTemplate(): Promise<void> {
		await this.newTemplateButton.click();
	}

	// Check if the component is fully loaded
	async isComponentFullyLoaded(): Promise<boolean> {
		const listVisible = await this.isListVisible();
		const headerVisible = await this.isHeaderVisible();
		const tableVisible = await this.isTableVisible();
		const buttonVisible = await this.isNewTemplateButtonVisible();

		return listVisible && headerVisible && tableVisible && buttonVisible;
	}
}

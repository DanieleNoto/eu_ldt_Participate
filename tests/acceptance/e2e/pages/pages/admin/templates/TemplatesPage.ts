import { Page } from '@playwright/test';
import { TemplatesBreadcrumbComponent } from '../../../components/admin/templates/TemplatesBreadcrumbComponent';
import { TemplatesSidebarComponent } from '../../../components/admin/templates/TemplatesSidebarComponent';
import { QuestionnaireTemplatesListComponent } from '../../../components/admin/templates/QuestionnaireTemplatesListComponent';

/**
 * Main page object for the Templates section in the admin area.
 * Combines all template-related components for easy access in tests.
 */
export class TemplatesPage {
	public readonly breadcrumb: TemplatesBreadcrumbComponent;
	public readonly sidebar: TemplatesSidebarComponent;
	public readonly questionnairesList: QuestionnaireTemplatesListComponent;

	constructor(private page: Page) {
		this.breadcrumb = new TemplatesBreadcrumbComponent(page);
		this.sidebar = new TemplatesSidebarComponent(page);
		this.questionnairesList = new QuestionnaireTemplatesListComponent(page);
	}

	// Page navigation
	async navigateToTemplates(): Promise<void> {
		await this.page.goto('/admin/templates/questionnaire_templates');
	}

	// Wait for page to load
	async waitForPageToLoad(): Promise<void> {
		await this.page.waitForSelector('.sidebar-menu__container');
		await this.page.waitForSelector('.item_show__header');
		await this.page.waitForSelector('.table-list.questionnaire-templates');
	}

	// Check if the entire page is loaded
	async isPageFullyLoaded(): Promise<boolean> {
		const breadcrumbLoaded = await this.breadcrumb.isBreadcrumbFullyLoaded();
		const sidebarLoaded = await this.sidebar.isSidebarFullyLoaded();
		const listLoaded = await this.questionnairesList.isComponentFullyLoaded();

		return breadcrumbLoaded && sidebarLoaded && listLoaded;
	}

	// Get current page title from the header
	async getPageTitle(): Promise<string> {
		return await this.questionnairesList.getPageTitle();
	}

	// Check if we're on the questionnaires templates page
	async isOnQuestionnairesPage(): Promise<boolean> {
		const isQuestionnairesActive = await this.sidebar.isQuestionnairesActive();
		const hasQuestionnairesInBreadcrumb = await this.breadcrumb.isQuestionnairesVisible();

		return isQuestionnairesActive && hasQuestionnairesInBreadcrumb;
	}

	// Quick actions
	async createNewTemplate(): Promise<void> {
		await this.questionnairesList.clickNewTemplate();
	}

	async getTemplatesCount(): Promise<number> {
		return await this.questionnairesList.getTemplateCount();
	}

	// Get template data by index
	async getTemplateByIndex(index: number) {
		return await this.questionnairesList.getTemplateDataByIndex(index);
	}

	// Template actions
	async editTemplate(templateName: string): Promise<void> {
		const index = await this.questionnairesList.findTemplateByName(templateName);
		if (index >= 0) {
			await this.questionnairesList.editTemplate(index);
		}
	}

	async duplicateTemplate(templateName: string): Promise<void> {
		const index = await this.questionnairesList.findTemplateByName(templateName);
		if (index >= 0) {
			await this.questionnairesList.duplicateTemplate(index);
		}
	}

	async deleteTemplate(templateName: string): Promise<void> {
		const index = await this.questionnairesList.findTemplateByName(templateName);
		if (index >= 0) {
			await this.questionnairesList.deleteTemplate(index);
		}
	}
}

import { Page } from '@playwright/test';
import { TemplatesBreadcrumbComponent } from '../../../components/admin/templates/TemplatesBreadcrumbComponent';
import { TemplatesSidebarComponent } from '../../../components/admin/templates/TemplatesSidebarComponent';
import { EditTemplateFormComponent } from '../../../components/admin/templates/EditTemplateFormComponent';
import { FlashMessageComponent } from '../../../components/admin/FlashMessageComponent';

/**
 * Page object for the Edit Template page.
 * Combines breadcrumb, sidebar, form, and flash message components for template editing workflow.
 */
export class EditTemplatePage {
	public readonly breadcrumb: TemplatesBreadcrumbComponent;
	public readonly sidebar: TemplatesSidebarComponent;
	public readonly form: EditTemplateFormComponent;
	public readonly flashMessage: FlashMessageComponent;

	constructor(private page: Page) {
		this.breadcrumb = new TemplatesBreadcrumbComponent(page);
		this.sidebar = new TemplatesSidebarComponent(page);
		this.form = new EditTemplateFormComponent(page);
		this.flashMessage = new FlashMessageComponent(page);
	}

	// Page navigation
	async navigateToEditTemplate(templateId: string): Promise<void> {
		await this.page.goto(`/admin/templates/questionnaire_templates/${templateId}/edit`);
	}

	// Wait for page to load
	async waitForPageToLoad(): Promise<void> {
		await this.page.waitForSelector('.item__edit-form');
		await this.page.waitForSelector('.sidebar-menu__container');
		await this.page.waitForSelector('#template_name_en');
		await this.page.waitForSelector('.card.mt-4'); // questionnaire card
	}

	// Check if the entire page is loaded
	async isPageFullyLoaded(): Promise<boolean> {
		const breadcrumbLoaded = await this.breadcrumb.isBreadcrumbFullyLoaded();
		const sidebarLoaded = await this.sidebar.isSidebarFullyLoaded();
		const formLoaded = await this.form.isFormFullyLoaded();

		return breadcrumbLoaded && sidebarLoaded && formLoaded;
	}

	// Get page title
	async getPageTitle(): Promise<string> {
		return await this.form.getPageTitle();
	}

	// Update template with new data
	async updateTemplate(templateData: {
		name?: { en?: string; ca?: string; es?: string };
		description?: { en?: string; ca?: string; es?: string };
	}): Promise<void> {
		await this.form.updateTemplateData(templateData);
		await this.form.clickSave();
	}

	// Update template and wait for success confirmation
	async updateTemplateAndWaitForSuccess(templateData: {
		name?: { en?: string; ca?: string; es?: string };
		description?: { en?: string; ca?: string; es?: string };
	}): Promise<void> {
		await this.form.updateTemplateData(templateData);
		await this.form.clickSave();
		await this.flashMessage.waitForTemplateUpdatedSuccess();
	}

	// Get current template data
	async getCurrentTemplateData(): Promise<{
		name: { en: string; ca: string; es: string };
		description: { en: string; ca: string; es: string };
	}> {
		return await this.form.getCurrentTemplateData();
	}

	// Get template ID
	async getTemplateId(): Promise<string> {
		return await this.form.getTemplateId();
	}

	// Questionnaire management actions
	async editQuestionnaire(): Promise<void> {
		await this.form.clickEditQuestionnaire();
	}

	async manageQuestions(): Promise<void> {
		await this.form.clickManageQuestions();
	}

	// Check questionnaire status
	async hasQuestions(): Promise<boolean> {
		return await this.form.hasQuestions();
	}

	async getNoQuestionsMessage(): Promise<string> {
		return await this.form.getNoQuestionsMessage();
	}

	// Flash message verification
	async isTemplateUpdatedSuccessfully(): Promise<boolean> {
		return await this.flashMessage.isTemplateUpdatedSuccessVisible();
	}

	async getSuccessMessage(): Promise<string> {
		return await this.flashMessage.getSuccessMessageText();
	}

	async dismissSuccessMessage(): Promise<void> {
		await this.flashMessage.closeFlashMessage();
	}

	// Form validation
	async isFormReadyToSubmit(): Promise<boolean> {
		return await this.form.isFormValid();
	}

	// Check if we're on the edit template page
	async isOnEditTemplatePage(): Promise<boolean> {
		const pageTitle = await this.getPageTitle();
		const isEditForm = await this.form.isEditForm();
		const isQuestionnairesActive = await this.sidebar.isQuestionnairesActive();
		const hasTemplatesInBreadcrumb = await this.breadcrumb.isTemplatesVisible();

		return (
			pageTitle.includes('Edit questionnaire template') &&
			isEditForm &&
			isQuestionnairesActive &&
			hasTemplatesInBreadcrumb
		);
	}

	// Navigation methods
	async goBackToTemplatesList(): Promise<void> {
		await this.breadcrumb.clickQuestionnaires();
	}

	async goToTemplatesHome(): Promise<void> {
		await this.breadcrumb.clickTemplates();
	}

	async goToAdminDashboard(): Promise<void> {
		await this.breadcrumb.clickHomeIcon();
	}

	// Check if questionnaire management buttons are available
	async canEditQuestionnaire(): Promise<boolean> {
		return await this.form.isEditQuestionnaireButtonVisible();
	}

	async canManageQuestions(): Promise<boolean> {
		return await this.form.isManageQuestionsButtonVisible();
	}

	// Update only template name (most common operation)
	async updateTemplateName(englishName: string): Promise<void> {
		await this.form.fillNameEnglish(englishName);
		await this.form.clickSave();
	}

	async updateTemplateNameAndWaitForSuccess(englishName: string): Promise<void> {
		await this.form.fillNameEnglish(englishName);
		await this.form.clickSave();
		await this.flashMessage.waitForTemplateUpdatedSuccess();
	}

	// Update only template description
	async updateTemplateDescription(englishDescription: string): Promise<void> {
		await this.form.fillDescriptionEnglish(englishDescription);
		await this.form.clickSave();
	}

	async updateTemplateDescriptionAndWaitForSuccess(englishDescription: string): Promise<void> {
		await this.form.fillDescriptionEnglish(englishDescription);
		await this.form.clickSave();
		await this.flashMessage.waitForTemplateUpdatedSuccess();
	}
}

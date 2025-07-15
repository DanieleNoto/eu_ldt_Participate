import { Page } from '@playwright/test';
import { TemplatesBreadcrumbComponent } from '../../../components/admin/templates/TemplatesBreadcrumbComponent';
import { TemplatesSidebarComponent } from '../../../components/admin/templates/TemplatesSidebarComponent';
import { NewTemplateFormComponent } from '../../../components/admin/templates/NewTemplateFormComponent';

/**
 * Page object for the New Template creation page.
 * Combines breadcrumb, sidebar, and form components for template creation workflow.
 */
export class NewTemplatePage {
	public readonly breadcrumb: TemplatesBreadcrumbComponent;
	public readonly sidebar: TemplatesSidebarComponent;
	public readonly form: NewTemplateFormComponent;

	constructor(private page: Page) {
		this.breadcrumb = new TemplatesBreadcrumbComponent(page);
		this.sidebar = new TemplatesSidebarComponent(page);
		this.form = new NewTemplateFormComponent(page);
	}

	// Page navigation
	async navigateToNewTemplate(): Promise<void> {
		await this.page.goto('/admin/templates/questionnaire_templates/new');
	}

	// Wait for page to load
	async waitForPageToLoad(): Promise<void> {
		await this.page.waitForSelector('.item__edit-form');
		await this.page.waitForSelector('.sidebar-menu__container');
		await this.page.waitForSelector('#template_name_en');
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

	// Quick template creation with minimal data
	async createTemplate(templateData: {
		name: { en: string; ca?: string; es?: string };
		description?: { en?: string; ca?: string; es?: string };
	}): Promise<void> {
		await this.form.fillTemplateData(templateData);
		await this.form.clickSave();
	}

	// Create template with English name only (minimum required)
	async createSimpleTemplate(englishName: string): Promise<void> {
		await this.form.fillNameEnglish(englishName);
		await this.form.clickSave();
	}

	// Validate form before submission
	async isFormReadyToSubmit(): Promise<boolean> {
		return await this.form.isFormValid();
	}

	// Check if we're on the new template page
	async isOnNewTemplatePage(): Promise<boolean> {
		const pageTitle = await this.getPageTitle();
		const isQuestionnairesActive = await this.sidebar.isQuestionnairesActive();
		const hasTemplatesInBreadcrumb = await this.breadcrumb.isTemplatesVisible();

		return pageTitle.includes('New questionnaire template') && isQuestionnairesActive && hasTemplatesInBreadcrumb;
	}

	// Cancel and go back to templates list
	async goBackToTemplatesList(): Promise<void> {
		await this.breadcrumb.clickQuestionnaires();
	}

	// Go to templates home
	async goToTemplatesHome(): Promise<void> {
		await this.breadcrumb.clickTemplates();
	}

	// Go to admin dashboard
	async goToAdminDashboard(): Promise<void> {
		await this.breadcrumb.clickHomeIcon();
	}
}

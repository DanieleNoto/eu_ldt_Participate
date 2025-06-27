import { expect, Locator, Page } from '@playwright/test';
import { SidebarProcessDetailComponent } from '../../../../components/admin/process/detail/SidebarProcessDetailComponent';
import { BaseAdminPage } from '../../BaseAdminPage';

/**
 * Page Object Model for updating Decidim admin participatory processes.
 * Handles form interactions and validation for process updates.
 */
export class UpdateProcessAdminPage extends BaseAdminPage {
	// Sidebar component
	public readonly sidebarProcessDetail: SidebarProcessDetailComponent;

	// Form elements
	private readonly titleInput: Locator;
	private readonly subtitleInput: Locator;
	private readonly shortDescriptionTextarea: Locator;
	private readonly descriptionTextarea: Locator;
	private readonly slugInput: Locator;
	private readonly hashtagInput: Locator;
	private readonly startDateInput: Locator;
	private readonly endDateInput: Locator;
	private readonly heroImageInput: Locator;
	private readonly bannerImageInput: Locator;
	private readonly publishedCheckbox: Locator;
	private readonly announcementTextarea: Locator;
	private readonly saveButton: Locator;
	private readonly cancelButton: Locator;

	// Status and validation elements
	private readonly errorMessages: Locator;
	private readonly successMessage: Locator;
	private readonly requiredFields: Locator;
	private readonly formValidationAlert: Locator;

	constructor(page: Page) {
		super(page);

		// Initialize sidebar component
		this.sidebarProcessDetail = new SidebarProcessDetailComponent(page);

		// Initialize form elements
		this.titleInput = page.locator('input[name*="title"]').first();
		this.subtitleInput = page.locator('input[name*="subtitle"]').first();
		this.shortDescriptionTextarea = page.locator('textarea[name*="short_description"]').first();
		this.descriptionTextarea = page.locator('textarea[name*="description"]').first();
		this.slugInput = page.locator('input[name*="slug"]');
		this.hashtagInput = page.locator('input[name*="hashtag"]');
		this.startDateInput = page.locator('input[name*="start_date"]');
		this.endDateInput = page.locator('input[name*="end_date"]');
		this.heroImageInput = page.locator('input[type="file"][name*="hero_image"]');
		this.bannerImageInput = page.locator('input[type="file"][name*="banner_image"]');
		this.publishedCheckbox = page.locator('input[type="checkbox"][name*="published"]');
		this.announcementTextarea = page.locator('textarea[name*="announcement"]');
		this.saveButton = page.locator('button[type="submit"], input[type="submit"]').first();
		this.cancelButton = page.getByRole('link', { name: /cancel|annulla/i });

		// Status and validation elements
		this.errorMessages = page.locator('.alert-danger, .error, .invalid-feedback');
		this.successMessage = page.locator('.alert-success, .success');
		this.requiredFields = page.locator('.required, [required]');
		this.formValidationAlert = page.locator('.alert, .notification');
	}

	// Navigation methods
	async navigateToUpdateProcess(processId: string) {
		const url = `/admin/participatory_processes/${processId}/edit`;
		await this.page.goto(url);
		await this.waitForUpdateProcessPageLoad();
	}

	async navigateToUpdateProcessBySlug(slug: string) {
		// First navigate to processes list to find the process
		await this.page.goto('/admin/participatory_processes');
		await this.page.getByRole('link', { name: slug }).first().click();
		await this.page.getByRole('link', { name: /edit|modifica/i }).click();
		await this.waitForUpdateProcessPageLoad();
	}

	// Sidebar navigation methods (using the component)
	async navigateToLandingPage() {
		await this.sidebarProcessDetail.navigateToLandingPage();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/landing_page\/edit/);
	}

	async navigateToPhases() {
		await this.sidebarProcessDetail.navigateToPhases();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/steps/);
	}

	async navigateToComponents() {
		await this.sidebarProcessDetail.navigateToComponents();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/components/);
	}

	async navigateToCategories() {
		await this.sidebarProcessDetail.navigateToCategories();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/categories/);
	}

	async navigateToAttachments() {
		await this.sidebarProcessDetail.navigateToAttachments();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/attachments/);
	}

	async navigateToProcessAdmins() {
		await this.sidebarProcessDetail.navigateToProcessAdmins();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/user_roles/);
	}

	async navigateToModerations() {
		await this.sidebarProcessDetail.navigateToModerations();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/moderations/);
	}

	async navigateToPrivateParticipants() {
		await this.sidebarProcessDetail.navigateToPrivateParticipants();
		await this.page.waitForURL(/\/admin\/participatory_processes\/.*\/participatory_space_private_users/);
	}

	// Page state validation
	async waitForUpdateProcessPageLoad() {
		await this.page.waitForSelector('form[data-remote="true"], form[action*="participatory_processes"]');
		await this.page.waitForLoadState('networkidle');
	}

	async isOnUpdateProcessPage(): Promise<boolean> {
		const url = this.page.url();
		return url.includes('/admin/participatory_processes/') && url.includes('/edit');
	}

	async isFormValid(): Promise<boolean> {
		const errorCount = await this.errorMessages.count();
		return errorCount === 0;
	}

	// Form interaction methods
	async fillTitle(title: string, locale: string = 'en') {
		const titleSelector =
			locale === 'en' ? this.titleInput : this.page.locator(`input[name*="title_${locale}"]`).first();

		await titleSelector.clear();
		await titleSelector.fill(title);
	}

	async fillSubtitle(subtitle: string, locale: string = 'en') {
		const subtitleSelector =
			locale === 'en' ? this.subtitleInput : this.page.locator(`input[name*="subtitle_${locale}"]`).first();

		await subtitleSelector.clear();
		await subtitleSelector.fill(subtitle);
	}

	async fillShortDescription(description: string, locale: string = 'en') {
		const descSelector =
			locale === 'en'
				? this.shortDescriptionTextarea
				: this.page.locator(`textarea[name*="short_description_${locale}"]`).first();

		await descSelector.clear();
		await descSelector.fill(description);
	}

	async fillDescription(description: string, locale: string = 'en') {
		const descSelector =
			locale === 'en'
				? this.descriptionTextarea
				: this.page.locator(`textarea[name*="description_${locale}"]`).first();

		await descSelector.clear();
		await descSelector.fill(description);
	}

	async fillSlug(slug: string) {
		await this.slugInput.clear();
		await this.slugInput.fill(slug);
	}

	async fillHashtag(hashtag: string) {
		// Remove # if included
		const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
		await this.hashtagInput.clear();
		await this.hashtagInput.fill(cleanHashtag);
	}

	async setStartDate(date: string) {
		await this.startDateInput.clear();
		await this.startDateInput.fill(date);
	}

	async setEndDate(date: string) {
		await this.endDateInput.clear();
		await this.endDateInput.fill(date);
	}

	async uploadHeroImage(imagePath: string) {
		await this.heroImageInput.setInputFiles(imagePath);
	}

	async uploadBannerImage(imagePath: string) {
		await this.bannerImageInput.setInputFiles(imagePath);
	}

	async setPublished(published: boolean) {
		const isChecked = await this.publishedCheckbox.isChecked();
		if (published !== isChecked) {
			await this.publishedCheckbox.click();
		}
	}

	async fillAnnouncement(announcement: string, locale: string = 'en') {
		const announcementSelector =
			locale === 'en' ? this.announcementTextarea : this.page.locator(`textarea[name*="announcement_${locale}"]`);

		await announcementSelector.clear();
		await announcementSelector.fill(announcement);
	}

	// Form submission and validation
	async saveProcess() {
		await this.saveButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async clickSaveButton() {
		await this.saveButton.click();
	}

	async cancelUpdate() {
		await this.cancelButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async saveAndExpectSuccess() {
		await this.saveProcess();
		await expect(this.successMessage).toBeVisible({ timeout: 10000 });
	}

	async saveAndExpectError() {
		await this.saveProcess();
		await expect(this.errorMessages.first()).toBeVisible({ timeout: 5000 });
	}

	// Validation methods
	async getErrorMessages(): Promise<string[]> {
		const errors = await this.errorMessages.allTextContents();
		return errors.filter(error => error.trim().length > 0);
	}

	async getSuccessMessage(): Promise<string> {
		return (await this.successMessage.textContent()) || '';
	}

	async getFieldValue(fieldName: string): Promise<string> {
		const field = this.page.locator(`input[name*="${fieldName}"], textarea[name*="${fieldName}"]`).first();
		return await field.inputValue();
	}

	async isFieldRequired(fieldName: string): Promise<boolean> {
		const field = this.page.locator(`input[name*="${fieldName}"], textarea[name*="${fieldName}"]`).first();
		return (await field.getAttribute('required')) !== null;
	}

	// Comprehensive update method
	async updateProcess(processData: {
		title?: string;
		subtitle?: string;
		shortDescription?: string;
		description?: string;
		slug?: string;
		hashtag?: string;
		startDate?: string;
		endDate?: string;
		heroImage?: string;
		bannerImage?: string;
		published?: boolean;
		announcement?: string;
		locale?: string;
	}) {
		const { locale = 'en' } = processData;

		if (processData.title) {
			await this.fillTitle(processData.title, locale);
		}

		if (processData.subtitle) {
			await this.fillSubtitle(processData.subtitle, locale);
		}

		if (processData.shortDescription) {
			await this.fillShortDescription(processData.shortDescription, locale);
		}

		if (processData.description) {
			await this.fillDescription(processData.description, locale);
		}

		if (processData.slug) {
			await this.fillSlug(processData.slug);
		}

		if (processData.hashtag) {
			await this.fillHashtag(processData.hashtag);
		}

		if (processData.startDate) {
			await this.setStartDate(processData.startDate);
		}

		if (processData.endDate) {
			await this.setEndDate(processData.endDate);
		}

		if (processData.heroImage) {
			await this.uploadHeroImage(processData.heroImage);
		}

		if (processData.bannerImage) {
			await this.uploadBannerImage(processData.bannerImage);
		}

		if (processData.published !== undefined) {
			await this.setPublished(processData.published);
		}

		if (processData.announcement) {
			await this.fillAnnouncement(processData.announcement, locale);
		}
	}

	// URL validation methods
	async expectToBeOnUpdateProcessPage() {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes\/.*\/edit/);
	}

	async expectProcessUpdatedSuccessfully() {
		await expect(this.successMessage).toBeVisible();
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes$/);
	}

	// Debug and utility methods
	async debugFormState() {
		console.log('=== Form Debug State ===');
		console.log('URL:', this.page.url());
		console.log('Title:', await this.getFieldValue('title'));
		console.log('Slug:', await this.getFieldValue('slug'));
		console.log('Published:', await this.publishedCheckbox.isChecked());
		console.log('Errors:', await this.getErrorMessages());
		console.log('========================');
	}
}

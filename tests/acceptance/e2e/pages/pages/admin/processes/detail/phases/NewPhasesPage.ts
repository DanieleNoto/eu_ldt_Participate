import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { expect, Locator, Page } from '@playwright/test';

export class NewPhasePage extends BaseAdminPage {
	public readonly sidebar: SidebarProcessDetailComponent;

	// Form elements
	private readonly titleInput: Locator;
	private readonly descriptionEditor: Locator;

	private readonly startDateInput: Locator;
	private readonly startTimeInput: Locator;
	private readonly endDateInput: Locator;
	private readonly endTimeInput: Locator;
	private readonly ctaPathInput: Locator;
	private readonly ctaTextInput: Locator;
	private readonly createPhaseButton: Locator;

	constructor(page: Page) {
		super(page);
		this.sidebar = new SidebarProcessDetailComponent(page);

		// Initialize locators based on the HTML structure
		this.titleInput = this.page.locator('#participatory_process_step_title_en');
		this.descriptionEditor = this.page.locator('#participatory_process_step_description_en .tiptap.ProseMirror');

		this.startDateInput = this.page.locator('#participatory_process_step_start_date_date');
		this.startTimeInput = this.page.locator('#participatory_process_step_start_date_time');
		this.endDateInput = this.page.locator('#participatory_process_step_end_date_date');
		this.endTimeInput = this.page.locator('#participatory_process_step_end_date_time');
		this.ctaPathInput = this.page.locator('#participatory_process_step_cta_path');
		this.ctaTextInput = this.page.locator('#participatory_process_step_cta_text_en');
		this.createPhaseButton = this.page.locator('button[type="submit"]', { hasText: 'Create' });
	}

	/**
	 * Fill the phase title (English)
	 */
	async fillTitle(title: string): Promise<void> {
		await this.titleInput.fill(title);
	}

	/**
	 * Fill the phase description (English)
	 */
	async fillDescription(description: string): Promise<void> {
		await this.descriptionEditor.click();
		await this.descriptionEditor.fill(description);
	}

	/**
	 * Fill start date and time
	 */
	async fillStartDateTime(date: string, time: string): Promise<void> {
		await this.startDateInput.fill(date);
		await this.startTimeInput.fill(time);
	}

	/**
	 * Fill end date and time
	 */
	async fillEndDateTime(date: string, time: string): Promise<void> {
		await this.endDateInput.fill(date);
		await this.endTimeInput.fill(time);
	}

	/**
	 * Fill the cta path
	 */
	async fillCtaPath(path: string): Promise<void> {
		await this.ctaPathInput.fill(path);
	}

	/**
	 * Fill the cta text (English)
	 */
	async fillCtaText(text: string): Promise<void> {
		await this.ctaTextInput.fill(text);
	}

	/**
	 * Click the create phase button
	 */
	async clickCreatePhase(): Promise<void> {
		await this.createPhaseButton.click();
	}

	/**
	 * Check if the create debate form is visible
	 */
	async isFormVisible(): Promise<boolean> {
		return await this.createPhaseButton.isVisible();
	}

	async isFormErrorVisible(): Promise<boolean> {
		return await this.page.locator('.form-error.is-visible').first().isVisible();
	}

	async expectToBeOnNewPhasePage(): Promise<void> {
		await expect(this.page).toHaveURL(/steps\/new/);
		await expect(this.createPhaseButton).toBeVisible();
	}
}

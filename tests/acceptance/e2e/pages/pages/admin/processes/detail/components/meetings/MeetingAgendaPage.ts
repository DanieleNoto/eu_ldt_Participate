import { expect, Locator, Page } from '@playwright/test';
import { BaseAdminPage } from '../../../../BaseAdminPage';

/**
 * Page Object Model for the Meeting Agenda management page.
 * Handles creating and managing meeting agendas with agenda items and sub-items.
 */
export class MeetingAgendaPage extends BaseAdminPage {
	// Main page elements
	private readonly pageWrapper: Locator;
	private readonly pageTitle: Locator;
	private readonly form: Locator;

	// Meeting info section
	private readonly meetingTitle: Locator;
	private readonly startDate: Locator;
	private readonly endDate: Locator;

	// Agenda form fields
	private readonly titleInput: Locator;
	private readonly visibleCheckbox: Locator;

	// Agenda items section
	private readonly agendaItemsSection: Locator;
	private readonly agendaItemsList: Locator;
	private readonly addAgendaItemButton: Locator;

	// Agenda item template selectors (for dynamic items)
	private readonly agendaItemTemplate: Locator;
	private readonly agendaItemCards: Locator;

	// Agenda sub-items template
	private readonly agendaSubItemTemplate: Locator;

	// Form actions
	private readonly createButton: Locator;
	private readonly stickyActionsContainer: Locator;

	// Upload modal elements
	private readonly uploadModal: Locator;
	private readonly uploadModalCloseButton: Locator;
	private readonly uploadFileInput: Locator;
	private readonly uploadDropzone: Locator;
	private readonly uploadSelectFileButton: Locator;
	private readonly uploadCancelButton: Locator;
	private readonly uploadSaveButton: Locator;

	constructor(page: Page) {
		super(page);

		// Main page elements
		this.pageWrapper = page.locator('.item_show__wrapper');
		this.pageTitle = page.locator('.item_show__header-title h1');
		this.form = page.locator('form.new_agenda, form.edit_agenda');

		// Meeting info section
		this.meetingTitle = page.locator('.card-title u');
		this.startDate = page.locator('.flex.items-center.gap-x-4 div:first-child div:nth-child(2)');
		this.endDate = page.locator('.flex.items-center.gap-x-4 div:last-child div:nth-child(2)');

		// Agenda form fields
		this.titleInput = page.locator('#meeting_agenda_title_en');
		this.visibleCheckbox = page.locator('#meeting_agenda_visible');

		// Agenda items section
		this.agendaItemsSection = page.locator('.meeting-agenda-items');
		this.agendaItemsList = page.locator('.meeting-agenda-items-list');
		this.addAgendaItemButton = page.locator('button.add-agenda-item');

		// Dynamic agenda item elements
		this.agendaItemTemplate = page.locator('script.decidim-template').first();
		this.agendaItemCards = page.locator('.meeting-agenda-item');

		// Agenda sub-items template
		this.agendaSubItemTemplate = page.locator('#agenda-item-child-template-dummy');

		// Form actions
		this.createButton = page.locator('button[type="submit"][name="commit"]');
		this.stickyActionsContainer = page.locator('.item__edit-sticky');

		// Upload modal elements
		this.uploadModal = page.locator('[data-dialog]');
		this.uploadModalCloseButton = page.locator('[data-dialog-close]');
		this.uploadFileInput = page.locator('input[type="file"][name="editor_image[file]"]');
		this.uploadDropzone = page.locator('[data-dropzone]');
		this.uploadSelectFileButton = page.locator('label.button__secondary[for*="files-upload"]');
		this.uploadCancelButton = page.locator('[data-dropzone-cancel]');
		this.uploadSaveButton = page.locator('[data-dropzone-save]');
	}

	// Navigation and page state
	async navigateToNewAgenda(processSlug: string, componentId: string, meetingId: string) {
		await this.page.goto(
			`/admin/participatory_processes/${processSlug}/components/${componentId}/manage/meetings/${meetingId}/agenda`
		);
		await this.waitForAgendaPageLoad();
	}

	async waitForAgendaPageLoad() {
		await this.page.waitForSelector('.item_show__wrapper');
		// Wait for either new agenda form or edit agenda form
		await this.page.waitForSelector('form.new_agenda, form.edit_agenda');
		await this.page.waitForLoadState('networkidle');
	}

	async isOnNewAgendaPage(): Promise<boolean> {
		const url = this.page.url();
		return url.includes('/manage/meetings/') && url.includes('/agenda') && !url.includes('/edit');
	}

	async isOnEditAgendaPage(): Promise<boolean> {
		const url = this.page.url();
		return url.includes('/manage/meetings/') && url.includes('/agenda') && url.includes('/edit');
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	// Meeting info methods
	async getMeetingTitle(): Promise<string> {
		return (await this.meetingTitle.textContent()) || '';
	}

	async getStartDate(): Promise<string> {
		return (await this.startDate.textContent()) || '';
	}

	async getEndDate(): Promise<string> {
		return (await this.endDate.textContent()) || '';
	}

	// Agenda title methods
	async switchToTitleTab() {
		// This method is kept for compatibility but does nothing
		// as the title input is directly accessible
	}

	async fillAgendaTitle(title: string) {
		// Check if the title input exists and is visible
		try {
			await this.titleInput.waitFor({ state: 'attached' });
			await this.titleInput.waitFor({ state: 'visible' });
			await this.titleInput.fill(title);
		} catch (error) {
			console.log('Title input not found or not visible:', error.message);
			// Try to wait for the page to load properly
			await this.waitForAgendaPageLoad();
			await this.titleInput.waitFor({ state: 'visible' });
			await this.titleInput.fill(title);
		}
	}

	async getAgendaTitle(): Promise<string> {
		return (await this.titleInput.inputValue()) || '';
	}

	async setVisibility(visible: boolean) {
		await this.visibleCheckbox.waitFor({ state: 'visible' });
		const isChecked = await this.visibleCheckbox.isChecked();
		if (visible !== isChecked) {
			await this.visibleCheckbox.click();
		}
	}

	async isVisible(): Promise<boolean> {
		return await this.visibleCheckbox.isChecked();
	}

	// Agenda items management
	async addAgendaItem() {
		const initialCount = await this.getAgendaItemsCount();
		await this.addAgendaItemButton.click();

		// Wait for a new visible item to appear
		await this.page.waitForFunction(expectedCount => {
			const visibleItems = document.querySelectorAll('.meeting-agenda-item:not(.hidden)');
			return visibleItems.length === expectedCount;
		}, initialCount + 1);
	}

	async getAgendaItemsCount(): Promise<number> {
		// Count only visible (non-hidden) agenda items
		return await this.page.locator('.meeting-agenda-item:not(.hidden)').count();
	}

	getAgendaItemCard(index: number): Locator {
		// Use a locator that specifically excludes hidden items
		return this.page.locator('.meeting-agenda-item:not(.hidden)').nth(index);
	}

	async fillAgendaItemTitle(itemIndex: number, title: string) {
		const itemCard = this.getAgendaItemCard(itemIndex);

		// Wait for the item card to be visible (this will wait as long as needed)
		await itemCard.waitFor({ state: 'visible' });

		// Check if tabs exist in the agenda item UI
		const tabExists = await itemCard
			.locator('.tabs-title')
			.nth(0)
			.isVisible()
			.catch(() => false);
		if (tabExists) {
			await itemCard.locator('.tabs-title').nth(0).locator('a').click();
			await this.page.waitForTimeout(300);
		}

		// Fill the title input - try different selectors
		let titleInput = itemCard.locator(`input[aria-label="title"]`).nth(0);
		const inputExists = await titleInput.isVisible().catch(() => false);

		if (!inputExists) {
			// Try alternative selector for title input
			titleInput = itemCard.locator('input[type="text"]').first();
		}

		// Wait for the input to be visible and fill it
		await titleInput.waitFor({ state: 'visible' });
		await titleInput.fill(title);
	}

	async fillAgendaItemDuration(itemIndex: number, duration: number) {
		const itemCard = this.getAgendaItemCard(itemIndex);
		const durationInput = itemCard.locator('input[type="number"][min="0"]');
		await durationInput.waitFor({ state: 'visible' });
		await durationInput.fill(duration.toString());
	}

	async fillAgendaItemDescription(itemIndex: number, description: string) {
		const itemCard = this.getAgendaItemCard(itemIndex);

		// Fill in the rich text editor - target the contenteditable element within editor-input
		let editor = itemCard.locator('.editor-input [contenteditable="true"]').first();
		let editorExists = await editor.isVisible().catch(() => false);

		if (!editorExists) {
			// Try alternative selector for the contenteditable element
			editor = itemCard.locator('[contenteditable="true"]').first();
			editorExists = await editor.isVisible().catch(() => false);

			if (!editorExists) {
				// Fallback to textarea if rich editor not found
				editor = itemCard.locator('textarea').first();
			}
		}

		await editor.waitFor({ state: 'visible' });
		await editor.click();
		await editor.fill(description);
	}

	async moveAgendaItemUp(itemIndex: number) {
		const itemCard = this.getAgendaItemCard(itemIndex);
		const moveUpButton = itemCard.locator('button.move-up-agenda-item');
		await moveUpButton.click();
		await this.page.waitForTimeout(300);
	}

	async moveAgendaItemDown(itemIndex: number) {
		const itemCard = this.getAgendaItemCard(itemIndex);
		const moveDownButton = itemCard.locator('button.move-down-agenda-item');
		await moveDownButton.click();
		await this.page.waitForTimeout(300);
	}

	async removeAgendaItem(itemIndex: number) {
		const itemCard = this.getAgendaItemCard(itemIndex);
		const removeButton = itemCard.locator('button.remove-agenda-item');
		await removeButton.click();
		await this.page.waitForTimeout(300);
	}

	// Agenda sub-items management
	async addAgendaSubItem(parentItemIndex: number) {
		const itemCard = this.getAgendaItemCard(parentItemIndex);
		const addSubItemButton = itemCard.locator('button.add-agenda-item-child');
		await addSubItemButton.click();
		await this.page.waitForTimeout(500);
	}

	async getAgendaSubItemsCount(parentItemIndex: number): Promise<number> {
		const itemCard = this.getAgendaItemCard(parentItemIndex);
		return await itemCard.locator('.meeting-agenda-item-child').count();
	}

	async fillAgendaSubItemTitle(parentItemIndex: number, subItemIndex: number, title: string) {
		const itemCard = this.getAgendaItemCard(parentItemIndex);
		const subItemCard = itemCard.locator('.meeting-agenda-item-child').nth(subItemIndex);

		// Fill the title input directly
		let titleInput = subItemCard.locator(`input[aria-label="title"]`).nth(0);
		const inputExists = await titleInput.isVisible().catch(() => false);

		if (!inputExists) {
			titleInput = subItemCard.locator('input[type="text"]').first();
		}

		await titleInput.fill(title);
	}

	async fillAgendaSubItemDuration(parentItemIndex: number, subItemIndex: number, duration: number) {
		const itemCard = this.getAgendaItemCard(parentItemIndex);
		const subItemCard = itemCard.locator('.meeting-agenda-item-child').nth(subItemIndex);
		const durationInput = subItemCard.locator('input[type="number"][min="0"]');
		await durationInput.fill(duration.toString());
	}

	async moveAgendaSubItemUp(parentItemIndex: number, subItemIndex: number) {
		const itemCard = this.getAgendaItemCard(parentItemIndex);
		const subItemCard = itemCard.locator('.meeting-agenda-item-child').nth(subItemIndex);
		const moveUpButton = subItemCard.locator('button.move-up-agenda-item-child');
		await moveUpButton.click();
		await this.page.waitForTimeout(300);
	}

	async moveAgendaSubItemDown(parentItemIndex: number, subItemIndex: number) {
		const itemCard = this.getAgendaItemCard(parentItemIndex);
		const subItemCard = itemCard.locator('.meeting-agenda-item-child').nth(subItemIndex);
		const moveDownButton = subItemCard.locator('button.move-down-agenda-item-child');
		await moveDownButton.click();
		await this.page.waitForTimeout(300);
	}

	async removeAgendaSubItem(parentItemIndex: number, subItemIndex: number) {
		const itemCard = this.getAgendaItemCard(parentItemIndex);
		const subItemCard = itemCard.locator('.meeting-agenda-item-child').nth(subItemIndex);
		const removeButton = subItemCard.locator('button.remove-agenda-item-child');
		await removeButton.click();
		await this.page.waitForTimeout(300);
	}

	// Image upload methods
	async openImageUploadDialog(itemIndex: number) {
		const itemCard = this.getAgendaItemCard(itemIndex);

		// Click the select file button to open upload dialog
		const selectFileButton = itemCard.locator('label.button__secondary').nth(0);
		await selectFileButton.click();
	}

	async uploadImage(filePath: string) {
		// Set the file for upload
		await this.uploadFileInput.setInputFiles(filePath);
		await this.page.waitForTimeout(1000); // Wait for file processing
	}

	async saveUploadedImage() {
		await this.uploadSaveButton.click();
		await this.page.waitForTimeout(500);
	}

	async cancelImageUpload() {
		await this.uploadCancelButton.click();
		await this.page.waitForTimeout(500);
	}

	async closeUploadModal() {
		await this.uploadModalCloseButton.first().click();
		await this.page.waitForTimeout(500);
	}

	// Form submission
	async createAgenda() {
		await this.createButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async isCreateButtonEnabled(): Promise<boolean> {
		return await this.createButton.isEnabled();
	}

	// Validation methods
	async expectToBeOnNewAgendaPage() {
		await expect(this.page).toHaveURL(/\/manage\/meetings\/.*\/agenda$/);
		await expect(this.pageTitle).toContainText('New agenda');
	}

	async expectToBeOnEditAgendaPage() {
		await expect(this.page).toHaveURL(/\/manage\/meetings\/.*\/agenda\/.*\/edit$/);
	}

	async expectMeetingInfo(expectedTitle: string, expectedStartDate?: string, expectedEndDate?: string) {
		await expect(this.meetingTitle).toContainText(expectedTitle);

		if (expectedStartDate) {
			await expect(this.startDate).toContainText(expectedStartDate);
		}

		if (expectedEndDate) {
			await expect(this.endDate).toContainText(expectedEndDate);
		}
	}

	async expectAgendaItemsCount(expectedCount: number) {
		await expect(this.agendaItemCards).toHaveCount(expectedCount);
	}

	async expectAgendaItemTitle(itemIndex: number, expectedTitle: string) {
		const itemCard = this.getAgendaItemCard(itemIndex);

		// Try different selectors for title input
		let titleInput = itemCard.locator(`input[aria-label="title"]`).nth(0);
		const inputExists = await titleInput.isVisible().catch(() => false);

		if (!inputExists) {
			titleInput = itemCard.locator('input[type="text"]').first();
		}

		await expect(titleInput).toHaveValue(expectedTitle);
	}

	async expectFormIsValid(): Promise<boolean> {
		// Check if create button is enabled and no form errors are visible
		const isButtonEnabled = await this.isCreateButtonEnabled();
		const hasFormErrors = (await this.page.locator('.form-error:visible').count()) > 0;
		return isButtonEnabled && !hasFormErrors;
	}

	// Bulk operations
	async createBasicAgenda(agendaTitle: string, visible: boolean = true): Promise<void> {
		await this.fillAgendaTitle(agendaTitle);
		await this.setVisibility(visible);
	}

	async createAgendaWithItems(
		agendaTitle: string,
		items: Array<{
			title: string;
			duration: number;
			description?: string;
		}>,
		visible: boolean = true
	): Promise<void> {
		// Set basic agenda info
		await this.createBasicAgenda(agendaTitle, visible);

		// Add agenda items
		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			await this.addAgendaItem();
			await this.fillAgendaItemTitle(i, item.title);
			await this.fillAgendaItemDuration(i, item.duration);

			if (item.description) {
				await this.fillAgendaItemDescription(i, item.description);
			}
		}
	}
}

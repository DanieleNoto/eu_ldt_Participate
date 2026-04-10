/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Simone Bianchelli
 */

import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { Locator, Page } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';

export class NewDebatePage extends BaseAdminPage {
	public readonly sidebar: SidebarProcessDetailComponent;
	// Form elements
	private readonly titleInput: Locator;
	private readonly descriptionEditor: Locator;
	private readonly instructionsEditor: Locator;
	private readonly informationUpdatesEditor: Locator;
	private readonly debateTypeFiniteRadio: Locator;
	private readonly debateTypeOpenRadio: Locator;
	private readonly startDateInput: Locator;
	private readonly startTimeInput: Locator;
	private readonly endDateInput: Locator;
	private readonly endTimeInput: Locator;
	private readonly categorySelect: Locator;
	private readonly commentsEnabledCheckbox: Locator;
	private readonly createDebateButton: Locator;

	constructor(page: Page) {
		super(page);
		this.sidebar = new SidebarProcessDetailComponent(page);

		// Initialize locators based on the HTML structure
		this.titleInput = this.page.locator('#debate_title_en');
		this.descriptionEditor = this.page.locator('#debate_description_en .tiptap.ProseMirror');
		this.instructionsEditor = this.page.locator('#debate_instructions_en .tiptap.ProseMirror');
		this.informationUpdatesEditor = this.page.locator('#debate_information_updates_en .tiptap.ProseMirror');
		this.debateTypeFiniteRadio = this.page.locator('#debate_finite_true');
		this.debateTypeOpenRadio = this.page.locator('#debate_finite_false');
		this.startDateInput = this.page.locator('#debate_start_time_date');
		this.startTimeInput = this.page.locator('#debate_start_time_time');
		this.endDateInput = this.page.locator('#debate_end_time_date');
		this.endTimeInput = this.page.locator('#debate_end_time_time');
		this.categorySelect = this.page.locator('#debate_decidim_category_id');
		this.commentsEnabledCheckbox = this.page.locator('#debate_comments_enabled');
		this.createDebateButton = this.page.locator('button[type="submit"]', { hasText: 'Create debate' });
	}

	/**
	 * Fill the debate title (English)
	 */
	async fillTitle(title: string): Promise<void> {
		await this.titleInput.fill(title);
	}

	/**
	 * Fill the debate description (English)
	 */
	async fillDescription(description: string): Promise<void> {
		await this.descriptionEditor.click();
		await this.descriptionEditor.fill(description);
	}

	/**
	 * Fill the instructions to participate (English)
	 */
	async fillInstructions(instructions: string): Promise<void> {
		await this.instructionsEditor.click();
		await this.instructionsEditor.fill(instructions);
	}

	/**
	 * Fill the information updates (English)
	 */
	async fillInformationUpdates(informationUpdates: string): Promise<void> {
		await this.informationUpdatesEditor.click();
		await this.informationUpdatesEditor.fill(informationUpdates);
	}

	/**
	 * Set debate type to finite (with start and end times)
	 */
	async setDebateTypeFinite(): Promise<void> {
		await this.debateTypeFiniteRadio.check();
	}

	/**
	 * Set debate type to open (no start or end times)
	 */
	async setDebateTypeOpen(): Promise<void> {
		await this.debateTypeOpenRadio.check();
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
	 * Select a category for the debate
	 */
	async selectCategory(categoryValue: string): Promise<void> {
		if (categoryValue) {
			await this.categorySelect.selectOption(categoryValue);
		}
	}

	/**
	 * Enable or disable comments
	 */
	async setCommentsEnabled(enabled: boolean): Promise<void> {
		if (enabled) {
			await this.commentsEnabledCheckbox.check();
		} else {
			await this.commentsEnabledCheckbox.uncheck();
		}
	}

	/**
	 * Click the create debate button and wait for the page to finish loading.
	 */
	async clickCreateDebate(): Promise<void> {
		await this.createDebateButton.click();
		await this.page.waitForLoadState('load');
	}

	/**
	 * Create a new debate with all required fields
	 */
	async createDebate(debateData: {
		title: string;
		description: string;
		instructions: string;
		informationUpdates?: string;
		type: 'finite' | 'open';
		startDate?: string;
		startTime?: string;
		endDate?: string;
		endTime?: string;
		category?: string;
		commentsEnabled?: boolean;
	}): Promise<void> {
		// Fill required fields
		await this.fillTitle(debateData.title);
		await this.fillDescription(debateData.description);
		await this.fillInstructions(debateData.instructions);

		// Fill optional information updates
		if (debateData.informationUpdates) {
			await this.fillInformationUpdates(debateData.informationUpdates);
		}

		// Set debate type
		if (debateData.type === 'finite') {
			await this.setDebateTypeFinite();

			// Fill start and end times if provided
			if (debateData.startDate && debateData.startTime) {
				await this.fillStartDateTime(debateData.startDate, debateData.startTime);
			}
			if (debateData.endDate && debateData.endTime) {
				await this.fillEndDateTime(debateData.endDate, debateData.endTime);
			}
		} else {
			await this.setDebateTypeOpen();
		}

		// Select category if provided
		if (debateData.category) {
			await this.selectCategory(debateData.category);
		}

		// Set comments enabled (default true if not specified)
		const commentsEnabled = debateData.commentsEnabled !== undefined ? debateData.commentsEnabled : true;
		await this.setCommentsEnabled(commentsEnabled);

		// Submit the form
		await this.clickCreateDebate();
	}

	/**
	 * Wait for the page to be ready for interaction
	 */
	async waitForPageReady(): Promise<void> {
		await this.titleInput.waitFor({ state: 'visible' });
		await this.createDebateButton.waitFor({ state: 'visible' });
	}

	/**
	 * Check if the create debate form is visible
	 */
	async isFormVisible(): Promise<boolean> {
		return await this.createDebateButton.isVisible();
	}
}

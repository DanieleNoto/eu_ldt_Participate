/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Simone Bianchelli
 */

import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { expect, Locator, Page } from '@playwright/test';

export class CloseDebatePage extends BaseAdminPage {
	public readonly sidebar: SidebarProcessDetailComponent;

	private readonly closeDebateButton: Locator;
	private readonly conclusionInput: Locator;

	constructor(page: Page) {
		super(page);
		this.sidebar = new SidebarProcessDetailComponent(page);

		// Initialize locators based on the HTML structure
		this.closeDebateButton = this.page.locator('button[type="submit"]', { hasText: 'Close' });
		this.conclusionInput = this.page.locator('.tiptap.ProseMirror:visible');
	}

	/**
	 * Fill the debate conclusion (English)
	 */
	async fillConclusion(conclusion: string): Promise<void> {
		await this.conclusionInput.click();
		await this.conclusionInput.fill(conclusion);
	}

	/**
	 * Click the close debate button
	 */
	async clickCloseDebate(): Promise<void> {
		await this.closeDebateButton.click();
	}

	/**
	 * Check if conclusion validation error is visible
	 * Checks for inline form errors or flash alerts
	 */
	async isConclusionValidationVisible(): Promise<boolean> {
		// Wait a moment for validation to appear after form submit
		await this.page.waitForTimeout(500);

		// Check for inline form error: <small class="form-error is-visible">
		const formError = this.page.locator('small.form-error.is-visible');
		// Check for flash alert: <div class="flash alert">
		const flashAlert = this.page.locator('.flash.alert');

		const hasFormError = await formError.isVisible().catch(() => false);
		const hasFlashAlert = await flashAlert.isVisible().catch(() => false);

		console.log(`[Validation Check] Form error visible: ${hasFormError}, Flash alert visible: ${hasFlashAlert}`);

		return hasFormError || hasFlashAlert;
	}

	async expectToBeOnCloseDebatePage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/debate_closes\//);
		await expect(this.conclusionInput).toBeVisible();
		await expect(this.closeDebateButton).toBeVisible();
	}
}

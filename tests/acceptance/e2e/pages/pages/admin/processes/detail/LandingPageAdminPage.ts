/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/**
 * Page Object Model for managing the Landing Page of a participatory process.
 * Handles content blocks configuration and visibility settings.
 */
export class LandingPageAdminPage extends BasePage {
	// Dropdown button and content block link
	private readonly addContentBlockButton: Locator;
	private readonly relatedDocumentsLink: Locator;
	private readonly contentBlockSuccessMessage: Locator;

	// Drag & Drop areas
	private readonly activeContentBlocksList: Locator;
	private readonly inactiveContentBlocksList: Locator;
	private readonly relatedDocumentsInInactiveList: Locator;

	constructor(page: Page) {
		super(page);

		this.addContentBlockButton = page.getByRole('button', { name: 'Add content block' });
		this.relatedDocumentsLink = page.getByRole('link', { name: 'Related documents' });
		this.contentBlockSuccessMessage = page.getByText('Content block successfully');

		// Drag & Drop elements
		this.activeContentBlocksList = page.locator('.js-list-actives');
		this.inactiveContentBlocksList = page.locator('.js-list-available');
		this.relatedDocumentsInInactiveList = this.inactiveContentBlocksList
			.locator('li .draggable-content')
			.filter({ hasText: 'Related documents' })
			.locator('..')
			.first();
	}

	/**
	 * Opens the content block dropdown
	 */
	async openContentBlockDropdown(): Promise<void> {
		await this.addContentBlockButton.click();
		await this.relatedDocumentsLink.waitFor({ state: 'visible' });
	}

	/**
	 * Clicks on "Related documents" content block link
	 */
	async clickRelatedDocuments(): Promise<void> {
		await this.relatedDocumentsLink.click();
		await this.page.waitForLoadState('load');
	}

	/**
	 * Expects the content block success message to be visible
	 */
	async expectContentBlockSuccessMessage(): Promise<void> {
		await this.contentBlockSuccessMessage.waitFor({ state: 'visible' });
	}

	/**
	 * Drags "Related documents" from inactive to active content blocks.
	 */
	async dragRelatedDocumentsToActive(): Promise<void> {
		// Wait for the block to appear in inactive list
		await this.relatedDocumentsInInactiveList.waitFor({ state: 'visible' });
		await this.relatedDocumentsInInactiveList.scrollIntoViewIfNeeded();

		console.log('Related documents block found in inactive list, attempting drag...');

		const sourceBox = await this.relatedDocumentsInInactiveList.boundingBox();
		const targetBox = await this.activeContentBlocksList.boundingBox();

		if (!sourceBox || !targetBox) {
			throw new Error('Could not get bounding boxes for drag source or target');
		}

		const sourceX = sourceBox.x + sourceBox.width / 2;
		const sourceY = sourceBox.y + sourceBox.height / 2;
		const targetX = targetBox.x + targetBox.width / 2;
		const targetY = targetBox.y + targetBox.height / 2;

		// Step-by-step mouse simulation: move → down → tiny nudge (triggers dragstart)
		// → gradual move to target (triggers dragover) → up (triggers drop)
		await this.page.mouse.move(sourceX, sourceY);
		await this.page.waitForTimeout(100);
		await this.page.mouse.down();
		await this.page.waitForTimeout(500);

		// Small initial nudge so the browser fires dragstart
		await this.page.mouse.move(sourceX + 2, sourceY + 2, { steps: 3 });
		await this.page.waitForTimeout(100);

		// Gradual move toward target — triggers dragenter/dragover on hovered elements
		await this.page.mouse.move(targetX, targetY, { steps: 30 });
		await this.page.waitForTimeout(300);

		// Release — triggers drop / dragend
		await this.page.mouse.up();

		console.log('Drag simulation completed, waiting for AJAX save...');

		// Wait for the AJAX save to complete
		await this.page.waitForLoadState('load');

		// Reload the page to confirm the save persisted to the database
		await this.page.reload();
		await this.page.waitForLoadState('load');
	}

	/**
	 * Verifies that "Related documents" block is in the active content blocks list
	 */
	async expectRelatedDocumentsInActiveList(): Promise<void> {
		const relatedDocsInActive = this.activeContentBlocksList
			.locator('li .draggable-content')
			.filter({ hasText: 'Related documents' });

		await expect(relatedDocsInActive).toBeVisible();
	}
}

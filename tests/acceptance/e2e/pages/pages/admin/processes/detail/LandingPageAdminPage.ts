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
		await this.page.waitForLoadState('networkidle');
	}

	/**
	 * Expects the content block success message to be visible
	 */
	async expectContentBlockSuccessMessage(): Promise<void> {
		await this.contentBlockSuccessMessage.waitFor({ state: 'visible' });
	}

	/**
	 * Drags "Related documents" from inactive to active content blocks
	 */
	async dragRelatedDocumentsToActive(): Promise<void> {
		// Wait for the block to appear in inactive list
		await this.relatedDocumentsInInactiveList.waitFor({ state: 'visible' });

		console.log('Related documents block found in inactive list, attempting drag...');

		// Perform drag and drop
		await this.relatedDocumentsInInactiveList.dragTo(this.activeContentBlocksList);

		console.log('Drag operation completed, waiting for page update...');

		// Wait for the action to complete
		await this.page.waitForLoadState('networkidle');
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

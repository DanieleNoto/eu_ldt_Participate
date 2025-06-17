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

	async expectToBeOnCloseDebatePage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/debate_closes\//);
		await expect(this.conclusionInput).toBeVisible();
		await expect(this.closeDebateButton).toBeVisible();
	}
}

import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { expect, Locator, Page } from '@playwright/test';

export class CategoriesPage extends BaseAdminPage {
	// Sidebar component
	public readonly sidebarProcessDetail: SidebarProcessDetailComponent;

	private readonly newButton: Locator;

	// Table elements
	private readonly table: Locator;
	private readonly tableRows: Locator;

	constructor(page: Page) {
		super(page);
		this.sidebarProcessDetail = new SidebarProcessDetailComponent(page);
		this.newButton = page.locator('a.button:has-text("New category")');
		this.table = page.locator('table.table-list');
		this.tableRows = this.table.locator('tbody tr');
	}
	async createNewCategory(): Promise<void> {
		await this.newButton.click();
	}
	async getCategoryCount(): Promise<number | PromiseLike<number>> {
		return await this.tableRows.count();
	}

	/**
	 * Get category title by row index
	 * @param index - The row index (0-based)
	 * @returns The category title
	 */
	async getCategoryTitleByIndex(index: number): Promise<string> {
		const row = this.tableRows.nth(index);
		const titleCell = row.locator('td').first();
		// Get text content, removing any HTML and extra whitespace
		const titleText = (await titleCell.textContent()) || '';
		return titleText.trim();
	}
	/**
	 * Click edit button for a category by row index
	 * @param index - The row index (0-based)
	 */
	async clickEditButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const editButton = row.locator('.action-icon--edit');

		if ((await editButton.count()) > 0) {
			await editButton.click();
		} else {
			throw new Error(`Edit button not found for phase at index ${index} `);
		}
	}

	/**
	 * Click delete button for a category by row index
	 * @param index - The row index (0-based)
	 */
	async clickDeleteButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const deleteButton = row.locator('.action-icon--remove');
		await deleteButton.click();
	}

	/**
	 * Clicks the delete button for the first row where delete is enabled
	 */
	async clickFirstEnabledDeleteButton(): Promise<void> {
		const count = await this.tableRows.count();
		for (let i = 0; i < count; i++) {
			const row = this.tableRows.nth(i);
			// Il delete abilitato è un <a> con .action-icon--remove, quello disabilitato è solo <svg> con .action-icon--disabled
			const deleteButton = row.locator('a.action-icon--remove');
			if ((await deleteButton.count()) > 0 && (await deleteButton.first().isVisible())) {
				await deleteButton.first().click();
				return;
			}
		}
		throw new Error('No enabled delete button found in any row');
	}

	/**
	 * Find the index of a category by title
	 * @param title - The title to search for
	 * @returns The index of the first matching category, or -1 if not found
	 */
	async findCategoryIndexByTitle(title: string): Promise<number> {
		const count = await this.tableRows.count();

		for (let i = 0; i < count; i++) {
			const rowTitle = await this.getCategoryTitleByIndex(i);
			if (rowTitle.includes(title)) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Get the index of the first row with the specified title
	 * @param title - The exact title to search for
	 * @returns The index of the first matching category
	 * @throws Error if no category with the specified title is found
	 */
	async getIndexByTitle(title: string): Promise<number> {
		const index = await this.findCategoryIndexByTitle(title);

		if (index === -1) {
			throw new Error(`Category with title "${title}" not found in the table`);
		}

		return index;
	}

	/**
	 * Verifies that the user is on the Participatory Process Categories page.
	 */
	async expectToBeOnCategoriesPage(): Promise<void> {
		await expect(this.page).toHaveURL(/categories$/);
		await expect(this.newButton).toBeVisible();
	}

	async expectTableIsVisible(): Promise<void> {
		await expect(this.table).toBeVisible();
	}
	async expectCategoryIsInTable(name: string): Promise<void> {
		const row = this.tableRows.filter({ hasText: name }).first();
		await expect(row).toBeVisible();
	}
}

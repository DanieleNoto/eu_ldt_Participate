import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { expect, Locator, Page } from '@playwright/test';

export class PhasesPage extends BaseAdminPage {
	// Sidebar component
	public readonly sidebarProcessDetail: SidebarProcessDetailComponent;

	private readonly newPhaseButton: Locator;

	// Table elements
	private readonly phasesTable: Locator;
	private readonly tableRows: Locator;

	constructor(page: Page) {
		super(page);
		this.sidebarProcessDetail = new SidebarProcessDetailComponent(page);
		this.newPhaseButton = page.locator('a.button:has-text("New phase")');
		this.phasesTable = page.locator('table.table-list');
		this.tableRows = this.phasesTable.locator('tbody tr');
	}
	async createNewPhase(): Promise<void> {
		await this.newPhaseButton.click();
	}

	/**
	 * Get phase title by row index
	 * @param index - The row index (0-based)
	 * @returns The phase title
	 */
	async getPhaseTitleByIndex(index: number): Promise<string> {
		const row = this.tableRows.nth(index);
		const titleCell = row.locator('td').first();
		// Get text content, removing any HTML and extra whitespace
		const titleText = (await titleCell.textContent()) || '';
		return titleText.trim();
	}
	/**
	 * Click edit button for a phase by row index
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
	 * Click delete button for a phase by row index
	 * @param index - The row index (0-based)
	 */
	async clickDeleteButtonByIndex(index: number): Promise<void> {
		const row = this.tableRows.nth(index);
		const deleteButton = row.locator('.action-icon--remove');
		await deleteButton.click();
	}

	/**
	 * Find the index of a debate by title
	 * @param title - The title to search for
	 * @returns The index of the first matching debate, or -1 if not found
	 */
	async findPhaseIndexByTitle(title: string): Promise<number> {
		const count = await this.tableRows.count();

		for (let i = 0; i < count; i++) {
			const rowTitle = await this.getPhaseTitleByIndex(i);
			if (rowTitle.includes(title)) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Get the index of the first row with the specified title
	 * @param title - The exact title to search for
	 * @returns The index of the first matching phase
	 * @throws Error if no phase with the specified title is found
	 */
	async getIndexByTitle(title: string): Promise<number> {
		const index = await this.findPhaseIndexByTitle(title);

		if (index === -1) {
			throw new Error(`Phase with title "${title}" not found in the table`);
		}

		return index;
	}

	/**
	 * Verifies that the user is on the Participatory Process Phases page.
	 */
	async expectToBeOnPhasesPage(): Promise<void> {
		await expect(this.page).toHaveURL(/steps$/);
		await expect(this.newPhaseButton).toBeVisible();
	}

	async expectTableIsVisible(): Promise<void> {
		await expect(this.phasesTable).toBeVisible();
	}
	async expectPhaseIsInTable(name: string): Promise<void> {
		const row = this.tableRows.filter({ hasText: name }).first();
		await expect(row).toBeVisible();
	}
}

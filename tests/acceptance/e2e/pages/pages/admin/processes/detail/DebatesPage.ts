import { SidebarProcessDetailComponent } from '@pages/components/admin/process/detail/SidebarProcessDetailComponent';
import { Locator, Page } from '@playwright/test';
import { BaseAdminPage } from '../../BaseAdminPage';

/**
 * Page Object Model for the Debates list page in process detail management.
 * Handles component management including adding, configuring, and managing components.
 */
export class DebatesPage extends BaseAdminPage {
	// Sidebar component
	public readonly sidebarProcessDetail: SidebarProcessDetailComponent;
	private readonly pageTitle: Locator;

	private readonly exportButton: Locator;
	private readonly exportDropdown: Locator;

	private readonly newDebateButton: Locator;
	private readonly configureButton: Locator;

	constructor(page: Page) {
		super(page);
		this.pageTitle = page.locator('.item_show__header-title h1, h1.item_show__header-title');

		this.newDebateButton = page.locator('a.button:has-text("New debate")');
	}

	async createNewDebate(): Promise<void> {
		await this.newDebateButton.click();
	}
}

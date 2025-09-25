import { expect, Locator, Page } from '@playwright/test';
import { SidebarProcessDetailComponent } from '../../../../../components/admin/process/detail/SidebarProcessDetailComponent';
import { BaseAdminPage } from '../../../BaseAdminPage';
import { ManagePageComponentPage } from './ManagePageComponentPage';
import { NewPageComponentPage } from './NewPageComponentPage';
import { readdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Page Object Model for the Components page in process detail management.
 * Handles component management including adding, configuring, and managing components.
 */
export class ComponentsPage extends BaseAdminPage {
	// Sidebar component
	public readonly sidebarProcessDetail: SidebarProcessDetailComponent;
	public readonly newPageComponentPage: NewPageComponentPage;
	public readonly managePageComponentPage: ManagePageComponentPage;

	// Main page elements
	private readonly pageWrapper: Locator;
	private readonly card: Locator;
	private readonly pageTitle: Locator;

	// Add component dropdown
	private readonly addComponentButton: Locator;
	private readonly addComponentDropdown: Locator;
	private readonly addComponentMenu: Locator;

	// Component type links in dropdown
	private readonly accountabilityLink: Locator;
	private readonly blogLink: Locator;
	private readonly budgetsLink: Locator;
	private readonly debatesLink: Locator;
	private readonly meetingsLink: Locator;
	private readonly pagesLink: Locator;
	private readonly proposalsLink: Locator;
	private readonly sortitionsLink: Locator;
	private readonly surveysLink: Locator;

	// Components table
	private readonly componentsTable: Locator;
	private readonly tableHeaders: Locator;
	private readonly tableBody: Locator;
	private readonly componentRows: Locator;

	constructor(page: Page) {
		super(page);

		// Initialize sidebar component
		this.sidebarProcessDetail = new SidebarProcessDetailComponent(page);
		this.newPageComponentPage = new NewPageComponentPage(page);
		this.managePageComponentPage = new ManagePageComponentPage(page);
		// Main page elements
		this.pageWrapper = page.locator('.item_show__wrapper');
		this.card = page.locator('.card');
		this.pageTitle = page.locator('.item_show__header-title h1, h1.item_show__header-title');

		// Add component dropdown
		this.addComponentButton = page.locator('button[data-toggle="add-component-dropdown"]');
		this.addComponentDropdown = page.locator('#add-component-dropdown');
		this.addComponentMenu = page.locator('.add-components.vertical.menu');

		// Component type links
		this.accountabilityLink = page.locator('a.accountability[href*="components/new?type=accountability"]');
		this.blogLink = page.locator('a.blogs[href*="components/new?type=blogs"]');
		this.budgetsLink = page.locator('a.budgets[href*="components/new?type=budgets"]');
		this.debatesLink = page.locator('a.debates[href*="components/new?type=debates"]');
		this.meetingsLink = page.locator('a.meetings[href*="components/new?type=meetings"]');
		this.pagesLink = page.locator('a.pages[href*="components/new?type=pages"]');
		this.proposalsLink = page.locator('a.proposals[href*="components/new?type=proposals"]');
		this.sortitionsLink = page.locator('a.sortitions[href*="components/new?type=sortitions"]');
		this.surveysLink = page.locator('a.surveys[href*="components/new?type=surveys"]');

		// Components table
		this.componentsTable = page.locator('.table-list');
		this.tableHeaders = page.locator('.table-list thead th');
		this.tableBody = page.locator('.table-list tbody');
    	this.componentRows = this.tableBody.locator('tr');
	}

	// Navigation and page state
	async navigateToComponents(processSlug: string) {
		await this.page.goto(`/admin/participatory_processes/${processSlug}/components`);
		await this.waitForComponentsPageLoad();
	}

	async waitForComponentsPageLoad() {
		await this.page.waitForSelector('.item_show__wrapper');
		await this.page.waitForSelector('.table-list');
		await this.page.waitForLoadState('networkidle');
	}

	async isOnComponentsPage(): Promise<boolean> {
		const url = this.page.url();
		return url.includes('/admin/participatory_processes/') && url.includes('/components');
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	// Get page instance for direct page operations
	getPage(): Page {
		return this.page;
	}

	// Convenience method for waiting for load state
	async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle') {
		await this.page.waitForLoadState(state);
	}

	// Add component dropdown methods
	async isAddComponentDropdownVisible(): Promise<boolean> {
		return await this.addComponentDropdown.isVisible();
	}

	async openAddComponentDropdown() {
		await this.addComponentButton.click();
		await expect(this.addComponentDropdown).toHaveAttribute('aria-hidden', 'false');
	}



	async closeAddComponentDropdown() {
		if (await this.isAddComponentDropdownVisible()) {
			await this.addComponentButton.click();
			await expect(this.addComponentDropdown).toHaveAttribute('aria-hidden', 'true');
		}
	}

	async isAddComponentDropdownExpanded(): Promise<boolean> {
		const ariaExpanded = await this.addComponentButton.getAttribute('aria-expanded');
		return ariaExpanded === 'true';
	}

	// Component creation methods
	async addAccountabilityComponent() {
		await this.openAddComponentDropdown();
		await this.accountabilityLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async addBlogComponent() {
		await this.openAddComponentDropdown();
		await this.blogLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async addBudgetsComponent() {
		await this.openAddComponentDropdown();
		await this.budgetsLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async addDebatesComponent() {
		await this.openAddComponentDropdown();
		await this.debatesLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async addMeetingsComponent() {
		await this.openAddComponentDropdown();
		await this.meetingsLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async addPagesComponent() {
		await this.openAddComponentDropdown();
		await this.pagesLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async addProposalsComponent() {
		await this.openAddComponentDropdown();
		await this.proposalsLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async addSortitionsComponent() {
		await this.openAddComponentDropdown();
		await this.sortitionsLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async addSurveysComponent() {
		await this.openAddComponentDropdown();
		await this.surveysLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	// Generic method to add component by type
	async addComponentByType(componentType: string) {
		const componentMap: { [key: string]: () => Promise<void> } = {
			accountability: () => this.addAccountabilityComponent(),
			blogs: () => this.addBlogComponent(),
			budgets: () => this.addBudgetsComponent(),
			debates: () => this.addDebatesComponent(),
			meetings: () => this.addMeetingsComponent(),
			pages: () => this.addPagesComponent(),
			proposals: () => this.addProposalsComponent(),
			sortitions: () => this.addSortitionsComponent(),
			surveys: () => this.addSurveysComponent()
		};

		const addMethod = componentMap[componentType];
		if (addMethod) {
			await addMethod();
		} else {
			throw new Error(`Unknown component type: ${componentType}`);
		}
	}

	// Table methods
	async getComponentsCount(): Promise<number> {
		return await this.componentRows.count();
	}

	async getTableHeaders(): Promise<string[]> {
		return await this.tableHeaders.allTextContents();
	}

	async getComponentNames(): Promise<string[]> {
		const nameLinks = this.componentRows.locator('td:nth-child(2) a');
		return await nameLinks.allTextContents();
	}

	async getComponentTypes(): Promise<string[]> {
		const typeColumns = this.componentRows.locator('td:nth-child(3)');
		return await typeColumns.allTextContents();
	}

	// Component row methods
	getComponentRow(componentName: string): Locator {
		return this.componentRows
			.filter({ has: this.page.locator('td:nth-child(2) a', { hasText: componentName }) })
			.first();
	}

	getComponentRowByIndex(index: number): Locator {
		return this.componentRows.nth(index);
	}

	// Component actions
	async manageComponent(componentName: string) {
		const row = this.getComponentRow(componentName).first();
		const manageLink = row.locator('a.action-icon--manage');
		await manageLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async checkPageComponent(componentName: string) {
		await this.addPagesComponent();
		await this.newPageComponentPage.waitForNewPageComponentPageLoad();
		await this.newPageComponentPage.fillComponentName(componentName);
		await this.newPageComponentPage.submitForm();
		await this.page.waitForLoadState('networkidle');
		await this.expectComponentExists(componentName);
		await this.manageComponent(componentName);
		await this.managePageComponentPage.fillBody('This is a test page body');
		await this.managePageComponentPage.savePage();
	}

	async shareComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		const shareLink = row.locator('a.action-icon--share');
		await shareLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async configureComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		const configureLink = row.locator('a.action-icon--configure').first();
		await configureLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async configureFirstComponent() {
		const row = this.getComponentRowByIndex(0);
		const configureLink = row.locator('a.action-icon--configure').first();
		await configureLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async unpublishComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		const unpublishLink = row.locator('a.action-icon--unpublish');
		await unpublishLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async publishComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		const publishLink = row.locator('a.action-icon--publish');
		await publishLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async previewComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		const previewLink = row.locator('a.action-icon--preview');
		await previewLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	async deleteComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		const deleteLink = row.locator('a.action-icon--remove');

		// Handle potential confirmation dialog
		this.page.on('dialog', async dialog => {
			if (dialog.type() === 'confirm') {
				await dialog.accept();
			}
		});

		await deleteLink.click();
		await this.page.waitForLoadState('networkidle');
	}

	// Component state checks
	async isComponentPublished(componentName: string): Promise<boolean> {
		const row = this.getComponentRow(componentName);
		const unpublishAction = row.locator('a.action-icon--unpublish');
		return await unpublishAction.isVisible();
	}

	async isComponentUnpublished(componentName: string): Promise<boolean> {
		const row = this.getComponentRow(componentName);
		const publishAction = row.locator('a.action-icon--publish');
		return await publishAction.isVisible();
	}

	async hasManagePermission(componentName: string): Promise<boolean> {
		const row = this.getComponentRow(componentName);
		const manageAction = row.locator('a.action-icon--manage');
		return await manageAction.isVisible();
	}

	async hasDeletePermission(componentName: string): Promise<boolean> {
		const row = this.getComponentRow(componentName);
		const deleteAction = row.locator('a.action-icon--remove');
		return await deleteAction.isVisible();
	}

	// Component link methods
	async getComponentManageUrl(componentName: string): Promise<string | null> {
		const row = this.getComponentRow(componentName);
		const manageLink = row.locator('a.action-icon--manage');
		return await manageLink.getAttribute('href');
	}

	async getComponentPreviewUrl(componentName: string): Promise<string | null> {
		const row = this.getComponentRow(componentName);
		const previewLink = row.locator('a.action-icon--preview');
		return await previewLink.getAttribute('href');
	}

	async getComponentConfigureUrl(componentName: string): Promise<string | null> {
		const row = this.getComponentRow(componentName);
		const configureLink = row.locator('a.action-icon--configure');
		return await configureLink.getAttribute('href');
	}

	// Bulk operations
	async getAllComponentsData(): Promise<Array<{ name: string; type: string; published: boolean }>> {
		const components = [];
		const count = await this.getComponentsCount();

		for (let i = 0; i < count; i++) {
			const row = this.componentRows.nth(i);
			// Component name is in the second column (td:nth-child(2)) within an anchor tag
			const nameElement = row.locator('td:nth-child(2) a');
			const name = (await nameElement.textContent()) || '';

			// Component type is in the third column (td:nth-child(3))
			const typeElement = row.locator('td:nth-child(3)');
			const type = (await typeElement.textContent()) || '';

			// Check if component is published by looking for the unpublish action button
			const unpublishButton = row.locator('a.action-icon--unpublish');
			const published = await unpublishButton.isVisible();

			components.push({
				name: name.trim(),
				type: type.trim(),
				published
			});
		}

		return components;
	}

	// Search and filter methods
	async findComponentByName(name: string): Promise<boolean> {
		const componentNames = await this.getComponentNames();
		return componentNames.some(componentName => componentName.trim().toLowerCase().includes(name.toLowerCase()));
	}

	async findComponentsByType(type: string): Promise<string[]> {
		const components = await this.getAllComponentsData();
		return components
			.filter(component => component.type.toLowerCase() === type.toLowerCase())
			.map(component => component.name);
	}

	// Validation methods
	async expectComponentExists(componentName: string) {
		await expect(this.getComponentRow(componentName)).toBeVisible();
	}

	async expectComponentNotExists(componentName: string) {
		await expect(this.getComponentRow(componentName)).not.toBeVisible();
	}

	async expectComponentIsPublished(componentName: string) {
		expect(await this.isComponentPublished(componentName)).toBeTruthy();
	}

	async expectComponentIsUnpublished(componentName: string) {
		expect(await this.isComponentUnpublished(componentName)).toBeTruthy();
	}

	async expectComponentsCount(expectedCount: number) {
		await expect(this.componentRows).toHaveCount(expectedCount);
	}

	// URL expectations
	async expectToBeOnComponentsPage() {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes\/.*\/components$/);
	}

	async expectToBeOnNewComponentPage(componentType?: string) {
		if (componentType) {
			await expect(this.page).toHaveURL(
				new RegExp(`/admin/participatory_processes/.*/components/new\\?type=${componentType}`)
			);
		} else {
			await expect(this.page).toHaveURL(/\/admin\/participatory_processes\/.*\/components\/new/);
		}
	}

    /**
     * Deletes a component by name if it exists, including snapshots cleanup.
     * @param componentName Name or regex of the component to delete
     * @param snapshotsDir Directory containing snapshots to delete
     */
    async deleteComponentIfExists(componentName: string | RegExp, snapshotsDir: string) {
        const rowLocator = this.page.getByRole('option', { name: componentName });
        if (await rowLocator.count() > 0) {
            const row = rowLocator.first();
            const deleteLink = row.locator('a.action-icon--delete');
            await deleteLink.click();

            // Confirm deletion
            await this.page.getByRole('button', { name: 'OK' }).click();

            // Verify success message
            const deletionSuccessMessage = this.page.locator('.flash.success, .alert.success, [role="alert"]');
            await expect(deletionSuccessMessage).toBeVisible();

            // Delete all files in snapshots directory
            if (existsSync(snapshotsDir)) {
                const files = readdirSync(snapshotsDir);
                for (const file of files) {
                    const filePath = join(snapshotsDir, file);
                    unlinkSync(filePath);
                    console.log(`Deleted: ${filePath}`);
                }
            } else {
                console.log(`Directory ${snapshotsDir} does not exist.`);
            }
        } else {
            console.log(`Component "${componentName}" not found, skipping deletion.`);
        }
    }
	/**
	 * Ritorna il link di un componente in base al testo (es. "Meetings", "Accountability").
	 * @param componentName Testo del link nella tabella
	 */
	getComponentLinkByName(componentName: string): Locator {
	  return this.componentRows.locator(`td a:has-text("${componentName}")`);
	}	
	/**
	 * Clicca direttamente sul link del componente dato il nome.
	 */
	async clickComponentLink(componentName: string): Promise<void> {
	  const link = this.getComponentLinkByName(componentName);
	  await link.click();
	}

}

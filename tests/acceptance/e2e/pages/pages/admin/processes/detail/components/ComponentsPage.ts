/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 * Denise Scarcelli
 * Denis Vasilev Dimchev
 * Antonio Abramo Carotenuto
 */

import { expect, Locator, Page } from '@playwright/test';
import { SidebarProcessDetailComponent } from '../../../../../components/admin/process/detail/SidebarProcessDetailComponent';
import { BaseAdminPage } from '../../../BaseAdminPage';
import { ManagePageComponentPage } from './ManagePageComponentPage';
import { NewPageComponentPage } from './NewPageComponentPage';

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
	private readonly pageTitle: Locator;

	// Add component dropdown
	private readonly addComponentButton: Locator;
	private readonly addComponentDropdown: Locator;

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
	private readonly ldtUseCaseScenariosLink: Locator;
	private readonly ldtMapVisualizationLink: Locator;

	// Components table
	private readonly tableHeaders: Locator;
	private readonly componentRows: Locator;

	constructor(page: Page) {
		super(page);

		// Initialize sidebar component
		this.sidebarProcessDetail = new SidebarProcessDetailComponent(page);
		this.newPageComponentPage = new NewPageComponentPage(page);
		this.managePageComponentPage = new ManagePageComponentPage(page);
		// Main page elements
		this.pageTitle = page.locator('.item_show__header-title h1, h1.item_show__header-title');

		// Add component dropdown
		this.addComponentButton = page.locator('button[data-target="add-component-dropdown"]');
		this.addComponentDropdown = page.locator('#add-component-dropdown');

		// Component type links
		this.accountabilityLink = page.locator('a.accountability[href*="components/new?type=accountability"]');
		this.blogLink = page.locator('a.blogs[href*="components/new?type=blogs"]');
		this.budgetsLink = page.locator('a.budgets[href*="components/new?type=budgets"]');
		this.debatesLink = page.locator('a[href*="components/new?type=debates"]');
		this.meetingsLink = page.locator('a[href*="components/new?type=meetings"]');
		this.pagesLink = page.locator('a[href*="components/new?type=pages"]');
		this.proposalsLink = page.locator('a.proposals[href*="components/new?type=proposals"]');
		this.sortitionsLink = page.locator('a.sortitions[href*="components/new?type=sortitions"]');
		this.surveysLink = page.locator('a[href*="components/new?type=surveys"]');
		this.ldtUseCaseScenariosLink = page.locator('a[href*="components/new?type=ldt_use_case_scenarios"]');
		this.ldtMapVisualizationLink = page.locator('a[href*="components/new?type=ldt_map_visualization"]');

		// Components table
		this.tableHeaders = page.locator('.table-list thead th');
		this.componentRows = page.locator('.table-list tbody tr');
	}

	// Navigation and page state
	async navigateToComponents(processSlug: string) {
		await this.page.goto(`/admin/participatory_processes/${processSlug}/components`);
		await this.waitForComponentsPageLoad();
	}

	async waitForComponentsPageLoad() {
		await this.page.waitForSelector('.item_show__wrapper');
		await this.page.waitForSelector('.table-list');
		await this.page.waitForLoadState('domcontentloaded');
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
	async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load') {
		await this.page.waitForLoadState(state);
	}

	// Add component dropdown methods
	async isAddComponentDropdownVisible(): Promise<boolean> {
		return await this.addComponentDropdown.isVisible();
	}

	async openAddComponentDropdown() {
		await this.addComponentButton.click();
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
		await this.page.waitForLoadState('load');
	}

	async addBlogComponent() {
		await this.openAddComponentDropdown();
		await this.blogLink.click();
		await this.page.waitForLoadState('load');
	}

	async addBudgetsComponent() {
		await this.openAddComponentDropdown();
		await this.budgetsLink.click();
		await this.page.waitForLoadState('load');
	}

	async addDebatesComponent() {
		await this.openAddComponentDropdown();
		await Promise.all([
			this.page.waitForURL(/\/admin\/participatory_processes\/[^/]+\/components\/new\?type=debates/),
			this.debatesLink.click()
		]);
	}

	async addMeetingsComponent() {
		await this.openAddComponentDropdown();
		await this.meetingsLink.click();
		await this.page.waitForLoadState('load');
	}

	async addPagesComponent() {
		await this.openAddComponentDropdown();
		await this.pagesLink.click();
		await this.page.waitForLoadState('load');
	}

	async addProposalsComponent() {
		await this.openAddComponentDropdown();
		await this.proposalsLink.click();
		await this.page.waitForLoadState('load');
	}

	async addSortitionsComponent() {
		await this.openAddComponentDropdown();
		await this.sortitionsLink.click();
		await this.page.waitForLoadState('load');
	}

	async addSurveysComponent() {
		await this.openAddComponentDropdown();
		await this.surveysLink.click();
		await this.page.waitForLoadState('load');
	}

	async addLDTUseCaseScenariosComponent() {
		await this.openAddComponentDropdown();
		await this.ldtUseCaseScenariosLink.click();
		await this.page.waitForLoadState('load');
	}

	async addLDTMapVisualizationComponent() {
		await this.openAddComponentDropdown();
		await this.ldtMapVisualizationLink.click();
		await this.page.waitForLoadState('load');
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

	// Opens the 3-dots actions dropdown for a given row
	private async openRowActionsDropdown(row: Locator): Promise<void> {
		await row.locator('button[data-controller="dropdown"]').click();
	}

	// Component actions
	async manageComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		await this.openRowActionsDropdown(row);
		await row.locator('a[href*="/manage/"]').first().click();
		await this.page.waitForLoadState('load');
	}

	async checkPageComponent(componentName: string) {
		await this.addPagesComponent();
		await this.newPageComponentPage.waitForNewPageComponentPageLoad();
		await this.newPageComponentPage.fillComponentName(componentName);
		await this.newPageComponentPage.submitForm();
		await this.page.waitForLoadState('load');
		await this.expectComponentExists(componentName);
		await this.manageComponent(componentName);
		await this.managePageComponentPage.fillBody('This is a test page body');
		await this.managePageComponentPage.savePage();
	}

	async shareComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		await this.openRowActionsDropdown(row);
		await row.locator('a[href*="/share_tokens"]').click();
		await this.page.waitForLoadState('load');
	}

	async configureComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		await this.openRowActionsDropdown(row);
		await row.locator('a[href$="/edit"]').first().click();
		await this.page.waitForLoadState('load');
	}

	async configureFirstComponent() {
		const row = this.getComponentRowByIndex(0);
		await this.openRowActionsDropdown(row);
		await row.locator('a[href$="/edit"]').first().click();
		await this.page.waitForLoadState('load');
	}

	/**
	 * Hide component by clicking the "Hide from menu" action link.
	 */
	async hideComponentByName(componentName: string): Promise<void> {
		const row = this.getComponentRow(componentName);
		await this.openRowActionsDropdown(row);
		const hideLink = row.locator('a[href*="/hide"]');
		if ((await hideLink.count()) > 0) {
			await hideLink.click();
			await this.page.waitForLoadState('load');
		}
	}

	/**
	 * Click on the "Unpublish" action link to unpublish a component.
	 * Always hides first (idempotent), then unpublishes.
	 */
	async unpublishComponentByName(componentName: string): Promise<void> {
		// Hide first if needed (hideComponentByName already checks if hide link exists)
		await this.hideComponentByName(componentName);

		// Open dropdown and click unpublish
		const row = this.getComponentRow(componentName);
		await this.openRowActionsDropdown(row);
		const unpublishLink = row.locator('a[href$="/unpublish"]');
		await unpublishLink.waitFor({ state: 'visible' });
		await unpublishLink.click();
		await this.page.waitForLoadState('load');
	}

	async publishComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		await this.openRowActionsDropdown(row);
		await row.locator('a[href$="/publish"]').click();
		await this.page.waitForLoadState('load');
	}

	async previewComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		await this.openRowActionsDropdown(row);
		await row.locator('a[href*="/processes/"]').click();
		await this.page.waitForLoadState('load');
	}

	async deleteComponent(componentName: string) {
		const row = this.getComponentRow(componentName);
		await this.openRowActionsDropdown(row);
		await row.locator('a[href$="/soft_delete"]').click();
		await this.page.waitForLoadState('load');
	}

	// Component state checks
	async isComponentPublished(componentName: string): Promise<boolean> {
		const row = this.getComponentRow(componentName);
		// If published, no "Unpublished" badge is visible in the Visibility column
		return (await row.locator('strong.label', { hasText: 'Unpublished' }).count()) === 0;
	}

	async isComponentUnpublished(componentName: string): Promise<boolean> {
		const row = this.getComponentRow(componentName);
		return (await row.locator('strong.label', { hasText: 'Unpublished' }).count()) > 0;
	}

	async hasManagePermission(componentName: string): Promise<boolean> {
		const row = this.getComponentRow(componentName);
		return (await row.locator('a[href*="/manage/"]').count()) > 0;
	}

	async hasDeletePermission(componentName: string): Promise<boolean> {
		const row = this.getComponentRow(componentName);
		return (await row.locator('a[href$="/soft_delete"]').count()) > 0;
	}

	// Component link methods
	async getComponentManageUrl(componentName: string): Promise<string | null> {
		const row = this.getComponentRow(componentName);
		return await row.locator('a[href*="/manage/"]').first().getAttribute('href');
	}

	async getComponentPreviewUrl(componentName: string): Promise<string | null> {
		const row = this.getComponentRow(componentName);
		return await row.locator('a[href*="/processes/"]').getAttribute('href');
	}

	async getComponentConfigureUrl(componentName: string): Promise<string | null> {
		const row = this.getComponentRow(componentName);
		return await row.locator('a[href$="/edit"]').first().getAttribute('href');
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

			// Check if component is published by absence of the "Unpublished" badge
			const published = (await row.locator('strong.label', { hasText: 'Unpublished' }).count()) === 0;

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
	 * Deletes a component by name or regex if it exists.
	 * Works with pages that expose role="option" and with normal tables.
	 */
	async deleteComponentIfExists(componentName: string | RegExp) {
		// try the semantic locator (when present)
		let rowLocator = this.page.getByRole('option', { name: componentName });

		// fallback: find table rows that contain the text
		if ((await rowLocator.count()) === 0) {
			rowLocator = this.page.locator('table tbody tr', { hasText: componentName });
		}

		// if there are no matches, exit
		if ((await rowLocator.count()) === 0) {
			console.log(`Component "${componentName}" not found, skipping deletion.`);
			return;
		}

		// take the first match and open its actions dropdown, then click delete
		const row = rowLocator.first();
		await this.openRowActionsDropdown(row);
		const deleteLink = row.locator('a[href$="/soft_delete"]');

		if ((await deleteLink.count()) === 0) {
			console.log(`Delete link not found for "${componentName}", skipping deletion.`);
			return;
		}

		await deleteLink.first().click();

		// confirm the deletion via the custom confirm modal
		const okButton = this.page.locator('button[data-confirm-ok]');
		await okButton.click();

		// Wait for the page to reload after deletion
		await this.page.waitForLoadState('load');

		// Verify the row is no longer visible
		await expect(rowLocator.first()).not.toBeVisible();
	}

	/**
	 * Returns the link of a component based on the exact name
	 * @param componentName Exact text of the link in the table
	 */
	getComponentLinkByName(componentName: string): Locator {
		return this.componentRows.getByRole('link', { name: componentName, exact: true }).first();
	}
	/**
	 * Click on link component from name
	 */
	async clickComponentLink(componentName: string): Promise<void> {
		const link = this.getComponentLinkByName(componentName);
		await link.click();
	}
	/**
	 * Verify that the Export button is visible
	 */
	async expectExportButtonVisible(): Promise<void> {
		await expect(this.page.locator('button[data-target="export-dropdown"]')).toBeVisible();
	}

	/**
	 * Click on the Export button to open export dropdown/modal
	 */
	async clickExportButton(): Promise<void> {
		await this.page.locator('button[data-target="export-dropdown"]').click();
	}

	/**
	 * Select a specific export format from the export options
	 * Generic method that works for all component types (Survey, Meeting, Debate)
	 * @param fileFormat - The format to export (CSV, JSON, Excel, PDF)
	 * @param exportType - Optional: The type of data to export
	 */
	async selectExportFormat(fileFormat: string, exportType?: string): Promise<void> {
		const exportDropdown = this.page.locator('#export-dropdown');

		// PDF format: Decidim uses 'FormPDF' in the href
		const hrefFormat = fileFormat === 'PDF' ? 'FormPDF' : fileFormat;

		if (!exportType) {
			// No disambiguation needed (e.g. surveys: single set of links)
			await exportDropdown.locator(`a.dropdown__button:has-text("Export ${fileFormat}")`).click();
			return;
		}

		// Detect component type by checking which id-params are present in the dropdown,
		// then resolve the human-readable exportType to the ?id= query param.
		const hasMeetings = (await this.page.locator('#export-dropdown a[href*="id=meetings"]').count()) > 0;
		const exportTypeToId: Record<string, string> = hasMeetings
			? { Meetings: 'meetings', Comments: 'meeting_comments', Answers: 'responses' }
			: { Debates: 'debates', Comments: 'debate_comments' };

		const idParam = exportTypeToId[exportType];
		if (idParam) {
			await exportDropdown
				.locator(`a.dropdown__button[href*="exports.${hrefFormat}"][href*="id=${idParam}"]`)
				.click();
		} else {
			// Fallback: match by visible text (works when only one link exists for this format)
			await exportDropdown.locator(`a.dropdown__button:has-text("Export ${fileFormat}")`).click();
		}
	}

	/**
	 * Complete export process: open export menu and select format
	 * @param fileFormat - The format to export (CSV, JSON, Excel, PDF)
	 * @param exportType - Optional: The type of data to export
	 */
	async exportComponentData(fileFormat: string, exportType?: string): Promise<void> {
		await this.clickExportButton();
		await this.selectExportFormat(fileFormat, exportType);
	}

	/**
	 * Verify that the export confirmation message is displayed
	 */
	async expectExportConfirmationMessage(): Promise<void> {
		await expect(this.page.getByText('Your export is currently in')).toBeVisible();
	}

	/**
	 * Verifies that the component was created successfully by checking the success message
	 */
	async verifyComponentCreatedSuccessfully(): Promise<void> {
		await expect(this.page.getByText('Component created successfully')).toBeVisible();
	}
}

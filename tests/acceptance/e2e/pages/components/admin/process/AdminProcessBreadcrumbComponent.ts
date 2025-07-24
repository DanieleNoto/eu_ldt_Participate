import { Page } from '@playwright/test';

/**
 * Component for the breadcrumb specific to the admin processes section.
 * Manages the breadcrumb, the "New process" button, and the "Manage" dropdown.
 */
export class AdminProcessBreadcrumbComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get processTitle() {
		return this.page.locator('.process-title');
	}

	private get breadcrumbContainer() {
		return this.processTitle.locator('.process-title-content');
	}

	private get breadcrumbLeft() {
		return this.breadcrumbContainer.locator('.process-title-content-breadcrumb-container-left');
	}

	private get breadcrumbRight() {
		return this.breadcrumbContainer.locator('.process-title-content-breadcrumb-container-right');
	}

	// Selectors for the left breadcrumb
	private get homeIcon() {
		return this.breadcrumbLeft.locator('.process-title-content-icon-home');
	}

	private get breadcrumbSeparator() {
		return this.breadcrumbLeft.locator('.text-white');
	}

	private get processesLabel() {
		return this.breadcrumbLeft.locator('.process-title-content-breadcrumb');
	}

	// Selectors for the right breadcrumb (actions)
	private get newProcessButton() {
		return this.breadcrumbRight.locator('a[href*="/admin/participatory_processes/new"]');
	}

	private get manageDropdownTrigger() {
		return this.breadcrumbRight.locator('[data-target="processes-dropdown-menu-settings"]');
	}

	private get manageDropdownMenu() {
		return this.page.locator('#processes-dropdown-menu-settings');
	}

	// Selectors for the "Manage" dropdown items
	private get processesMenuItem() {
		return this.manageDropdownMenu.locator('a[href*="/admin/participatory_processes"]').first();
	}

	private get importMenuItem() {
		return this.manageDropdownMenu.locator('a[href*="/admin/participatory_processes/imports/new"]');
	}

	private get processTypesMenuItem() {
		return this.manageDropdownMenu.locator('a[href*="/admin/participatory_process_types"]');
	}

	// Verification methods
	async isBreadcrumbVisible(): Promise<boolean> {
		return await this.processTitle.isVisible();
	}

	async isHomeIconVisible(): Promise<boolean> {
		return await this.homeIcon.isVisible();
	}

	async isProcessesLabelVisible(): Promise<boolean> {
		return await this.processesLabel.isVisible();
	}

	async isNewProcessButtonVisible(): Promise<boolean> {
		return await this.newProcessButton.isVisible();
	}

	async isManageDropdownVisible(): Promise<boolean> {
		return await this.manageDropdownTrigger.isVisible();
	}

	// Methods to get text
	async getProcessesLabelText(): Promise<string> {
		return (await this.processesLabel.textContent()) || '';
	}

	async getNewProcessButtonText(): Promise<string> {
		return (await this.newProcessButton.textContent()) || '';
	}

	async getManageDropdownText(): Promise<string> {
		return (await this.manageDropdownTrigger.textContent()) || '';
	}

	// Navigation methods
	async clickHomeIcon(): Promise<void> {
		await this.homeIcon.click();
	}

	async clickNewProcess(): Promise<void> {
		await this.newProcessButton.click();
	}

	async openManageDropdown(): Promise<void> {
		await this.manageDropdownTrigger.click();
	}

	async closeManageDropdown(): Promise<void> {
		// Click outside to close
		await this.processesLabel.click();
	}

	// Methods for navigation via dropdown
	async navigateToProcesses(): Promise<void> {
		await this.openManageDropdown();
		await this.processesMenuItem.click();
	}

	async navigateToImport(): Promise<void> {
		await this.openManageDropdown();
		await this.importMenuItem.click();
	}

	async navigateToProcessTypes(): Promise<void> {
		await this.openManageDropdown();
		await this.processTypesMenuItem.click();
	}

	// Methods to check the dropdown state
	async isManageDropdownOpen(): Promise<boolean> {
		return await this.manageDropdownMenu.isVisible();
	}

	async getManageDropdownItems(): Promise<string[]> {
		await this.openManageDropdown();
		const items = await this.manageDropdownMenu.locator('.dropdown__item a').all();
		const itemTexts: string[] = [];

		for (const item of items) {
			const text = await item.textContent();
			if (text) {
				itemTexts.push(text.trim());
			}
		}

		await this.closeManageDropdown();
		return itemTexts;
	}

	// Methods to check aria-current
	async isProcessesLabelCurrent(): Promise<boolean> {
		const ariaCurrent = await this.processesLabel.getAttribute('aria-current');
		return ariaCurrent === 'page';
	}

	// Check if the component is fully loaded
	async isComponentFullyLoaded(): Promise<boolean> {
		const breadcrumbVisible = await this.isBreadcrumbVisible();
		const homeIconVisible = await this.isHomeIconVisible();
		const labelVisible = await this.isProcessesLabelVisible();
		const buttonVisible = await this.isNewProcessButtonVisible();
		const dropdownVisible = await this.isManageDropdownVisible();

		return breadcrumbVisible && homeIconVisible && labelVisible && buttonVisible && dropdownVisible;
	}
}

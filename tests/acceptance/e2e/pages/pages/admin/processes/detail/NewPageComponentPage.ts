import { expect, Locator, Page } from '@playwright/test';
import { LocalizationUtils } from '../../../../../utils/localization.utils';
import { BaseAdminPage } from '../../BaseAdminPage';

/**
 * Page Object Model for creating a new Page component in process detail management.
 * Simplified version for English-only testing using LocalizationUtils.
 */
export class NewPageComponentPage extends BaseAdminPage {
	// Main page elements
	private readonly pageWrapper: Locator;
	private readonly pageTitle: Locator;
	private readonly form: Locator;

	// Order position field
	private readonly orderPositionInput: Locator;

	// Submit button
	private readonly submitButton: Locator;

	constructor(page: Page) {
		super(page);

		// Main page elements
		this.pageWrapper = page.locator('.item_show__wrapper');
		this.pageTitle = page.locator('.item_show__header-title h1');
		this.form = page.locator('form.new_component');

		// Order position field
		this.orderPositionInput = page.locator('#component_weight');

		// Submit button
		this.submitButton = page.locator('button[type="submit"][name="commit"]');
	}

	// Navigation and page state
	async navigateToNewPageComponent(processSlug: string) {
		await this.navigateTo(`/admin/participatory_processes/${processSlug}/components/new?type=pages`);
		await this.waitForNewPageComponentPageLoad();
	}

	async waitForNewPageComponentPageLoad() {
		await this.waitForElement('.item_show__wrapper');
		await this.waitForElement('form.new_component');
		await this.waitForLoadState('networkidle');
	}

	async isOnNewPageComponentPage(): Promise<boolean> {
		const url = this.getPage().url();
		return (
			url.includes('/admin/participatory_processes/') &&
			url.includes('/components/new') &&
			url.includes('type=pages')
		);
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	// Component name methods using LocalizationUtils
	async fillComponentName(name: string) {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'component_name');
		const input = this.getPage().locator(selector);
		await input.clear();
		await input.fill(name);
	}

	async getComponentName(): Promise<string> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'component_name');
		const input = this.getPage().locator(selector);
		return (await input.inputValue()) || '';
	}

	// Order position methods
	async setOrderPosition(position: number) {
		await this.orderPositionInput.clear();
		await this.orderPositionInput.fill(position.toString());
	}

	async getOrderPosition(): Promise<number> {
		const value = await this.orderPositionInput.inputValue();
		return parseInt(value) || 0;
	}

	// Global announcement methods using LocalizationUtils
	async fillGlobalAnnouncement(content: string) {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.getPage(),
			'component_settings_announcement'
		);
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);

		// Wait for the rich text editor to be ready
		await editorLocator.waitFor({ state: 'visible' });
		await editorLocator.fill(content);
	}

	async getGlobalAnnouncement(): Promise<string> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.getPage(),
			'component_settings_announcement'
		);
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);
		return await editorLocator.inputValue();
	}

	// Step announcement methods using LocalizationUtils
	async fillStepAnnouncement(content: string) {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.getPage(),
			'component_step_settings_9_announcement'
		);
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);

		// Wait for the rich text editor to be ready
		await editorLocator.waitFor({ state: 'visible' });
		await editorLocator.fill(content);
	}

	async getStepAnnouncement(): Promise<string> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.getPage(),
			'component_step_settings_9_announcement'
		);
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);
		return await editorLocator.inputValue();
	}

	// Form submission methods
	async submitForm() {
		await this.submitButton.click();
		await this.waitForLoadState('networkidle');
	}

	async isSubmitButtonEnabled(): Promise<boolean> {
		return await this.submitButton.isEnabled();
	}

	async isSubmitButtonVisible(): Promise<boolean> {
		return await this.submitButton.isVisible();
	}

	// Combined methods for easier usage
	async fillNewPageComponentForm(data: {
		name: string;
		orderPosition?: number;
		globalAnnouncement?: string;
		stepAnnouncement?: string;
	}) {
		// Fill component name
		await this.fillComponentName(data.name);

		// Fill order position if provided
		if (data.orderPosition !== undefined) {
			await this.setOrderPosition(data.orderPosition);
		}

		// Fill global announcement if provided
		if (data.globalAnnouncement) {
			await this.fillGlobalAnnouncement(data.globalAnnouncement);
		}

		// Fill step announcement if provided
		if (data.stepAnnouncement) {
			await this.fillStepAnnouncement(data.stepAnnouncement);
		}
	}

	// Validation methods
	async expectToBeOnNewPageComponentPage() {
		await expect(this.getPage()).toHaveURL(/\/admin\/participatory_processes\/.*\/components\/new\?type=pages$/);
	}

	async expectPageTitle(expectedTitle: string) {
		await expect(this.pageTitle).toHaveText(expectedTitle);
	}

	async expectComponentName(expectedName: string) {
		const actualName = await this.getComponentName();
		expect(actualName).toBe(expectedName);
	}

	async expectOrderPosition(expectedPosition: number) {
		await expect(this.orderPositionInput).toHaveValue(expectedPosition.toString());
	}

	async expectSubmitButtonToBeEnabled() {
		await expect(this.submitButton).toBeEnabled();
	}

	async expectSubmitButtonToBeDisabled() {
		await expect(this.submitButton).toBeDisabled();
	}

	// Debug methods
	async debugFormState() {
		console.log('=== New Page Component Form Debug State ===');
		console.log('URL:', this.getPage().url());
		console.log('Page title:', await this.getPageTitle());
		console.log('Order position:', await this.getOrderPosition());
		console.log('Submit button enabled:', await this.isSubmitButtonEnabled());
		console.log('===========================================');
	}
}

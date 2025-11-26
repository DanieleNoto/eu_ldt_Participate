import { expect, Locator, Page } from '@playwright/test';
import { LocalizationUtils } from '../../../../../../utils/localization.utils';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * Page Object Model for managing a Page component in Decidim admin.
 * Simplified version for English-only testing using LocalizationUtils.
 */
export class ManagePageComponentPage extends BaseAdminPage {
	// Main page elements
	private readonly pageWrapper: Locator;
	private readonly pageTitle: Locator;
	private readonly editPageForm: Locator;

	// Update button
	private readonly updateButton: Locator;

	constructor(page: Page) {
		super(page);

		// Main page elements
		this.pageWrapper = page.locator('.wrapper');
		this.pageTitle = page.locator('h1');
		this.editPageForm = page.locator('form.edit_page');
		this.updateButton = page.locator('button[type="submit"][name="commit"]');
	}

	/**
	 * Navigates to the Page component management page
	 * @param processSlug - The slug of the process
	 * @param componentSlug - The slug of the page component
	 */
	async navigateToManagePage(processSlug: string, componentSlug: string): Promise<void> {
		await this.navigateTo(
			`/admin/participatory_processes/${processSlug}/components/${componentSlug}/manage/static_pages`
		);
		await this.waitForPageLoad();
	}

	/**
	 * Waits for the page to load completely
	 */
	async waitForPageLoad(): Promise<void> {
		await expect(this.pageWrapper).toBeVisible();
		await expect(this.editPageForm).toBeVisible();
	}

	/**
	 * Verifies that the page is correctly loaded
	 */
	async verifyPageLoaded(): Promise<void> {
		await expect(this.pageTitle).toBeVisible();
		await expect(this.editPageForm).toBeVisible();
		await expect(this.updateButton).toBeVisible();
	}

	// Content editing methods using LocalizationUtils

	/**
	 * Fills the title field using LocalizationUtils
	 * @param title - The title text
	 */
	async fillTitle(title: string): Promise<void> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'static_page_title');
		const input = this.getPage().locator(selector);
		await input.clear();
		await input.fill(title);
	}

	/**
	 * Gets the title field value using LocalizationUtils
	 */
	async getTitle(): Promise<string> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'static_page_title');
		const input = this.getPage().locator(selector);
		return (await input.inputValue()) || '';
	}

	/**
	 * Fills the body content using the rich text editor with LocalizationUtils
	 * @param content - The content text
	 */
	async fillBody(content: string): Promise<void> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'page_body');
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);

		// Wait for the rich text editor to be ready
		await editorLocator.waitFor({ state: 'visible' });
		await editorLocator.fill(content);
	}

	/**
	 * Gets the body content using LocalizationUtils
	 */
	async getBody(): Promise<string> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'page_body');
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);
		return await editorLocator.innerText();
	}

	/**
	 * Fills both title and body content
	 * @param title - The title text
	 * @param body - The body content
	 */
	async fillContent(title: string, body: string): Promise<void> {
		await this.fillBody(body);
	}

	// Form submission methods

	/**
	 * Clicks the update button to save changes
	 */
	async clickUpdateButton(): Promise<void> {
		await this.updateButton.click();
	}

	/**
	 * Saves the page content and waits for confirmation
	 */
	async savePage(): Promise<void> {
		await this.clickUpdateButton();
		// Wait for the form to submit and page to reload or show success message
		await this.waitForLoadState('networkidle');
	}

	// Validation methods

	/**
	 * Verifies that the update button is visible and enabled
	 */
	async verifyUpdateButtonVisible(): Promise<void> {
		await expect(this.updateButton).toBeVisible();
		await expect(this.updateButton).toBeEnabled();
	}

	/**
	 * Verifies that content fields are visible
	 */
	async verifyContentFieldsVisible(): Promise<void> {
		const titleSelector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'static_page_title');
		const bodySelector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'static_page_content');

		await expect(this.getPage().locator(titleSelector)).toBeVisible();
		await expect(this.getPage().locator(bodySelector)).toBeVisible();
	}

	/**
	 * Gets the current URL of the page
	 */
	async getCurrentUrl(): Promise<string> {
		return this.getPage().url();
	}

	/**
	 * Reloads the current page
	 */
	async reloadPage(): Promise<void> {
		await this.getPage().reload();
		await this.waitForPageLoad();
	}

	/**
	 * Waits for the page to have a specific URL pattern
	 */
	async waitForUrl(pattern: RegExp): Promise<void> {
		await this.getPage().waitForURL(pattern);
	}

	/**
	 * Sets up a route to simulate network errors
	 */
	async simulateNetworkError(urlPattern: string): Promise<void> {
		await this.getPage().route(urlPattern, async route => {
			if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
				await route.fulfill({
					status: 500,
					contentType: 'text/html',
					body: 'Internal Server Error'
				});
			} else {
				await route.continue();
			}
		});
	}

	/**
	 * Removes all route handlers
	 */
	async clearNetworkInterception(urlPattern: string): Promise<void> {
		await this.getPage().unroute(urlPattern);
	}

	/**
	 * Waits for a specific timeout
	 */
	async waitForTimeout(milliseconds: number): Promise<void> {
		await this.getPage().waitForTimeout(milliseconds);
	}

	/**
	 * Checks if the page URL contains manage/static_pages
	 */
	async isOnManagePageUrl(): Promise<boolean> {
		const url = await this.getCurrentUrl();
		return url.includes('/manage/static_pages');
	}

	/**
	 * Checks for error messages on the page
	 */
	async hasErrorMessages(): Promise<boolean> {
		const errorSelectors = [
			'.error',
			'.alert-error',
			'.field-error',
			'[data-error]',
			'.form-error',
			'.validation-error'
		];

		for (const selector of errorSelectors) {
			const isVisible = await this.getPage()
				.locator(selector)
				.isVisible()
				.catch(() => false);
			if (isVisible) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Gets the page title element locator for direct Playwright access
	 */
	getPageTitleLocator() {
		return this.pageTitle;
	}

	/**
	 * Gets the title field locator for direct Playwright access
	 */
	async getTitleFieldLocator() {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'static_page_title');
		return this.getPage().locator(selector);
	}

	/**
	 * Gets the body field locator for direct Playwright access
	 */
	async getBodyFieldLocator() {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'static_page_content');
		return this.getPage().locator(`${selector} .tiptap`);
	}

	/**
	 * Expects the page to be loaded with correct URL pattern
	 */
	async expectToBeOnManagePage() {
		await expect(this.getPage()).toHaveURL(
			/\/admin\/participatory_processes\/.*\/components\/.*\/manage\/static_pages$/
		);
	}

	/**
	 * Expects the title field to have a specific value
	 */
	async expectTitle(expectedTitle: string) {
		const actualTitle = await this.getTitle();
		expect(actualTitle).toBe(expectedTitle);
	}

	/**
	 * Expects the update button to be enabled
	 */
	async expectUpdateButtonToBeEnabled() {
		await expect(this.updateButton).toBeEnabled();
	}

	/**
	 * Expects the update button to be disabled
	 */
	async expectUpdateButtonToBeDisabled() {
		await expect(this.updateButton).toBeDisabled();
	}

	public async expectBodyContent(expectedContent: string): Promise<void> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'page_body');
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);
		await editorLocator.waitFor({ state: 'visible' });
		await expect(editorLocator).toHaveText(expectedContent);
	}
}

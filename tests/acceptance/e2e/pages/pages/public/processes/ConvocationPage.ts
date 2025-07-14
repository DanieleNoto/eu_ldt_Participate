import { expect, Locator, Page } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';

/**
 * Page Object Model for the Convocation Page.
 * Manages the display of the convocation page content of a participatory process.
 */
export class ConvocationPage extends AuthenticatedPage {
	// Main content elements
	private readonly contentContainer: Locator;
	private readonly mainElement: Locator;
	private readonly contentWrapper: Locator;

	// Page title elements
	private readonly titleSection: Locator;
	private readonly pageTitle: Locator;

	// Content elements
	private readonly editorContent: Locator;
	private readonly richTextDisplay: Locator;

	constructor(page: Page) {
		super(page);

		// Main content elements
		this.contentContainer = page.locator('#content[data-content]');
		this.mainElement = page.locator('main.layout-1col');
		this.contentWrapper = page.locator('.py-12.space-y-12');

		// Page title elements
		this.titleSection = page.locator('.text-center');
		this.pageTitle = page.locator('h1.h1.decorator');

		// Content elements
		this.editorContent = page.locator('.editor-content');
		this.richTextDisplay = page.locator('.rich-text-display');
	}

	// Navigation methods

	/**
	 * Navigates to a convocation page using process slug and component ID
	 * @param processSlug - The slug of the process
	 * @param componentId - The ID of the convocation page component
	 */
	async navigateToConvocationPage(processSlug: string, componentId: string): Promise<void> {
		await this.navigateTo(`/processes/${processSlug}/f/${componentId}/`);
		await this.waitForPageLoad();
	}

	/**
	 * Waits for the page to load completely
	 */
	async waitForPageLoad(): Promise<void> {
		await this.waitForElement('main.layout-1col');
		await this.waitForElement('h1.h1.decorator');
		await this.waitForLoadState('networkidle');
	}

	// Content verification methods

	/**
	 * Gets the page title text
	 */
	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	/**
	 * Gets the page content text
	 */
	async getPageContent(): Promise<string> {
		return (await this.richTextDisplay.textContent()) || '';
	}

	/**
	 * Checks if the page has content
	 */
	async hasContent(): Promise<boolean> {
		const content = await this.getPageContent();
		return content.trim().length > 0;
	}

	/**
	 * Checks if the page title is "Convocation Page"
	 */
	async isTitleConvocationPage(): Promise<boolean> {
		const title = await this.getPageTitle();
		return title.trim() === 'Page';
	}

	// Verification methods

	/**
	 * Verifies that the page title is "Convocation Page"
	 */
	async expectTitleToBeConvocationPage(): Promise<void> {
		await expect(this.pageTitle).toHaveText('Page');
	}

	/**
	 * Verifies that the page has content
	 */
	async expectPageToHaveContent(): Promise<void> {
		await expect(this.richTextDisplay).not.toBeEmpty();
		const hasContent = await this.hasContent();
		expect(hasContent).toBe(true);
	}

	/**
	 * Verifies that the page has specific content text
	 * @param expectedContent - The expected content text
	 */
	async expectPageContent(expectedContent: string): Promise<void> {
		await expect(this.richTextDisplay).toHaveText(expectedContent);
	}

	/**
	 * Verifies that the convocation page is properly loaded
	 */
	async expectToBeOnConvocationPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes\/[^\/]+\/f\/\d+\/$/);
		await expect(this.mainElement).toBeVisible();
		await this.expectTitleToBeConvocationPage();
		await this.expectPageToHaveContent();
	}

	// Page state verification

	/**
	 * Checks if the page layout is properly loaded
	 */
	async isPageLayoutLoaded(): Promise<boolean> {
		const contentLoaded = await this.contentContainer.isVisible();
		const mainLoaded = await this.mainElement.isVisible();
		const wrapperLoaded = await this.contentWrapper.isVisible();
		const titleLoaded = await this.titleSection.isVisible();

		return contentLoaded && mainLoaded && wrapperLoaded && titleLoaded;
	}

	/**
	 * Checks if the content section is properly loaded
	 */
	async isContentLoaded(): Promise<boolean> {
		const editorLoaded = await this.editorContent.isVisible();
		const richTextLoaded = await this.richTextDisplay.isVisible();

		return editorLoaded && richTextLoaded;
	}

	// Debug methods

	/**
	 * Debug method to log page information
	 */
	async debugPageInfo(): Promise<void> {
		console.log('=== Convocation Page Debug ===');
		console.log('URL:', this.getPage().url());
		console.log('Page title:', await this.getPageTitle());
		console.log('Has content:', await this.hasContent());
		console.log('Content:', await this.getPageContent());
		console.log('Is title "Convocation Page":', await this.isTitleConvocationPage());
		console.log('==============================');
	}
}

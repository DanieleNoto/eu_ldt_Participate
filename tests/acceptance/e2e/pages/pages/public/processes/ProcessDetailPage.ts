import { expect, Locator, Page, Download } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, unlinkSync } from 'fs';

/**
 * Page Object Model for the participatory process detail page.
 * Manages the display of process details and navigation to its components.
 */
export class ProcessDetailPage extends AuthenticatedPage {
	// Main content elements
	private readonly contentContainer: Locator;
	private readonly mainElement: Locator;
	private readonly participatorySpaceContainer: Locator;

	// Hero section elements
	private readonly heroSection: Locator;
	private readonly processTitle: Locator;
	private readonly processSlogan: Locator;

	// Navigation dropdown
	private readonly navContainer: Locator;
	private readonly navDropdownTrigger: Locator;
	private readonly navDropdownMenu: Locator;
	private readonly navItems: Locator;

	// Help elements
	private readonly debatesLink: Locator;
	private readonly meetingsLink: Locator;

	// Related documents section
	private readonly relatedDocumentsHeading: Locator;
	private readonly attachmentLinks: Locator;

	constructor(page: Page) {
		super(page);

		// Main content elements
		this.contentContainer = page.locator('#content[data-content]');
		this.mainElement = page.locator('main');
		this.participatorySpaceContainer = page.locator('.participatory-space__container');

		// Hero section elements
		this.heroSection = page.locator('section[data-process-hero]');
		this.processTitle = page.locator('.participatory-space__hero-text h1');
		this.processSlogan = page.locator('.participatory-space__hero-slogan');

		// Navigation dropdown
		this.navContainer = page.locator('.participatory-space__nav-container');
		this.navDropdownTrigger = page.locator('#dropdown-trigger-participatory-space');
		this.navDropdownMenu = page.locator('#dropdown-menu-participatory-space');
		this.navItems = page.locator('.participatory-space__nav-item');

		// Help elements
		this.debatesLink = page.locator('a[href$="/debates"]:visible').first();
		this.meetingsLink = page.locator('a[href$="/meetings"]:visible').first();

		// Related documents section
		this.relatedDocumentsHeading = page
			.locator('.content-block__title h2.decorator')
			.filter({ hasText: 'Related documents' });
		this.attachmentLinks = page.locator('a[title="Download file"]');
	}

	// Navigation methods

	/**
	 * Navigates to a specific process detail page using its slug
	 * @param processSlug - The slug of the process to navigate to
	 */
	async navigateToProcess(processSlug: string): Promise<void> {
		await this.navigateTo(`/processes/${processSlug}`);
		await this.waitForPageLoad();
	}

	/**
	 * Waits for the page to load completely
	 */
	async waitForPageLoad(): Promise<void> {
		await this.waitForElement('.participatory-space__container');
		await this.waitForElement('section[data-process-hero]');
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to the convocation page from the navigation dropdown
	 */
	async navigateToConvocationPage(): Promise<void> {
		// Ensure the dropdown is open
		await this.openNavigationDropdown();

		// Find and click the convocation page link
		const convocationLink = this.navItems.filter({ hasText: 'Page' });
		await convocationLink.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to the debates page from the link
	 */
	async navigateToDebatesPage(): Promise<void> {
		// Find and click the debates page link
		await this.debatesLink.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to the meetings page from the link
	 */
	async navigateToMeetingsPage(): Promise<void> {
		// Find and click the meetings page link
		await this.meetingsLink.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Navigates to a specific component by its name from the navigation dropdown
	 * @param componentName - The name of the component to navigate to
	 */
	async navigateToComponent(componentName: string): Promise<void> {
		// Ensure the dropdown is open
		await this.openNavigationDropdown();

		// Find and click the component link
		const componentLink = this.navItems.filter({ hasText: componentName });
		await componentLink.click();
		await this.waitForLoadState('networkidle');
	}

	// Navigation dropdown interaction methods

	/**
	 * Opens the navigation dropdown if not already open
	 */
	async openNavigationDropdown(): Promise<void> {
		const isExpanded = await this.navDropdownTrigger.getAttribute('aria-expanded');
		if (isExpanded !== 'true') {
			await this.navDropdownTrigger.click();
			await this.navDropdownMenu.waitFor({ state: 'visible' });
		}
	}

	/**
	 * Closes the navigation dropdown if open
	 */
	async closeNavigationDropdown(): Promise<void> {
		const isExpanded = await this.navDropdownTrigger.getAttribute('aria-expanded');
		if (isExpanded === 'true') {
			await this.navDropdownTrigger.click();
			await this.navDropdownMenu.waitFor({ state: 'hidden' });
		}
	}

	/**
	 * Checks if the navigation dropdown is open
	 */
	async isNavigationDropdownOpen(): Promise<boolean> {
		const isExpanded = await this.navDropdownTrigger.getAttribute('aria-expanded');
		return isExpanded === 'true';
	}

	// Information methods

	/**
	 * Gets the process title from the hero section
	 */
	async getProcessTitle(): Promise<string> {
		return (await this.processTitle.textContent()) || '';
	}

	/**
	 * Gets the process slogan from the hero section
	 */
	async getProcessSlogan(): Promise<string> {
		return (await this.processSlogan.textContent()) || '';
	}

	/**
	 * Gets all available navigation component names
	 */
	async getAvailableComponents(): Promise<string[]> {
		await this.openNavigationDropdown();

		const components: string[] = [];
		const count = await this.navItems.count();

		for (let i = 0; i < count; i++) {
			const text = await this.navItems.nth(i).textContent();
			if (text) {
				// Remove the arrow icon text and trim
				const componentName = text.replace(/\s*→\s*$/, '').trim();
				components.push(componentName);
			}
		}

		return components;
	}

	/**
	 * Checks if a specific component is available in the navigation
	 * @param componentName - The name of the component to check
	 */
	async hasComponent(componentName: string): Promise<boolean> {
		const components = await this.getAvailableComponents();
		return components.includes(componentName);
	}

	/**
	 * Checks if the convocation page is available
	 */
	async hasConvocationPage(): Promise<boolean> {
		return await this.hasComponent('Convocation Page');
	}

	/**
	 * Gets the URL of the convocation page
	 */
	async getConvocationPageUrl(): Promise<string> {
		await this.openNavigationDropdown();
		const convocationLink = this.navItems.filter({ hasText: 'Convocation Page' });
		const href = await convocationLink.getAttribute('href');
		return href || '';
	}

	/**
	 * Gets the URL of a specific component
	 * @param componentName - The name of the component
	 */
	async getComponentUrl(componentName: string): Promise<string> {
		await this.openNavigationDropdown();
		const componentLink = this.navItems.filter({ hasText: componentName });
		const href = await componentLink.getAttribute('href');
		return href || '';
	}

	// Verification methods

	/**
	 * Verifies that the process detail page is properly loaded
	 */
	async expectToBeOnProcessDetailPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes\/[^\/]+$/);
		await expect(this.heroSection).toBeVisible();
		await expect(this.processTitle).toBeVisible();
		await expect(this.navContainer).toBeVisible();
	}

	/**
	 * Expects the process to have a specific title
	 * @param expectedTitle - The expected process title
	 */
	async expectProcessTitle(expectedTitle: string): Promise<void> {
		await expect(this.processTitle).toHaveText(expectedTitle);
	}

	/**
	 * Expects the convocation page to be available
	 */
	async expectConvocationPageToBeAvailable(): Promise<void> {
		const hasConvocation = await this.hasConvocationPage();
		expect(hasConvocation).toBe(true);
	}

	/**
	 * Expects a specific component to be available
	 * @param componentName - The name of the component
	 */
	async expectComponentToBeAvailable(componentName: string): Promise<void> {
		const hasComponent = await this.hasComponent(componentName);
		expect(hasComponent).toBe(true);
	}
	/**
	 * Expects the participatory container to be visible
	 */
	async expectParticipatoryContainerToBeVisible(): Promise<void> {
		this.expectToBeOnProcessDetailPage();
		expect(this.participatorySpaceContainer).toBeVisible();
	}

	/**
	 * Expects the current process to be a private process
	 */
	async expectToBePrivateProcess(): Promise<void> {
		const privateProcessText = this.getPage().getByText('This is a private process');
		await expect(privateProcessText).toBeVisible();
	}

	/**
	 * Expects to be on a process detail page with valid URL pattern
	 */
	async expectToBeOnValidProcessDetailPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/processes\/[^\/]+$/);
	}

	// Page state verification

	/**
	 * Checks if the page layout is properly loaded
	 */
	async isPageLayoutLoaded(): Promise<boolean> {
		const contentLoaded = await this.contentContainer.isVisible();
		const mainLoaded = await this.mainElement.isVisible();
		const containerLoaded = await this.participatorySpaceContainer.isVisible();
		const heroLoaded = await this.heroSection.isVisible();

		return contentLoaded && mainLoaded && containerLoaded && heroLoaded;
	}

	/**
	 * Checks if the navigation dropdown is available and functional
	 */
	async isNavigationAvailable(): Promise<boolean> {
		const navLoaded = await this.navContainer.isVisible();
		const triggerLoaded = await this.navDropdownTrigger.isVisible();

		return navLoaded && triggerLoaded;
	}

	/**
	 * Verifies that the "Related documents" section is visible on the page
	 */
	async expectRelatedDocumentsSectionToBeVisible(): Promise<void> {
		await expect(this.relatedDocumentsHeading).toBeVisible();
	}

	/**
	 * Verifies that an attachment with the given title is visible and downloads the file
	 * @param attachmentTitle - The title of the attachment to verify and download
	 */
	async verifyAndDownloadAttachment(attachmentTitle: string): Promise<void> {
		// First verify the Related documents section is visible
		await this.expectRelatedDocumentsSectionToBeVisible();

		// Look for the attachment link by title text within the card content
		const attachmentTitleLink = this.getPage().locator('.card__list-title').filter({ hasText: attachmentTitle });

		// Verify the attachment title link is visible
		await expect(attachmentTitleLink).toBeVisible();
		console.log(`Attachment "${attachmentTitle}" is visible on the page`);

		try {
			console.log('Setting up popup and download listeners...');

			// Register event listeners before any action
			const popupPromise = this.getPage().waitForEvent('popup');
			const downloadPromise = this.getPage().waitForEvent('download');

			console.log('Listeners registered, now clicking...');

			// Now perform the click
			await attachmentTitleLink.click();

			console.log('Click performed, waiting for events...');

			// Wait for both events to complete
			const [popup, download] = await Promise.all([popupPromise, downloadPromise]);

			console.log('Both popup and download received successfully');

			// Close the popup immediately
			await popup.close();
			console.log('Popup closed');

			// Process the download
			const suggestedFilename = download.suggestedFilename();
			console.log(`Downloaded filename: "${suggestedFilename}"`);

			// Save to temp directory for verification
			const tempDir = tmpdir();
			const downloadPath = join(tempDir, suggestedFilename);

			try {
				console.log(`Saving download to: ${downloadPath}`);
				await download.saveAs(downloadPath);
				console.log(`File saved successfully: ${downloadPath}`);

				// Verify file exists and cleanup
				if (existsSync(downloadPath)) {
					console.log('Downloaded file exists and is accessible');
					unlinkSync(downloadPath);
					console.log(`Cleaned up downloaded file: ${downloadPath}`);
				} else {
					throw new Error('Downloaded file not found on disk');
				}

				console.log(`Attachment "${attachmentTitle}" download completed successfully`);
			} catch (saveError: unknown) {
				const errorMessage = saveError instanceof Error ? saveError.message : String(saveError);
				console.error(`Failed to save or verify download: ${errorMessage}`);
				throw new Error(`Download verification failed: ${errorMessage}`);
			}
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Attachment download verification failed: ${errorMessage}`);
			throw new Error(`Failed to verify attachment download for "${attachmentTitle}": ${errorMessage}`);
		}
	}

	/**
	 * Verifies that an attachment link with the given title is visible and opens correctly
	 * @param attachmentTitle - The title of the attachment link to verify
	 * @param expectedUrl - Expected URL to verify
	 */
	async verifyAndOpenAttachmentLink(attachmentTitle: string, expectedUrl?: string | RegExp): Promise<void> {
		// First verify the Related documents section is visible
		await this.expectRelatedDocumentsSectionToBeVisible();

		// Look for the attachment link by title text within the card content
		const attachmentTitleLink = this.getPage().locator('.card__list-title').filter({ hasText: attachmentTitle });

		// Verify the attachment title link is visible
		await expect(attachmentTitleLink).toBeVisible();
		console.log(`Attachment link "${attachmentTitle}" is visible on the page`);

		try {
			console.log('Setting up popup listener for external link...');

			// Setup listener for the external link popup (new browser tab)
			const externalLinkPopupPromise = this.getPage().waitForEvent('popup');

			console.log('Clicking on attachment link...');

			// Click the attachment title link to open the confirmation modal
			await attachmentTitleLink.click();

			console.log('Waiting for confirmation modal to appear...');

			// Wait for the modal dialog to be visible
			const modalDialog = this.getPage().locator('#external-domain-warning-content');
			await expect(modalDialog).toBeVisible();

			console.log('Confirmation modal appeared');

			// Find and click the "Proceed" button in the modal
			const proceedButton = modalDialog.getByRole('link', { name: 'Proceed' });
			await expect(proceedButton).toBeVisible();

			console.log('Clicking "Proceed" button in confirmation modal');
			await proceedButton.click();

			// Wait for the external link to open in new tab
			const externalLinkPage = await externalLinkPopupPromise;

			console.log('External link opened in new tab');

			// Wait for the external page to load
			await externalLinkPage.waitForLoadState('networkidle');

			// Verify the opened URL if expected value is provided
			if (expectedUrl) {
				const actualUrl = externalLinkPage.url();

				if (typeof expectedUrl === 'string') {
					// Direct string comparison for exact match
					expect(actualUrl).toBe(expectedUrl);
					console.log(`External link URL matches expected: ${expectedUrl}`);
				} else {
					// Regex pattern matching
					await expect(externalLinkPage).toHaveURL(expectedUrl);
					console.log(`External link URL matches expected pattern: ${expectedUrl}`);
				}
			}

			const openedUrl = externalLinkPage.url();
			console.log(`Opened URL: ${openedUrl}`);

			// Close the external link tab
			await externalLinkPage.close();
			console.log('Closed external link tab');

			console.log(`Attachment link "${attachmentTitle}" opened successfully`);
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Attachment link verification failed: ${errorMessage}`);
			throw new Error(`Failed to verify attachment link for "${attachmentTitle}": ${errorMessage}`);
		}
	}
}

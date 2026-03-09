/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 */

import { Download, expect, Locator, Page } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, unlinkSync } from 'fs';

/**
 * Page Object Model for the participatory process detail page.
 * Manages the display of process details and navigation to its components.
 */

export type FoundItem = { text: string; href: string | null; index: number };

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
	private meetingCards: Locator;

	// Related documents section
	private readonly relatedDocumentsHeading: Locator;

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

		this.meetingCards = this.page.locator('.card__list-list .card__list');
		// Related documents section
		this.relatedDocumentsHeading = page
			.locator('.content-block__title h2.decorator')
			.filter({ hasText: 'Related documents' });
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
		await this.waitForLoadState('load');
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
		await this.waitForLoadState('load');
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
	// /**
	// * Finds the index of a meeting card given its title
	// * @param title - The exact title of the card
	// * @returns the index (0-based) or -1 if not found
	// */
	async findMeetingCardIndexByTitle(title: string): Promise<number> {
		const count = await this.meetingCards.count();
		for (let i = 0; i < count; i++) {
			const cardTitle = await this.meetingCards.nth(i).locator('.card__list-title').innerText();
			if (cardTitle.trim() === title) {
				return i;
			}
		}
		return -1;
	}

	async clickMeetingCardByIndex(index: number): Promise<void> {
		const meetingCard = this.meetingCards.nth(index);
		await meetingCard.click();
	}

	async expectUrlContainsMeetings(): Promise<void> {
		await this.page.waitForURL(/.*\/meetings.*/);
		expect(this.page.url()).toContain('/meetings');
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

		// Find the attachment container by ID pattern (div[id^="attachment_"]) that contains the title
		// Structure: <div id="attachment_XX"><div class="card__list-content"><span class="card__list-title">Title</span>...
		const attachmentCard = this.getPage().locator('div[id^="attachment_"]').filter({ hasText: attachmentTitle });
		await expect(attachmentCard).toBeVisible();
		console.log(`Attachment card for "${attachmentTitle}" is visible`);

		// Find the download link within the card (the <a> with title="Download file")
		const downloadLink = attachmentCard.locator('a[title="Download file"]');
		await expect(downloadLink).toBeVisible();

		const href = await downloadLink.getAttribute('href');
		const target = await downloadLink.getAttribute('target');
		console.log(`Download link href: ${href}`);
		console.log(`Download link target: ${target}`);

		try {
			// The link has target="_blank", so it opens a new tab
			// We need to listen for popup, then wait for download from that popup
			if (target === '_blank') {
				console.log('Link opens in new tab - setting up popup and download listeners...');

				// Setup popup listener BEFORE clicking
				const popupPromise = this.getPage().waitForEvent('popup');

				// Click the download link
				console.log('Clicking download link...');
				await downloadLink.click();

				// Wait for popup (new tab)
				console.log('Waiting for popup...');
				const popup = await popupPromise;
				console.log(`Popup opened: ${popup.url()}`);

				// Wait for the download event from the popup page
				console.log('Waiting for download from popup...');

				try {
					const download = await popup.waitForEvent('download');
					console.log('Download event received from popup');

					const suggestedFilename = download.suggestedFilename();
					console.log(`Downloaded filename: "${suggestedFilename}"`);

					// Save and verify
					const tempDir = tmpdir();
					const downloadPath = join(tempDir, suggestedFilename);
					await download.saveAs(downloadPath);
					console.log(`File saved to: ${downloadPath}`);

					if (existsSync(downloadPath)) {
						console.log('Downloaded file exists');
						unlinkSync(downloadPath);
						console.log('Cleaned up downloaded file');
					}
				} catch (downloadError) {
					// Download might have already completed or popup closed
					console.log('No download event from popup - file may have been served inline');
				}

				// Close the popup
				if (!popup.isClosed()) {
					await popup.close();
				}
				console.log('Popup closed');
			} else {
				// Direct download (no target="_blank")
				console.log('Direct download link - setting up download listener...');

				const downloadPromise = this.getPage().waitForEvent('download');
				await downloadLink.click();

				const download = await downloadPromise;
				console.log('Download event received');

				const suggestedFilename = download.suggestedFilename();
				console.log(`Downloaded filename: "${suggestedFilename}"`);

				const tempDir = tmpdir();
				const downloadPath = join(tempDir, suggestedFilename);
				await download.saveAs(downloadPath);

				if (existsSync(downloadPath)) {
					console.log('Downloaded file exists');
					unlinkSync(downloadPath);
					console.log('Cleaned up downloaded file');
				}
			}

			console.log(`Attachment "${attachmentTitle}" download verification completed successfully`);
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

		// Find the attachment container by ID pattern that contains the title
		// Structure: <div id="attachment_XX">...<a title="Visit link">Visit link</a>
		const attachmentCard = this.getPage().locator('div[id^="attachment_"]').filter({ hasText: attachmentTitle });
		await expect(attachmentCard).toBeVisible();
		console.log(`Attachment card for "${attachmentTitle}" is visible`);

		// Find the "Visit link" button (for external links)
		const visitLinkButton = attachmentCard.locator('a[title="Visit link"]');
		await expect(visitLinkButton).toBeVisible();

		const href = await visitLinkButton.getAttribute('href');
		const isExternalLink = await visitLinkButton.getAttribute('data-external-link');
		console.log(`Visit link href: ${href}`);
		console.log(`Is external link: ${isExternalLink}`);

		try {
			// Setup popup listener BEFORE clicking
			const popupPromise = this.getPage().waitForEvent('popup');

			console.log('Clicking "Visit link" button...');
			await visitLinkButton.click();

			// Check if external domain warning modal appears
			const modalDialog = this.getPage().locator('#external-domain-warning-content');
			const modalVisible = await modalDialog.isVisible().catch(() => false);

			if (modalVisible) {
				console.log('External domain warning modal appeared');

				// Find and click the "Proceed" button in the modal
				const proceedButton = modalDialog.getByRole('link', { name: 'Proceed' });
				await expect(proceedButton).toBeVisible();

				console.log('Clicking "Proceed" button...');
				await proceedButton.click();
			} else {
				console.log('No warning modal - link opened directly');
			}

			// Wait for the external link to open in new tab
			const externalLinkPage = await popupPromise;
			console.log('External link opened in new tab');

			// Wait for the external page to load
			await externalLinkPage.waitForLoadState('domcontentloaded');

			// Verify the opened URL if expected value is provided
			if (expectedUrl) {
				const actualUrl = externalLinkPage.url();

				if (typeof expectedUrl === 'string') {
					expect(actualUrl).toBe(expectedUrl);
					console.log(`External link URL matches expected: ${expectedUrl}`);
				} else {
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

	/**
	 * Make sure the meeting list is visible
	 * and that each card contains the title, date/time, and location.
	 */

	async enhancedVerifyMeetingsCardListVisible(): Promise<void> {
		const count = await this.meetingCards.count();
		expect(count).toBeGreaterThan(0);

		for (let i = 0; i < count; i++) {
			const card = this.meetingCards.nth(i);

			await expect(card.locator('.card__list-title')).toBeVisible();

			await expect(card.locator('time.card__calendar')).toBeVisible();
			const locationText = await card.locator('.card__list-metadata div:nth-child(2)').textContent();
			expect(locationText?.trim()).toMatch(/Online|In-person|Hybrid/);

			const commentsLocator = card.locator('.card__list-metadata div[data-comments-count]');
			await expect(commentsLocator).toBeVisible();
		}
	}

	/**
	 * Retrieves the first online meeting card details
	 * @returns An object with meeting details or null if no online meeting is found
	 */

	async getFirstOnlineMeeting(): Promise<{
		index: number;
		title: string;
		date: string;
		type: string;
		link: string;
		comments: number;
	} | null> {
		const count = await this.meetingCards.count();

		for (let i = 0; i < count; i++) {
			const card = this.meetingCards.nth(i);

			const title = await card.locator('.card__list-title').textContent();
			const dateAttr = await card.locator('time.card__calendar').getAttribute('datetime');
			const link = await card.getAttribute('href');

			// Extract type (Online, Hybrid, In-person)
			const metadataItems = card.locator('.card__list-metadata div');
			const metadataCount = await metadataItems.count();

			let type = '';
			for (let j = 0; j < metadataCount; j++) {
				const text = await metadataItems.nth(j).textContent();
				if (text?.match(/Online|Hybrid|In-person/)) {
					type = text.trim();
					break;
				}
			}

			if (type === 'Online') {
				const commentsText = await card.locator('.card__list-metadata div[data-comments-count]').textContent();
				const comments = parseInt(commentsText?.trim() ?? '0', 10);

				return {
					index: i,
					title: title?.trim() ?? '',
					date: dateAttr ?? '',
					type,
					link: link ?? '',
					comments: isNaN(comments) ? 0 : comments
				};
			}
		}

		return null;
	}

	/**
	 * Collects and verifies that the participatory space dropdown exists and contains at least one item.
	 * Returns the list of found items { text, href, index }.
	 */

	public async collectAndVerifyParticipatoryMenuItems(openIfHidden = true): Promise<FoundItem[]> {
		// Ensures that the container is present in the DOM
		await expect(this.navDropdownMenu).toHaveCount(1);

		// If the menu is initially hidden, try opening it by clicking the trigger
		const ariaHidden = await this.navDropdownMenu.getAttribute('aria-hidden');
		if (ariaHidden === 'true' && openIfHidden) {
			if ((await this.navDropdownTrigger.count()) > 0) {
				await this.navDropdownTrigger.click();
				await this.navDropdownMenu.waitFor({ state: 'visible' }).catch(() => null);
				await expect(this.navDropdownMenu).toBeVisible();
			}
		}

		// Collect the items inside the menu (li > a)
		const items = this.navDropdownMenu.locator('li[role="menuitem"] a.participatory-space__nav-item');
		const count = await items.count();

		if (count === 0) {
			throw new Error('No items found within #dropdown-menu-participatory-space');
		}

		const found: FoundItem[] = [];
		for (let i = 0; i < count; i++) {
			const item = items.nth(i);
			await expect(item).toBeVisible();
			const text = (await item.innerText()).trim();
			const href = await item.getAttribute('href');
			found.push({ text, href, index: i });
		}

		return found;
	}

	public async verifyProcessDescriptionSection(): Promise<void> {
		// 1. Verify title
		const heading = this.page.getByRole('heading', { level: 2, name: 'About this process' });
		await expect(heading).toBeVisible();

		// 2. Make sure there are at least two description blocks
		const blocks = this.page.locator('.content-block__description.editor-content');
		await expect(blocks).toHaveCount(2);

		// 3. Make sure both are visible and have content
		for (let i = 0; i < 2; i++) {
			const block = blocks.nth(i);
			await expect(block).toBeVisible();
			const text = await block.innerText();
			expect(text.trim().length).toBeGreaterThan(0);
		}
	}

	public async clickOnMenuItem(target: string): Promise<void> {
		const items = this.navDropdownMenu.locator('li[role="menuitem"] a.participatory-space__nav-item');
		const count = await items.count();

		for (let i = 0; i < count; i++) {
			const item = items.nth(i);
			const text = (await item.innerText()).trim();
			const href = await item.getAttribute('href');

			if (text === target || href === target) {
				await item.click();
				return;
			}
		}

		throw new Error(`Menu item "${target}" not found`);
	}

	public async openProcessSteps(timeout = 7000): Promise<boolean> {
		const modalSel = '#process-steps-modal-content';
		const userMenuBtn = this.page.getByRole('button', { name: 'User menu' }).first();
		const menuDropdown = this.page.locator('.menu-bar__secondary-dropdown__left').first();

		if ((await userMenuBtn.count()) === 0) throw new Error('User menu button not found');

		await userMenuBtn.hover();
		await expect(menuDropdown).toBeVisible();

		// try to find a link near "Current phase"
		const currentPhase = this.page.getByLabel('User menu').getByText('Current phase').first();
		let clicked = false;

		if ((await currentPhase.count()) > 0) {
			// in the context of the ancestor take the first useful link (we assume it always exists)
			const candidate = await currentPhase.evaluate(node => {
				const anc = node.closest('li') || node.closest('div') || node.parentElement;
				const container = anc || node.parentElement;
				const links = container ? Array.from(container.querySelectorAll('a')) : [];
				// filter irrelevant links
				const filtered = links.filter(a => {
					const t = (a.textContent || '').trim().toLowerCase();
					const h = a.getAttribute('href') || '';
					return !(t.includes('skip to') || h.startsWith('#'));
				});
				const chosen = filtered[0] || links[0] || null;
				return chosen ? { href: chosen.getAttribute('href'), text: (chosen.textContent || '').trim() } : null;
			});

			// Click the link found: first try by href, otherwise by text
			if (candidate?.href) {
				const loc = this.page.locator(`a[href="${candidate.href}"]`).first();
				if ((await loc.count()) > 0) {
					await loc.scrollIntoViewIfNeeded().catch(() => {});
					await loc.click().catch(() => {});
					clicked = true;
				}
			}

			if (!clicked && candidate?.text) {
				const byText = this.page.getByRole('link', { name: candidate.text }).first();
				if ((await byText.count()) > 0) {
					await byText.scrollIntoViewIfNeeded().catch(() => {});
					await byText.click().catch(() => {});
					clicked = true;
				}
			}
		}

		// assuming there is always a link near "Current phase", if we haven't clicked it, we report an error
		if (!clicked) throw new Error('No clickable link found near "Current phase"');

		// wait for modal: wait for visibility (visible also implies attached)
		try {
			await this.page.waitForSelector(modalSel, { state: 'visible', timeout });
		} catch {
			// If waitForSelector('visible') fails, try the fallback: wait for attached and then poll on isVisible
			await this.page.waitForSelector(modalSel, { state: 'attached', timeout }).catch(() => {});
			const start = Date.now();
			let visible = false;
			while (Date.now() - start < timeout) {
				if (await this.page.isVisible(modalSel).catch(() => false)) {
					visible = true;
					break;
				}
				await this.page.waitForTimeout(150);
			}
			if (!visible) throw new Error('Process steps modal did not become visible within timeout');
		}
		return true;
	}

	async getProcessPhaseInfo(): Promise<{
		title: string;
		phaseName: string;
		dateRange: string;
		description: string;
	}> {
		// Locate the modal container
		const modal = this.page.locator('#process-steps-modal-content');

		// Ensure the modal title "Process phases" is present
		const titleLocator = modal.locator('#dialog-title-process-steps-modal');
		await expect(titleLocator).toHaveText('Process phases');

		// Extract the phase name, removing "Current phase" if present
		const phaseTitleLocator = modal.locator('.participatory-space__metadata-modal__step-title');
		const rawPhaseText = await phaseTitleLocator.first().innerText();
		const phaseName = rawPhaseText.replace('Current phase', '').trim();

		// Extract the date range of the phase
		const dateLocator = modal.locator('.participatory-space__metadata-modal__step-dates');
		const dateRange = await dateLocator.first().innerText();

		// Extract the phase description text
		const descriptionLocator = modal.locator('.rich-text-display');
		const description = await descriptionLocator.first().innerText();

		// Click the close button to dismiss the modal
		const closeButton = modal.locator('button[data-dialog-close="process-steps-modal"]');
		await expect(closeButton).toBeVisible();
		await closeButton.click();

		// Return extracted information
		return {
			title: 'Process phases',
			phaseName,
			dateRange,
			description
		};
	}
}

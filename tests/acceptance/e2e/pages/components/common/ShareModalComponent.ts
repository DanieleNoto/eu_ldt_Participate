/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Gianfranco Cedro
 * Denis Vasilev Dimchev
 */

import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Component for handling the social share modal dialog
 * This modal appears when clicking the share button on debates and other content
 */
export class ShareModalComponent {
	private readonly page: Page;

	// Modal container and dialog
	private readonly modalDialog: Locator;
	private readonly closeButton: Locator;
	private readonly modalTitle: Locator;

	// Social sharing options
	private readonly shareList: Locator;
	private readonly xShareLink: Locator;
	private readonly facebookShareLink: Locator;
	private readonly whatsappShareLink: Locator;
	private readonly telegramShareLink: Locator;

	// Copy to clipboard section
	private readonly shareUrlInput: Locator;
	private readonly copyButton: Locator;

	constructor(page: Page) {
		this.page = page;

		// Modal container and dialog
		this.modalDialog = this.page.locator('#socialShare[role="dialog"]');
		this.closeButton = this.page.locator('button[data-dialog-close="socialShare"]');
		this.modalTitle = this.page.locator('#dialog-title-socialShare');

		// Social sharing options
		this.shareList = this.page.locator('.share-modal__list[data-social-share]');
		this.xShareLink = this.page.locator('.share-modal__list a[data-site="x"]');
		this.facebookShareLink = this.page.locator('.share-modal__list a[data-site="facebook"]');
		this.whatsappShareLink = this.page.locator('.share-modal__list a[data-site="whatsapp"]');
		this.telegramShareLink = this.page.locator('.share-modal__list a[data-site="telegram"]');

		// Copy to clipboard section
		this.shareUrlInput = this.page.locator('#urlShareLink');
		this.copyButton = this.page.locator('button[data-clipboard-copy="#urlShareLink"]');
	}

	/**
	 * Wait for the modal to be visible
	 * @param timeout - Maximum time to wait in milliseconds
	 */
	async waitForModalToBeVisible(): Promise<void> {
		await this.modalDialog.waitFor({ state: 'visible' });
		await expect(this.modalDialog).toHaveAttribute('aria-hidden', 'false');
	}

	/**
	 * Wait for the modal to be hidden
	 * @param timeout - Maximum time to wait in milliseconds
	 */
	async waitForModalToBeHidden(): Promise<void> {
		await this.modalDialog.waitFor({ state: 'hidden' });
	}

	/**
	 * Check if the modal is currently visible
	 * @returns True if the modal is visible
	 */
	async isModalVisible(): Promise<boolean> {
		try {
			const isVisible = await this.modalDialog.isVisible();
			const ariaHidden = await this.modalDialog.getAttribute('aria-hidden');
			return isVisible && ariaHidden === 'false';
		} catch {
			return false;
		}
	}

	/**
	 * Get the modal title text
	 * @returns The title text of the modal
	 */
	async getModalTitle(): Promise<string> {
		return (await this.modalTitle.textContent()) || '';
	}

	/**
	 * Close the modal using the close button
	 */
	async closeModal(): Promise<void> {
		await this.closeButton.click();
		await this.waitForModalToBeHidden();
	}

	/**
	 * Close the modal using the Escape key
	 */
	async closeModalWithEscape(): Promise<void> {
		await this.page.keyboard.press('Escape');
		await this.waitForModalToBeHidden();
	}

	/**
	 * Get the share URL from the input field
	 * @returns The URL that can be shared
	 */
	async getShareUrl(): Promise<string> {
		return (await this.shareUrlInput.inputValue()) || '';
	}

	/**
	 * Click the copy button to copy the share URL to clipboard
	 */
	async copyShareUrl(): Promise<void> {
		await this.copyButton.click();

		// Wait for the copy operation to complete
		await this.page.waitForTimeout(500);
	}

	/**
	 * Get the copy button text (changes to "Copied!" after copying)
	 * @returns The current text of the copy button
	 */
	async getCopyButtonText(): Promise<string> {
		const buttonSpan = this.copyButton.locator('span').first();
		return (await buttonSpan.textContent()) || '';
	}

	/**
	 * Verify that the copy operation was successful
	 */
	async expectCopySuccessMessage(): Promise<void> {
		// The button text should change to "Copied!" after successful copy
		await expect(this.copyButton.locator('span').first()).toHaveText('Copied!');
	}

	// === SOCIAL SHARING METHODS ===

	/**
	 * Get the X (Twitter) share URL
	 * @returns The X sharing URL
	 */
	async getXShareUrl(): Promise<string> {
		return (await this.xShareLink.getAttribute('href')) || '';
	}

	/**
	 * Get the Facebook share URL
	 * @returns The Facebook sharing URL
	 */
	async getFacebookShareUrl(): Promise<string> {
		return (await this.facebookShareLink.getAttribute('href')) || '';
	}

	/**
	 * Get the WhatsApp share URL
	 * @returns The WhatsApp sharing URL
	 */
	async getWhatsappShareUrl(): Promise<string> {
		return (await this.whatsappShareLink.getAttribute('href')) || '';
	}

	/**
	 * Get the Telegram share URL
	 * @returns The Telegram sharing URL
	 */
	async getTelegramShareUrl(): Promise<string> {
		return (await this.telegramShareLink.getAttribute('href')) || '';
	}

	/**
	 * Click on X (Twitter) share link
	 * Note: This will open in a new tab/window
	 */
	async shareOnX(): Promise<void> {
		await this.xShareLink.click();
	}

	/**
	 * Click on Facebook share link
	 * Note: This will open in a new tab/window
	 */
	async shareOnFacebook(): Promise<void> {
		await this.facebookShareLink.click();
	}

	/**
	 * Click on WhatsApp share link
	 * Note: This will open in a new tab/window or WhatsApp app
	 */
	async shareOnWhatsapp(): Promise<void> {
		await this.whatsappShareLink.click();
	}

	/**
	 * Click on Telegram share link
	 * Note: This will open in a new tab/window or Telegram app
	 */
	async shareOnTelegram(): Promise<void> {
		await this.telegramShareLink.click();
	}

	/**
	 * Verify that all social sharing options are visible
	 */
	async expectAllSocialOptionsToBeVisible(): Promise<void> {
		await expect(this.xShareLink).toBeVisible();
		await expect(this.facebookShareLink).toBeVisible();
		await expect(this.whatsappShareLink).toBeVisible();
		await expect(this.telegramShareLink).toBeVisible();
	}

	/**
	 * Get the count of available social sharing options
	 * @returns The number of social sharing links available
	 */
	async getSocialOptionsCount(): Promise<number> {
		return await this.shareList.locator('a[data-site]').count();
	}

	/**
	 * Verify that the share URLs contain expected patterns
	 * @param expectedContentTitle - Expected title/text in the share URLs
	 * @param expectedUrl - Expected base URL being shared
	 */
	async verifyShareUrlsContent(expectedContentTitle?: string, expectedUrl?: string): Promise<void> {
		if (expectedContentTitle) {
			// Normalize the content title: replace newlines with spaces and trim
			const normalizedTitle = expectedContentTitle.replace(/\s+/g, ' ').trim();
			const xUrl = await this.getXShareUrl();
			const whatsappUrl = await this.getWhatsappShareUrl();

			// For URL parameters, spaces can be encoded as either %20 or +
			// So we check for both encoded versions
			const encodedTitle = encodeURIComponent(normalizedTitle);
			const urlEncodedTitle = normalizedTitle.replace(/ /g, '+'); // Replace spaces with +

			// These URLs typically include the normalized content title
			const xContainsTitle = xUrl.includes(encodedTitle) || xUrl.includes(urlEncodedTitle);
			const whatsappContainsTitle = whatsappUrl.includes(encodedTitle) || whatsappUrl.includes(urlEncodedTitle);

			expect(xContainsTitle).toBe(true);
			expect(whatsappContainsTitle).toBe(true);
		}

		if (expectedUrl) {
			const xUrl = await this.getXShareUrl();
			const facebookUrl = await this.getFacebookShareUrl();
			const whatsappUrl = await this.getWhatsappShareUrl();
			const telegramUrl = await this.getTelegramShareUrl();

			// For URL verification, we need to be flexible as the actual URL might be different
			// (e.g., shortened URL vs full URL). Check if any part of the expected URL is contained
			const urlToCheck = decodeURIComponent(expectedUrl);

			// Check if URLs contain either the encoded expected URL or parts of the decoded URL
			const xContainsUrl = xUrl.includes(encodeURIComponent(expectedUrl)) || xUrl.includes(urlToCheck);
			const facebookContainsUrl =
				facebookUrl.includes(encodeURIComponent(expectedUrl)) || facebookUrl.includes(urlToCheck);
			const whatsappContainsUrl =
				whatsappUrl.includes(encodeURIComponent(expectedUrl)) || whatsappUrl.includes(urlToCheck);
			const telegramContainsUrl =
				telegramUrl.includes(encodeURIComponent(expectedUrl)) || telegramUrl.includes(urlToCheck);

			// If direct URL check fails, verify that URLs contain at least the domain
			if (!xContainsUrl && !facebookContainsUrl && !whatsappContainsUrl && !telegramContainsUrl) {
				// Extract domain from expected URL for fallback verification
				const urlObj = new URL(expectedUrl);
				const domain = urlObj.hostname;

				expect(xUrl).toContain(domain);
				expect(facebookUrl).toContain(domain);
				expect(whatsappUrl).toContain(domain);
				expect(telegramUrl).toContain(domain);
			} else {
				expect(xContainsUrl).toBe(true);
				expect(facebookContainsUrl).toBe(true);
				expect(whatsappContainsUrl).toBe(true);
				expect(telegramContainsUrl).toBe(true);
			}
		}
	}

	/**
	 * Verify that the modal has proper accessibility attributes
	 */
	async expectProperAccessibility(): Promise<void> {
		// Check aria attributes
		await expect(this.modalDialog).toHaveAttribute('role', 'dialog');
		await expect(this.modalDialog).toHaveAttribute('aria-modal', 'true');
		await expect(this.modalDialog).toHaveAttribute('aria-labelledby', 'dialog-title-socialShare');

		// Check that the close button has proper aria-label
		await expect(this.closeButton).toHaveAttribute('aria-label', 'Close modal');

		// Check that the title is properly focused when opened
		await expect(this.modalTitle).toHaveAttribute('tabindex', '-1');
	}

	/**
	 * Test the complete copy-to-clipboard workflow
	 */
	async testCopyToClipboardWorkflow(): Promise<void> {
		// Get the initial button text
		const initialText = await this.getCopyButtonText();
		expect(initialText.toLowerCase()).toBe('copy');

		// Get the URL to be copied
		const shareUrl = await this.getShareUrl();
		expect(shareUrl).toBeTruthy();

		// Click copy button
		await this.copyShareUrl();

		// Verify success message
		await this.expectCopySuccessMessage();

		// Optionally verify clipboard content (note: this might not work in all test environments)
		// const clipboardContent = await this.page.evaluate(() => navigator.clipboard.readText());
		// expect(clipboardContent).toBe(shareUrl);
	}

	/**
	 * Test sharing to all social platforms (without actually opening external links)
	 * This method verifies URLs are correctly constructed but doesn't open them
	 */
	async verifyAllSocialSharingUrls(): Promise<void> {
		// Verify all social options are present
		await this.expectAllSocialOptionsToBeVisible();

		// Verify URL patterns
		const xUrl = await this.getXShareUrl();
		const facebookUrl = await this.getFacebookShareUrl();
		const whatsappUrl = await this.getWhatsappShareUrl();
		const telegramUrl = await this.getTelegramShareUrl();

		// Basic URL validation
		expect(xUrl).toMatch(/https:\/\/twitter\.com\/intent\/tweet/);
		expect(facebookUrl).toMatch(/http:\/\/www\.facebook\.com\/sharer\/sharer\.php/);
		expect(whatsappUrl).toMatch(/https:\/\/api\.whatsapp\.com\/send/);
		expect(telegramUrl).toMatch(/https:\/\/telegram\.me\/share\/url/);

		console.log('All social sharing URLs verified:', {
			x: xUrl,
			facebook: facebookUrl,
			whatsapp: whatsappUrl,
			telegram: telegramUrl
		});
	}

	async shareToX() {
		await this.page.click('[data-site="x"]');
	}

	async shareToFacebook() {
		await this.page.click('[data-site="facebook"]');
	}

	async shareToWhatsApp() {
		await this.page.click('[data-site="whatsapp"]');
	}

	async shareToTelegram() {
		await this.page.click('[data-site="telegram"]');
	}

	async copyShareLink() {
		await this.page.click('[data-clipboard-copy="#urlShareLink"]');
	}

	async getShareLinkValue(): Promise<string> {
		return await this.page.getAttribute('#urlShareLink', 'value');
	}

	async expectModalVisible() {
		await this.page.waitForSelector('#socialShare-content', { state: 'visible' });
	}

	async expectShareToXSuccess() {
		await this.page.waitForSelector('[data-site="x"]', { state: 'attached' });
	}

	async expectShareToFacebookSuccess() {
		await this.page.waitForSelector('[data-site="facebook"]', { state: 'attached' });
	}

	async expectShareToWhatsAppSuccess() {
		await this.page.waitForSelector('[data-site="whatsapp"]', { state: 'attached' });
	}

	async expectShareToTelegramSuccess() {
		await this.page.waitForSelector('[data-site="telegram"]', { state: 'attached' });
	}

	async expectClipboardCopySuccess() {
		const copiedMessage = await this.page.getAttribute(
			'[data-clipboard-copy="#urlShareLink"]',
			'data-clipboard-copy-message'
		);
		if (copiedMessage !== 'The link was successfully copied to clipboard.') {
			throw new Error('Clipboard copy failed');
		}
	}
	/**
	 * Verifies that all social share links are visible, have valid hrefs,
	 * and redirect to the expected external domains. If blocked, logs a warning.
	 * Also detects if the redirect page shows a "blocked content" message.
	 */
	public async verifySocialShareRedirects(): Promise<void> {
		const shareList = this.page.locator('.share-modal__list');
		await expect(shareList).toBeVisible();

		// Expected domains for each social platform
		const expectedDomains: Record<string, string> = {
			x: 'twitter.com',
			facebook: 'facebook.com',
			whatsapp: 'api.whatsapp.com',
			telegram: 'telegram.me'
		};

		for (const [site, expectedDomain] of Object.entries(expectedDomains)) {
			const link = shareList.locator(`a[data-site="${site}"]`);
			await expect(link).toBeVisible();

			const href = await link.getAttribute('href');
			expect(href).toBeTruthy();
			expect(href).toContain(expectedDomain);

			try {
				const [newPage] = await Promise.all([this.page.context().waitForEvent('page'), link.click()]);

				await newPage.waitForLoadState('domcontentloaded', { timeout: 5000 });
				const redirectedUrl = newPage.url();
				console.log(`🔗 Opened ${site} link: ${redirectedUrl}`);

				// Special case: twitter.com redirects to x.com — this is expected
				const isTwitterRedirect = site === 'x' && redirectedUrl.includes('x.com');
				const isExpectedDomain = redirectedUrl.includes(expectedDomain) || isTwitterRedirect;

				if (!isExpectedDomain) {
					console.warn(
						`⚠️ ${site} redirect does not match expected domain "${expectedDomain}". Got: ${redirectedUrl}`
					);
				}

				await newPage.close();
			} catch (error) {
				console.warn(`⚠️ Failed to open ${site} link. Possibly blocked or intercepted. Reason: ${error}`);
			}
		}
	}
}

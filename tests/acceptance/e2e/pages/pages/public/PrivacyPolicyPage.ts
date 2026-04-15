/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 * Denis Vasilev Dimchev
 * Simone Bianchelli
 */

import { BasePage } from '@pages/base/BasePage';
import { Page, expect } from '@playwright/test';

/**
 * PrivacyPolicyPage - Page Object Model for the Terms of Service page.
 *
 * Extends BasePage and provides methods to interact with the terms of service content.
 * Note: This page is currently in development and shows placeholder content.
 */
export class PrivacyPolicyPage extends BasePage {
	// Page elements based on actual HTML structure
	private readonly pageTitle = this.page.locator('h1.h1.decorator');
	private readonly pageContainer = this.page.locator('.page__container');
	private readonly editorContent = this.page.locator('.editor-content');
	private readonly richTextDisplay = this.page.locator('.rich-text-display');
	private readonly mainLayout = this.page.locator('main.layout-1col');
	private readonly backButton = this.page.locator('.back-button, [data-testid="back-button"]');

	constructor(page: Page) {
		super(page);
	} /**
	 * Navigate to the Privacy Policy page (Terms of Service)
	 */
	async navigateToPrivacyPolicy(): Promise<void> {
		await this.page.goto('/pages/terms-of-service');
		await this.page.waitForLoadState('load');
	}

	/**
	 * Verify that we are on the Privacy Policy page (Terms of Service)
	 */
	async expectToBeOnPrivacyPolicyPage(): Promise<void> {
		await expect(this.page).toHaveURL(/.*terms-of-service/);
		await expect(this.pageTitle).toBeVisible();
	}

	/**
	 * Get the page title
	 */
	async getPrivacyPolicyTitle(): Promise<string> {
		await expect(this.pageTitle).toBeVisible();
		return (await this.pageTitle.textContent()) || '';
	}

	/**
	 * Verify that page content is displayed
	 */
	async expectPrivacyPolicyContentToBeVisible(): Promise<void> {
		await expect(this.pageContainer).toBeVisible();
		await expect(this.editorContent).toBeVisible();
	}

	/**
	 * Get page content for verification
	 */
	async getPageContent(): Promise<string> {
		await expect(this.richTextDisplay).toBeVisible();
		return (await this.richTextDisplay.textContent()) || '';
	}

	/**
	 * Verify that the page is properly loaded
	 */
	async expectPageToBeProperlyLoaded(): Promise<void> {
		await expect(this.mainLayout).toBeVisible();
		await expect(this.pageTitle).toBeVisible();
		await expect(this.pageContainer).toBeVisible();
		await expect(this.editorContent).toBeVisible();
	}

	/**
	 * Verify that basic page information is displayed (simplified for development state)
	 */
	async expectComprehensivePrivacyInformationToBeDisplayed(): Promise<void> {
		// Since the page is in development, just verify basic structure
		await this.expectPageToBeProperlyLoaded();

		// Verify there is some content (even if placeholder)
		const content = await this.getPageContent();
		expect(content).not.toBe('');
		expect(content.length).toBeGreaterThan(0);
	}
}

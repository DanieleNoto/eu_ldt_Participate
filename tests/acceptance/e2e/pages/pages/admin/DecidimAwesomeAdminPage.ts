/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { type Locator, type Page } from '@playwright/test';
import { BaseAdminPage } from './BaseAdminPage';

/**
 * DecidimAwesomeAdminPage - Page Object Model for Decidim Awesome configuration pages
 *
 * Handles navigation and interactions within the Decidim Awesome admin section
 */
export class DecidimAwesomeAdminPage extends BaseAdminPage {
	readonly customStylesLink: Locator;
	readonly adminPanelLink: Locator;
	readonly tweaksHeading: Locator;
	readonly cssVariablesText: Locator;
	readonly addNewCssBoxLink: Locator;
	readonly cssBoxCreatedMessage: Locator;
	readonly cssEditor: Locator;
	readonly cssEditorTextarea: Locator;
	readonly updateConfigurationButton: Locator;
	readonly configurationUpdatedMessage: Locator;
	readonly titleBar: Locator;
	readonly processTitle: Locator;
	readonly layoutNav: Locator;
	readonly layoutContent: Locator;
	readonly cardSection: Locator;
	readonly button: Locator;
	readonly link: Locator;
	readonly deleteLink: Locator;
	readonly confirmOkButton: Locator;
	readonly cssBoxRemovedMessage: Locator;

	constructor(page: Page) {
		super(page);
		this.customStylesLink = page.getByRole('link', { name: 'Custom Styles' });
		this.adminPanelLink = page.getByRole('link', { name: 'Admin panel' });
		this.tweaksHeading = page.getByRole('heading', { name: 'Tweaks for Custom Styles:' });
		this.cssVariablesText = page.getByText('var(--primary) var(--');
		this.addNewCssBoxLink = page.getByRole('link', { name: 'Add a new "admin panel" CSS' });
		this.cssBoxCreatedMessage = page.getByText(/CSS box \w+ created/);
		this.cssEditor = page.locator('.CodeMirror');
		this.cssEditorTextarea = page.locator('.CodeMirror textarea');
		this.updateConfigurationButton = page.getByRole('button', { name: 'Update configuration' });
		this.configurationUpdatedMessage = page.getByText('Configuration updated');

		// Selectors for verifying applied styles
		this.titleBar = page.locator('.title-bar').first();
		this.processTitle = page.locator('.process-title').first();
		this.layoutNav = page.locator('.layout-nav').first();
		this.layoutContent = page.locator('.layout-content').first();
		this.cardSection = page.locator('.card-section').first();
		this.button = page.locator('button, .dropdown__trigger').first();
		this.link = page.locator('a').first();

		// Selectors for cleanup
		this.deleteLink = page.getByRole('link', { name: 'Delete' });
		this.confirmOkButton = page.getByRole('button', { name: 'OK' });
		this.cssBoxRemovedMessage = page.getByText(/CSS box \w+ removed/);
	}

	/**
	 * Navigates to Custom Styles section
	 */
	async navigateToCustomStyles(): Promise<void> {
		await this.customStylesLink.click();
	}

	/**
	 * Navigates to Admin Panel configuration within Custom Styles
	 */
	async navigateToAdminPanelConfig(): Promise<void> {
		await this.adminPanelLink.click();
	}

	/**
	 * Clicks on Add a new "admin panel" CSS box link
	 */
	async clickAddNewCssBox(): Promise<void> {
		await this.addNewCssBoxLink.click();
	}

	/**
	 * Edits CSS content in the CodeMirror editor
	 */
	async editCssContent(cssContent: string): Promise<void> {
		await this.cssEditor.click();
		await this.cssEditorTextarea.fill(cssContent);
	}

	/**
	 * Clicks the Update configuration button
	 */
	async clickUpdateConfiguration(): Promise<void> {
		await this.updateConfigurationButton.click();
	}

	/**
	 * verifies that all custom styles have been applied correctly
	 */
	async verifyAllCustomStylesApplied(): Promise<boolean> {
		const checks: { [key: string]: boolean } = {};

		try {
			//  Verify title-bar background color (#28A745 = rgb(40, 167, 69))
			const titleBarBgColor = await this.titleBar.evaluate(el => getComputedStyle(el).backgroundColor);
			checks.titleBarBackground =
				titleBarBgColor.includes('40, 167, 69') || titleBarBgColor === 'rgb(40, 167, 69)';

			// Verify title-bar text color (#FCFDFD = rgb(252, 253, 253))
			const titleBarColor = await this.titleBar.evaluate(el => getComputedStyle(el).color);
			checks.titleBarColor = titleBarColor.includes('252, 253, 253') || titleBarColor === 'rgb(252, 253, 253)';

			// Verify process-title background color (rgb(25, 45, 69))
			if (await this.processTitle.isVisible()) {
				const processTitleBgColor = await this.processTitle.evaluate(
					el => getComputedStyle(el).backgroundColor
				);
				checks.processTitleBackground =
					processTitleBgColor.includes('25, 45, 69') || processTitleBgColor === 'rgb(25, 45, 69)';
			} else {
				checks.processTitleBackground = true;
			}

			// Verify layout-nav background color (rgb(25, 45, 69))
			if (await this.layoutNav.isVisible()) {
				const layoutNavBgColor = await this.layoutNav.evaluate(el => getComputedStyle(el).backgroundColor);
				checks.layoutNavBackground =
					layoutNavBgColor.includes('25, 45, 69') || layoutNavBgColor === 'rgb(25, 45, 69)';
			} else {
				checks.layoutNavBackground = true;
			}

			// Verify button background color (#1CA5D1 = rgb(28, 165, 209))
			if (await this.button.isVisible()) {
				const buttonBgColor = await this.button.evaluate(el => getComputedStyle(el).backgroundColor);
				checks.buttonBackground =
					buttonBgColor.includes('28, 165, 209') || buttonBgColor === 'rgb(28, 165, 209)';

				// Verify button text color (#fff = rgb(255, 255, 255))
				const buttonColor = await this.button.evaluate(el => getComputedStyle(el).color);
				checks.buttonColor = buttonColor.includes('255, 255, 255') || buttonColor === 'rgb(255, 255, 255)';
			} else {
				checks.buttonBackground = true;
				checks.buttonColor = true;
			}

			// Verify layout-content background color (#263F57 = rgb(38, 63, 87))
			if (await this.layoutContent.isVisible()) {
				const layoutContentBgColor = await this.layoutContent.evaluate(
					el => getComputedStyle(el).backgroundColor
				);
				checks.layoutContentBackground =
					layoutContentBgColor.includes('38, 63, 87') || layoutContentBgColor === 'rgb(38, 63, 87)';

				// Verify layout-content text color (#FCFDFD = rgb(252, 253, 253))
				const layoutContentColor = await this.layoutContent.evaluate(el => getComputedStyle(el).color);
				checks.layoutContentColor =
					layoutContentColor.includes('252, 253, 253') || layoutContentColor === 'rgb(252, 253, 253)';
			} else {
				checks.layoutContentBackground = true;
				checks.layoutContentColor = true;
			}

			// Verify card-section background color (#263F57 = rgb(38, 63, 87))
			if (await this.cardSection.isVisible()) {
				const cardSectionBgColor = await this.cardSection.evaluate(el => getComputedStyle(el).backgroundColor);
				checks.cardSectionBackground =
					cardSectionBgColor.includes('38, 63, 87') || cardSectionBgColor === 'rgb(38, 63, 87)';

				// Verify card-section text color (#FCFDFD = rgb(252, 253, 253))
				const cardSectionColor = await this.cardSection.evaluate(el => getComputedStyle(el).color);
				checks.cardSectionColor =
					cardSectionColor.includes('252, 253, 253') || cardSectionColor === 'rgb(252, 253, 253)';
			} else {
				checks.cardSectionBackground = true;
				checks.cardSectionColor = true;
			}

			// Verify links color (#1CA5D1 = rgb(28, 165, 209))
			if (await this.link.isVisible()) {
				const linkColor = await this.link.evaluate(el => getComputedStyle(el).color);
				checks.linkColor = linkColor.includes('28, 165, 209') || linkColor === 'rgb(28, 165, 209)';
			} else {
				checks.linkColor = true;
			}

			// Verify font-family
			const bodyFontFamily = await this.page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
			checks.fontFamily = bodyFontFamily.includes('Roboto') || bodyFontFamily.includes('Open Sans');

			// Verify font-size increase
			const bodyFontSize = await this.page.locator('body').evaluate(el => getComputedStyle(el).fontSize);
			const expectedMinSize = 16.5; // Allow some tolerance for 1.05em
			const actualSize = parseFloat(bodyFontSize.replace('px', ''));
			checks.fontSize = actualSize >= expectedMinSize;

			console.log('Style verification results:', checks);

			const allChecksPassed = Object.values(checks).every(check => check === true);

			if (!allChecksPassed) {
				const failedChecks = Object.entries(checks)
					.filter(([, passed]) => !passed)
					.map(([name]) => name);
				console.error('Failed style checks:', failedChecks);
			}

			return allChecksPassed;
		} catch (error) {
			console.error('Error verifying styles:', error);
			if (error instanceof Error) {
				console.error('Error message:', error.message);
				console.error('Error stack:', error.stack);
			}
			return false;
		}
	}

	/**
	 * Deletes the CSS box by clicking the Delete link
	 */
	async clickDeleteCssBox(): Promise<void> {
		await this.deleteLink.click();
	}

	/**
	 * Confirms the deletion by clicking OK in the modal dialog
	 */
	async confirmDeleteCssBox(): Promise<void> {
		await this.page.evaluate(() => {
			const okButton = Array.from(document.querySelectorAll('button')).find(
				btn => btn.textContent?.trim() === 'OK'
			);
			if (okButton) {
				(okButton as HTMLButtonElement).click();
			}
		});
	}
}

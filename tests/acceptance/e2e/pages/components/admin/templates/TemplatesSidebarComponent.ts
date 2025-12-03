/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Page } from '@playwright/test';

/**
 * Component for the Templates sidebar navigation.
 * Manages the three template types: Questionnaires, Block user messages, and Proposal answers.
 */
export class TemplatesSidebarComponent {
	constructor(private page: Page) {}

	// Main selectors
	private get sidebarContainer() {
		return this.page.locator('.sidebar-menu__container');
	}

	private get sidebarMenu() {
		return this.page.locator('.sidebar-menu');
	}

	private get desktopMenu() {
		return this.sidebarMenu.locator('.hidden.md\\:block ul');
	}

	private get mobileMenuTrigger() {
		return this.page.locator('button[data-target="dropdown-menu-sidebar"]');
	}

	private get mobileMenu() {
		return this.page.locator('#dropdown-menu-sidebar');
	}

	// Selectors for specific menu items
	private get questionnairesLink() {
		return this.page.locator('a[href*="/admin/templates/questionnaire_templates"]');
	}

	private get blockUserLink() {
		return this.page.locator('a[href*="/admin/templates/block_user_templates"]');
	}

	private get proposalAnswersLink() {
		return this.page.locator('a[href*="/admin/templates/proposal_answer_templates"]');
	}

	// Active state selectors
	private get activeMenuItem() {
		return this.page.locator('.sidebar-menu__item.is-active');
	}

	// Verification methods
	async isSidebarVisible(): Promise<boolean> {
		return await this.sidebarContainer.isVisible();
	}

	async isDesktopMenuVisible(): Promise<boolean> {
		return await this.desktopMenu.isVisible();
	}

	async isMobileMenuTriggerVisible(): Promise<boolean> {
		return await this.mobileMenuTrigger.isVisible();
	}

	async isMobileMenuOpen(): Promise<boolean> {
		const ariaHidden = await this.mobileMenu.getAttribute('aria-hidden');
		return ariaHidden === 'false';
	}

	// Navigation methods
	async navigateToQuestionnaires(): Promise<void> {
		await this.questionnairesLink.first().click();
	}

	async navigateToBlockUserMessages(): Promise<void> {
		await this.blockUserLink.first().click();
	}

	async navigateToProposalAnswers(): Promise<void> {
		await this.proposalAnswersLink.first().click();
	}

	// Mobile menu interaction
	async openMobileMenu(): Promise<void> {
		if ((await this.isMobileMenuTriggerVisible()) && !(await this.isMobileMenuOpen())) {
			await this.mobileMenuTrigger.click();
		}
	}

	async closeMobileMenu(): Promise<void> {
		if (await this.isMobileMenuOpen()) {
			// Click outside the menu to close it
			await this.sidebarContainer.click();
		}
	}

	// Active state verification
	async getActiveMenuItem(): Promise<string> {
		return (await this.activeMenuItem.locator('a').textContent()) || '';
	}

	async isQuestionnairesActive(): Promise<boolean> {
		const activeText = await this.getActiveMenuItem();
		return activeText.includes('Questionnaires');
	}

	async isBlockUserActive(): Promise<boolean> {
		const activeText = await this.getActiveMenuItem();
		return activeText.includes('Block user messages');
	}

	async isProposalAnswersActive(): Promise<boolean> {
		const activeText = await this.getActiveMenuItem();
		return activeText.includes('Proposal answers');
	}

	// Link visibility checks
	async isQuestionnairesLinkVisible(): Promise<boolean> {
		return await this.questionnairesLink.first().isVisible();
	}

	async isBlockUserLinkVisible(): Promise<boolean> {
		return await this.blockUserLink.first().isVisible();
	}

	async isProposalAnswersLinkVisible(): Promise<boolean> {
		return await this.proposalAnswersLink.first().isVisible();
	}

	// Get link texts
	async getQuestionnairesLinkText(): Promise<string> {
		return (await this.questionnairesLink.first().textContent()) || '';
	}

	async getBlockUserLinkText(): Promise<string> {
		return (await this.blockUserLink.first().textContent()) || '';
	}

	async getProposalAnswersLinkText(): Promise<string> {
		return (await this.proposalAnswersLink.first().textContent()) || '';
	}

	async getMobileMenuTriggerText(): Promise<string> {
		return (await this.mobileMenuTrigger.locator('span').textContent()) || '';
	}

	// Get all available menu items
	async getAllMenuItems(): Promise<string[]> {
		const items: string[] = [];

		if (await this.isQuestionnairesLinkVisible()) {
			items.push(await this.getQuestionnairesLinkText());
		}

		if (await this.isBlockUserLinkVisible()) {
			items.push(await this.getBlockUserLinkText());
		}

		if (await this.isProposalAnswersLinkVisible()) {
			items.push(await this.getProposalAnswersLinkText());
		}

		return items;
	}

	// Check if sidebar is fully loaded
	async isSidebarFullyLoaded(): Promise<boolean> {
		const sidebarVisible = await this.isSidebarVisible();
		const questionnairesVisible = await this.isQuestionnairesLinkVisible();
		const blockUserVisible = await this.isBlockUserLinkVisible();
		const proposalAnswersVisible = await this.isProposalAnswersLinkVisible();

		return sidebarVisible && questionnairesVisible && blockUserVisible && proposalAnswersVisible;
	}
}

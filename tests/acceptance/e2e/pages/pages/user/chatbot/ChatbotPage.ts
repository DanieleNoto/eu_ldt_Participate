/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Antonio Abramo Carotenuto
 */

import { BasePage } from '@pages/base/BasePage';
import { expect, Page } from '@playwright/test';

/**
 * ChatbotPage - Page Object Model for the chatbot assistance feature.
 *
 * Extends BasePage and provides methods for interacting with the chatbot FAB (Floating Action Button)
 * for citizen support and assistance.
 */
export class ChatbotPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	// Selectors for chatbot elements
	private get openHelpAssistantButton() {
		return this.page.getByRole('button', { name: 'Open help assistant' });
	}

	private get closeHelpAssistantButton() {
		return this.page.getByRole('button', { name: 'Close help assistant' });
	}

	private get chatbotTitle() {
		return this.page.locator('div').filter({ hasText: /^Chat$/ });
	}

	private get chatbotWarningMessage() {
		return this.page.getByLabel('Chat').locator('div').filter({ hasText: '⚠Please note: The information' });
	}

	private get chatbotAvatarLogo() {
		return this.page.getByRole('log').locator('svg');
	}

	private get chatbotGreeting() {
		return this.page.locator('div.rounded-lg').filter({ hasText: "Hello, I'm the virtual assistant" }).first();
	}

	private get suggestedQuestionParticipateTool() {
		return this.page.getByRole('button', { name: 'What can I do in EU LDT' });
	}

	private get suggestedQuestionParticipatoryProcess() {
		return this.page.getByRole('button', { name: 'What is a participatory' });
	}

	private get suggestedQuestionAssemblies() {
		return this.page.getByRole('button', { name: 'What are assemblies?' });
	}

	private get suggestedQuestionConferences() {
		return this.page.getByRole('button', { name: 'What are conferences?' });
	}

	private get suggestedQuestionInitiatives() {
		return this.page.getByRole('button', { name: 'What are initiatives?' });
	}

	private get topicAnswer() {
		return this.page.locator('div.rounded-lg.bg-\\[\\#E9EBEF\\]').first();
	}

	private get SupportButton() {
		return this.page.getByRole('button', { name: 'Further support' });
	}

	private get describeIssueTextbox() {
		return this.page.getByRole('textbox', { name: 'Describe your issue' });
	}

	private get sendButton() {
		return this.page.getByRole('button', { name: 'Send' });
	}

	private get confirmationMessage() {
		return this.page.locator('div.rounded-lg.bg-\\[\\#E9EBEF\\]').filter({ hasText: 'Support request sent. Our' });
	}

	private get chatbotDialog() {
		return this.page.locator('dialog[aria-labelledby="chatbot-header-title"]');
	}

	/**
	 * Clicks the "Open help assistant" button to open the chatbot
	 */
	async openHelpAssistant(): Promise<void> {
		await this.openHelpAssistantButton.click();
		await this.waitForLoadState('load');
	}

	/**
	 * Clicks a topic button by name
	 */
	async clickTopicByName(topicName: string): Promise<void> {
		await this.page.getByRole('button', { name: topicName }).click();
		await this.waitForLoadState('load');
	}

	/**
	 * Clicks the "Further support" button
	 */
	async clickSupportButton(): Promise<void> {
		await this.SupportButton.click();
		await this.waitForLoadState('load');
	}

	/**
	 * Clicks on the "Describe your issue" textbox
	 */
	async clickDescribeIssueTextbox(): Promise<void> {
		await this.describeIssueTextbox.click();
	}

	/**
	 * Clicks the "Send" button.
	 * Does not wait for load state: the chatbot sends the message via an API call (no page
	 * navigation), so any waitForLoadState is unreliable on Firefox in CI.
	 * Callers that need to assert the result should use isConfirmationMessageVisible(), which
	 * already waits for the confirmation element to appear in the DOM.
	 */
	async clickSendButton(): Promise<void> {
		await this.sendButton.click();
	}

	/**
	 * Clicks the "Close help assistant" button to close the chatbot
	 */
	async closeHelpAssistant(): Promise<void> {
		await expect(this.chatbotDialog).toBeVisible();
		await expect(this.closeHelpAssistantButton).toBeVisible();
		await this.closeHelpAssistantButton.scrollIntoViewIfNeeded();

		// Try clicking the close button; if it fails, fall back to Escape
		try {
			await this.closeHelpAssistantButton.click({ force: true });
		} catch (error: unknown) {
			console.warn('closeHelpAssistant: click failed, falling back to Escape key.', error);
			await this.page.keyboard.press('Escape');
		}

		if (await this.chatbotDialog.isVisible().catch(() => false)) {
			await this.page.keyboard.press('Escape');
		}

		await expect(this.chatbotDialog).toBeHidden();
		await expect(this.openHelpAssistantButton).toBeVisible();
	}

	/**
	 * Checks if the "Close help assistant" button is visible
	 */
	async isCloseHelpAssistantButtonVisible(): Promise<boolean> {
		return await this.closeHelpAssistantButton.isVisible();
	}

	/**
	 * Checks if the chatbot title is visible
	 */
	async isChatbotTitleVisible(): Promise<boolean> {
		return await this.chatbotTitle.isVisible();
	}

	/**
	 * Checks if the chatbot warning message is visible
	 */
	async isWarningMessageVisible(): Promise<boolean> {
		return await this.chatbotWarningMessage.isVisible();
	}

	/**
	 * Checks if the chatbot avatar logo is visible
	 */
	async isAvatarLogoVisible(): Promise<boolean> {
		return await this.chatbotAvatarLogo.isVisible();
	}

	/**
	 * Checks if the chatbot greeting message is visible
	 */
	async isGreetingMessageVisible(): Promise<boolean> {
		await this.chatbotGreeting.waitFor({ state: 'visible', timeout: 5000 });
		return await this.chatbotGreeting.isVisible();
	}

	/**
	 * Checks if the suggested question is visible
	 */
	async isParticipateToolQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionParticipateTool.waitFor({ state: 'visible' });
		return await this.suggestedQuestionParticipateTool.isVisible();
	}

	/**
	 * Checks if the "What is a participatory process?" suggested question is visible
	 */
	async isParticipatoryProcessQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionParticipatoryProcess.waitFor({ state: 'visible' });
		return await this.suggestedQuestionParticipatoryProcess.isVisible();
	}

	/**
	 * Checks if the "What are assemblies?" suggested question is visible
	 */
	async isAssembliesQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionAssemblies.waitFor({ state: 'visible' });
		return await this.suggestedQuestionAssemblies.isVisible();
	}

	/**
	 * Checks if the "What are conferences?" suggested question is visible
	 */
	async isConferencesQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionConferences.waitFor({ state: 'visible' });
		return await this.suggestedQuestionConferences.isVisible();
	}

	/**
	 * Checks if the "What are initiatives?" suggested question is visible
	 */
	async isInitiativesQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionInitiatives.waitFor({ state: 'visible' });
		return await this.suggestedQuestionInitiatives.isVisible();
	}

	/**
	 * Checks if the chatbot has provided a topic answer
	 */
	async isTopicAnswerVisible(): Promise<boolean> {
		await this.topicAnswer.waitFor({ state: 'visible' });
		return await this.topicAnswer.isVisible();
	}

	/**
	 * Checks if the "Describe your issue" textbox is visible
	 */
	async isDescribeIssueTextboxVisible(): Promise<boolean> {
		return await this.describeIssueTextbox.isVisible();
	}

	/**
	 * Fills the "Describe your issue" textbox with a question
	 */
	async fillDescribeIssueTextbox(question: string): Promise<void> {
		await this.describeIssueTextbox.fill(question);

		// Trigger input event on the textbox
		await this.describeIssueTextbox.dispatchEvent('input');

		// Wait for the Send button to be enabled
		await this.page.waitForFunction(() => {
			const button = document.querySelector('button[type="submit"]');
			return button && !button.hasAttribute('disabled');
		});
	}

	/**
	 * Checks if the confirmation message is visible.
	 * After clicking Send, the chatbot shows a typing indicator (3 animated dots) while the
	 * API call is in progress. The confirmation message replaces it once the response arrives.
	 * On CI (especially Firefox) the API round-trip can take longer than the default 30s timeout,
	 * so we use expect() with an explicit 60s timeout to cover slow environments.
	 */
	async isConfirmationMessageVisible(): Promise<boolean> {
		await expect(this.confirmationMessage).toBeVisible({ timeout: 60000 });
		return true;
	}

	/**
	 * Checks if the chatbot dialog is closed
	 */
	async isChatbotDialogClosed(): Promise<boolean> {
		return !(await this.chatbotDialog.isVisible());
	}

	/**
	 * Checks if the "Open help assistant" button (FAB) is visible
	 */
	async isOpenHelpAssistantButtonVisible(): Promise<boolean> {
		return await this.openHelpAssistantButton.isVisible();
	}
}

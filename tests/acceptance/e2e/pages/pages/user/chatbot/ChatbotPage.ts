/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Simone Bianchelli
 */

import { BasePage } from '@pages/base/BasePage';
import { Page } from '@playwright/test';

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
		return this.page.getByText("Hello, I'm the virtual").first();
	}

	private get billingQuestionsButton() {
		return this.page.getByRole('button', { name: 'Billing questions' });
	}

	private get technicalSupportButton() {
		return this.page.getByRole('button', { name: 'Technical support' });
	}

	private get generalInformationButton() {
		return this.page.getByRole('button', { name: 'General information' });
	}

	private get suggestedQuestionGetStarted() {
		return this.page.getByRole('button', { name: 'How do I get started with the' });
	}

	private get suggestedQuestionInviteTeamMembers() {
		return this.page.getByRole('button', { name: 'Can I invite team members to' });
	}

	private get suggestedQuestionContactCustomer() {
		return this.page.getByRole('button', { name: 'How do I contact customer' });
	}

	private get suggestedQuestionDataSecurity() {
		return this.page.getByRole('button', { name: 'Is my data secure and private?' });
	}

	private get dataSecurityAnswer() {
		return this.page.getByText('Yes, we take data security');
	}

	private get askSupportButton() {
		return this.page.getByRole('button', { name: 'Ask support' });
	}

	private get describeIssueTextbox() {
		return this.page.getByRole('textbox', { name: 'Describe your issue' });
	}

	private get sendButton() {
		return this.page.getByRole('button', { name: 'Send' });
	}

	private get confirmationMessage() {
		return this.page.getByText('Support request sent. Our');
	}

	private get chatbotDialog() {
		return this.page.locator('dialog[aria-labelledby="chatbot-header-title"]');
	}

	/**
	 * Clicks the "Open help assistant" button to open the chatbot
	 */
	async openHelpAssistant(): Promise<void> {
		await this.openHelpAssistantButton.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Clicks the "General information" button
	 */
	async clickGeneralInformationButton(): Promise<void> {
		await this.generalInformationButton.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Clicks the "Is my data secure and private?" suggested question
	 */
	async clickDataSecurityQuestion(): Promise<void> {
		await this.suggestedQuestionDataSecurity.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Clicks the "Ask support" button
	 */
	async clickAskSupportButton(): Promise<void> {
		await this.askSupportButton.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Clicks on the "Describe your issue" textbox
	 */
	async clickDescribeIssueTextbox(): Promise<void> {
		await this.describeIssueTextbox.click();
	}

	/**
	 * Clicks the "Send" button
	 */
	async clickSendButton(): Promise<void> {
		await this.sendButton.click();
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Clicks the "Close help assistant" button to close the chatbot
	 */
	async closeHelpAssistant(): Promise<void> {
		await this.closeHelpAssistantButton.click();
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
		return await this.chatbotGreeting.isVisible();
	}

	/**
	 * Checks if the "Billing questions" button is visible
	 */
	async isBillingQuestionsButtonVisible(): Promise<boolean> {
		return await this.billingQuestionsButton.isVisible();
	}

	/**
	 * Checks if the "Technical support" button is visible
	 */
	async isTechnicalSupportButtonVisible(): Promise<boolean> {
		return await this.technicalSupportButton.isVisible();
	}

	/**
	 * Checks if the "General information" button is visible
	 */
	async isGeneralInformationButtonVisible(): Promise<boolean> {
		return await this.generalInformationButton.isVisible();
	}

	/**
	 * Checks if the "How do I get started with the platform?" suggested question is visible
	 */
	async isGetStartedQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionGetStarted.waitFor({ state: 'visible' });
		return await this.suggestedQuestionGetStarted.isVisible();
	}

	/**
	 * Checks if the "Can I invite team members to my account?" suggested question is visible
	 */
	async isInviteTeamMembersQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionInviteTeamMembers.waitFor({ state: 'visible' });
		return await this.suggestedQuestionInviteTeamMembers.isVisible();
	}

	/**
	 * Checks if the "How do I contact customer support?" suggested question is visible
	 */
	async isContactCustomerQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionContactCustomer.waitFor({ state: 'visible' });
		return await this.suggestedQuestionContactCustomer.isVisible();
	}

	/**
	 * Checks if the "Is my data secure and private?" suggested question is visible
	 */
	async isDataSecurityQuestionVisible(): Promise<boolean> {
		await this.suggestedQuestionDataSecurity.waitFor({ state: 'visible' });
		return await this.suggestedQuestionDataSecurity.isVisible();
	}

	/**
	 * Checks if the data security answer is visible
	 */
	async isDataSecurityAnswerVisible(): Promise<boolean> {
		return await this.dataSecurityAnswer.isVisible();
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
	 * Checks if the confirmation message is visible
	 */
	async isConfirmationMessageVisible(): Promise<boolean> {
		await this.confirmationMessage.waitFor({ state: 'visible' });
		return await this.confirmationMessage.isVisible();
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

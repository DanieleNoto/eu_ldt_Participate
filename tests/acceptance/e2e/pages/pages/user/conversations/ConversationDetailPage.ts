/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { Locator, Page, expect } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';

export class ConversationDetailPage extends AuthenticatedPage {
	readonly conversationTitle: Locator;
	readonly participantsSection: Locator;
	readonly participantNames: Locator;
	readonly messagesContainer: Locator;
	readonly messages: Locator;
	readonly replyTextarea: Locator;
	readonly newConversationTextarea: Locator;
	readonly sendButton: Locator;
	readonly emojiButton: Locator;
	readonly characterCounter: Locator;
	readonly replyForm: Locator;
	readonly newConversationForm: Locator;

	constructor(page: Page) {
		super(page);
		this.conversationTitle = page.locator('h2.conversation__title');
		this.participantsSection = page.locator('.conversation__participants');
		this.participantNames = page.locator('.author__name.underline');
		this.messagesContainer = page.locator('#messages');
		this.messages = page.locator('.conversation__message');
		this.replyTextarea = page.locator('#message_body');
		this.newConversationTextarea = page
			.locator('form.new_conversation textarea, #conversation_body, #message_body')
			.first();
		this.sendButton = page.locator('button[type="submit"]:has-text("Send")');
		this.emojiButton = page.locator('.emoji__button');
		this.characterCounter = page.locator('#message_body_characters');
		this.replyForm = page.locator('form.new_message');
		this.newConversationForm = page.locator('form.new_conversation');
	}

	/**
	 * Navigate to a specific conversation detail page
	 * @param conversationId - The ID of the conversation
	 */
	async goto(conversationId: string) {
		await this.page.goto(`/conversations/${conversationId}`);
	}

	/**
	 * Verify that we are on the conversation detail page
	 */
	async expectToBeOnConversationDetailPage() {
		await expect(this.conversationTitle).toBeVisible();
		await expect(this.conversationTitle).toContainText('Conversation with');
		await expect(this.participantsSection).toBeVisible();
		await expect(this.messagesContainer).toBeVisible();
		await expect(this.replyTextarea).toBeVisible();
		await expect(this.page).toHaveURL(/.*\/conversations\/\d+/);
	}

	async expectToBeOnNewConversationDetailPage() {
		await expect(this.conversationTitle).toBeVisible();
		await expect(this.conversationTitle).toContainText('Conversation with');
		await expect(this.participantsSection).toBeVisible();
		await expect(this.newConversationTextarea).toBeVisible();
		await expect(this.page).toHaveURL(/.*\/conversations\/new(\?.*)?$/);
	}

	/**
	 * Verify that we are on a conversation detail page (new or existing)
	 */
	async expectToBeOnConversationPage() {
		await expect(this.conversationTitle).toBeVisible();
		await expect(this.conversationTitle).toContainText('Conversation with');
		await expect(this.participantsSection).toBeVisible();

		// Accept either new conversation or existing conversation URL
		await expect(this.page).toHaveURL(/.*\/conversations\/(new|\d+)/);

		// Wait for either textarea to be available
		await this.page.waitForSelector('textarea', { state: 'visible' });
	}

	/**
	 * Get the active textarea (new conversation or reply)
	 */
	async getActiveTextarea(): Promise<Locator> {
		const isNewConversation = await this.newConversationTextarea.isVisible().catch(() => false);
		return isNewConversation ? this.newConversationTextarea : this.replyTextarea;
	}

	/**
	 * Send a message in the conversation
	 * @param messageText - The text to send
	 */
	async sendMessage(messageText: string) {
		await this.replyTextarea.fill(messageText);
		await this.sendButton.click();
	}

	/**
	 * Get the number of messages in the conversation
	 */
	async getMessageCount(): Promise<number> {
		return await this.messages.count();
	}

	/**
	 * Get the text content of a specific message by index
	 * @param index - The index of the message (0-based)
	 */
	async getMessageText(index: number): Promise<string> {
		const message = this.messages.nth(index);
		const messageTextElement = message.locator('.conversation__message-text > div > p');
		return (await messageTextElement.textContent()) || '';
	}

	/**
	 * Get the sender name of a specific message by index
	 * @param index - The index of the message (0-based)
	 */
	async getMessageSender(index: number): Promise<string> {
		const message = this.messages.nth(index);
		const senderElement = message.locator('.conversation__message-sender');
		return (await senderElement.textContent()) || '';
	}

	/**
	 * Get the timestamp of a specific message by index
	 * @param index - The index of the message (0-based)
	 */
	async getMessageTimestamp(index: number): Promise<string> {
		const message = this.messages.nth(index);
		const timestampElement = message.locator('.conversation__message-time');
		return (await timestampElement.textContent()) || '';
	}

	/**
	 * Get the full timestamp title attribute of a specific message by index
	 * @param index - The index of the message (0-based)
	 */
	async getMessageFullTimestamp(index: number): Promise<string> {
		const message = this.messages.nth(index);
		const timestampElement = message.locator('.conversation__message-time');
		return (await timestampElement.getAttribute('title')) || '';
	}

	/**
	 * Get the names of all participants in the conversation
	 */
	async getParticipantNames(): Promise<string[]> {
		const names = await this.participantNames.allTextContents();
		return names.filter(name => name.trim() !== '');
	}

	/**
	 * Verify that a specific participant is in the conversation
	 * @param participantName - The name of the participant to verify
	 */
	async expectParticipantInConversation(participantName: string) {
		const participant = this.participantNames.filter({ hasText: participantName });
		await expect(participant).toBeVisible();
	}

	/**
	 * Click on a participant's profile link
	 * @param participantName - The name of the participant
	 */
	async clickParticipantProfile(participantName: string) {
		const participant = this.participantNames.filter({ hasText: participantName });
		await participant.click();
	}

	/**
	 * Scroll to the latest message in the conversation
	 */
	async scrollToLatestMessage() {
		const messageCount = await this.getMessageCount();
		if (messageCount > 0) {
			const lastMessage = this.messages.nth(messageCount - 1);
			await lastMessage.scrollIntoViewIfNeeded();
		}
	}

	/**
	 * Scroll to a specific message by index
	 * @param index - The index of the message to scroll to
	 */
	async scrollToMessage(index: number) {
		const message = this.messages.nth(index);
		await message.scrollIntoViewIfNeeded();
	}

	/**
	 * Clear the reply textarea
	 */
	async clearReplyText() {
		await this.replyTextarea.clear();
	}

	/**
	 * Get the current character count from the counter
	 */
	async getCharacterCount(): Promise<string> {
		return (await this.characterCounter.textContent()) || '';
	}

	/**
	 * Click the emoji button to open emoji picker
	 */
	async clickEmojiButton() {
		await this.emojiButton.click();
	}

	/**
	 * Get the placeholder text of the reply textarea
	 */
	async getReplyPlaceholder(): Promise<string> {
		return (await this.replyTextarea.getAttribute('placeholder')) || '';
	}

	/**
	 * Verify that a message with specific text exists in the conversation
	 * @param messageText - The text to search for
	 */
	async expectMessageWithText(messageText: string) {
		const message = this.messages.filter({
			has: this.page.locator('.conversation__message-text > div > p', { hasText: messageText })
		});
		await expect(message).toBeVisible();
	}

	/**
	 * Verify that a message from a specific sender exists
	 * @param senderName - The name of the sender
	 * @param messageText - The text of the message (optional)
	 */
	async expectMessageFromSender(senderName: string, messageText?: string) {
		let message = this.messages.filter({
			has: this.page.locator('.conversation__message-sender', { hasText: senderName })
		});

		if (messageText) {
			message = message.filter({
				has: this.page.locator('.conversation__message-text > div > p', { hasText: messageText })
			});
		}

		await expect(message).toBeVisible();
	}

	/**
	 * Wait for the conversation to load completely
	 */
	async waitForConversationToLoad() {
		await expect(this.conversationTitle).toBeVisible();
		await expect(this.messagesContainer).toBeVisible();
		await this.page.waitForTimeout(1000); // Allow time for messages to render
	}

	/**
	 * Check if the reply form is visible and ready for input
	 */
	async isReplyFormReady(): Promise<boolean> {
		return (await this.replyTextarea.isVisible()) && (await this.sendButton.isVisible());
	}
}

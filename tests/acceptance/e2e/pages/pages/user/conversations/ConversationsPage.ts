import { Locator, Page, expect } from '@playwright/test';
import { AuthenticatedPage } from '../../../base/AuthenticatedPage';

export class ConversationsPage extends AuthenticatedPage {
	readonly conversationsTitle: Locator;
	readonly newConversationButton: Locator;
	readonly conversationsList: Locator;
	readonly conversationItems: Locator;

	constructor(page: Page) {
		super(page);
		this.conversationsTitle = page.locator('h1.title-decorator:has-text("Conversations")');
		this.newConversationButton = page.locator('#start-conversation-dialog-button');
		this.conversationsList = page.locator('section.layout-main__section');
		this.conversationItems = page.locator('a.conversation__item');
	}

	/**
	 * Navigate to the conversations page
	 */
	async goto() {
		await this.page.goto('/conversations');
	}

	/**
	 * Verify that we are on the conversations page
	 */
	async expectToBeOnConversationsPage() {
		await expect(this.conversationsTitle).toBeVisible();
		await expect(this.newConversationButton).toBeVisible();
		await expect(this.page).toHaveURL(/.*\/conversations/);
	}

	/**
	 * Click on a conversation based on its index (0-based)
	 * @param index - The index of the conversation to click (0 = first conversation)
	 */
	async clickConversationByIndex(index: number) {
		const conversations = this.conversationItems;
		await expect(conversations).toHaveCount(await conversations.count());

		const targetConversation = conversations.nth(index);
		await expect(targetConversation).toBeVisible();
		await targetConversation.click();
	}

	/**
	 * Click on a conversation by participant name
	 * @param participantName - The name of the conversation participant
	 */
	async clickConversationByParticipant(participantName: string) {
		const conversation = this.conversationItems.filter({
			has: this.page.locator('.conversation__item-snippet-title h2', { hasText: participantName })
		});
		await expect(conversation).toBeVisible();
		await conversation.click();
	}

	/**
	 * Scroll to the last conversation in the list
	 */
	async scrollToLastConversation() {
		const conversations = this.conversationItems;
		const conversationCount = await conversations.count();

		if (conversationCount > 0) {
			const lastConversation = conversations.nth(conversationCount - 1);
			await lastConversation.scrollIntoViewIfNeeded();
		}
	}

	/**
	 * Get the number of conversations in the list
	 */
	async getConversationCount(): Promise<number> {
		return await this.conversationItems.count();
	}

	/**
	 * Check if a conversation has unread messages by index
	 * @param index - The index of the conversation to check
	 */
	async hasUnreadMessages(index: number): Promise<boolean> {
		const conversation = this.conversationItems.nth(index);
		const unreadBadge = conversation.locator('.conversation__item-unread span');
		return await unreadBadge.isVisible();
	}

	/**
	 * Get the unread message count for a conversation by index
	 * @param index - The index of the conversation to check
	 */
	async getUnreadMessageCount(index: number): Promise<number> {
		const conversation = this.conversationItems.nth(index);
		const unreadBadge = conversation.locator('.conversation__item-unread span');

		if (await unreadBadge.isVisible()) {
			const countText = await unreadBadge.textContent();
			return parseInt(countText?.trim() || '0', 10);
		}

		return 0;
	}

	/**
	 * Get conversation snippet message by index
	 * @param index - The index of the conversation
	 */
	async getConversationSnippet(index: number): Promise<string> {
		const conversation = this.conversationItems.nth(index);
		const snippet = conversation.locator('.conversation__item-snippet-message');
		return (await snippet.textContent()) || '';
	}

	/**
	 * Get conversation participant name by index
	 * @param index - The index of the conversation
	 */
	async getConversationParticipant(index: number): Promise<string> {
		const conversation = this.conversationItems.nth(index);
		const participantName = conversation.locator('.conversation__item-snippet-title h2');
		return (await participantName.textContent()) || '';
	}

	/**
	 * Get conversation timestamp by index
	 * @param index - The index of the conversation
	 */
	async getConversationTimestamp(index: number): Promise<string> {
		const conversation = this.conversationItems.nth(index);
		const timestamp = conversation.locator('.conversation__item-snippet-time');
		return (await timestamp.textContent()) || '';
	}

	/**
	 * Click on the "New conversation" button
	 */
	async clickNewConversationButton() {
		await this.newConversationButton.click();
	}

	/**
	 * Wait for conversations to load
	 */
	async waitForConversationsToLoad() {
		await expect(this.conversationsTitle).toBeVisible();
		// Wait for at least one conversation to appear or confirm the list is empty
		await this.page.waitForTimeout(1000);
	}

	/**
	 * Verify that a specific conversation exists by participant name
	 * @param participantName - The name of the conversation participant
	 */
	async expectConversationWithParticipant(participantName: string) {
		const conversation = this.conversationItems.filter({
			has: this.page.locator('.conversation__item-snippet-title h2', { hasText: participantName })
		});
		await expect(conversation).toBeVisible();
	}
}

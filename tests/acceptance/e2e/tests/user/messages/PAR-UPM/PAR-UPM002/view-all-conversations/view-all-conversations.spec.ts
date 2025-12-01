/* SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ConversationDetailPage } from '@pages/pages/user/conversations/ConversationDetailPage';
import { ConversationsPage } from '@pages/pages/user/conversations/ConversationsPage';
import { test, expect } from '@fixtures/parallel-test';

/**
 * Test suite for Allows citizens to view all their conversations within the system, providing an overview of past and ongoing private communications with other users.
 *
 * User Story: As a Citizen, I want to view all my conversations so that I can easily access my message history and keep track of ongoing discussions with other users.
 *
 * Requirements: PAR R12f, PAR R13
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 *
 */
test.describe('[PAR-UPM002] – View all conversations', () => {
	let homePage: HomePage;
	let conversationsPage: ConversationsPage;
	let conversationDetailPage: ConversationDetailPage;

	test.beforeEach(async ({ userPage }) => {
		homePage = new HomePage(userPage);
		conversationsPage = new ConversationsPage(userPage);
		conversationDetailPage = new ConversationDetailPage(userPage);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow user to view all conversations', async () => {
			await test.step('1. User: Navigates to the "Conversations" section from the main dashboard.', async () => {
				// Navigate to conversations section
				await homePage.header.goToConversations();
				await homePage.waitForLoadState('load');

				// Verify we're on the conversations page
				await conversationsPage.expectToBeOnConversationsPage();
			});

			await test.step('2. System: Displays a list of all existing conversations, showing each conversation as a separate entry. Participant Name, Last Message Preview, Timestamp', async () => {
				// Wait for conversations to load
				await conversationsPage.waitForConversationsToLoad();

				// Verify conversations are displayed
				const conversationCount = await conversationsPage.getConversationCount();
				expect(conversationCount).toBeGreaterThan(0);

				// Verify first conversation has required elements
				if (conversationCount > 0) {
					// Check participant name is visible
					const participantName = await conversationsPage.getConversationParticipant(0);
					expect(participantName).toBeTruthy();

					// Check last message preview is visible
					const messageSnippet = await conversationsPage.getConversationSnippet(0);
					expect(messageSnippet).toBeTruthy();

					// Check timestamp is visible
					const timestamp = await conversationsPage.getConversationTimestamp(0);
					expect(timestamp).toBeTruthy();
				}
			});

			await test.step('3. User: Scrolls through the list to browse all conversations.', async () => {
				const conversationCount = await conversationsPage.getConversationCount();

				if (conversationCount > 1) {
					// Scroll to the last conversation to verify scrolling works
					await conversationsPage.scrollToLastConversation();

					// Verify we can see the last conversation
					const lastConversationParticipant = await conversationsPage.getConversationParticipant(
						conversationCount - 1
					);
					expect(lastConversationParticipant).toBeTruthy();
				}
			});

			let selectedConversationParticipant: string;
			let selectedConversationSnippet: string;

			await test.step('4. User: Selects a conversation to view the full message history.', async () => {
				// Get details of the first conversation before clicking
				selectedConversationParticipant = await conversationsPage.getConversationParticipant(0);
				selectedConversationSnippet = await conversationsPage.getConversationSnippet(0);

				// Click on the first conversation
				await conversationsPage.clickConversationByIndex(0);
			});

			await test.step('5. System: Displays the entire conversation history with the selected user, allowing the citizen to view all sent and received messages.', async () => {
				// Verify we're on the conversation detail page
				await conversationDetailPage.expectToBeOnConversationDetailPage();

				// Wait for conversation to load completely
				await conversationDetailPage.waitForConversationToLoad();

				// Verify the participant is in the conversation
				await conversationDetailPage.expectParticipantInConversation(selectedConversationParticipant);

				// Verify messages are displayed
				const messageCount = await conversationDetailPage.getMessageCount();
				expect(messageCount).toBeGreaterThan(0);

				// Verify we can see the message history
				if (messageCount > 0) {
					// Check first message details
					const firstMessageText = await conversationDetailPage.getMessageText(0);
					const firstMessageSender = await conversationDetailPage.getMessageSender(0);
					const firstMessageTimestamp = await conversationDetailPage.getMessageTimestamp(0);

					expect(firstMessageText).toBeTruthy();
					expect(firstMessageSender).toBeTruthy();
					expect(firstMessageTimestamp).toBeTruthy();

					// Verify the snippet from the conversations list matches with the actual conversation
					await conversationDetailPage.expectMessageWithText(selectedConversationSnippet);
				}

				// Verify the reply form is ready for interaction
				const isReplyFormReady = await conversationDetailPage.isReplyFormReady();
				expect(isReplyFormReady).toBe(true);
			});

			await test.step('Result.', async () => {
				// Final verification: User successfully viewed all conversations and accessed detailed conversation history

				// Verify we can navigate back to conversations list
				await conversationsPage.goto();
				await conversationsPage.expectToBeOnConversationsPage();

				// Verify conversations list is still accessible and functional
				const finalConversationCount = await conversationsPage.getConversationCount();
				expect(finalConversationCount).toBeGreaterThan(0);

				// Verify we can still see conversation details
				const firstConversationParticipant = await conversationsPage.getConversationParticipant(0);
				expect(firstConversationParticipant).toBeTruthy();

				console.log(
					`✅ Test completed successfully: User viewed ${finalConversationCount} conversations and successfully accessed detailed conversation history with ${selectedConversationParticipant}`
				);
			});
		});
	});
});

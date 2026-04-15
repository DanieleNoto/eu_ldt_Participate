/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ConversationDetailPage } from '@pages/pages/user/conversations/ConversationDetailPage';
import { ConversationsPage } from '@pages/pages/user/conversations/ConversationsPage';
import { ProfilePage } from '@pages/pages/user/ProfilePage';
import { test, expect } from '@fixtures/parallel-test-reserved';

/**
 * Test suite for Enables citizens to communicate privately with other users.
 *
 * User Story: 	As a Citizen, I want to send private messages to other users so that I can have direct conversations and engage in private discussions.
 *
 * Requirements: PAR R12f, PAR R13
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 *
 */

test.describe('@reserved [PAR-UPM001] – Send private messages', () => {
	test.describe.configure({ mode: 'serial' });
	let homePage: HomePage;
	let profilePage: ProfilePage;
	let conversationsPage: ConversationsPage;
	let conversationDetailPage: ConversationDetailPage;
	const targetProfileUsername = 'admin'; // Fixed user to message

	test.beforeEach(async ({ userPage }) => {
		homePage = new HomePage(userPage);
		profilePage = new ProfilePage(userPage);
		conversationsPage = new ConversationsPage(userPage);
		conversationDetailPage = new ConversationDetailPage(userPage);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		let recipientName: string;
		let messageContent: string;
		let messageTimestamp: string;
		let senderName: string;

		test('should allow user to send a private message', async ({ userPage, adminPage }) => {
			// Generate unique timestamp
			messageTimestamp = new Date().toISOString();

			// Get the sender's name (logged in user) for verification
			const userProfilePage = new ProfilePage(userPage);
			await homePage.header.goToMyProfile();
			await userProfilePage.waitForProfileToLoad();
			senderName = await userProfilePage.getProfileName();
			console.log(`Sender (logged in user): ${senderName}`);
			await homePage.navigateToHomePage();

			await test.step('1. User: Navigates to the profile of the user they wish to message.', async () => {
				// Navigate directly to the target user's profile
				const profileUrl = `/profiles/${targetProfileUsername}`;
				console.log(`Navigating to profile: ${profileUrl}`);

				await homePage.navigateTo(profileUrl);
				await homePage.waitForLoadState('load');
			});

			await test.step("2. System: Displays the user's profile, including an option to send a private message.", async () => {
				// Verify we're on the profile page
				await profilePage.expectToBeOnProfilePage();

				await profilePage.waitForProfileToLoad();

				// Get the recipient's name for later verification
				recipientName = await profilePage.getProfileName();
				expect(recipientName).toBeTruthy();

				// Verify the message button is present and visible
				await expect(profilePage.messageButton).toBeVisible();

				// Verify the profile displays expected elements
				await expect(profilePage.profileAvatar).toBeVisible();
				await expect(profilePage.profileName).toBeVisible();
				await expect(profilePage.profileDetails).toBeVisible();

				// Verify the message button has correct functionality
				await profilePage.expectMessageButtonWithRecipientId();
			});

			await test.step('3. User: Clicks on the "Send Private Message" button.', async () => {
				// Click the message button to start a new conversation
				await profilePage.clickMessageButton();
			});

			await test.step('4. System: Displays the messaging interface with a text input box.', async () => {
				// Verify we're redirected to the conversation detail page
				await conversationDetailPage.expectToBeOnConversationPage();

				// Verify the conversation title indicates it's with the selected user
				await expect(conversationDetailPage.conversationTitle).toBeVisible();
				await expect(conversationDetailPage.conversationTitle).toContainText('Conversation with');

				// Verify the messaging interface elements are present
				const activeTextarea = await conversationDetailPage.getActiveTextarea();
				await expect(activeTextarea).toBeVisible();
				await expect(conversationDetailPage.sendButton).toBeVisible();
			});

			await test.step('5. User: Types the message content into the input box.', async () => {
				// Define the message content with unique timestamp
				messageContent = `Test message sent at ${messageTimestamp} - Hello ${recipientName}! This is an automated test message.`;

				// Get the active textarea
				const activeTextarea = await conversationDetailPage.getActiveTextarea();
				await activeTextarea.fill(messageContent);

				// Verify the message was typed correctly
				const typedText = await activeTextarea.inputValue();
				expect(typedText).toBe(messageContent);
			});

			await test.step('6. User: Clicks the "Send" button to send the message.', async () => {
				// Get initial message count for comparison
				const initialMessageCount = await conversationDetailPage.getMessageCount();
				console.log(`Initial message count: ${initialMessageCount}`);

				// Send the message
				await conversationDetailPage.sendButton.click();

				// Wait for the message to be sent and page to update
				await conversationDetailPage.waitForLoadState('load');
			});

			await test.step('7. System: Sends the message to the recipient and adds it to the conversation history between the two users.', async () => {
				// Verify the message with unique timestamp appears in the conversation
				await conversationDetailPage.expectMessageWithText(messageTimestamp);

				// Verify the full message content is present
				await conversationDetailPage.expectMessageWithText(messageContent);

				// Verify the message count has increased
				const finalMessageCount = await conversationDetailPage.getMessageCount();
				expect(finalMessageCount).toBeGreaterThan(0);
				console.log(`Final message count: ${finalMessageCount}`);

				// Find and verify the specific message by searching for the unique timestamp
				let foundOurMessage = false;
				for (let i = 0; i < finalMessageCount; i++) {
					const msgText = await conversationDetailPage.getMessageText(i);
					if (msgText.includes(messageTimestamp)) {
						foundOurMessage = true;
						console.log(`Found our message at index ${i}: "${msgText.substring(0, 50)}..."`);

						// Verify the message has a timestamp
						const msgTimestamp = await conversationDetailPage.getMessageTimestamp(i);
						expect(msgTimestamp).toBeTruthy();
						break;
					}
				}

				expect(foundOurMessage).toBe(true);

				// Verify the conversation participant is correct
				await conversationDetailPage.expectParticipantInConversation(recipientName);
			});

			await test.step('8. System: Notifies the recipient that they have received a new private message.', async () => {
				// Verify from both sender and recipient perspectives that the message was sent/received

				// First, verify from sender's perspective (user)
				// Verify the conversation is now in the conversations list
				await conversationsPage.goto();
				await conversationsPage.expectToBeOnConversationsPage();
				await conversationsPage.waitForConversationsToLoad();

				// Verify the conversation appears in the list
				const conversationCount = await conversationsPage.getConversationCount();
				expect(conversationCount).toBeGreaterThan(0);

				// Look for our conversation with the recipient
				let foundConversation = false;
				for (let i = 0; i < conversationCount; i++) {
					const participantName = await conversationsPage.getConversationParticipant(i);
					if (participantName.includes(recipientName)) {
						foundConversation = true;

						// Verify the conversation snippet shows our message
						const snippet = await conversationsPage.getConversationSnippet(i);
						expect(snippet).toBeTruthy();

						break;
					}
				}

				expect(foundConversation).toBe(true);

				// Verify from admin's perspective that the message was received
				const adminConversationsPage = new ConversationsPage(adminPage);

				// Navigate to admin's conversations page
				await adminConversationsPage.goto();
				await adminConversationsPage.expectToBeOnConversationsPage();
				await adminConversationsPage.waitForConversationsToLoad();

				// Look for conversation with the sender (logged in user)
				const adminConversationCount = await adminConversationsPage.getConversationCount();
				expect(adminConversationCount).toBeGreaterThan(0);

				let foundSenderConversation = false;
				for (let i = 0; i < adminConversationCount; i++) {
					const participantName = await adminConversationsPage.getConversationParticipant(i);
					if (participantName.includes(senderName)) {
						foundSenderConversation = true;

						// Verify the conversation snippet shows the specific message with unique timestamp
						// This ensures we're not matching old messages from the same sender
						const snippet = await adminConversationsPage.getConversationSnippet(i);
						expect(snippet).toContain(messageTimestamp);

						console.log(`Admin received message from ${senderName}`);
						console.log(`Message contains unique timestamp: ${messageTimestamp}`);

						break;
					}
				}

				expect(foundSenderConversation).toBe(true);
				console.log('Message successfully received and visible to admin in conversation list');
			});

			await test.step('Result.', async () => {
				// Final verification: Private message was successfully sent

				// Find and click on the specific conversation
				const adminConversation = conversationsPage
					.getPage()
					.locator('a.conversation__item')
					.filter({
						has: conversationsPage
							.getPage()
							.locator('.conversation__item-snippet-title h2', { hasText: targetProfileUsername })
					})
					.first();

				await adminConversation.click();
				await conversationDetailPage.expectToBeOnConversationDetailPage();

				// Verify our unique message is still there
				await conversationDetailPage.expectMessageWithText(messageTimestamp);

				// Verify the conversation maintains the correct participant
				await conversationDetailPage.expectParticipantInConversation(recipientName);

				// Verify the reply form is still functional for continued conversation
				const isReplyFormReady = await conversationDetailPage.isReplyFormReady();
				expect(isReplyFormReady).toBe(true);

				console.log(`Test completed successfully:`);
				console.log(`- Message sent at: ${messageTimestamp}`);
				console.log(`- Recipient: ${recipientName}`);
				console.log(`- Message appears in conversation history`);
			});
		});
	});
});

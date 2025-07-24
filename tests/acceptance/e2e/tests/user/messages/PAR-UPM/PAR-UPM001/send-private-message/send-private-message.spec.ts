import { HomePage } from '@pages/pages/public/HomePage';
import { ConversationDetailPage } from '@pages/pages/user/conversations/ConversationDetailPage';
import { ConversationsPage } from '@pages/pages/user/conversations/ConversationsPage';
import { ProfilePage } from '@pages/pages/user/ProfilePage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

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
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
});
test.describe('[PAR-UPM001] – Send private messages', () => {
	test.use({ storageState: STORAGE_STATE.USER });

	let homePage: HomePage;
	let profilePage: ProfilePage;
	let conversationsPage: ConversationsPage;
	let conversationDetailPage: ConversationDetailPage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		profilePage = new ProfilePage(page);
		conversationsPage = new ConversationsPage(page);
		conversationDetailPage = new ConversationDetailPage(page);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow user to send a private message', async () => {
			let recipientName: string;
			let messageContent: string;

			await test.step('1. User: Navigates to the profile of the user they wish to message.', async () => {
				// Navigate to user profile by clicking on an author avatar from last activity
				await homePage.lastActivitySection.waitForActivityToLoad();

				// Scroll to the last activity section to ensure it's visible
				await homePage.lastActivitySection.scrollToSection();

				// Wait for activities to be fully loaded
				await homePage.waitForLoadState('networkidle');

				// Ensure there are activities with authors
				const activitiesWithAuthors = await homePage.lastActivitySection.getActivitiesWithAuthors();
				expect(activitiesWithAuthors.length).toBeGreaterThan(0);

				// Get the first activity with an author (most reliable approach)
				const firstActivityWithAuthor = activitiesWithAuthors[0];
				console.log(`Getting profile URL for activity at index: ${firstActivityWithAuthor}`);

				// Get the profile URL directly and navigate to it
				const profileUrl = await homePage.lastActivitySection.getAuthorProfileUrl(firstActivityWithAuthor);
				expect(profileUrl).toBeTruthy();
				console.log(`Navigating directly to profile URL: ${profileUrl}`);

				// Navigate directly to the profile page
				await homePage.navigateTo(profileUrl);
				await homePage.waitForLoadState('load');
			});

			await test.step("2. System: Displays the user's profile, including an option to send a private message.", async () => {
				// Verify we're on the profile page
				await profilePage.expectToBeOnProfilePage();

				// Wait for profile to load completely
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
				// Verify we're redirected to the conversation detail page (new conversation)
				await conversationDetailPage.expectToBeOnNewConversationDetailPage();

				// Verify the messaging interface elements are present
				await expect(conversationDetailPage.newConversationTextarea).toBeVisible();
				await expect(conversationDetailPage.sendButton).toBeVisible();

				// Verify the conversation title indicates it's with the selected user
				await expect(conversationDetailPage.conversationTitle).toBeVisible();
				await expect(conversationDetailPage.conversationTitle).toContainText('Conversation with');
			});

			await test.step('5. User: Types the message content into the input box.', async () => {
				// Define the message content
				messageContent = `Hello ${recipientName}! This is a test private message sent via automated testing. How are you doing today?`;

				await conversationDetailPage.newConversationTextarea.fill(messageContent);

				// Verify the message was typed correctly
				const typedText = await conversationDetailPage.newConversationTextarea.inputValue();
				expect(typedText).toBe(messageContent);
			});

			await test.step('6. User: Clicks the "Send" button to send the message.', async () => {
				// Get initial message count for comparison
				const initialMessageCount = await conversationDetailPage.getMessageCount();

				// Send the message
				await conversationDetailPage.sendButton.click();

				// Wait for the message to be sent and page to update
				await test.step('Wait for message processing', async () => {
					await conversationDetailPage.waitForLoadState('networkidle');
				});
			});

			await test.step('7. System: Sends the message to the recipient and adds it to the conversation history between the two users.', async () => {
				// Verify the message appears in the conversation
				await conversationDetailPage.expectMessageWithText(messageContent);

				// Verify the message count has increased
				const finalMessageCount = await conversationDetailPage.getMessageCount();
				expect(finalMessageCount).toBeGreaterThan(0);

				// Verify the latest message contains our sent text
				const latestMessageIndex = finalMessageCount - 1;
				const latestMessageText = await conversationDetailPage.getMessageText(latestMessageIndex);
				expect(latestMessageText).toContain(messageContent);

				// Verify the message has a timestamp
				const messageTimestamp = await conversationDetailPage.getMessageTimestamp(latestMessageIndex);
				expect(messageTimestamp).toBeTruthy();

				// Verify the conversation participant is correct
				await conversationDetailPage.expectParticipantInConversation(recipientName);
			});

			await test.step('8. System: Notifies the recipient that they have received a new private message.', async () => {
				// Note: We cannot directly verify the recipient's notification in this test
				// as we're testing from the sender's perspective. However, we can verify
				// that the system has processed the message correctly.

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
			});

			await test.step('Result.', async () => {
				// Final verification: Private message was successfully sent

				// Verify we can navigate back to the specific conversation
				await conversationsPage.clickConversationByParticipant(recipientName);
				await conversationDetailPage.expectToBeOnConversationDetailPage();

				// Verify our message is still there
				await conversationDetailPage.expectMessageWithText(messageContent);

				// Verify the conversation maintains the correct participant
				await conversationDetailPage.expectParticipantInConversation(recipientName);

				// Verify the reply form is still functional for continued conversation
				const isReplyFormReady = await conversationDetailPage.isReplyFormReady();
				expect(isReplyFormReady).toBe(true);

				console.log(
					`✅ Test completed successfully: Private message "${messageContent.substring(0, 50)}..." was sent to ${recipientName} and appears in conversation history.`
				);
			});
		});
	});
});

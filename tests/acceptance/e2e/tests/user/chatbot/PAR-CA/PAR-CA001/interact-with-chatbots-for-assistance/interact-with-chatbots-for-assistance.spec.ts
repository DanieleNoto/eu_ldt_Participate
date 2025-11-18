/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Simone Bianchelli
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ChatbotPage } from '@pages/pages/user/chatbot/ChatbotPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Allows citizens to interact with standard chatbots for immediate help.
 * User Story: As a Citizen, I want to interact with chatbots so that I can receive quick assistance and understand better how the system and LDT works.
 * Requirements: PAR R13c
 * Prerequisites:
 * - The user has an active account on the platform and is logged in.
 * - he database of FAQs and LDT-related questions is configured and accessible by the chatbot.
 * - A dedicated support email address is configured to receive manual inquiries
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
});
test.describe('[PAR-CA001] – Interact with chatbots for assistance', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let homePage: HomePage;
	let chatbotPage: ChatbotPage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		chatbotPage = new ChatbotPage(page);
		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allow citizen to interact with standard chatbots for immediate help', async () => {
			await test.step('1. USER: Clicks the floating action button (FAB) visible on all platform pages.', async () => {
				await chatbotPage.openHelpAssistant();
			});
			await test.step('2. SYSTEM: The chatbot interface opens in a small overlay window.', async () => {
				expect(await chatbotPage.isChatbotTitleVisible()).toBe(true);
				expect(await chatbotPage.isCloseHelpAssistantButtonVisible()).toBe(true);
				expect(await chatbotPage.isWarningMessageVisible()).toBe(true);
				expect(await chatbotPage.isAvatarLogoVisible()).toBe(true);
				expect(await chatbotPage.isGreetingMessageVisible()).toBe(true);
				// Verify all suggested questions are visible
				expect(await chatbotPage.isParticipateToolQuestionVisible()).toBe(true);
				expect(await chatbotPage.isParticipatoryProcessQuestionVisible()).toBe(true);
				expect(await chatbotPage.isAssembliesQuestionVisible()).toBe(true);
				expect(await chatbotPage.isConferencesQuestionVisible()).toBe(true);
				expect(await chatbotPage.isInitiativesQuestionVisible()).toBe(true);
			});

			await test.step('3. USER: Selects a question from the chatbot.', async () => {
				await chatbotPage.clickTopicByName('What can I do in EU LDT');
			});

			await test.step('4. SYSTEM: The chatbot provides the preconfigured answer for the selected question.', async () => {
				expect(await chatbotPage.isTopicAnswerVisible()).toBe(true);
			});

			await test.step('5. USER: If the desired answer is not found, clicks "Further Support".', async () => {
				await chatbotPage.clickSupportButton();
			});

			await test.step('6. SYSTEM: The chatbot displays a text input field for manual question entry.', async () => {
				expect(await chatbotPage.isDescribeIssueTextboxVisible()).toBe(true);
			});

			await test.step('7. USER: Types a question into the text box and clicks "Send".', async () => {
				await chatbotPage.clickDescribeIssueTextbox();
				await chatbotPage.fillDescribeIssueTextbox('Will my personal data be deleted if i delete my account?');
				await chatbotPage.clickSendButton();
			});

			await test.step("8. SYSTEM: The system sends an email to the support team containing the user's question and displays a confirmation message.", async () => {
				expect(await chatbotPage.isConfirmationMessageVisible()).toBe(true);
			});

			await test.step('9. USER: Closes the chatbot by clicking the close button on the overlay window.', async () => {
				await chatbotPage.closeHelpAssistant();
			});

			await test.step('10. SYSTEM: The chatbot interface disappears, and the FAB remains visible.', async () => {
				expect(await chatbotPage.isChatbotDialogClosed()).toBe(true);
				expect(await chatbotPage.isOpenHelpAssistantButtonVisible()).toBe(true);
			});
		});
	});
});

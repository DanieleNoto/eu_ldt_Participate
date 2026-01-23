/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Antonio Abramo Carotenuto
 */

import { test } from '@fixtures/parallel-test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { NewsletterAdminPage } from '@pages/pages/admin/newsletters/NewsletterAdminPage';

/**
 * Test suite for Send Mass Email Communications functionality
 *
 * Enables integration with an SMTP server to send mass emails with various features.
 * User Story: As a City Communications Officer, I want to send mass email campaigns with personalised content so that I can effectively engage citizens.
 * Requirements: PAR R22
 * Prerequisites:
 * - The City Communications Officer has an active account on the platform and is logged in.
 * - The SMTP server is integrated and configured properly to support mass email delivery.
 * - The recipient participants have opted in to receive newsletters.
 */

test.describe('[PAR-MACT001] – Send mass email communications', () => {
	let adminHomePage: AdminHomePage;
	let newsletterAdminPage: NewsletterAdminPage;

	// Process constants for newsletter testing
	const processTitle = 'Update Test0';

	// Common setup for both flows (only Page Objects)
	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		newsletterAdminPage = new NewsletterAdminPage(adminPage);

		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		let subject: string;

		test.afterEach(async () => {
			// Cleanup: delete the newsletter created during the test
			if (subject) {
				await newsletterAdminPage.deleteNewsletterBySubject(subject);
			}
		});

		test('should send mass email campaigns', async ({ adminPage }) => {
			let timestamp: string;
			let body: string;

			await test.step('1. User: Navigates to the "Newsletter" section in the admin panel.', async () => {
				await newsletterAdminPage.navigateToNewsletters();

				// Verify that the user is now on the newsletters page
				await newsletterAdminPage.expectToBeOnNewslettersPage();

				await adminPage.waitForLoadState('load');
			});

			await test.step('2. User: Clicks on the "New Newsletter" button to create a new email campaign.', async () => {
				// Verify the New Newsletter button is visible
				await newsletterAdminPage.expectNewNewsletterButtonToBeVisible();

				// Click on the New Newsletter button
				await newsletterAdminPage.clickNewNewsletter();

				await adminPage.waitForLoadState('load');
			});

			await test.step('3. System: Displays available templates for the newsletter.', async () => {
				// Verify that the newsletter templates are displayed
				await newsletterAdminPage.expectNewsletterTemplatesDisplayed();

				await adminPage.waitForLoadState('load');
			});

			await test.step('4. User: Selects a template for the newsletter: Basic / Text, Image, and CTA', async () => {
				// Select the Basic template
				await newsletterAdminPage.selectBasicTemplate();

				await adminPage.waitForLoadState('load');
			});

			await test.step('5. User: Fills in the required fields based on the chosen template', async () => {
				// Verify that the newsletter creation form is displayed
				await newsletterAdminPage.expectNewsletterFormToBeVisible();

				// Generate current timestamp for unique newsletter identification
				timestamp = Date.now().toString();
				subject = `Test newsletter ${timestamp}`;
				body = `Hello %{name},\nthis is a test newsletter!`;

				// Fill in the newsletter form
				await newsletterAdminPage.fillNewsletterForm(subject, body);

				console.log(`Creating newsletter: "${subject}"`);

				await adminPage.waitForLoadState('load');
			});

			await test.step('6. User: Clicks Save button to confirm the template selection', async () => {
				// Click Save to confirm the newsletter creation
				await newsletterAdminPage.saveNewsletter();

				await adminPage.waitForLoadState('load');
			});

			await test.step('7. System: Displays a preview of the newsletter to the user, allowing them to check layout and overall content', async () => {
				// Verify that the newsletter preview is displayed
				await newsletterAdminPage.expectNewsletterPreviewHeadingToBeVisible();

				// Verify the subject has the exact expected value
				await newsletterAdminPage.expectSubjectToHaveValue(subject);

				// Verify the content shows message with original content
				await newsletterAdminPage.expectPreviewContentToMatchPattern(
					'[A-Za-z0-9\\s]+',
					'this is a test newsletter!'
				);

				await adminPage.waitForLoadState('load');
			});

			await test.step('8. User: Makes any necessary edits and clicks on "Save" to confirm the newsletter contents', async () => {
				// Click Edit to modify the newsletter
				await newsletterAdminPage.clickEditNewsletter();

				// Update the body content with modified text
				const modifiedBody = `Hello %{name},\n\nthis is a test newsletter with modified content.`;
				await newsletterAdminPage.editNewsletterBody(modifiedBody);

				// Save and preview the changes
				await newsletterAdminPage.saveAndPreviewNewsletter();
			});
			await test.step('9. System: Saves the newsletter content for the current campaign', async () => {
				// Verify the success message is displayed
				await newsletterAdminPage.expectNewsletterUpdatedMessageToBeVisible();

				// Verify the content shows message with modified content
				await newsletterAdminPage.expectPreviewContentToMatchPattern(
					'[A-Za-z0-9\\s]+',
					'this is a test newsletter with modified content\\.'
				);

				await adminPage.waitForLoadState('load');
			});

			await test.step('10. System: Displays options for selecting targeted recipients', async () => {
				// Click to access recipient selection options
				await newsletterAdminPage.clickSelectRecipients();

				// Verify all recipient selection options are displayed
				await newsletterAdminPage.expectRecipientOptionsToBeDisplayed();

				await adminPage.waitForLoadState('load');
			});

			await test.step('11. User: Selects recipients for the newsletter delivery', async () => {
				// Select "Send to all users" option
				await newsletterAdminPage.selectSendToAllUsers();

				await adminPage.waitForLoadState('load');
			});

			await test.step('12. User: Clicks on "Deliver Newsletter" to start sending emails', async () => {
				// Click to deliver the newsletter
				await newsletterAdminPage.clickDeliverNewsletter();

				// Confirm the delivery
				await newsletterAdminPage.confirmDelivery();

				await adminPage.waitForLoadState('load');
			});

			await test.step('13. System: Notifies the City Communications Officer that the newsletter has been successfully delivered', async () => {
				// Verify the success delivery message is displayed
				await newsletterAdminPage.expectNewsletterDeliveredMessageToBeVisible();

				// Verify that the specific newsletter (identified by subject) shows "Has been sent to: All users"
				await newsletterAdminPage.expectNewsletterSentToAllUsers(subject);

				// Wait for delivery count starting
				await newsletterAdminPage.expectNewsletterDeliveryStarted(subject);

				await adminPage.waitForLoadState('load');
			});
		});
	});

	test.describe('Alternative Flow', () => {
		let subject: string;

		test.afterEach(async () => {
			// Cleanup: delete the newsletter created during the test
			if (subject) {
				await newsletterAdminPage.deleteNewsletterBySubject(subject);
			}
		});

		test('should send mass email campaigns with another recipients selection option', async ({ adminPage }) => {
			let timestamp: string;
			let body: string;

			await test.step('1. User: Navigates to the "Newsletter" section in the admin panel.', async () => {
				await newsletterAdminPage.navigateToNewsletters();

				// Verify that the user is now on the newsletters page
				await newsletterAdminPage.expectToBeOnNewslettersPage();

				await adminPage.waitForLoadState('load');
			});

			await test.step('2. User: Clicks on the "New Newsletter" button to create a new email campaign.', async () => {
				// Verify the New Newsletter button is visible
				await newsletterAdminPage.expectNewNewsletterButtonToBeVisible();

				// Click on the New Newsletter button
				await newsletterAdminPage.clickNewNewsletter();

				await adminPage.waitForLoadState('load');
			});

			await test.step('3. System: Displays available templates for the newsletter.', async () => {
				// Verify that the newsletter templates are displayed
				await newsletterAdminPage.expectNewsletterTemplatesDisplayed();

				await adminPage.waitForLoadState('load');
			});

			await test.step('4. User: Selects a template for the newsletter: Basic / Text, Image, and CTA', async () => {
				// Select the Basic template
				await newsletterAdminPage.selectBasicTemplate();

				await adminPage.waitForLoadState('load');
			});

			await test.step('5. User: Fills in the required fields based on the chosen template', async () => {
				// Verify that the newsletter creation form is displayed
				await newsletterAdminPage.expectNewsletterFormToBeVisible();

				// Generate current timestamp for unique newsletter identification
				timestamp = Date.now().toString();
				subject = `Test newsletter ${timestamp}`;
				body = `Hello %{name},\nthis is a test newsletter!`;

				// Fill in the newsletter form
				await newsletterAdminPage.fillNewsletterForm(subject, body);

				console.log(`Creating newsletter: "${subject}"`);

				await adminPage.waitForLoadState('load');
			});

			await test.step('6. User: Clicks Save button to confirm the template selection', async () => {
				// Click Save to confirm the newsletter creation
				await newsletterAdminPage.saveNewsletter();

				await adminPage.waitForLoadState('load');
			});

			await test.step('7. System: Displays a preview of the newsletter to the user, allowing them to check layout and overall content', async () => {
				// Verify that the newsletter preview is displayed
				await newsletterAdminPage.expectNewsletterPreviewHeadingToBeVisible();

				// Verify the subject has the exact expected value
				await newsletterAdminPage.expectSubjectToHaveValue(subject);

				// Verify the content shows message with original content
				await newsletterAdminPage.expectPreviewContentToMatchPattern(
					'[A-Za-z0-9\\s]+',
					'this is a test newsletter!'
				);

				await adminPage.waitForLoadState('load');
			});

			await test.step('8. User: Makes any necessary edits and clicks on "Save" to confirm the newsletter contents', async () => {
				// Click Edit to modify the newsletter
				await newsletterAdminPage.clickEditNewsletter();

				// Update the body content with modified text
				const modifiedBody = `Hello %{name},\n\nthis is a test newsletter with modified content.`;
				await newsletterAdminPage.editNewsletterBody(modifiedBody);

				// Save and preview the changes
				await newsletterAdminPage.saveAndPreviewNewsletter();
			});
			await test.step('9. System: Saves the newsletter content for the current campaign', async () => {
				// Verify the success message is displayed
				await newsletterAdminPage.expectNewsletterUpdatedMessageToBeVisible();

				// Verify the content shows message with modified content
				await newsletterAdminPage.expectPreviewContentToMatchPattern(
					'[A-Za-z0-9\\s]+',
					'this is a test newsletter with modified content\\.'
				);

				await adminPage.waitForLoadState('load');
			});

			await test.step('10. System: Displays options for selecting targeted recipients', async () => {
				// Click to access recipient selection options
				await newsletterAdminPage.clickSelectRecipients();

				// Verify all recipient selection options are displayed
				await newsletterAdminPage.expectRecipientOptionsToBeDisplayed();

				await adminPage.waitForLoadState('load');
			});

			await test.step('11. User: Selects recipients for the newsletter delivery', async () => {
				// Select "Send to participants" and choose the specific process
				await newsletterAdminPage.selectSendToParticipants(processTitle);
				console.log(`Selected participants from process: "${processTitle}"`);

				// Confirm the selected recipients
				await newsletterAdminPage.confirmRecipients();

				// Verify we're on the confirm recipients page
				await newsletterAdminPage.expectConfirmRecipientsPageToBeVisible();

				// Verify at least one recipient is displayed
				await newsletterAdminPage.expectAtLeastOneRecipientToBeDisplayed();

				console.log('Recipients confirmed successfully');

				await adminPage.waitForLoadState('load');
			});

			await test.step('12. User: Clicks on "Deliver Newsletter" to start sending emails', async () => {
				// Click to deliver the newsletter
				await newsletterAdminPage.clickDeliverNewsletter();

				// Confirm the delivery
				await newsletterAdminPage.confirmDelivery();

				await adminPage.waitForLoadState('load');
			});

			await test.step('13. System: Notifies the City Communications Officer that the newsletter has been successfully delivered', async () => {
				// Verify the success delivery message is displayed
				await newsletterAdminPage.expectNewsletterDeliveredMessageToBeVisible();

				// Verify that the specific newsletter (identified by subject) shows "Has been sent to: participants"
				await newsletterAdminPage.expectNewsletterSentToProcessParticipants(subject, processTitle);

				// Wait for delivery count starting
				await newsletterAdminPage.expectNewsletterDeliveryStarted(subject);

				await adminPage.waitForLoadState('load');
			});
		});
	});
});

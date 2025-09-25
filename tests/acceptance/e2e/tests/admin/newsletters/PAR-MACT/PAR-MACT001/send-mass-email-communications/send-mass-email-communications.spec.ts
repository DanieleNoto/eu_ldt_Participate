import { test } from '@playwright/test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { NewsletterAdminPage } from '@pages/pages/admin/newsletters/NewsletterAdminPage';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Enables integration with an SMTP server to send mass emails with various features.
 * User Story: As a City Communications Officer, I want to send mass email campaigns with personalised content so that I can effectively engage citizens.
 * Requirements: PAR R22
 * Prerequisites:
 * - The City Communications Officer has an active account on the platform and is logged in.
 * - The SMTP server is integrated and configured properly to support mass email delivery.
 * -  The recipient participants have opted in to receive newsletters.
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'ADMIN');
	await page.close();
	await context.close();
});

test.describe('[PAR-MACT001] – Send mass email communications', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let newsletterAdminPage: NewsletterAdminPage;

	test.beforeEach(async ({ page }) => {
		adminHomePage = new AdminHomePage(page);
		newsletterAdminPage = new NewsletterAdminPage(page);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should send mass email campaigns', async ({ page }) => {
			let timestamp: string;
			let subject: string;
			let body: string;

			await test.step('1. User: Navigates to the "Newsletter" section in the admin panel.', async () => {
				await newsletterAdminPage.navigateToNewsletters();

				// Verify that the user is now on the newsletters page
				await newsletterAdminPage.expectToBeOnNewslettersPage();

				await page.waitForLoadState('networkidle');
			});

			await test.step('2. User: Clicks on the "New Newsletter" button to create a new email campaign.', async () => {
				// Verify the New Newsletter button is visible
				await newsletterAdminPage.expectNewNewsletterButtonToBeVisible();

				// Click on the New Newsletter button
				await newsletterAdminPage.clickNewNewsletter();

				await page.waitForLoadState('networkidle');
			});

			await test.step('3. System: Displays available templates for the newsletter.', async () => {
				// Verify that the newsletter templates are displayed
				await newsletterAdminPage.expectNewsletterTemplatesDisplayed();

				await page.waitForLoadState('networkidle');
			});

			await test.step('4. User: Selects a template for the newsletter: Basic / Text, Image, and CTA', async () => {
				// Select the Basic template
				await newsletterAdminPage.selectBasicTemplate();

				await page.waitForLoadState('networkidle');
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

				await page.waitForLoadState('networkidle');
			});

			await test.step('6. User: Clicks Save button to confirm the template selection', async () => {
				// Click Save to confirm the newsletter creation
				await newsletterAdminPage.saveNewsletter();

				await page.waitForLoadState('networkidle');
			});

			await test.step('7. System: Displays a preview of the newsletter to the user, allowing them to check layout, personalization tags, and overall content', async () => {
				// Verify that the newsletter preview is displayed
				await newsletterAdminPage.expectNewsletterPreviewHeadingToBeVisible();

				// Verify the subject has the exact expected value
				await newsletterAdminPage.expectSubjectToHaveValue(subject);

				// Verify the content shows message with original content
				await newsletterAdminPage.expectPreviewContentToMatchPattern(
					'[A-Za-z\\s]+',
					'this is a test newsletter!'
				);

				await page.waitForLoadState('networkidle');
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
					'[A-Za-z\\s]+',
					'this is a test newsletter with modified content\\.'
				);

				await page.waitForLoadState('networkidle');
			});

			await test.step('10. System: Displays options for selecting targeted recipients', async () => {
				// Click to access recipient selection options
				await newsletterAdminPage.clickSelectRecipients();

				// Verify all recipient selection options are displayed
				await newsletterAdminPage.expectRecipientOptionsToBeDisplayed();

				await page.waitForLoadState('networkidle');
			});

			await test.step('11. User: Selects recipients for the newsletter delivery', async () => {
				// Select "Send to all users" option
				await newsletterAdminPage.selectSendToAllUsers();

				await page.waitForLoadState('networkidle');
			});

			await test.step('12. User: Clicks on "Deliver Newsletter" to start sending emails', async () => {
				// Click to deliver the newsletter
				await newsletterAdminPage.clickDeliverNewsletter();

				// Confirm the delivery
				await newsletterAdminPage.confirmDelivery();

				await page.waitForLoadState('networkidle');
			});

			await test.step('13. System: Notifies the City Communications Officer that the newsletter has been successfully delivered', async () => {
				// Verify the success delivery message is displayed
				await newsletterAdminPage.expectNewsletterDeliveredMessageToBeVisible();

				// Verify that the specific newsletter (identified by subject) shows "Has been sent to: All users"
				await newsletterAdminPage.expectNewsletterSentToAllUsers(subject);

				// Wait for delivery count starting
				await newsletterAdminPage.expectNewsletterDeliveryStarted(subject);

				await page.waitForLoadState('networkidle');
			});
		});
	});
});

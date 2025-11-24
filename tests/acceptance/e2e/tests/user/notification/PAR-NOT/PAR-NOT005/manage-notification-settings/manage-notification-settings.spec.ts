import { HomePage } from '@pages/pages/public/HomePage';
import { AccountPage } from '@pages/pages/user/account/AccountPage';
import { NotificationFrequency, NotificationSettingsPage } from '@pages/pages/user/account/NotificationSettingsPage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows citizens to customize their notification settings to control which types of notifications they receive.
 *
 * User Story: 	As a Citizen, I want to manage my notification settings so that I can control which types of notifications I receive and stay informed in a way that suits me.
 *
 * Requirements: PAR R13, PAR R14, PAR R8
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
test.describe('[PAR-NOT005] – Manage notification settings', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let notificationSettings = {
		ownActivityToggle: true,
		followedToggle: true,
		newsletterToggle: true,
		publicContactToggle: true,
		evaluetorsEmailToggle: true,
		administratorsEmailToggle: true,
		administratorsReminderToggle: true,
		frequency: NotificationFrequency.Daily
	};
	let notificationSettingsPage: NotificationSettingsPage;
	let homePage: HomePage;
	let accountPage: AccountPage;

	test.beforeEach(async ({ page }) => {
		notificationSettingsPage = new NotificationSettingsPage(page);
		homePage = new HomePage(page);
		accountPage = new AccountPage(page);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		test('should allow user to manage notification settings', async () => {
			await test.step('1. User: Navigates to the "Profile -> My Accounts -> Notifications" section.', async () => {
				// Navigate to notifications section
				await homePage.header.goToMyAccount();
				await accountPage.waitForPageLoad();
				await accountPage.navigateToTab('Notifications');
				await notificationSettingsPage.waitForLoadState('load');
			});
			await test.step('2. System: Displays the notification settings page', async () => {
				await notificationSettingsPage.expectToBeOnSettingsPage();
				await notificationSettingsPage.expectOwnActivityToBe(notificationSettings.ownActivityToggle);
				await notificationSettingsPage.expectFollowedToBe(notificationSettings.followedToggle);
				await notificationSettingsPage.expectFrequencyToBe(notificationSettings.frequency);
				await notificationSettingsPage.expectNewsletterToBe(notificationSettings.newsletterToggle);
				await notificationSettingsPage.expectPublicContactToBe(notificationSettings.publicContactToggle);
				await notificationSettingsPage.expectEvaluetorsEmailToBe(notificationSettings.evaluetorsEmailToggle);
				await notificationSettingsPage.expectAdministratorsEmailToBe(notificationSettings.administratorsEmailToggle);
				await notificationSettingsPage.expectAdministratorsReminderToBe(notificationSettings.administratorsReminderToggle);
			});
			await test.step('3. User: Customizes notification preferences by selecting or deselecting the types of notifications they wish to receive, and how often want to receive the notification mail.', async () => {
				await notificationSettingsPage.setOwnActivity(!notificationSettings.ownActivityToggle);
				await notificationSettingsPage.setFollowed(!notificationSettings.followedToggle);
				await notificationSettingsPage.setFrequency(NotificationFrequency.Weekly);
				await notificationSettingsPage.setNewsletter(!notificationSettings.newsletterToggle);
				await notificationSettingsPage.setPublicContact(!notificationSettings.publicContactToggle);
			});
			await test.step('4. User: Clicks the "Save" button to apply the changes.', async () => {
				await notificationSettingsPage.saveChanges();
			});
			await test.step('5. System: Saves the updated notification preferences for the citizen.', async () => {
				await notificationSettingsPage.waitForLoadState('load');
				await notificationSettingsPage.expectOwnActivityToBe(!notificationSettings.ownActivityToggle);
				await notificationSettingsPage.expectFollowedToBe(!notificationSettings.followedToggle);
				await notificationSettingsPage.expectFrequencyToBe(NotificationFrequency.Weekly);
				await notificationSettingsPage.expectNewsletterToBe(!notificationSettings.newsletterToggle);
				await notificationSettingsPage.expectPublicContactToBe(!notificationSettings.publicContactToggle);
			});
			await test.step('6. System: Confirms that the notification settings have been successfully updated.', async () => {
				await notificationSettingsPage.waitForSuccessFlashMessage();
				expect(await notificationSettingsPage.hasSuccessFlashMessage()).toBe(true);
			});
			await test.step('Result.', async () => {
				await notificationSettingsPage.expectOwnActivityToBe(!notificationSettings.ownActivityToggle);
				await notificationSettingsPage.expectFollowedToBe(!notificationSettings.followedToggle);
				await notificationSettingsPage.expectFrequencyToBe(NotificationFrequency.Weekly);
				await notificationSettingsPage.expectNewsletterToBe(!notificationSettings.newsletterToggle);
				await notificationSettingsPage.expectPublicContactToBe(!notificationSettings.publicContactToggle);
			});
		});
	});
});

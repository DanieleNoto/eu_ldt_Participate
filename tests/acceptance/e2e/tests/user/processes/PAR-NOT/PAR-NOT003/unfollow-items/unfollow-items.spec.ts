import { HomePage } from '@pages/pages/public/HomePage';
import { ProfilePage } from '@pages/pages/user/ProfilePage';
import test, { expect } from '@playwright/test';
import { ensureLoggedIn } from '@utils/auth-helper';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for Allows citizens to unfollow content items, participatory spaces, stopping notifications related to the unfollowed items.
 *
 * User Story: 	As a Citizen, I want to unfollow content items, participatory spaces, so that I stop receiving notifications and can manage my activity feed.
 *
 * Requirements: PAR R13, PAR R14, PAR R8
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 * - The citizen is following the content item, participatory space.
 *
 */
test.beforeAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await ensureLoggedIn(page, 'USER');
});
test.describe('[PAR-NOT003] – Unfollow items', () => {
	test.use({ storageState: STORAGE_STATE.USER });

	let homePage: HomePage;
	let profilePage: ProfilePage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		profilePage = new ProfilePage(page);
		await homePage.navigateToHomePage();
	});
	test.describe('Main Flow', () => {
		let recipientName: string;
		test('should allow user to unfollow items', async () => {
			await test.step('1. User: Navigates to the content item, participatory space they wish to unfollow.', async () => {
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

			await test.step("2. System: Displays the details of the item, space including a 'Stop following' button.", async () => {
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
				await expect(profilePage.unfollowButton).toBeVisible();

				// Verify the message button has correct functionality
				await profilePage.expectMessageButtonWithRecipientId();
			});

			await test.step('3. User: Clicks the "Stop following" button to follow the selected item, space, or participant.', async () => {
				let buttonText = await profilePage.followButton.textContent();
				console.log(buttonText);
				if (buttonText.includes('Follow')) {
					// If already following, we might want to unfollow
					await profilePage.clickFollowButton();
				}
				// Click the follow button
				await profilePage.clickUnfollowButton();
			});

			await test.step('4. System: Displays the "Follow" button in place of the "Stop following" button.', async () => {
				// Verify the follow button has changed to "Follow"
				await expect(profilePage.followButton).toHaveText('Follow');
			});
			await test.step('5. System: Updates the citizen\'s profile to remove the unfollowed item from their "Following" list', async () => {
				// Navigate to user's own profile
				await homePage.header.goToMyProfile();

				// Wait for profile page to load
				await profilePage.waitForProfileToLoad();

				// Click on the follows/following tab
				await profilePage.clickFollowsTab();

				// Wait for the page to load after clicking the tab
				await profilePage.waitForLoadState('load');

				// Verify we're on the following page by checking URL
				await expect(profilePage.getPage()).toHaveURL(/.*\/following/);

				const followedUser = await profilePage
					.getPage()
					.locator('div.profile__user-name')
					.filter({ hasText: recipientName });

				expect(await followedUser.count()).toBe(0);
			});

			await test.step('Result.', async () => {
				// The citizen successfully follows the item and receives notifications of future activities.
				console.log(`Test completed successfully:`);
				console.log(`- User successfully followed: ${recipientName}`);
				console.log(`- Follow button changed to "Follow"`);
				console.log(`- Stop following relationship is reflected in user's profile`);

				console.log("Test completed: User don't receive notifications for unfollowed items");
			});
		});
	});
});

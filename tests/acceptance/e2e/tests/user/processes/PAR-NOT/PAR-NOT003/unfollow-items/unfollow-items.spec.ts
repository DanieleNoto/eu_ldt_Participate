/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 */

import { HomePage } from '@pages/pages/public/HomePage';
import { ProfilePage } from '@pages/pages/user/ProfilePage';
import { test, expect } from '@fixtures/parallel-test-reserved';

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

test.describe('@reserved [PAR-NOT003] – Unfollow items', () => {
	test.describe.configure({ mode: 'serial' });
	let homePage: HomePage;
	let profilePage: ProfilePage;
	const targetProfileUsername = 'admin'; // Fixed user to unfollow

	test.beforeEach(async ({ userPage }) => {
		homePage = new HomePage(userPage);
		profilePage = new ProfilePage(userPage);
		await homePage.navigateToHomePage();

		// Ensure clean state: follow admin if not already following
		const profileUrl = `/profiles/${targetProfileUsername}`;
		await homePage.navigateTo(profileUrl);
		await homePage.waitForLoadState('load');
		await profilePage.waitForProfileToLoad();

		// Check if not following (follow button is visible)
		const isNotFollowing = await profilePage.followButton.isVisible().catch(() => false);
		if (isNotFollowing) {
			await profilePage.clickFollowButton();
			console.log('Setup: Followed admin to ensure clean state');
		}

		// Return to home page
		await homePage.navigateToHomePage();
	});

	test.afterEach(async ({ userPage }) => {
		// Cleanup: ensure we're not following admin after test
		try {
			const profileUrl = `/profiles/${targetProfileUsername}`;
			await userPage.goto(profileUrl);
			await userPage.waitForLoadState('load');

			const unfollowButton = userPage.locator('a[data-remote="true"][data-method="delete"][href^="/follow"]');
			const isFollowing = await unfollowButton.isVisible().catch(() => false);

			if (isFollowing) {
				await unfollowButton.click();
				await userPage.waitForLoadState('networkidle');
				console.log('Cleanup: Unfollowed admin after test');
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error during cleanup:', error.message);
			}
		}
	});
	test.describe('Main Flow', () => {
		let recipientName: string;
		test('should allow user to unfollow items', async () => {
			await test.step('1. User: Navigates to the content item, participatory space they wish to unfollow.', async () => {
				// Navigate directly to the target user's profile
				const profileUrl = `/profiles/${targetProfileUsername}`;
				console.log(`Navigating to profile: ${profileUrl}`);

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

				// Verify the profile displays expected elements
				await expect(profilePage.profileAvatar).toBeVisible();
				await expect(profilePage.profileName).toBeVisible();
				await expect(profilePage.profileDetails).toBeVisible();
				await expect(profilePage.unfollowButton).toBeVisible();
				await expect(profilePage.messageButton).toBeVisible();

				// Verify the unfollow button shows "Stop following"
				await expect(profilePage.unfollowButton).toHaveText('Stop following');
			});

			await test.step('3. User: Clicks the "Stop following" button to unfollow the selected item, space, or participant.', async () => {
				// Click the unfollow button
				await profilePage.clickUnfollowButton();
			});

			await test.step('4. System: Displays the "Follow" button in place of the "Stop following" button.', async () => {
				// After clicking unfollow, the button changes from unfollow to follow
				// Verify the follow button is now visible
				await expect(profilePage.followButton).toBeVisible();
				await expect(profilePage.followButton).toHaveText('Follow');

				// And the unfollow button is no longer present
				await expect(profilePage.unfollowButton).not.toBeVisible();
			});
			await test.step('5. System: Updates the citizen\'s profile to remove the unfollowed item from their "Following" list', async () => {
				// Navigate to the logged-in user's profile
				await homePage.header.goToMyProfile();

				await profilePage.waitForProfileToLoad();

				// Click on the follows/following tab to see who we are following
				await profilePage.clickFollowsTab();

				await profilePage.waitForLoadState('load');

				// Verify we're on the following page by checking URL
				await expect(profilePage.getPage()).toHaveURL(/.*\/following/);

				// Verify the admin user is not in the following list anymore
				const followedUser = profilePage
					.getPage()
					.locator(`a.profile__user[href="/profiles/${targetProfileUsername}"]`);

				// The element should not be visible (unfollowed)
				await expect(followedUser).not.toBeVisible();
			});

			await test.step('Result.', async () => {
				// The citizen successfully unfollows the item and stops receiving notifications.
				console.log(`Test completed successfully:`);
				console.log(`- User successfully unfollowed: ${recipientName}`);
				console.log(`- Unfollow button changed to "Follow"`);
				console.log(`- Unfollow relationship is reflected in user's profile`);

				console.log("Test completed: User won't receive notifications for unfollowed items");
			});
		});
	});
});

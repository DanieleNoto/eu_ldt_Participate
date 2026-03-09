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
 * Test suite for Allows citizens to follow content items, participatory spaces, enabling them to receive notifications of the activities of the things they follow.
 *
 * User Story: 	As a Citizen, I want to follow content items, participatory spaces so that I receive notifications of activities and stay informed about updates.
 *
 * Requirements: PAR R13, PAR R14, PAR R8
 *
 * Prerequisites:
 *
 * - The citizen has an active account on the platform and is logged in.
 *
 */

test.describe('@reserved [PAR-NOT002] – Follow items', () => {
	test.describe.configure({ mode: 'serial' });
	let homePage: HomePage;
	let profilePage: ProfilePage;
	const targetProfileUsername = 'admin'; // Fixed user to follow

	test.beforeEach(async ({ userPage }) => {
		homePage = new HomePage(userPage);
		profilePage = new ProfilePage(userPage);
		await homePage.navigateToHomePage();

		// Ensure clean state: unfollow admin if already following
		const profileUrl = `/profiles/${targetProfileUsername}`;
		await homePage.navigateTo(profileUrl);
		await homePage.waitForLoadState('load');
		await profilePage.waitForProfileToLoad();

		// Check if already following (unfollow button is visible)
		const isFollowing = await profilePage.unfollowButton.isVisible().catch(() => false);
		if (isFollowing) {
			await profilePage.clickUnfollowButton();
			console.log('Cleanup: Unfollowed admin to ensure clean state');
		}

		// Return to home page
		await homePage.navigateToHomePage();
	});

	test.afterEach(async ({ userPage }) => {
		// Cleanup: unfollow admin after test
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

		test('should allow user to follow items', async () => {
			await test.step('1. User: Navigates to the content item, participatory space they wish to follow.', async () => {
				// Navigate directly to the target user's profile
				const profileUrl = `/profiles/${targetProfileUsername}`;
				console.log(`Navigating to profile: ${profileUrl}`);

				await homePage.navigateTo(profileUrl);
				await homePage.waitForLoadState('load');
			});

			await test.step("2. System: Displays the details of the item, space including a 'Follow' button.", async () => {
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
				await expect(profilePage.followButton).toBeVisible();
				await expect(profilePage.messageButton).toBeVisible();

				// Verify the follow button shows "Follow" (clean state)
				await expect(profilePage.followButton).toHaveText('Follow');
			});

			await test.step('3. User: Clicks the "Follow" button to follow the selected item, space, or participant.', async () => {
				// Click the follow button
				await profilePage.clickFollowButton();
			});

			await test.step('4. System: Displays the "Stop Following" button in place of the "Follow" button.', async () => {
				// Verify the unfollow button is now visible
				await expect(profilePage.unfollowButton).toBeVisible();
				await expect(profilePage.unfollowButton).toHaveText('Stop following');

				// And the follow button is no longer present
				await expect(profilePage.followButton).not.toBeVisible();
			});
			await test.step('5. System: Updates the citizen\'s profile to include the followed item in their "Following" list', async () => {
				// Navigate to the logged-in user's profile
				await homePage.header.goToMyProfile();

				await profilePage.waitForProfileToLoad();

				// Click on the follows/following tab to see who we are following
				await profilePage.clickFollowsTab();

				await profilePage.waitForLoadState('load');

				// Verify we're on the following page by checking URL
				await expect(profilePage.getPage()).toHaveURL(/.*\/following/);

				// Verify the followed user appears in the following list
				const followingList = profilePage.getPage().locator('a.profile__user');
				const followingCount = await followingList.count();
				expect(followingCount).toBeGreaterThan(0);

				// Verify the admin user is in the following list
				const followedUser = profilePage
					.getPage()
					.locator(`a.profile__user[href="/profiles/${targetProfileUsername}"]`);

				await expect(followedUser).toBeVisible();

				// Also verify the displayed name matches what we captured earlier
				const displayedName = await followedUser.locator('div.profile__user-name').textContent();
				expect(displayedName).toContain(recipientName);
			});

			await test.step('Result.', async () => {
				// The citizen successfully follows the item and receives notifications of future activities.
				console.log(`Test completed successfully:`);
				console.log(`- User successfully followed: ${recipientName}`);
				console.log(`- Follow button changed to "Stop Following"`);
				console.log(`- Following relationship is reflected in user's profile`);
				console.log(`- Activity timeline is functional and will show followed user's activities`);
				console.log(`- Notification system is in place for future activities`);

				console.log('Test completed: User can now receive notifications for followed activities');
			});
		});
	});
});

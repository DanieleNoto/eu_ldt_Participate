/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../../base/BasePage';

export class ProfilePage extends BasePage {
	readonly profileAvatar: Locator;
	readonly profileName: Locator;
	readonly profileUsername: Locator;
	readonly profileWebsite: Locator;
	readonly profileDescription: Locator;
	readonly messageButton: Locator;
	readonly followButton: Locator;
	readonly unfollowButton: Locator;
	readonly reportButton: Locator;
	readonly activityTab: Locator;
	readonly badgesTab: Locator;
	readonly followsTab: Locator;
	readonly followersTab: Locator;
	readonly groupsTab: Locator;
	readonly activityFilter: Locator;
	readonly activityItems: Locator;
	readonly profileDetails: Locator;
	readonly profileActions: Locator;

	constructor(page: Page) {
		super(page);
		this.profileAvatar = page.locator('.profile__avatar img');
		this.profileName = page.locator('.profile__details h1');
		this.profileUsername = page.locator('.profile__details-item:has(svg[href*="ri-account-pin-circle-line"]) span');
		this.profileWebsite = page.locator('.profile__details-item:has(svg[href*="ri-link"]) span a');
		this.profileDescription = page.locator('.profile__description');
		this.messageButton = page.locator('a.button[href*="/conversations"][title="Message"]');
		this.followButton = page
			.locator('a[data-remote="true"][data-method="post"][href^="/follow"]')
			.filter({ hasText: 'Follow' });
		this.unfollowButton = page
			.locator('a[data-remote="true"][data-method="delete"][href^="/follow"]')
			.filter({ hasText: 'Stop following' });
		this.reportButton = page.locator('button[data-dialog-open="flagUserModal"]:has-text("Report")');
		this.activityTab = page.locator('a[href*="/activity"]:has-text("Activity")');
		this.badgesTab = page.locator('a[href*="/badges"]:has-text("Badges")');
		this.followsTab = page.locator('a[href*="/following"]:has-text("Follows")');
		this.followersTab = page.locator('a[href*="/followers"]:has-text("Followers")');
		this.groupsTab = page.locator('a[href*="/groups"]:has-text("Groups")');
		this.activityFilter = page.locator('#dropdown-trigger-resource');
		this.activityItems = page.locator('.activity[data-activity]');
		this.profileDetails = page.locator('.profile__details');
		this.profileActions = page.locator('.profile__actions-main');
	}

	/**
	 * Verify that we are on a user profile page
	 */
	async expectToBeOnProfilePage() {
		await expect(this.profileName).toBeVisible();
		await expect(this.profileAvatar).toBeVisible();
		await expect(this.profileActions).toBeVisible();
		await expect(this.page).toHaveURL(/.*\/profiles\/[^\/]+/);
	}

	/**
	 * Get the profile name/display name
	 */
	async getProfileName(): Promise<string> {
		const nameText = await this.profileName.textContent();
		// Remove the "Activity (...)" part from the heading
		return nameText?.replace(/\s*Activity\s*\(.*\)\s*$/, '').trim() || '';
	}

	/**
	 * Get the username (with @)
	 */
	async getUsername(): Promise<string> {
		return (await this.profileUsername.textContent()) || '';
	}

	/**
	 * Get the profile description
	 */
	async getProfileDescription(): Promise<string> {
		return (await this.profileDescription.textContent()) || '';
	}

	/**
	 * Get the website URL if available
	 */
	async getWebsiteUrl(): Promise<string> {
		if ((await this.profileWebsite.count()) > 0) {
			return (await this.profileWebsite.getAttribute('href')) || '';
		}
		return '';
	}

	/**
	 * Get the avatar alt text
	 */
	async getAvatarAltText(): Promise<string> {
		return (await this.profileAvatar.getAttribute('alt')) || '';
	}

	/**
	 * Check if the message button is available
	 */
	async hasMessageButton(): Promise<boolean> {
		return (await this.messageButton.count()) > 0;
	}

	/**
	 * Click on the "Message" button to start a conversation
	 */
	async clickMessageButton() {
		await expect(this.messageButton).toBeVisible();
		await this.messageButton.click();
	}

	/**
	 * Get the message button URL
	 */
	async getMessageButtonUrl(): Promise<string> {
		return (await this.messageButton.getAttribute('href')) || '';
	}

	/**
	 * Click on the "Follow" button
	 */
	async clickFollowButton() {
		await this.followButton.waitFor({ state: 'visible' });
		await this.followButton.click();
		console.log('Click follow');
		await this.waitForLoadState('networkidle');
	}
	/**
	 * Click on the "Stop Following" button
	 */
	async clickUnfollowButton() {
		await this.unfollowButton.waitFor({ state: 'visible' });
		await this.unfollowButton.click();
		console.log('Click unfollow');
		await this.waitForLoadState('networkidle');
	}

	/**
	 * Click on the "Report" button
	 */
	async clickReportButton() {
		await expect(this.reportButton).toBeVisible();
		await this.reportButton.click();
	}

	/**
	 * Navigate to the Activity tab
	 */
	async clickActivityTab() {
		await this.activityTab.click();
	}

	/**
	 * Navigate to the Badges tab
	 */
	async clickBadgesTab() {
		await this.badgesTab.click();
	}

	/**
	 * Navigate to the Follows tab
	 */
	async clickFollowsTab() {
		await this.followsTab.click();
	}

	/**
	 * Navigate to the Followers tab
	 */
	async clickFollowersTab() {
		await this.followersTab.click();
	}

	/**
	 * Navigate to the Groups tab
	 */
	async clickGroupsTab() {
		await this.groupsTab.click();
	}

	/**
	 * Get the number of activity items displayed
	 */
	async getActivityItemCount(): Promise<number> {
		return await this.activityItems.count();
	}

	/**
	 * Get activity content by index
	 * @param index - The index of the activity item (0-based)
	 */
	async getActivityContent(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const content = activity.locator('.activity__content');
		return (await content.textContent()) || '';
	}

	/**
	 * Get activity time by index
	 * @param index - The index of the activity item (0-based)
	 */
	async getActivityTime(index: number): Promise<string> {
		const activity = this.activityItems.nth(index);
		const time = activity.locator('.activity__time');
		return (await time.textContent()) || '';
	}

	/**
	 * Click on an activity filter option
	 * @param filterType - The type of filter (e.g., "all", "Comment", "Proposal")
	 */
	async selectActivityFilter(filterType: string) {
		await this.activityFilter.click();
		const filterOption = this.page.locator(`a.filter[href*="${filterType}"]`);
		await filterOption.click();
	}

	/**
	 * Verify that the message button contains the correct recipient ID
	 * @param expectedRecipientId - The expected recipient ID in the URL
	 */
	async expectMessageButtonWithRecipientId(expectedRecipientId?: string) {
		await expect(this.messageButton).toBeVisible();

		if (expectedRecipientId) {
			const href = await this.messageButton.getAttribute('href');
			expect(href).toContain(`recipient_id=${expectedRecipientId}`);
		}
	}

	/**
	 * Wait for the profile page to load completely
	 */
	async waitForProfileToLoad() {
		await expect(this.profileName).toBeVisible();
		await expect(this.profileAvatar).toBeVisible();
		await expect(this.profileActions).toBeVisible();
		await this.page.waitForTimeout(1000); // Allow time for all elements to render
	}

	/**
	 * Check if the profile has a description
	 */
	async hasProfileDescription(): Promise<boolean> {
		return (
			(await this.profileDescription.count()) > 0 && (await this.profileDescription.textContent())?.trim() !== ''
		);
	}

	/**
	 * Check if the profile has a website
	 */
	async hasWebsite(): Promise<boolean> {
		return (await this.profileWebsite.count()) > 0;
	}

	/**
	 * Verify that specific profile information is displayed
	 * @param expectedName - Expected profile name
	 * @param expectedUsername - Expected username (optional)
	 */
	async expectProfileInformation(expectedName?: string, expectedUsername?: string) {
		if (expectedName) {
			const actualName = await this.getProfileName();
			expect(actualName).toContain(expectedName);
		}

		if (expectedUsername) {
			const actualUsername = await this.getUsername();
			expect(actualUsername).toContain(expectedUsername);
		}

		// Verify basic profile elements are present
		await expect(this.profileAvatar).toBeVisible();
		await expect(this.profileName).toBeVisible();
		await expect(this.profileDetails).toBeVisible();
	}
}

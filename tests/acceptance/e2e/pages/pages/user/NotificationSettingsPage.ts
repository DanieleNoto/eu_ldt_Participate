/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 * Antonio Abramo Carotenuto
 */

import { Locator, Page, expect } from '@playwright/test';
import { HeaderComponent } from '../../components/common/HeaderComponent';
import { VerticalTabsComponent } from '../../components/common/VerticalTabsComponent';
import { ToggleSwitchComponent } from '../../components/common/ToggleSwitchComponent';

export class NotificationSettingsPage {
	private page: Page;
	private header: HeaderComponent;
	private verticalTabs: VerticalTabsComponent;

	// Form locators
	private form: Locator;
	private saveButton: Locator;

	// Toggle switches using ToggleSwitchComponent
	private ownActivityToggle: ToggleSwitchComponent;
	private followedToggle: ToggleSwitchComponent;
	private newsletterToggle: ToggleSwitchComponent;
	private publicContactToggle: ToggleSwitchComponent;
	private assignedProposalsToggle: ToggleSwitchComponent;
	private moderationsToggle: ToggleSwitchComponent;
	private meetingReminderToggle: ToggleSwitchComponent;

	// Radio button locators for notification frequency
	private notificationFrequencyNone: Locator;
	private notificationFrequencyRealTime: Locator;
	private notificationFrequencyDaily: Locator;
	private notificationFrequencyWeekly: Locator;

	// Section labels
	private ownActivityLabel: Locator;
	private frequencyLabel: Locator;
	private newsletterLabel: Locator;
	private publicContactLabel: Locator;
	private evaluatorsLabel: Locator;
	private administratorsLabel: Locator;

	constructor(page: Page) {
		this.page = page;
		this.header = new HeaderComponent(page);
		this.verticalTabs = new VerticalTabsComponent(page);

		// Initialize form locators
		this.form = page.locator('form.edit_user');
		this.saveButton = page.locator('button[type="submit"]:has-text("Save changes")');

		// Initialize toggle switches
		this.ownActivityToggle = new ToggleSwitchComponent(page, 'notifications_from_own_activity');
		this.followedToggle = new ToggleSwitchComponent(page, 'notifications_from_followed');
		this.newsletterToggle = new ToggleSwitchComponent(page, 'newsletter_notifications');
		this.publicContactToggle = new ToggleSwitchComponent(page, 'allow_public_contact');
		this.assignedProposalsToggle = new ToggleSwitchComponent(page, 'email_on_assigned_proposals');
		this.moderationsToggle = new ToggleSwitchComponent(page, 'email_on_moderations');
		this.meetingReminderToggle = new ToggleSwitchComponent(
			page,
			'user_notification_settings[close_meeting_reminder]'
		);

		// Initialize radio button locators
		this.notificationFrequencyNone = page.locator('#user_notifications_sending_frequency_none');
		this.notificationFrequencyRealTime = page.locator('#user_notifications_sending_frequency_real_time');
		this.notificationFrequencyDaily = page.locator('#user_notifications_sending_frequency_daily');
		this.notificationFrequencyWeekly = page.locator('#user_notifications_sending_frequency_weekly');

		// Initialize section labels
		this.ownActivityLabel = page.locator('label:has-text("I want to get notifications about")');
		this.frequencyLabel = page.locator(
			'label:has-text("How often do you want to receive the notifications email?")'
		);
		this.newsletterLabel = page.getByText('Newsletters', { exact: true }).first();
		this.publicContactLabel = page.locator('label:has-text("Receive direct messages from anyone")');
		this.evaluatorsLabel = page.locator('label:has-text("Evaluators")');
		this.administratorsLabel = page.locator('label:has-text("Administrators")');
	}

	/**
	 * Navigate to the notification settings page via vertical tabs
	 */
	async navigateToNotificationSettings(): Promise<void> {
		await this.verticalTabs.navigateToNotificationSettings();
		await this.waitForPageLoad();
	}

	/**
	 * Wait for the notification settings page to fully load
	 */
	async waitForPageLoad(): Promise<void> {
		await expect(this.page).toHaveURL(/\/notifications_settings$/);
		await expect(this.form).toBeVisible();
		await expect(this.saveButton).toBeVisible();
		await expect(this.ownActivityToggle.isVisible()).resolves.toBe(true);
	}

	/**
	 * Own Activity Notifications section methods
	 */
	async toggleOwnActivityNotifications(enabled: boolean): Promise<void> {
		await this.ownActivityToggle.setToggleState(enabled);
	}

	async isOwnActivityNotificationsEnabled(): Promise<boolean> {
		return await this.ownActivityToggle.isChecked();
	}

	async toggleFollowedNotifications(enabled: boolean): Promise<void> {
		await this.followedToggle.setToggleState(enabled);
	}

	async isFollowedNotificationsEnabled(): Promise<boolean> {
		return await this.followedToggle.isChecked();
	}

	/**
	 * Notification Frequency section methods
	 */
	async setNotificationFrequency(frequency: 'none' | 'real_time' | 'daily' | 'weekly'): Promise<void> {
		switch (frequency) {
			case 'none':
				await this.notificationFrequencyNone.check();
				break;
			case 'real_time':
				await this.notificationFrequencyRealTime.check();
				break;
			case 'daily':
				await this.notificationFrequencyDaily.check();
				break;
			case 'weekly':
				await this.notificationFrequencyWeekly.check();
				break;
		}
	}

	async getSelectedNotificationFrequency(): Promise<string> {
		if (await this.notificationFrequencyNone.isChecked()) return 'none';
		if (await this.notificationFrequencyRealTime.isChecked()) return 'real_time';
		if (await this.notificationFrequencyDaily.isChecked()) return 'daily';
		if (await this.notificationFrequencyWeekly.isChecked()) return 'weekly';
		return '';
	}

	/**
	 * Newsletter section methods
	 */
	async toggleNewsletterNotifications(enabled: boolean): Promise<void> {
		await this.newsletterToggle.setToggleState(enabled);
	}

	async isNewsletterNotificationsEnabled(): Promise<boolean> {
		return await this.newsletterToggle.isChecked();
	}

	/**
	 * Public Contact section methods
	 */
	async togglePublicContactPermission(enabled: boolean): Promise<void> {
		await this.publicContactToggle.setToggleState(enabled);
	}

	async isPublicContactPermissionEnabled(): Promise<boolean> {
		return await this.publicContactToggle.isChecked();
	}

	/**
	 * Evaluators section methods
	 */
	async toggleAssignedProposalsNotifications(enabled: boolean): Promise<void> {
		await this.assignedProposalsToggle.setToggleState(enabled);
	}

	async isAssignedProposalsNotificationsEnabled(): Promise<boolean> {
		return await this.assignedProposalsToggle.isChecked();
	}

	/**
	 * Administrators section methods
	 */
	async toggleModerationNotifications(enabled: boolean): Promise<void> {
		await this.moderationsToggle.setToggleState(enabled);
	}

	async isModerationNotificationsEnabled(): Promise<boolean> {
		return await this.moderationsToggle.isChecked();
	}

	async toggleMeetingReminderNotifications(enabled: boolean): Promise<void> {
		await this.meetingReminderToggle.setToggleState(enabled);
	}

	async isMeetingReminderNotificationsEnabled(): Promise<boolean> {
		return await this.meetingReminderToggle.isChecked();
	}

	/**
	 * Form submission methods
	 */
	async saveNotificationSettings(): Promise<void> {
		await this.saveButton.click();
	}

	async submitForm(): Promise<void> {
		await this.saveNotificationSettings();
	}

	/**
	 * Bulk configuration methods
	 */
	async configureNotificationSettings(settings: {
		ownActivity?: boolean;
		followed?: boolean;
		frequency?: 'none' | 'real_time' | 'daily' | 'weekly';
		newsletter?: boolean;
		publicContact?: boolean;
		assignedProposals?: boolean;
		moderations?: boolean;
		meetingReminder?: boolean;
	}): Promise<void> {
		if (settings.ownActivity !== undefined) {
			await this.toggleOwnActivityNotifications(settings.ownActivity);
		}

		if (settings.followed !== undefined) {
			await this.toggleFollowedNotifications(settings.followed);
		}

		if (settings.frequency) {
			await this.setNotificationFrequency(settings.frequency);
		}

		if (settings.newsletter !== undefined) {
			await this.toggleNewsletterNotifications(settings.newsletter);
		}

		if (settings.publicContact !== undefined) {
			await this.togglePublicContactPermission(settings.publicContact);
		}

		if (settings.assignedProposals !== undefined) {
			await this.toggleAssignedProposalsNotifications(settings.assignedProposals);
		}

		if (settings.moderations !== undefined) {
			await this.toggleModerationNotifications(settings.moderations);
		}

		if (settings.meetingReminder !== undefined) {
			await this.toggleMeetingReminderNotifications(settings.meetingReminder);
		}
	}

	async getAllNotificationSettings(): Promise<{
		ownActivity: boolean;
		followed: boolean;
		frequency: string;
		newsletter: boolean;
		publicContact: boolean;
		assignedProposals: boolean;
		moderations: boolean;
		meetingReminder: boolean;
	}> {
		return {
			ownActivity: await this.isOwnActivityNotificationsEnabled(),
			followed: await this.isFollowedNotificationsEnabled(),
			frequency: await this.getSelectedNotificationFrequency(),
			newsletter: await this.isNewsletterNotificationsEnabled(),
			publicContact: await this.isPublicContactPermissionEnabled(),
			assignedProposals: await this.isAssignedProposalsNotificationsEnabled(),
			moderations: await this.isModerationNotificationsEnabled(),
			meetingReminder: await this.isMeetingReminderNotificationsEnabled()
		};
	}

	/**
	 * Verification methods
	 */
	async verifyPageTitle(): Promise<void> {
		await expect(this.page).toHaveTitle(/Notifications settings/);
	}

	async verifyFormSectionsPresent(): Promise<void> {
		await expect(this.ownActivityLabel).toBeVisible();
		await expect(this.frequencyLabel).toBeVisible();
		await expect(this.newsletterLabel).toBeVisible();
		await expect(this.publicContactLabel).toBeVisible();
		await expect(this.evaluatorsLabel).toBeVisible();
	}

	async verifyAllTogglesPresent(): Promise<void> {
		await expect(this.ownActivityToggle.isVisible()).resolves.toBe(true);
		await expect(this.followedToggle.isVisible()).resolves.toBe(true);
		await expect(this.newsletterToggle.isVisible()).resolves.toBe(true);
		await expect(this.publicContactToggle.isVisible()).resolves.toBe(true);
		await expect(this.assignedProposalsToggle.isVisible()).resolves.toBe(true);
		await expect(this.moderationsToggle.isVisible()).resolves.toBe(true);
		await expect(this.meetingReminderToggle.isVisible()).resolves.toBe(true);
	}

	async verifyFrequencyRadioButtonsPresent(): Promise<void> {
		await expect(this.notificationFrequencyNone).toBeVisible();
		await expect(this.notificationFrequencyRealTime).toBeVisible();
		await expect(this.notificationFrequencyDaily).toBeVisible();
		await expect(this.notificationFrequencyWeekly).toBeVisible();
	}

	/**
	 * Get component instances for additional functionality
	 */
	getHeader(): HeaderComponent {
		return this.header;
	}

	getVerticalTabs(): VerticalTabsComponent {
		return this.verticalTabs;
	}

	/**
	 * Get the page instance for direct page operations
	 */
	getPage(): Page {
		return this.page;
	}

	/**
	 * Get specific toggle component instances for advanced operations
	 */
	getOwnActivityToggle(): ToggleSwitchComponent {
		return this.ownActivityToggle;
	}

	getFollowedToggle(): ToggleSwitchComponent {
		return this.followedToggle;
	}

	getNewsletterToggle(): ToggleSwitchComponent {
		return this.newsletterToggle;
	}

	getPublicContactToggle(): ToggleSwitchComponent {
		return this.publicContactToggle;
	}

	getAssignedProposalsToggle(): ToggleSwitchComponent {
		return this.assignedProposalsToggle;
	}

	getModerationsToggle(): ToggleSwitchComponent {
		return this.moderationsToggle;
	}

	getMeetingReminderToggle(): ToggleSwitchComponent {
		return this.meetingReminderToggle;
	}
}

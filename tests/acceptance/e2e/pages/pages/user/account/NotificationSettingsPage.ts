import { AuthenticatedPage } from '@pages/base/AuthenticatedPage';
import { expect, Page } from '@playwright/test';

export enum NotificationFrequency {
	None = 'none',
	RealTime = 'real_time',
	Daily = 'daily',
	Weekly = 'weekly'
}

export class NotificationSettingsPage extends AuthenticatedPage {
	// Selectors
	private readonly form = this.page.locator('form.edit_user');
	private readonly saveButton = this.page.locator('button[type="submit"][name="commit"]');

	// Toggles
	private readonly ownActivityToggle = this.page.locator(
		'label[for="notifications_from_own_activity"] span.toggle__switch-toggle-content'
	);
	private readonly followedToggle = this.page.locator(
		'label[for="notifications_from_followed"] span.toggle__switch-toggle-content'
	);
	private readonly newsletterToggle = this.page.locator(
		'label[for="newsletter_notifications"] span.toggle__switch-toggle-content'
	);
	private readonly publicContactToggle = this.page.locator(
		'label[for="allow_public_contact"] span.toggle__switch-toggle-content'
	);
	private readonly evaluetorsEmailToggle = this.page.locator(
		'label[for="email_on_assigned_proposals"] span.toggle__switch-toggle-content'
	);
	private readonly administratorsEmailToggle = this.page.locator(
		'label[for="email_on_moderations"] span.toggle__switch-toggle-content'
	);
	private readonly administratorsReminderToggle = this.page.locator(
		'label[for="user_notification_settings[close_meeting_reminder]"] span.toggle__switch-toggle-content'
	);

	// Frequency radios
	private readonly frequencyNone = this.page.locator('label[for="user_notifications_sending_frequency_none"]');
	private readonly frequencyRealTime = this.page.locator(
		'label[for="user_notifications_sending_frequency_real_time"]'
	);
	private readonly frequencyDaily = this.page.locator('label[for="user_notifications_sending_frequency_daily"]');
	private readonly frequencyWeekly = this.page.locator('#user_notifications_sending_frequency_weekly');

	constructor(page: Page) {
		super(page);
	}

	// Expect page loaded
	async expectToBeOnSettingsPage(): Promise<void> {
		await expect(this.form).toBeVisible();
		await expect(this.saveButton).toBeVisible();
	}

	// Toggle methods
	async setOwnActivity(enabled: boolean): Promise<void> {
		if ((await this.ownActivityToggle.isChecked()) !== enabled) {
			await this.ownActivityToggle.click();
		}
	}

	async setFollowed(enabled: boolean): Promise<void> {
		if ((await this.followedToggle.isChecked()) !== enabled) {
			await this.followedToggle.click();
		}
	}

	async setNewsletter(enabled: boolean): Promise<void> {
		if ((await this.newsletterToggle.isChecked()) !== enabled) {
			await this.newsletterToggle.click();
		}
	}

	async setPublicContact(enabled: boolean): Promise<void> {
		if ((await this.publicContactToggle.isChecked()) !== enabled) {
			await this.publicContactToggle.click();
		}
	}

	// Frequency methods
	async setFrequency(frequency: NotificationFrequency): Promise<void> {
		switch (frequency) {
			case NotificationFrequency.None:
				await this.frequencyNone.click();
				break;
			case NotificationFrequency.RealTime:
				await this.frequencyRealTime.click();
				break;
			case NotificationFrequency.Daily:
				await this.frequencyDaily.click();
				break;
			case NotificationFrequency.Weekly:
				await this.frequencyWeekly.click();
				break;
		}
	}

	// Expect methods for toggles
	async expectOwnActivityToBe(enabled: boolean): Promise<void> {
		await expect(this.ownActivityToggle).toBeChecked({ checked: enabled });
	}
	async expectFollowedToBe(enabled: boolean): Promise<void> {
		await expect(this.followedToggle).toBeChecked({ checked: enabled });
	}
	async expectNewsletterToBe(enabled: boolean): Promise<void> {
		await expect(this.newsletterToggle).toBeChecked({ checked: enabled });
	}
	async expectPublicContactToBe(enabled: boolean): Promise<void> {
		await expect(this.publicContactToggle).toBeChecked({ checked: enabled });
	}
	async expectEvaluetorsEmailToBe(enabled: boolean): Promise<void> {
		await expect(this.evaluetorsEmailToggle).toBeChecked({ checked: enabled });
	}
	async expectAdministratorsEmailToBe(enabled: boolean): Promise<void> {
		await expect(this.administratorsEmailToggle).toBeChecked({ checked: enabled });
	}
	async expectAdministratorsReminderToBe(enabled: boolean): Promise<void> {
		await expect(this.administratorsReminderToggle).toBeChecked({ checked: enabled });
	}
	async expectFrequencyToBe(frequency: NotificationFrequency): Promise<void> {
		switch (frequency) {
			case NotificationFrequency.None:
				await expect(this.frequencyNone).toBeChecked();
				break;
			case NotificationFrequency.RealTime:
				await expect(this.frequencyRealTime).toBeChecked();
				break;
			case NotificationFrequency.Daily:
				await expect(this.frequencyDaily).toBeChecked();
				break;
			case NotificationFrequency.Weekly:
				await expect(this.frequencyWeekly).toBeChecked();
				break;
		}
	}

	// Save changes
	async saveChanges(): Promise<void> {
		await this.saveButton.click();
	}
}

import { Page, expect } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * FormMeetingPage - Page Object Model for the meeting form (create/edit).
 *
 * Extends BaseAdminPage and provides methods for interacting with the meeting form:
 * - Form field interactions (title, description, type, dates, etc.)
 * - Form submission and validation
 * - Dynamic field visibility based on meeting type
 * - Service management
 *
 * Used for both creating new meetings and editing existing ones.
 */
export class FormMeetingPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	// Form field selectors
	private get titleField() {
		return this.page.locator('#meeting_title_en');
	}

	private get descriptionEditor() {
		return this.page.locator('.editor-input .tiptap');
	}

	private get meetingTypeSelect() {
		return this.page.locator('#meeting_type_of_meeting');
	}

	private get addressField() {
		return this.page.locator('#meeting_address');
	}

	private get locationField() {
		return this.page.locator('#meeting_location_en');
	}

	private get locationHintsField() {
		return this.page.locator('#meeting_location_hints_en');
	}

	private get onlineMeetingUrlField() {
		return this.page.locator('#meeting_online_meeting_url');
	}

	private get iframeEmbedTypeSelect() {
		return this.page.locator('#meeting_iframe_embed_type');
	}

	private get iframeAccessLevelSelect() {
		return this.page.locator('#meeting_iframe_access_level');
	}

	private get startTimeField() {
		return this.page.locator('#meeting_start_time');
	}

	private get endTimeField() {
		return this.page.locator('#meeting_end_time');
	}

	private get startDateInput() {
		return this.page.locator('#meeting_start_time_date');
	}

	private get startTimeInput() {
		return this.page.locator('#meeting_start_time_time');
	}

	private get endDateInput() {
		return this.page.locator('#meeting_end_time_date');
	}

	private get endTimeInput() {
		return this.page.locator('#meeting_end_time_time');
	}

	private get scopeSelect() {
		return this.page.locator('#meeting_decidim_scope_id');
	}

	private get categorySelect() {
		return this.page.locator('#meeting_decidim_category_id');
	}

	private get registrationTypeSelect() {
		return this.page.locator('#meeting_registration_type');
	}

	private get registrationUrlField() {
		return this.page.locator('#meeting_registration_url');
	}

	private get privateMeetingCheckbox() {
		return this.page.locator('#meeting_private_meeting');
	}

	private get transparentCheckbox() {
		return this.page.locator('#meeting_transparent');
	}

	private get commentsEnabledCheckbox() {
		return this.page.locator('#meeting_comments_enabled');
	}

	private get commentsStartTimeField() {
		return this.page.locator('#meeting_comments_start_time');
	}

	private get commentsEndTimeField() {
		return this.page.locator('#meeting_comments_end_time');
	}

	private get updateButton() {
		return this.page.getByRole('button', { name: 'Update' });
	}

	private get createButton() {
		return this.page.getByRole('button', { name: 'Create' });
	}

	private get addServiceButton() {
		return this.page.locator('.add-service');
	}

	private get servicesSection() {
		return this.page.locator('#panel-services');
	}

    /** Returns the calendar button based on the index (0 = first, 1 = second) */
    private calendarIcon(index: number) {
        return this.page.locator('.datepicker__calendar-button').nth(index);
    }

    /** Returns the "Select" button based on the index (0 = first, 1 = second) */
    private selectButtoncalendar(index: number) {
        return this.page.locator('button.datepicker__pick-calendar:enabled:has-text("Select")').nth(index);
    }
	// Page verification methods
	async isOnMeetingFormPage(): Promise<boolean> {
		try {
			await expect(this.page.locator('h1')).toContainText(/Edit meeting|New meeting/);
			await expect(this.titleField).toBeVisible();
			return true;
		} catch {
			return false;
		}
	}

	async verifyEditMeetingPageVisible() {
		await expect(this.page.locator('h1')).toContainText('Edit meeting');
		await expect(this.titleField).toBeVisible();
		await expect(this.updateButton).toBeVisible();
	}

	async verifyNewMeetingPageVisible() {
		await expect(this.page.locator('h1')).toContainText('New meeting');
		await expect(this.titleField).toBeVisible();
	}

	// Basic form field interactions
	async fillTitle(title: string) {
		await this.titleField.clear();
		await this.titleField.fill(title);
	}

	async getTitle(): Promise<string> {
		return await this.titleField.inputValue();
	}

	async fillDescription(description: string) {
		await this.descriptionEditor.clear();
		await this.descriptionEditor.fill(description);
	}

	async fillDescriptionField(description: string, lang: 'en' | 'fr' | 'es' | 'de' = 'en') {
    	const editor = this.page.locator(`#meeting_description_${lang} .tiptap`);
    	await editor.fill(description);
	}


	async getDescription(): Promise<string> {
		return (await this.descriptionEditor.textContent()) || '';
	}

	async selectMeetingType(type: 'in_person' | 'online' | 'hybrid') {
		await this.meetingTypeSelect.selectOption(type);
		// Wait for conditional fields to show/hide
		await this.page.waitForTimeout(500);
	}

	async getMeetingType(): Promise<string> {
		return await this.meetingTypeSelect.inputValue();
	}

	// Location-related fields
	async fillAddress(address: string) {
		await this.addressField.fill(address);
	}

	async fillLocation(location: string) {
		await this.locationField.fill(location);
	}

	async fillLocationHints(hints: string) {
		await this.locationHintsField.fill(hints);
	}

	async fillOnlineMeetingUrl(url: string) {
		await this.onlineMeetingUrlField.fill(url);
	}

	// Date and time methods
	async setStartDateTime(date: string, time: string) {
		await this.startDateInput.click();
		await this.startDateInput.fill(date);
		await this.startTimeInput.fill(time);
	}

	async setEndDateTime(date: string, time: string) {
		await this.endDateInput.click();
		await this.endDateInput.fill(date);
		await this.endTimeInput.fill(time);
	}

	async setDuration(startDate: string, startTime: string, endDate: string, endTime: string) {
		await this.setStartDateTime(startDate, startTime);
		await this.setEndDateTime(endDate, endTime);
	}

	// Dropdown selections
	async selectScope(scopeValue: string) {
		await this.scopeSelect.selectOption(scopeValue);
	}

	async selectCategory(categoryValue: string) {
		await this.categorySelect.selectOption(categoryValue);
	}

	async selectRegistrationType(type: 'registration_disabled' | 'on_this_platform' | 'on_different_platform' | '') {
		await this.registrationTypeSelect.selectOption(type);
		// Wait for conditional fields to show/hide
		await this.page.waitForTimeout(500);
	}

	async fillRegistrationUrl(url: string) {
		await this.registrationUrlField.fill(url);
	}

	async selectIframeEmbedType(
		type: 'none' | 'embed_in_meeting_page' | 'open_in_live_event_page' | 'open_in_new_tab'
	) {
		await this.iframeEmbedTypeSelect.selectOption(type);
	}

	async selectIframeAccessLevel(level: 'all' | 'signed_in' | 'registered') {
		await this.iframeAccessLevelSelect.selectOption(level);
	}

	// Checkbox interactions
	async setPrivateMeeting(isPrivate: boolean) {
		if (isPrivate !== (await this.privateMeetingCheckbox.isChecked())) {
			await this.privateMeetingCheckbox.click();
		}
	}

	async setTransparent(isTransparent: boolean) {
		if (isTransparent !== (await this.transparentCheckbox.isChecked())) {
			await this.transparentCheckbox.click();
		}
	}

	async setCommentsEnabled(enabled: boolean) {
		if (enabled !== (await this.commentsEnabledCheckbox.isChecked())) {
			await this.commentsEnabledCheckbox.click();
			// Wait for conditional fields to show/hide
			await this.page.waitForTimeout(500);
		}
	}

	// Comments time configuration
	async setCommentsStartTime(date: string, time: string) {
		const startDateInput = this.page.locator('#meeting_comments_start_time_date');
		const startTimeInput = this.page.locator('#meeting_comments_start_time_time');
		await startDateInput.fill(date);
		await startTimeInput.fill(time);
	}

	async setCommentsEndTime(date: string, time: string) {
		const endDateInput = this.page.locator('#meeting_comments_end_time_date');
		const endTimeInput = this.page.locator('#meeting_comments_end_time_time');
		await endDateInput.fill(date);
		await endTimeInput.fill(time);
	}

	// Service management
	async addService(title: string, description: string) {
		await this.addServiceButton.click();

		// Find the newly added service form
		const serviceCards = this.page.locator('.meeting-service');
		const newServiceCard = serviceCards.last();

		const titleInput = newServiceCard.locator('input[id*="_title_en"]');
		const descriptionTextarea = newServiceCard.locator('textarea[id*="_description_en"]');

		await titleInput.fill(title);
		await descriptionTextarea.fill(description);
	}

	async removeFirstService() {
		const removeButton = this.page.locator('.remove-service').first();
		await removeButton.click();
	}

	async getServicesCount(): Promise<number> {
		return await this.page.locator('.meeting-service').count();
	}

	// Form submission and validation
	async updateMeeting() {
		await this.updateButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	async submitForm() {
		await this.updateButton.click();
		await this.page.waitForLoadState('networkidle');
	}

	// For creating a new meeting
	async createMeeting() {
		await this.createButton.click();
		await this.page.waitForLoadState('networkidle');
	}	

	// Comprehensive form filling method for test scenarios
	async fillMeetingDetails(meetingData: {
		title?: string;
		description?: string;
		type?: 'in_person' | 'online' | 'hybrid';
		startDate?: string;
		startTime?: string;
		endDate?: string;
		endTime?: string;
		location?: string;
		onlineUrl?: string;
		registrationType?: 'registration_disabled' | 'on_this_platform' | 'on_different_platform';
	}) {
		if (meetingData.title) {
			await this.fillTitle(meetingData.title);
		}

		if (meetingData.description) {
			await this.fillDescription(meetingData.description);
		}

		if (meetingData.type) {
			await this.selectMeetingType(meetingData.type);
		}

		if (meetingData.startDate && meetingData.startTime) {
			await this.setStartDateTime(meetingData.startDate, meetingData.startTime);
		}

		if (meetingData.endDate && meetingData.endTime) {
			await this.setEndDateTime(meetingData.endDate, meetingData.endTime);
		}

		if (meetingData.location && meetingData.type === 'in_person') {
			await this.fillLocation(meetingData.location);
		}

		if (meetingData.onlineUrl && (meetingData.type === 'online' || meetingData.type === 'hybrid')) {
			await this.fillOnlineMeetingUrl(meetingData.onlineUrl);
		}

		if (meetingData.registrationType) {
			await this.selectRegistrationType(meetingData.registrationType);
		}
	}

	// Validation helpers
	async hasValidationErrors(): Promise<boolean> {
		const errorElements = this.page.locator('.form-error[role="alert"]:visible');
		return (await errorElements.count()) > 0;
	}

	async getValidationErrors(): Promise<string[]> {
		const errorElements = this.page.locator('.form-error[role="alert"]:visible');
		const errors: string[] = [];
		const count = await errorElements.count();

		for (let i = 0; i < count; i++) {
			const errorText = await errorElements.nth(i).textContent();
			if (errorText) {
				errors.push(errorText.trim());
			}
		}

		return errors;
	}

	// Wait for form to load completely
	async waitForFormToLoad() {
		await this.titleField.waitFor({ state: 'visible' });
		await this.page.waitForTimeout(1000); // Additional wait for form to fully render
	}

	// Success message verification
	async verifyUpdateSuccess() {
		// Look for success flash message or URL change indicating successful update
		const successMessage = this.page.locator(
			'.flash.success, .alert-success, [role="alert"]:has-text("successfully")'
		);
		await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
	}

	async verifyOnMeetingsListAfterUpdate() {
		await this.expectUrl(/\/admin.*\/meetings$/);
	}

	// Field visibility helpers for conditional fields
	async isAddressFieldVisible(): Promise<boolean> {
		return await this.addressField.isVisible();
	}

	async isOnlineUrlFieldVisible(): Promise<boolean> {
		return await this.onlineMeetingUrlField.isVisible();
	}

	async isRegistrationUrlFieldVisible(): Promise<boolean> {
		return await this.registrationUrlField.isVisible();
	}

	async areCommentsFieldsVisible(): Promise<boolean> {
		return await this.commentsStartTimeField.isVisible();
	}

	// Additional getter methods for field values
	async getRegistrationType(): Promise<string> {
		return await this.registrationTypeSelect.inputValue();
	}

	async getOnlineMeetingUrl(): Promise<string> {
		return await this.onlineMeetingUrlField.inputValue();
	}

	async getLocationHints(): Promise<string> {
		return await this.locationHintsField.inputValue();
	}

	async getStartDateTimeValue(): Promise<{ startDate: string; startTime: string }> {
		const startDate = await this.startDateInput.inputValue();
		const startTime = await this.startTimeInput.inputValue();
		return { startDate, startTime };
	}

	async getEndDateTimeValue(): Promise<{ endDate: string; endTime: string }> {
		const endDate = await this.endDateInput.inputValue();
		const endTime = await this.endTimeInput.inputValue();
		return { endDate, endTime };
	}

	async getCommentsEnabledValue(): Promise<boolean> {
		return await this.commentsEnabledCheckbox.isChecked();
	}

	/**
	 * Selects tomorrow's date.
	 * Works for both start and end date by passing the correct index.
	 */
	async selectTomorrowDate(calendarIndex: number, selectIndex: number): Promise<void> {
	  // Calculate tomorrow in YYYY-MM-DD
	  const tomorrow = new Date();
	  tomorrow.setDate(tomorrow.getDate() + 1);
	  const pad = (n: number) => (n < 10 ? '0' + n : n);
	  const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

	  // Open the datepicker
	  await this.calendarIcon(calendarIndex).click();

	  // Pick tomorrow’s date
	  const dateCell = this.page.locator(`.wc-datepicker__date[data-date="${tomorrowStr}"]:visible`).first();
	  await dateCell.click();

	  // Confirm date with "Select"
	  await this.selectButtoncalendar(selectIndex).click();

	  // Open the clock for this field
	  await this.page.locator('.datepicker__clock-button').nth(calendarIndex).click();
	}

	/**
	 * Sets a specific time using the time picker widget.
	 * Works for both start and end date/time by passing the correct index.
	 */
	async selectTomorrowTime(calendarIndex: number, hour: number, minute: number): Promise<void> {

	  // Fill tomorrow's date in both date inputs	  // Open the clock for this field
	  await this.page.locator('.datepicker__clock-button').nth(calendarIndex).click();

	  // Get the right timepicker container (start or end)
	  const timePicker = calendarIndex === 0
	    ? this.page.locator('#meeting_start_time_time_timepicker')
	    : this.page.locator('#meeting_end_time_time_timepicker');

	  // Adjust hour
	  for (let i = 0; i < hour; i++) {
	    await timePicker.locator('.datepicker__hour-up').click();
	  }

	  // Adjust minute
	  for (let i = 0; i < minute; i++) {
	    await timePicker.locator('.datepicker__minute-up').click();
	  }

	  // Confirm time
	  await timePicker.locator('button.datepicker__select-clock:has-text("Select")').click();
	}	
}

/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/**
 * RegistrationsPage - Page Object for managing meeting registrations in admin panel
 */
export class RegistrationsPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}

	/**
	 * Navigate to registrations page for a specific meeting
	 * @param processSlug - Process slug
	 * @param componentId - Component ID (usually 6 for meetings)
	 * @param meetingId - Meeting ID
	 */
	async navigateToRegistrations(processSlug: string, componentId: number, meetingId: number): Promise<void> {
		const url = `/admin/participatory_processes/${processSlug}/components/${componentId}/manage/meetings/${meetingId}/registrations/edit`;
		await this.page.goto(url);
		await this.page.waitForLoadState('load');
	}

	/**
	 * Set available slots for meeting registration
	 * @param slots - Number of available slots
	 */
	async setAvailableSlots(slots: number): Promise<void> {
		const slotsInput = this.page.locator('input#meeting_available_slots');
		await slotsInput.waitFor({ state: 'visible' });
		await slotsInput.clear();
		await slotsInput.fill(slots.toString());
	}

	/**
	 * Click the Save button
	 */
	async clickSave(): Promise<void> {
		const saveButton = this.page.locator('button[type="submit"]:has-text("Save")');
		await saveButton.click();
		await this.page.waitForLoadState('load');
	}

	/**
	 * Get current available slots value
	 */
	async getAvailableSlots(): Promise<number> {
		const slotsInput = this.page.locator('input#meeting_available_slots');
		const value = await slotsInput.inputValue();
		return parseInt(value, 10);
	}

	/**
	 * Set available slots and save
	 * @param slots - Number of available slots
	 */
	async setAvailableSlotsAndSave(slots: number): Promise<void> {
		await this.setAvailableSlots(slots);
		await this.clickSave();
	}
}

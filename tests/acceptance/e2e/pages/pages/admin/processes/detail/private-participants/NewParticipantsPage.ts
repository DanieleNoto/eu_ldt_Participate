/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';
import { Page, expect } from '@playwright/test';

export class NewPrivateParticipantFormPage extends BaseAdminPage {
	protected page: Page;

	constructor(page: Page) {
		super(page);
		this.page = page;
	}

	async fillName(name: string): Promise<void> {
		await this.page.fill('#participatory_space_private_user_name', name);
	}

	async fillEmail(email: string): Promise<void> {
		await this.page.fill('#participatory_space_private_user_email', email);
	}

	async submitForm(): Promise<void> {
		await this.page.click('form button[type="submit"]');
	}

	// Validations
	async expectToBeOnNewPrivateParticipantsPage(): Promise<void> {
		await expect(this.page).toHaveURL(/participatory_space_private_users\/new/);
		await expect(this.page.locator('h1.item_show__header-title')).toHaveText(
			'New Participatory Space private participant.'
		);
	}

	async expectFormValidationError(): Promise<void> {
		const errorElements = this.page.locator('.form-error');
		await expect(errorElements.first()).toBeVisible();
	}
}

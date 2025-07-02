import { Page, expect } from '@playwright/test';

import { BaseAdminPage } from '@pages/pages/admin/BaseAdminPage';

export class ConfigureAccountabilityComponentPage extends BaseAdminPage {
	constructor(page: Page) {
		super(page);
	}

	getPage(): Page {
		return this.page;
	}

	// Navigazione
	async expectToBeOnEditComponentPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/admin\/participatory_processes\/.+\/components\/.+/);
		await expect(this.page.getByRole('heading', { name: 'Edit component' }).first()).toBeVisible();
	}

	// Interazioni campi principali
	async fillName(name: string): Promise<void> {
		await this.page.fill('#component_name_en', name);
	}

	async fillOrderPosition(position: number): Promise<void> {
		await this.page.fill('#component_weight', position.toString());
	}

	// Global settings
	async setScopesEnabled(enabled: boolean): Promise<void> {
		const checkbox = this.page.locator('#component_settings_scopes_enabled');
		if ((await checkbox.isChecked()) !== enabled) {
			await checkbox.click();
		}
	}

	async selectScopeByValue(value: string): Promise<void> {
		await this.page.selectOption('#component_settings_scope_id', value);
	}

	async setCommentsEnabled(enabled: boolean): Promise<void> {
		const checkbox = this.page.locator('#component_settings_comments_enabled');
		if ((await checkbox.isChecked()) !== enabled) {
			await checkbox.click();
		}
	}

	async fillCommentsMaxLength(length: number): Promise<void> {
		await this.page.fill('#component_settings_comments_max_length', length.toString());
	}

	async fillIntro(introHtml: string): Promise<void> {
		// L'input hidden contiene il valore HTML dell'intro
		await this.page.fill('input[name="component[settings][intro_en]"]', introHtml);
	}

	async setDisplayProgressEnabled(enabled: boolean): Promise<void> {
		const checkbox = this.page.locator('#component_settings_display_progress_enabled');
		if ((await checkbox.isChecked()) !== enabled) {
			await checkbox.click();
		}
	}

	// Step settings
	async setStep1CommentsBlocked(enabled: boolean): Promise<void> {
		const checkbox = this.page.locator('#component_step_settings_1_comments_blocked');
		if ((await checkbox.isChecked()) !== enabled) {
			await checkbox.click();
		}
	}

	// Submit
	async submitForm(): Promise<void> {
		await this.page.click('form button[type="submit"]');
		await this.waitForLoadState();
	}

	// Validazioni
	async expectFormValidationError(): Promise<void> {
		const error = this.page.locator('.form-error');
		await expect(error.first()).toBeVisible();
	}
}

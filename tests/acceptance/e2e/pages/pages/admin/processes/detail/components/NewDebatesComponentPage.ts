/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Gianfranco Cedro
 * Antonio Abramo Carotenuto
 */

import { expect, Locator, Page } from '@playwright/test';
import { LocalizationUtils } from '../../../../../../utils/localization.utils';
import { pasteTiptapContent } from '../../../../../../utils/tiptap.utils';
import { SidebarProcessDetailComponent } from '../../../../../components/admin/process/detail/SidebarProcessDetailComponent';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * Page Object Model for creating a new Debates component in process detail management.
 * English-only testing using LocalizationUtils and reusing SidebarProcessDetailComponent.
 */
export class NewDebatesComponentPage extends BaseAdminPage {
	// Sidebar component
	public readonly sidebar: SidebarProcessDetailComponent;

	// Main page elements
	private readonly pageWrapper: Locator;
	private readonly pageTitle: Locator;
	private readonly form: Locator;

	// Order position field
	private readonly orderPositionInput: Locator;

	// Settings section toggles
	private readonly commentsToggle: Locator;
	private readonly commentsBlockedToggle: Locator;

	// Comments settings fields
	private readonly commentsMaxLengthInput: Locator;

	// Permissions section
	private readonly participationPermissionsSection: Locator;
	private readonly createDebatesPermissionSelect: Locator;

	// Submit button
	private readonly submitButton: Locator;

	constructor(page: Page) {
		super(page);

		// Initialize sidebar component
		this.sidebar = new SidebarProcessDetailComponent(page);

		// Main page elements
		this.pageWrapper = page.locator('.item_show__wrapper');
		this.pageTitle = page.locator('h1.item_show__header-title');
		this.form = page.locator('form.new_component');

		// Order position field
		this.orderPositionInput = page.locator('#component_weight');

		// Settings section toggles
		this.commentsToggle = page.locator('#component_settings_comments_enabled');
		this.commentsBlockedToggle = page.locator('.comments_blocked_container input[type="checkbox"]');

		// Comments settings
		this.commentsMaxLengthInput = page.locator('#component_settings_comments_max_length');

		// Permissions section
		this.participationPermissionsSection = page.locator('.card[data-content="participation-permissions"]');
		this.createDebatesPermissionSelect = page.locator('.creation_enabled_container input[type="checkbox"]');

		// Submit button
		this.submitButton = page.locator('button[type="submit"][name="commit"]');
	}

	// Navigation and page state
	async navigateToNewDebatesComponent(processSlug: string): Promise<void> {
		await this.navigateTo(`/admin/participatory_processes/${processSlug}/components/new?type=debates`);
		await this.waitForNewDebatesComponentPageLoad();
	}

	async waitForNewDebatesComponentPageLoad(): Promise<void> {
		await this.waitForElement('.item_show__wrapper');
		await this.waitForElement('form.new_component');
		await this.sidebar.isSidebarVisible();
		await this.page.waitForLoadState('load');
	}

	async isOnNewDebatesComponentPage(): Promise<boolean> {
		const url = this.getPage().url();
		return (
			url.includes('/admin/participatory_processes/') &&
			url.includes('/components') &&
			url.includes('type=debates')
		);
	}

	async getPageTitle(): Promise<string> {
		return (await this.pageTitle.textContent()) || '';
	}

	// Component name methods using LocalizationUtils (English-only)
	async fillComponentName(name: string): Promise<void> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'component_name');
		const input = this.getPage().locator(selector);
		await input.clear();
		await input.fill(name);
	}

	async getComponentName(): Promise<string> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(this.getPage(), 'component_name');
		const input = this.getPage().locator(selector);
		return (await input.inputValue()) || '';
	}

	// Order position methods
	async setOrderPosition(position: number): Promise<void> {
		await this.orderPositionInput.clear();
		await this.orderPositionInput.fill(position.toString());
	}

	async getOrderPosition(): Promise<number> {
		const value = await this.orderPositionInput.inputValue();
		return parseInt(value) || 0;
	}

	// Global announcement methods using LocalizationUtils (English-only)
	async fillGlobalAnnouncement(content: string): Promise<void> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.getPage(),
			'component_settings_announcement'
		);
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);

		// Wait for the rich text editor to be ready
		await editorLocator.waitFor({ state: 'visible' });
		await pasteTiptapContent(editorLocator, content);
	}

	async getGlobalAnnouncement(): Promise<string> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.getPage(),
			'component_settings_announcement'
		);
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);
		return (await editorLocator.inputValue()) || '';
	}

	// Step announcement methods using LocalizationUtils (English-only)
	async fillStepAnnouncement(content: string): Promise<void> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.getPage(),
			'component_step_settings_1_announcement'
		);
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);
		await editorLocator.scrollIntoViewIfNeeded();
		// Wait for the rich text editor to be ready
		await editorLocator.waitFor({ state: 'visible' });
		await pasteTiptapContent(editorLocator, content);
	}

	async getStepAnnouncement(): Promise<string> {
		const selector = await LocalizationUtils.getWorkingLocalizedSelector(
			this.getPage(),
			'component_step_settings_1_announcement'
		);
		const editorLocator = this.getPage().locator(`${selector} .tiptap`);
		return (await editorLocator.inputValue()) || '';
	}

	// Comments settings methods
	async enableComments(): Promise<void> {
		if (!(await this.commentsToggle.isChecked())) {
			await this.commentsToggle.check();
		}
	}

	async disableComments(): Promise<void> {
		if (await this.commentsToggle.isChecked()) {
			await this.commentsToggle.uncheck();
		}
	}

	async isCommentsEnabled(): Promise<boolean> {
		return await this.commentsToggle.isChecked();
	}

	async blockComments(): Promise<void> {
		await this.commentsBlockedToggle.evaluateAll((els: HTMLInputElement[]) => {
			els.forEach(el => {
				if (!el.checked) {
					el.checked = true;
					el.dispatchEvent(new Event('change', { bubbles: true }));
				}
			});
		});
	}

	async unblockComments(): Promise<void> {
		await this.commentsBlockedToggle.evaluateAll((els: HTMLInputElement[]) => {
			els.forEach(el => {
				if (el.checked) {
					el.checked = false;
					el.dispatchEvent(new Event('change', { bubbles: true }));
				}
			});
		});
	}

	async areCommentsBlocked(): Promise<boolean> {
		return await this.commentsBlockedToggle.isChecked();
	}

	async setCommentsMaxLength(maxLength: number): Promise<void> {
		await this.commentsMaxLengthInput.clear();
		await this.commentsMaxLengthInput.fill(maxLength.toString());
	}

	async getCommentsMaxLength(): Promise<number> {
		const value = await this.commentsMaxLengthInput.inputValue();
		return parseInt(value) || 0;
	}

	// Permissions methods
	async setCreateDebatesPermission(): Promise<void> {
		const checkboxes = await this.createDebatesPermissionSelect.all();
		for (const checkbox of checkboxes) {
			if (!(await checkbox.isChecked())) {
				await checkbox.check();
				await this.page.waitForTimeout(100); // Small delay between operations
			}
		}
	}

	async getCreateDebatesPermission(): Promise<string> {
		return (await this.createDebatesPermissionSelect.inputValue()) || '';
	}

	async isParticipationPermissionsSectionVisible(): Promise<boolean> {
		return await this.participationPermissionsSection.isVisible();
	}

	// Form submission methods
	async submitForm(): Promise<void> {
		// Wait for any pending operations to complete
		await this.page.waitForTimeout(200);

		// Ensure the submit button is ready
		await expect(this.submitButton).toBeEnabled();
		await expect(this.submitButton).toBeVisible();

		await Promise.all([
			this.page.waitForURL(/\/admin\/participatory_processes\/[^/]+\/components(?!\/)/),
			this.submitButton.click({ noWaitAfter: true, force: true })
		]);
		await this.waitForLoadState('load');
	}

	async isSubmitButtonEnabled(): Promise<boolean> {
		return await this.submitButton.isEnabled();
	}

	async isSubmitButtonVisible(): Promise<boolean> {
		return await this.submitButton.isVisible();
	}

	// Combined methods for easier usage
	async fillNewDebatesComponentForm(data: {
		name: string;
		orderPosition?: number;
		globalAnnouncement?: string;
		stepAnnouncement?: string;
		commentsEnabled?: boolean;
		commentsBlocked?: boolean;
		commentsMaxLength?: number;
		createDebatesPermission?: 'all' | 'verified_users' | 'participants';
	}): Promise<void> {
		// Fill component name
		await this.fillComponentName(data.name);

		// Fill order position if provided
		if (data.orderPosition !== undefined) {
			await this.setOrderPosition(data.orderPosition);
		}

		// Fill global announcement if provided
		if (data.globalAnnouncement) {
			await this.fillGlobalAnnouncement(data.globalAnnouncement);
		}

		// Fill step announcement if provided
		if (data.stepAnnouncement) {
			await this.fillStepAnnouncement(data.stepAnnouncement);
		}

		// Configure comments settings if provided
		if (data.commentsEnabled !== undefined) {
			if (data.commentsEnabled) {
				await this.enableComments();
			} else {
				await this.disableComments();
			}
		}

		if (data.commentsBlocked !== undefined) {
			if (data.commentsBlocked) {
				await this.blockComments();
			} else {
				await this.unblockComments();
			}
		}

		if (data.commentsMaxLength !== undefined) {
			await this.setCommentsMaxLength(data.commentsMaxLength);
		}

		// Set permissions if provided
		if (data.createDebatesPermission) {
			await this.setCreateDebatesPermission();
		}
	}

	// Validation methods
	async expectToBeOnNewDebatesComponentPage(): Promise<void> {
		await expect(this.getPage()).toHaveURL(/\/admin\/participatory_processes\/.*\/components\/new\?type=debates$/);
	}

	async expectPageTitle(expectedTitle: string): Promise<void> {
		await expect(this.pageTitle).toHaveText(expectedTitle);
	}

	async expectComponentName(expectedName: string): Promise<void> {
		const actualName = await this.getComponentName();
		expect(actualName).toBe(expectedName);
	}

	async expectOrderPosition(expectedPosition: number): Promise<void> {
		await expect(this.orderPositionInput).toHaveValue(expectedPosition.toString());
	}

	async expectCommentsEnabled(enabled: boolean): Promise<void> {
		if (enabled) {
			await expect(this.commentsToggle).toBeChecked();
		} else {
			await expect(this.commentsToggle).not.toBeChecked();
		}
	}

	async expectCommentsBlocked(blocked: boolean): Promise<void> {
		await expect
			.poll(async () => {
				const states: boolean[] = await this.commentsBlockedToggle.evaluateAll((els: HTMLInputElement[]) =>
					els.map(el => el.checked)
				);
				if (states.length === 0) {
					return blocked ? 'no-checkboxes' : 'ok';
				}
				return states.every(s => s === blocked) ? 'ok' : 'mismatch';
			})
			.toBe('ok');
	}

	async expectCommentsMaxLength(expectedLength: number): Promise<void> {
		await expect(this.commentsMaxLengthInput).toHaveValue(expectedLength.toString());
	}

	async expectCreateDebatesPermission(expectedPermission: boolean): Promise<void> {
		const checkboxes = await this.createDebatesPermissionSelect.all();
		for (const checkbox of checkboxes) {
			if (expectedPermission) {
				await expect(checkbox).toBeChecked();
			} else {
				await expect(checkbox).not.toBeChecked();
			}
		}
	}

	async expectSubmitButtonToBeEnabled(): Promise<void> {
		await expect(this.submitButton).toBeEnabled();
	}

	async expectSubmitButtonToBeDisabled(): Promise<void> {
		await expect(this.submitButton).toBeDisabled();
	}

	// Sidebar navigation methods (delegated to SidebarProcessDetailComponent)
	async navigateToComponents(): Promise<void> {
		await this.sidebar.navigateToComponents();
	}

	async navigateToAboutProcess(): Promise<void> {
		await this.sidebar.navigateToAboutProcess();
	}

	async navigateToLandingPage(): Promise<void> {
		await this.sidebar.navigateToLandingPage();
	}

	async navigateToPhases(): Promise<void> {
		await this.sidebar.navigateToPhases();
	}

	async navigateToCategories(): Promise<void> {
		await this.sidebar.navigateToCategories();
	}

	async navigateToAttachments(): Promise<void> {
		await this.sidebar.navigateToAttachments();
	}

	async navigateToProcessAdmins(): Promise<void> {
		await this.sidebar.navigateToProcessAdmins();
	}

	async navigateToModerations(): Promise<void> {
		await this.sidebar.navigateToModerations();
	}
}

import { Locator, Page, expect } from '@playwright/test';
import { BaseAdminPage } from '../../../BaseAdminPage';

/**
 * Page Object Model for the New Participatory Process Admin page.
 * Extends BaseAdminPage and provides methods for form management and validation.
 */
export class NewAdminPage extends BaseAdminPage {
	private readonly nameInput: Locator;
	private readonly emailInput: Locator;
	private readonly roleDropdown: Locator;
	private readonly createButton: Locator;

	constructor(page: Page) {
		super(page);

		this.nameInput = page.locator('#participatory_process_user_role_name');
		this.emailInput = page.locator('#participatory_process_user_role_email');
		this.roleDropdown = page.locator('#participatory_process_user_role_role');
		this.createButton = page.locator('form button[type="submit"][name="commit"]');
	}

	/**
	 * Fills the name field in the form.
	 * @param name The name to input.
	 */
	async fillName(name: string): Promise<void> {
		await this.nameInput.fill(name);
	}

	/**
	 * Fills the email field in the form.
	 * @param email The email to input.
	 */
	async fillEmail(email: string): Promise<void> {
		await this.emailInput.fill(email);
	}

	/**
	 * Selects a role from the dropdown.
	 * @param role The role to select (e.g., "admin", "collaborator", "moderator", "valuator").
	 */
	async selectRole(role: string): Promise<void> {
		await this.roleDropdown.selectOption(role);
	}

	/**
	 * Submits the form to create a new admin.
	 */
	async submitForm(): Promise<void> {
		await this.createButton.click();
	}

	/**
	 * Validates that the form has errors.
	 */
	async expectFormErrors(): Promise<void> {
		const errorMessages = this.page.locator('.form-error');
		await expect(errorMessages).toBeVisible();
	}

	/**
	 * Validates that the form is submitted successfully.
	 */
	async expectFormSubmissionSuccess(): Promise<void> {
		await expect(this.page).toHaveURL(/user_roles$/);
	}

	/**
	 * Validates that the user is on the New Admin page.
	 */
	async expectToBeOnNewAdminPage(): Promise<void> {
		await expect(this.page).toHaveURL(/user_roles\/new$/);
		await expect(this.nameInput).toBeVisible();
		await expect(this.emailInput).toBeVisible();
		await expect(this.roleDropdown).toBeVisible();
	}
	async expectToBeOnEditAdminPage(): Promise<void> {
		await expect(this.page).toHaveURL(/user_roles\/\d+\/edit$/);
		await expect(this.nameInput).toBeVisible();
		await expect(this.emailInput).toBeVisible();
		await expect(this.roleDropdown).toBeVisible();
	}
}
